//! Homebound escrow: USDC for each building stage is held here and released only when a
//! TEE-signed AI verdict on the site photo passes and the owner approves with their wallet.
//!
//! - The agent account can record verdicts and propose releases. It cannot move money.
//! - A verdict is accepted only if its exact response bytes are signed by a registered model key.
//! - Releases and refunds need the owner's full-access key (exactly 1 yoctoNEAR attached).

use near_sdk::json_types::{U64, U128};
use near_sdk::serde_json::{self, json};
use near_sdk::store::{LookupMap, LookupSet};
use near_sdk::{
    AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue,
    assert_one_yocto, env, near, require,
};

mod verdict;
#[cfg(test)]
mod tests;

pub use verdict::Verdict;
use verdict::{
    expected_reference, expected_reference_with_criteria, from_hex, is_sha256_hex, parse_response,
    signed_text, to_hex,
};

const PROPOSAL_TTL_NS: u64 = 7 * 24 * 60 * 60 * 1_000_000_000;
const MIN_CONFIDENCE: u8 = 60;
const MAX_STAGES: usize = 20;
const MAX_ID_LEN: usize = 64;
/// Prepaid storage per stage for the verdict record and replay guard written later by the agent,
/// whose function-call key cannot attach deposits.
const VERDICT_STORAGE_BYTES: u64 = 1_000;
const GAS_FT_TRANSFER: Gas = Gas::from_tgas(15);
const GAS_PAYOUT_CALLBACK: Gas = Gas::from_tgas(10);

#[derive(BorshStorageKey)]
#[near]
enum StorageKey {
    Signers,
    Projects,
    UsedResponses,
}

#[near(serializers = [borsh, json])]
#[serde(rename_all = "snake_case")]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum StageStatus {
    Planned,
    Funded,
    Proposed,
    Released,
    Refunded,
}

/// Deterministic photo checks computed by the Homebound server (not inside the TEE).
#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct PhotoChecks {
    pub taken_in_window: bool,
    pub on_site: bool,
    pub not_reused: bool,
}

impl PhotoChecks {
    fn all_pass(&self) -> bool {
        self.taken_in_window && self.on_site && self.not_reused
    }
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct VerdictRecord {
    pub evidence_sha256: String,
    pub model_id: String,
    pub request_hash: String,
    pub response_hash: String,
    pub verdict: Verdict,
    pub confidence: u8,
    pub checks: PhotoChecks,
    pub submitted_at: U64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Stage {
    pub name: String,
    pub payee: AccountId,
    pub amount: U128,
    pub funded: U128,
    pub criteria_hash: String,
    pub status: StageStatus,
    pub verdict: Option<VerdictRecord>,
    pub proposal_expires_at: Option<U64>,
}

#[near(serializers = [json])]
pub struct StageInput {
    pub name: String,
    pub payee: AccountId,
    pub amount: U128,
    /// SHA-256 (hex) of the stage's acceptance criteria text.
    pub criteria_hash: String,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Project {
    pub owner: AccountId,
    pub agent: AccountId,
    pub stages: Vec<Stage>,
    pub ledger_seq: u32,
    pub ledger_head: Option<String>,
}

#[near(serializers = [json])]
struct FundMsg {
    project_id: String,
    stage: u32,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    admin: AccountId,
    usdc: AccountId,
    /// Model ID to the hex Ed25519 public key of its attested TEE signer.
    signers: LookupMap<String, String>,
    projects: LookupMap<String, Project>,
    used_responses: LookupSet<String>,
}

#[near]
impl Contract {
    #[init]
    pub fn new(admin: AccountId, usdc: AccountId) -> Self {
        Self {
            admin,
            usdc,
            signers: LookupMap::new(StorageKey::Signers),
            projects: LookupMap::new(StorageKey::Projects),
            used_responses: LookupSet::new(StorageKey::UsedResponses),
        }
    }

    // ---------- Admin ----------

    /// Registers the signing key of an attested model, after its attestation was verified off chain.
    #[payable]
    pub fn register_signer(&mut self, model_id: String, public_key: String) {
        assert_one_yocto();
        self.assert_admin();
        require!(
            from_hex::<32>(&public_key).is_some(),
            "Public key must be 32 bytes of hex"
        );
        let public_key = public_key.trim_start_matches("0x").to_lowercase();
        emit(
            "signer_registered",
            json!({ "model_id": model_id, "public_key": public_key }),
        );
        self.signers.insert(model_id, public_key);
    }

    #[payable]
    pub fn remove_signer(&mut self, model_id: String) {
        assert_one_yocto();
        self.assert_admin();
        require!(self.signers.remove(&model_id).is_some(), "Unknown model");
        emit("signer_removed", json!({ "model_id": model_id }));
    }

    // ---------- Owner ----------

    /// Creates a project. The caller becomes its owner. Payees, amounts and order are fixed here.
    /// Attach enough NEAR for storage; the unused part is refunded.
    #[payable]
    pub fn create_project(&mut self, project_id: String, agent: AccountId, stages: Vec<StageInput>) {
        require!(
            !project_id.is_empty() && project_id.len() <= MAX_ID_LEN,
            "Project ID must be 1 to 64 characters"
        );
        require!(
            !project_id.contains('/'),
            "Project ID cannot contain '/'"
        );
        require!(
            !self.projects.contains_key(&project_id),
            "Project ID already exists"
        );
        require!(
            !stages.is_empty() && stages.len() <= MAX_STAGES,
            "A project needs 1 to 20 stages"
        );

        let owner = env::predecessor_account_id();
        let stages: Vec<Stage> = stages
            .into_iter()
            .map(|s| {
                require!(!s.name.trim().is_empty(), "Stage name is empty");
                require!(s.amount.0 > 0, "Stage amount must be above zero");
                require!(
                    is_sha256_hex(&s.criteria_hash),
                    "Criteria hash must be a lowercase SHA-256 hex digest"
                );
                Stage {
                    name: s.name,
                    payee: s.payee,
                    amount: s.amount,
                    funded: U128(0),
                    criteria_hash: s.criteria_hash,
                    status: StageStatus::Planned,
                    verdict: None,
                    proposal_expires_at: None,
                }
            })
            .collect();
        let stage_count = stages.len() as u64;

        let before = env::storage_usage();
        self.projects.insert(
            project_id.clone(),
            Project {
                owner: owner.clone(),
                agent: agent.clone(),
                stages,
                ledger_seq: 0,
                ledger_head: None,
            },
        );
        self.projects.flush();
        let used = env::storage_usage() - before + stage_count * VERDICT_STORAGE_BYTES;
        let cost = env::storage_byte_cost().saturating_mul(used as u128);
        let attached = env::attached_deposit();
        require!(
            attached >= cost,
            format!("Attach at least {} yoctoNEAR for storage", cost.as_yoctonear())
        );
        let refund = attached.saturating_sub(cost);
        if !refund.is_zero() {
            Promise::new(owner.clone()).transfer(refund).detach();
        }

        emit(
            "project_created",
            json!({ "project_id": project_id, "owner": owner, "agent": agent, "stages": stage_count }),
        );
    }

    /// Replaces the agent account allowed to submit verdicts and propose releases.
    #[payable]
    pub fn set_agent(&mut self, project_id: String, agent: AccountId) {
        assert_one_yocto();
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.owner,
            "Only the owner can change the agent"
        );
        project.agent = agent.clone();
        emit("agent_changed", json!({ "project_id": project_id, "agent": agent }));
    }

    /// Releases a stage the agent proposed. Needs the owner's wallet (exactly 1 yoctoNEAR).
    #[payable]
    pub fn approve_release(&mut self, project_id: String, stage: u32) -> Promise {
        assert_one_yocto();
        let now = env::block_timestamp();
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.owner,
            "Only the owner can approve a release"
        );
        let s = stage_mut(project, stage);
        require!(
            s.status == StageStatus::Proposed,
            "Stage is not proposed for release"
        );
        require!(
            s.proposal_expires_at.is_some_and(|t| now <= t.0),
            "Proposal expired; the agent must propose again"
        );
        s.status = StageStatus::Released;
        let (payee, amount) = (s.payee.clone(), s.amount);
        self.pay_out(project_id, stage, payee, amount, StageStatus::Proposed, None)
    }

    /// Releases a funded stage without a passing verdict. The reason is recorded on chain.
    #[payable]
    pub fn override_release(&mut self, project_id: String, stage: u32, reason: String) -> Promise {
        assert_one_yocto();
        require!(!reason.trim().is_empty(), "Give a reason for the override");
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.owner,
            "Only the owner can override"
        );
        require_previous_released(project, stage);
        let s = stage_mut(project, stage);
        require!(
            matches!(s.status, StageStatus::Funded | StageStatus::Proposed),
            "Stage must be fully funded and not yet paid"
        );
        let prev = s.status;
        s.status = StageStatus::Released;
        let (payee, amount) = (s.payee.clone(), s.amount);
        self.pay_out(project_id, stage, payee, amount, prev, Some(reason))
    }

    /// Returns a stage's funds to the owner, as long as it has not been released.
    #[payable]
    pub fn refund_stage(&mut self, project_id: String, stage: u32) -> Promise {
        assert_one_yocto();
        let project = self.project_mut(&project_id);
        let owner = project.owner.clone();
        require!(
            env::predecessor_account_id() == owner,
            "Only the owner can refund"
        );
        let s = stage_mut(project, stage);
        require!(
            matches!(
                s.status,
                StageStatus::Planned | StageStatus::Funded | StageStatus::Proposed
            ),
            "Stage is already paid out or refunded"
        );
        require!(s.funded.0 > 0, "Nothing to refund");
        let prev = s.status;
        s.status = StageStatus::Refunded;
        let funded = s.funded;
        self.pay_out(project_id, stage, owner, funded, prev, None)
    }

    // ---------- Agent ----------

    /// Records a verdict whose exact response bytes are signed by a registered model key.
    /// Moves no money.
    #[allow(clippy::too_many_arguments)]
    pub fn submit_verdict(
        &mut self,
        project_id: String,
        stage: u32,
        evidence_sha256: String,
        model_id: String,
        request_hash: String,
        response_body: String,
        signature: String,
        checks: PhotoChecks,
    ) {
        require!(
            is_sha256_hex(&evidence_sha256) && is_sha256_hex(&request_hash),
            "Hashes must be lowercase SHA-256 hex digests"
        );
        let public_key = self
            .signers
            .get(&model_id)
            .unwrap_or_else(|| env::panic_str("Model signer is not registered"));
        let public_key = from_hex::<32>(public_key).expect("stored key is valid");
        let signature = from_hex::<64>(&signature)
            .unwrap_or_else(|| env::panic_str("Signature must be 64 bytes of hex"));

        let response_hash = to_hex(&env::sha256_array(response_body.as_bytes()));
        let text = signed_text(&model_id, &request_hash, &response_hash);
        require!(
            env::ed25519_verify(&signature, text.as_bytes(), &public_key),
            "Signature check failed: the response was not signed by the registered model"
        );
        require!(
            self.used_responses.insert(response_hash.clone()),
            "This signed response was already used"
        );

        let parsed = parse_response(&response_body).unwrap_or_else(|e| env::panic_str(e));

        let now = env::block_timestamp();
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.agent,
            "Only the project's agent can submit verdicts"
        );
        let s = stage_mut(project, stage);
        require!(
            matches!(
                s.status,
                StageStatus::Planned | StageStatus::Funded | StageStatus::Proposed
            ),
            "Stage is not open for a new verdict"
        );
        let criteria_hash = s.criteria_hash.clone();
        require!(
            parsed.reference
                == expected_reference_with_criteria(
                    &project_id,
                    stage,
                    &criteria_hash,
                    &evidence_sha256
                )
                || parsed.reference == expected_reference(&project_id, stage, &evidence_sha256),
            "The model's answer is for a different stage or photo or criteria"
        );
        if s.status == StageStatus::Proposed
            && (parsed.verdict != Verdict::Pass
                || parsed.confidence < MIN_CONFIDENCE
                || !checks.all_pass())
        {
            s.status = StageStatus::Funded;
            s.proposal_expires_at = None;
        }
        s.verdict = Some(VerdictRecord {
            evidence_sha256: evidence_sha256.clone(),
            model_id: model_id.clone(),
            request_hash,
            response_hash: response_hash.clone(),
            verdict: parsed.verdict,
            confidence: parsed.confidence,
            checks,
            submitted_at: U64(now),
        });

        emit(
            "verdict",
            json!({
                "project_id": project_id,
                "stage": stage,
                "criteria_hash": criteria_hash,
                "verdict": parsed.verdict,
                "confidence": parsed.confidence,
                "checks": checks,
                "model_id": model_id,
                "evidence_sha256": evidence_sha256,
                "response_hash": response_hash,
            }),
        );
    }

    /// Asks the owner to release a stage. Only possible with a passing signed verdict.
    pub fn propose_release(&mut self, project_id: String, stage: u32) {
        let now = env::block_timestamp();
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.agent,
            "Only the project's agent can propose a release"
        );
        require_previous_released(project, stage);
        let s = stage_mut(project, stage);
        require!(
            matches!(s.status, StageStatus::Funded | StageStatus::Proposed) && s.funded == s.amount,
            "Stage must be fully funded and not yet released"
        );
        let v = s
            .verdict
            .as_ref()
            .unwrap_or_else(|| env::panic_str("No signed verdict for this stage"));
        require!(v.verdict == Verdict::Pass, "The signed verdict is not a pass");
        require!(
            v.confidence >= MIN_CONFIDENCE,
            "The verdict's confidence is below 60"
        );
        require!(v.checks.all_pass(), "A photo check failed");

        let expires_at = now + PROPOSAL_TTL_NS;
        s.status = StageStatus::Proposed;
        s.proposal_expires_at = Some(U64(expires_at));
        emit(
            "proposed",
            json!({ "project_id": project_id, "stage": stage, "expires_at": U64(expires_at) }),
        );
    }

    /// Stores the head of the off-chain hash-chained ledger.
    pub fn anchor_ledger(&mut self, project_id: String, seq: u32, head_hash: String) {
        require!(
            is_sha256_hex(&head_hash),
            "Head hash must be a lowercase SHA-256 hex digest"
        );
        let project = self.project_mut(&project_id);
        require!(
            env::predecessor_account_id() == project.agent,
            "Only the project's agent can anchor the ledger"
        );
        require!(seq > project.ledger_seq, "Ledger sequence must increase");
        project.ledger_seq = seq;
        project.ledger_head = Some(head_hash.clone());
        emit(
            "ledger_anchored",
            json!({ "project_id": project_id, "seq": seq, "head_hash": head_hash }),
        );
    }

    // ---------- USDC ----------

    /// NEP-141 receiver. `msg` is `{"project_id": "...", "stage": 0}`. Anyone can fund a stage;
    /// anything above what the stage still needs is returned.
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        require!(
            env::predecessor_account_id() == self.usdc,
            "Only USDC is accepted"
        );
        let FundMsg { project_id, stage } = serde_json::from_str(&msg)
            .unwrap_or_else(|_| env::panic_str("msg must be {\"project_id\",\"stage\"}"));
        let project = self.project_mut(&project_id);
        let s = stage_mut(project, stage);
        require!(
            s.status == StageStatus::Planned,
            "Stage is not open for funding"
        );

        let needed = s.amount.0 - s.funded.0;
        let accepted = amount.0.min(needed);
        s.funded = U128(s.funded.0 + accepted);
        if s.funded == s.amount {
            s.status = StageStatus::Funded;
        }
        emit(
            "funded",
            json!({
                "project_id": project_id,
                "stage": stage,
                "from": sender_id,
                "amount": U128(accepted),
                "funded": s.funded,
                "fully_funded": s.status == StageStatus::Funded,
            }),
        );
        PromiseOrValue::Value(U128(amount.0 - accepted))
    }

    #[private]
    pub fn on_payout(
        &mut self,
        project_id: String,
        stage: u32,
        receiver: AccountId,
        amount: U128,
        previous_status: StageStatus,
        reason: Option<String>,
    ) -> bool {
        let ok = env::promise_result_checked(0, 64).is_ok();
        let project = self.project_mut(&project_id);
        let s = stage_mut(project, stage);
        let kind = match s.status {
            StageStatus::Refunded => "refunded",
            _ => "released",
        };
        if ok {
            emit(
                kind,
                json!({
                    "project_id": project_id,
                    "stage": stage,
                    "to": receiver,
                    "amount": amount,
                    "override_reason": reason,
                }),
            );
        } else {
            s.status = previous_status;
            emit(
                "payout_failed",
                json!({ "project_id": project_id, "stage": stage, "to": receiver, "kind": kind }),
            );
        }
        ok
    }

    // ---------- Views ----------

    pub fn get_project(&self, project_id: String) -> Option<Project> {
        self.projects.get(&project_id).cloned()
    }

    pub fn get_signer(&self, model_id: String) -> Option<String> {
        self.signers.get(&model_id).cloned()
    }

    pub fn get_config(&self) -> serde_json::Value {
        json!({ "admin": self.admin, "usdc": self.usdc })
    }
}

impl Contract {
    fn assert_admin(&self) {
        require!(
            env::predecessor_account_id() == self.admin,
            "Only the admin can do this"
        );
    }

    fn project_mut(&mut self, project_id: &str) -> &mut Project {
        self.projects
            .get_mut(project_id)
            .unwrap_or_else(|| env::panic_str("Unknown project"))
    }

    fn pay_out(
        &mut self,
        project_id: String,
        stage: u32,
        receiver: AccountId,
        amount: U128,
        previous_status: StageStatus,
        reason: Option<String>,
    ) -> Promise {
        let args = json!({
            "receiver_id": receiver,
            "amount": amount,
            "memo": format!("Homebound {project_id} stage {stage}"),
        });
        Promise::new(self.usdc.clone())
            .function_call(
                "ft_transfer".to_string(),
                args.to_string().into_bytes(),
                NearToken::from_yoctonear(1),
                GAS_FT_TRANSFER,
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_PAYOUT_CALLBACK)
                    .on_payout(project_id, stage, receiver, amount, previous_status, reason),
            )
    }
}

fn stage_mut(project: &mut Project, stage: u32) -> &mut Stage {
    project
        .stages
        .get_mut(stage as usize)
        .unwrap_or_else(|| env::panic_str("Unknown stage"))
}

fn require_previous_released(project: &Project, stage: u32) {
    if stage > 0 {
        let previous = project
            .stages
            .get(stage as usize - 1)
            .unwrap_or_else(|| env::panic_str("Unknown stage"));
        require!(
            previous.status == StageStatus::Released,
            "The previous stage must be released first"
        );
    }
}

fn emit(event: &str, data: serde_json::Value) {
    let log = json!({
        "standard": "homebound_escrow",
        "version": "1.0.0",
        "event": event,
        "data": [data],
    });
    env::log_str(&format!("EVENT_JSON:{log}"));
}
