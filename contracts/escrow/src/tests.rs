use super::*;
use ed25519_dalek::{Signer, SigningKey};
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::testing_env;

const MODEL: &str = "Qwen/Qwen3.8-27B";
const PROJECT: &str = "lekki-duplex";
const EVIDENCE: &str = "1111111111111111111111111111111111111111111111111111111111111111";
const REQUEST: &str = "2222222222222222222222222222222222222222222222222222222222222222";
const CRITERIA: &str = "3333333333333333333333333333333333333333333333333333333333333333";

fn acc(name: &str) -> AccountId {
    name.parse().unwrap()
}
fn admin() -> AccountId {
    acc("admin.testnet")
}
fn usdc() -> AccountId {
    acc("usdc.testnet")
}
fn owner() -> AccountId {
    acc("ada.testnet")
}
fn agent() -> AccountId {
    acc("agent.testnet")
}
fn builder() -> AccountId {
    acc("chidi.testnet")
}

fn model_key() -> SigningKey {
    SigningKey::from_bytes(&[7u8; 32])
}

fn as_caller(caller: AccountId, deposit: NearToken) {
    let mut ctx = VMContextBuilder::new();
    ctx.current_account_id(acc("escrow.testnet"))
        .predecessor_account_id(caller.clone())
        .signer_account_id(caller)
        .attached_deposit(deposit)
        .block_timestamp(1_000);
    testing_env!(ctx.build());
}

fn call(caller: AccountId) {
    as_caller(caller, NearToken::from_yoctonear(0));
}

fn call_1yocto(caller: AccountId) {
    as_caller(caller, NearToken::from_yoctonear(1));
}

fn answer(verdict: &str, confidence: u32, stage: u32) -> String {
    let content = format!(
        r#"{{"verdict":"{verdict}","confidence":{confidence},"ref":"{PROJECT}/{stage}/{EVIDENCE}"}}"#
    );
    json!({ "id": "chatcmpl-1", "choices": [{ "message": { "content": content } }] }).to_string()
}

fn sign(body: &str) -> String {
    let response_hash = to_hex(&env::sha256_array(body.as_bytes()));
    let text = signed_text(MODEL, REQUEST, &response_hash);
    to_hex(&model_key().sign(text.as_bytes()).to_bytes())
}

fn all_checks() -> PhotoChecks {
    PhotoChecks { taken_in_window: true, on_site: true, not_reused: true }
}

fn stage_input(name: &str, amount: u128) -> StageInput {
    StageInput {
        name: name.into(),
        payee: builder(),
        amount: U128(amount),
        criteria_hash: CRITERIA.into(),
    }
}

/// A contract with a registered model and a two-stage project.
fn setup() -> Contract {
    call(admin());
    let mut c = Contract::new(admin(), usdc());
    call_1yocto(admin());
    c.register_signer(MODEL.into(), to_hex(model_key().verifying_key().as_bytes()));
    as_caller(owner(), NearToken::from_near(1));
    c.create_project(
        PROJECT.into(),
        agent(),
        vec![stage_input("Foundation", 5_000_000), stage_input("Roofing", 3_000_000)],
    );
    c
}

fn fund(c: &mut Contract, stage: u32, amount: u128) -> U128 {
    call(usdc());
    let msg = json!({ "project_id": PROJECT, "stage": stage }).to_string();
    match c.ft_on_transfer(owner(), U128(amount), msg) {
        PromiseOrValue::Value(unused) => unused,
        PromiseOrValue::Promise(_) => panic!("expected a value"),
    }
}

fn submit(c: &mut Contract, stage: u32, body: &str, signature: &str, checks: PhotoChecks) {
    call(agent());
    c.submit_verdict(
        PROJECT.into(),
        stage,
        EVIDENCE.into(),
        MODEL.into(),
        REQUEST.into(),
        body.into(),
        signature.into(),
        checks,
    );
}

fn stage(c: &Contract, stage: usize) -> Stage {
    c.get_project(PROJECT.into()).unwrap().stages[stage].clone()
}

/// Funds stage 0, records a signed pass and proposes the release.
fn proposed() -> Contract {
    let mut c = setup();
    fund(&mut c, 0, 5_000_000);
    let body = answer("pass", 88, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    call(agent());
    c.propose_release(PROJECT.into(), 0);
    c
}

// ---------- funding ----------

#[test]
fn funding_in_parts_and_returning_the_excess() {
    let mut c = setup();
    assert_eq!(fund(&mut c, 0, 2_000_000), U128(0));
    assert_eq!(stage(&c, 0).status, StageStatus::Planned);
    assert_eq!(fund(&mut c, 0, 4_000_000), U128(1_000_000));
    assert_eq!(stage(&c, 0).funded, U128(5_000_000));
    assert_eq!(stage(&c, 0).status, StageStatus::Funded);
}

#[test]
#[should_panic(expected = "Only USDC is accepted")]
fn other_tokens_are_refused() {
    let mut c = setup();
    call(acc("fake-usdc.testnet"));
    let _ = c.ft_on_transfer(
        owner(),
        U128(5_000_000),
        json!({ "project_id": PROJECT, "stage": 0 }).to_string(),
    );
}

#[test]
#[should_panic(expected = "Attach at least")]
fn create_project_needs_storage_deposit() {
    call(admin());
    let mut c = Contract::new(admin(), usdc());
    call(owner());
    c.create_project(PROJECT.into(), agent(), vec![stage_input("Foundation", 1)]);
}

// ---------- signed verdicts ----------

#[test]
fn a_signed_verdict_is_recorded() {
    let mut c = setup();
    let body = answer("pass", 88, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    let v = stage(&c, 0).verdict.unwrap();
    assert_eq!(v.verdict, Verdict::Pass);
    assert_eq!(v.confidence, 88);
    assert_eq!(v.response_hash, to_hex(&env::sha256_array(body.as_bytes())));
}

#[test]
#[should_panic(expected = "Signature check failed")]
fn editing_the_response_breaks_the_signature() {
    let mut c = setup();
    let real = answer("fail", 91, 0);
    let forged = answer("pass", 91, 0);
    submit(&mut c, 0, &forged, &sign(&real), all_checks());
}

#[test]
#[should_panic(expected = "Signature check failed")]
fn a_key_that_is_not_registered_is_refused() {
    let mut c = setup();
    let body = answer("pass", 91, 0);
    let response_hash = to_hex(&env::sha256_array(body.as_bytes()));
    let text = signed_text(MODEL, REQUEST, &response_hash);
    let attacker = SigningKey::from_bytes(&[9u8; 32]);
    let signature = to_hex(&attacker.sign(text.as_bytes()).to_bytes());
    submit(&mut c, 0, &body, &signature, all_checks());
}

#[test]
#[should_panic(expected = "already used")]
fn a_signed_response_cannot_be_replayed() {
    let mut c = setup();
    let body = answer("pass", 88, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    submit(&mut c, 0, &body, &sign(&body), all_checks());
}

#[test]
#[should_panic(expected = "different stage or photo")]
fn a_pass_for_another_stage_is_refused() {
    let mut c = setup();
    let body = answer("pass", 88, 1);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
}

#[test]
#[should_panic(expected = "Only the project's agent")]
fn only_the_agent_submits_verdicts() {
    let mut c = setup();
    let body = answer("pass", 88, 0);
    call(owner());
    c.submit_verdict(
        PROJECT.into(),
        0,
        EVIDENCE.into(),
        MODEL.into(),
        REQUEST.into(),
        body.clone(),
        sign(&body),
        all_checks(),
    );
}

// ---------- a real NEAR AI Cloud capture ----------

const REAL: &str = include_str!("../tests/fixtures/nearai-signed-response.json");

fn real_fixture() -> serde_json::Value {
    serde_json::from_str(REAL).unwrap()
}

fn field(f: &serde_json::Value, key: &str) -> String {
    f[key].as_str().unwrap().to_string()
}

/// A contract that trusts the attested model key from the capture, with a one-stage "spike" project.
fn real_setup(f: &serde_json::Value) -> Contract {
    call(admin());
    let mut c = Contract::new(admin(), usdc());
    call_1yocto(admin());
    c.register_signer(field(f, "model_id"), field(f, "signing_address"));
    as_caller(owner(), NearToken::from_near(1));
    c.create_project("spike".into(), agent(), vec![stage_input("Lintel", 1_000_000)]);
    c
}

fn submit_real(c: &mut Contract, f: &serde_json::Value, body: String) {
    call(agent());
    c.submit_verdict(
        "spike".into(),
        0,
        field(f, "evidence_sha256"),
        field(f, "model_id"),
        field(f, "request_hash"),
        body,
        field(f, "signature"),
        all_checks(),
    );
}

#[test]
fn a_real_nearai_signed_verdict_is_recorded() {
    let f = real_fixture();
    let mut c = real_setup(&f);
    submit_real(&mut c, &f, field(&f, "response_body"));
    let v = c.get_project("spike".into()).unwrap().stages[0].clone().verdict.unwrap();
    assert_eq!(v.verdict, Verdict::Fail);
    assert_eq!(v.confidence, 0);
    assert_eq!(v.response_hash, field(&f, "response_hash"));
    assert_eq!(v.model_id, field(&f, "model_id"));
}

#[test]
#[should_panic(expected = "Signature check failed")]
fn a_real_nearai_verdict_edited_to_pass_is_refused() {
    let f = real_fixture();
    let mut c = real_setup(&f);
    let forged = field(&f, "response_body").replacen(r#"\"verdict\": \"fail\""#, r#"\"verdict\": \"pass\""#, 1);
    assert_ne!(forged, field(&f, "response_body"));
    submit_real(&mut c, &f, forged);
}

// ---------- proposals ----------

#[test]
fn a_funded_stage_with_a_signed_pass_is_proposed() {
    let c = proposed();
    let s = stage(&c, 0);
    assert_eq!(s.status, StageStatus::Proposed);
    assert_eq!(s.proposal_expires_at, Some(U64(1_000 + PROPOSAL_TTL_NS)));
}

#[test]
#[should_panic(expected = "not a pass")]
fn a_fail_cannot_be_proposed() {
    let mut c = setup();
    fund(&mut c, 0, 5_000_000);
    let body = answer("fail", 95, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    call(agent());
    c.propose_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "confidence is below 60")]
fn a_low_confidence_pass_cannot_be_proposed() {
    let mut c = setup();
    fund(&mut c, 0, 5_000_000);
    let body = answer("pass", 55, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    call(agent());
    c.propose_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "A photo check failed")]
fn a_reused_photo_cannot_be_proposed() {
    let mut c = setup();
    fund(&mut c, 0, 5_000_000);
    let body = answer("pass", 92, 0);
    let checks = PhotoChecks { not_reused: false, ..all_checks() };
    submit(&mut c, 0, &body, &sign(&body), checks);
    call(agent());
    c.propose_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "fully funded")]
fn an_unfunded_stage_cannot_be_proposed() {
    let mut c = setup();
    let body = answer("pass", 92, 0);
    submit(&mut c, 0, &body, &sign(&body), all_checks());
    call(agent());
    c.propose_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "previous stage must be released")]
fn stages_release_in_order() {
    let mut c = setup();
    fund(&mut c, 1, 3_000_000);
    let body = answer("pass", 92, 1);
    submit(&mut c, 1, &body, &sign(&body), all_checks());
    call(agent());
    c.propose_release(PROJECT.into(), 1);
}

#[test]
#[should_panic(expected = "Only the project's agent")]
fn only_the_agent_proposes() {
    let mut c = setup();
    call(owner());
    c.propose_release(PROJECT.into(), 0);
}

// ---------- approvals and refunds ----------

#[test]
fn the_owner_approves_with_one_yocto() {
    let mut c = proposed();
    call_1yocto(owner());
    let _ = c.approve_release(PROJECT.into(), 0);
    assert_eq!(stage(&c, 0).status, StageStatus::Released);
}

#[test]
#[should_panic(expected = "Requires attached deposit of exactly 1 yoctoNEAR")]
fn approval_needs_a_wallet_signature() {
    let mut c = proposed();
    call(owner());
    let _ = c.approve_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "Only the owner can approve")]
fn the_agent_cannot_approve() {
    let mut c = proposed();
    call_1yocto(agent());
    let _ = c.approve_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "not proposed for release")]
fn a_stage_cannot_be_paid_twice() {
    let mut c = proposed();
    call_1yocto(owner());
    let _ = c.approve_release(PROJECT.into(), 0);
    let _ = c.approve_release(PROJECT.into(), 0);
}

#[test]
#[should_panic(expected = "Proposal expired")]
fn an_expired_proposal_cannot_be_approved() {
    let mut c = proposed();
    let mut ctx = VMContextBuilder::new();
    ctx.predecessor_account_id(owner())
        .attached_deposit(NearToken::from_yoctonear(1))
        .block_timestamp(2_000 + PROPOSAL_TTL_NS);
    testing_env!(ctx.build());
    let _ = c.approve_release(PROJECT.into(), 0);
}

#[test]
fn the_owner_can_override_with_a_reason() {
    let mut c = setup();
    fund(&mut c, 0, 5_000_000);
    call_1yocto(owner());
    let _ = c.override_release(PROJECT.into(), 0, "Inspected in person".into());
    assert_eq!(stage(&c, 0).status, StageStatus::Released);
}

#[test]
fn the_owner_can_refund_an_unreleased_stage() {
    let mut c = setup();
    fund(&mut c, 0, 2_000_000);
    call_1yocto(owner());
    let _ = c.refund_stage(PROJECT.into(), 0);
    assert_eq!(stage(&c, 0).status, StageStatus::Refunded);
}

#[test]
#[should_panic(expected = "already paid out or refunded")]
fn a_released_stage_cannot_be_refunded() {
    let mut c = proposed();
    call_1yocto(owner());
    let _ = c.approve_release(PROJECT.into(), 0);
    let _ = c.refund_stage(PROJECT.into(), 0);
}

// ---------- ledger and admin ----------

#[test]
fn the_ledger_head_only_moves_forward() {
    let mut c = setup();
    call(agent());
    c.anchor_ledger(PROJECT.into(), 3, EVIDENCE.into());
    let p = c.get_project(PROJECT.into()).unwrap();
    assert_eq!((p.ledger_seq, p.ledger_head.as_deref()), (3, Some(EVIDENCE)));
}

#[test]
#[should_panic(expected = "Ledger sequence must increase")]
fn the_ledger_cannot_be_rewound() {
    let mut c = setup();
    call(agent());
    c.anchor_ledger(PROJECT.into(), 3, EVIDENCE.into());
    c.anchor_ledger(PROJECT.into(), 2, REQUEST.into());
}

#[test]
#[should_panic(expected = "Only the admin")]
fn only_the_admin_registers_signers() {
    let mut c = setup();
    call_1yocto(owner());
    c.register_signer("evil/model".into(), to_hex(&[1u8; 32]));
}
