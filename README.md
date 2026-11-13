# Homebound — every milestone earns its release

Diaspora Nigerians send billions home to build houses, yet most remittances vanish into lump-sum bank wires that no one can audit remotely.

**Homebound** puts every construction stage into Circle USDC escrow on NEAR (`escrow.homebound-hq.testnet`). A contractor uploads a progress photo, NEAR AI Cloud (`Qwen/Qwen3.8-27B`) inspects it inside a confidential TEE and signs the verdict, and money moves **only when three independent locks agree**:

1. **Contract Escrow Lock** — Stage budgets, contractor payees, and `criteria_hash` are fixed on NEAR at project creation; Circle USDC stays locked per stage via NEP-141 `ft_transfer_call`.
2. **Confidential TEE Verdict Lock** — `NEAR AI Cloud` grades the site photo and returns an Ed25519 signature over `{model_id}:{request_hash}:{response_hash}`. The contract verifies that signature on chain (`env::ed25519_verify`) and binds the response `ref` to `{project_id}/{stage}/{evidence_sha256}` — rejecting tampered bodies, cross-stage replays, and forged keys.
3. **Owner Final Approval Lock (`1 yoctoNEAR`)** — Even after a passing TEE verdict puts the stage into `ProposedRelease`, payout requires the homeowner's own NEAR wallet signature (`approve_release`), while the AI agent's `FunctionCall` key on `agent.homebound-hq.testnet` is scoped strictly to `submit_verdict`, `propose_release`, and `anchor_ledger` — never transfers.

> **Security boundary note:** On chain, `submit_verdict` verifies response immutability against the TEE-attested key (`sha256(response_body) == response_hash`) and `ref` binding to `{project_id}/{stage}/{evidence_sha256}`; `request_hash` is recorded verbatim while stage `criteria_hash` is committed at `create_project`, so prompt construction and EXIF extraction rely on server integrity backed by Lock 3 (owner's `1 yoctoNEAR` final approval).

---

## Live Testnet Deployment

| Component | Account / Model | Link |
| :--- | :--- | :--- |
| Escrow Contract (Rust) | `escrow.homebound-hq.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/escrow.homebound-hq.testnet) |
| Agent (Function-Call Key) | `agent.homebound-hq.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/agent.homebound-hq.testnet) |
| Circle USDC (Testnet) | `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af` | [Nearblocks](https://testnet.nearblocks.io/address/3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af) |
| NEAR AI Cloud Vision TEE | `Qwen/Qwen3.8-27B` | Registered Ed25519 signer `89154a43...30cb2d93` |

---

## Quick Verification

```bash
# 1. Run red-team cryptographic + live testnet FunctionCall key audit
npm run attack

# 2. Run Rust escrow contract unit tests (32 tests incl. real captured TEE signature)
#    (On Windows, run via WSL if Unix test deps require a Linux target)
cargo test --manifest-path contracts/escrow/Cargo.toml --lib

# 3. Install, lint, and run Next.js 16 workspace locally (zero external DB needed; uses embedded PGlite)
npm install
cp .env.example .env.local   # Add NEARAI_API_KEY + NEAR_AGENT_PRIVATE_KEY for live uploads
npm run lint
npm run build
npm run dev
```

Visit `http://localhost:3000` for the overview, `/build` for the homeowner escrow cockpit, `/site` for the foreman field camera + 1-click EXIF samples, and `/verify` for live enclave attestation & the audit ledger:
- **Live TEE Attestation** — Click `Verify live TEE attestation` on `/verify` (`GET /api/attestation`) to validate live Intel TDX + NVIDIA GPU TCB quotes via `@nearai/inference-sdk` against the on-chain `get_signer` key.
- **Sample construction photos** — Curated EXIF-stamped Ibadan and Lagos field photos are bundled in `public/samples/` for 1-click testing on `/site`.

---

## Architecture

- [`contracts/escrow`](contracts/escrow/src/lib.rs) — NEAR Rust smart contract managing stage funding (`ft_on_transfer`), `env::ed25519_verify` TEE verdict validation (`submit_verdict`), proposal windows (`propose_release`), `1 yoctoNEAR` homeowner payout (`approve_release` / `override_release` / `refund_stage`), and audit anchoring (`anchor_ledger`).
- [`src/lib/ai`](src/lib/ai/nearai.ts) — NEAR AI Cloud vision inspector (`verify-photo.ts`), completion signature fetcher, and live Intel TDX + NVIDIA NRAS quote verifier.
- [`src/lib/near`](src/lib/near/agent.ts) — Restricted `FunctionCall` agent signer (`submit_verdict`, `propose_release`, `anchor_ledger`), fastNEAR RPC view reader, and transaction event verifier.
- [`src/lib/ledger.ts`](src/lib/ledger.ts) — SHA-256 hash-chained audit trail persisted in Postgres/PGlite and anchored periodically on NEAR.
- [`scripts/attack.mjs`](scripts/attack.mjs) — Standalone red-team suite proving signature tamper rejection, cross-stage replay rejection, forged signer rejection, and live testnet key scoping.

---

## Hackathon Context & Baseline Disclosure

Targeted tracks: **Real-World Money**, **AI Security & Defense**, and **Privacy & Private AI**.

Built from a clean milestone scheduling schema originally explored in an unsubmitted PayPal/Postgres prototype ([`emarc99/HomeBound`](https://github.com/emarc99/HomeBound), started Nov 3, 2026), re-architected around NEAR USDC escrow, on-chain Ed25519 TEE verification via NEAR AI Cloud, function-call key isolation, and a focused editorial workspace UI.
