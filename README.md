# Homebound® — Every milestone earns its release

Diaspora homeowners send billions abroad each year to build houses, yet most remittances vanish into lump-sum wires with zero proof of progress on site.

**Homebound** bridges **Money (`Circle USDC`)**, **Intelligence (`NEAR AI Cloud Qwen/Qwen3.8-27B`)**, and **Ownership (`1 yoctoNEAR`)** on NEAR (`escrow.homebound-hq.testnet`) so every construction milestone settles on verifiable physical evidence:

1. **Stage-Locked Circle USDC & Gasless Foreman Relay (`08 / Real-World Money`)** — Each construction tranche is funded individually via NEP-141 `ft_transfer_call` and paid to `chidi.homebound-hq.testnet` only when approved. On `/site`, site foremen in Ibadan need **zero NEAR and no wallet extension**: uploads are gas-sponsored by `agent.homebound-hq.testnet`. Reconcile all 6 stages anytime via `/verify` or `GET /api/ledger/csv` with trusted payment statuses (`Paid`, `Proposed`, `Funded`, `Refunded`, `Planned`).
2. **Criteria-Bound TEE Intelligence (`13 / Open Innovation`)** — The site server extracts EXIF timestamps, enforces a **150m Haversine geofence**, blocks recycled images with a **64-bit dHash** barrier, and asks `Qwen/Qwen3.8-27B` inside a NEAR AI Cloud enclave to grade masonry against the stage's written specification. On-chain, `submit_verdict` verifies the registered Ed25519 signature, rejects `response_hash` replay, and binds `ref` to `{project_id}/{stage}/{criteria_hash}/{evidence_sha256}`.
3. **Human Ownership & Explicit Failure Recovery (`13 / Open Innovation`)** — The agent can propose a release (`24h TTL`) but can **never transfer funds**. Every settlement requires the homeowner's `1 yoctoNEAR` signature (`approve_release`), and owner escape hatches (`override_release`, `refund_stage`, `set_agent`) stay visible on `/build`.

---

## Failure-Case Recovery & Public On-Chain Rules

| Failure Mode | On-Chain Rule (`contracts/escrow/src/lib.rs`) | Recovery Action |
| :--- | :--- | :--- |
| **AI rejects valid masonry / cloud stalls** | `override_release(project_id, stage, reason)` | Owner attaches public inspection reason and releases USDC (`1 yoctoNEAR`). |
| **Contractor halts or abandons milestone** | `refund_stage(project_id, stage)` | Owner sweeps unspent Circle USDC back to their wallet (`1 yoctoNEAR`). |
| **24h release proposal expires** | `PROPOSAL_TTL_NS = 24h` | Stale proposal cannot pay out; re-verify a fresh photo or call `refund_stage`. |
| **Agent relayer key compromised / stale** | `set_agent(project_id, new_agent)` | Owner rotates or revokes `project.agent` immediately (`1 yoctoNEAR`). |

---

## Live Testnet Deployment (`hb-akobo-bungalow`)

| Component | Account / Model | Link |
| :--- | :--- | :--- |
| Escrow Contract (Rust) | `escrow.homebound-hq.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/escrow.homebound-hq.testnet) |
| Live Demo Owner | `tightrat3805.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/tightrat3805.testnet) |
| Gasless Relayer Agent | `agent.homebound-hq.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/agent.homebound-hq.testnet) |
| Nigeria Builder Payee | `chidi.homebound-hq.testnet` | [Nearblocks](https://testnet.nearblocks.io/address/chidi.homebound-hq.testnet) |
| Circle USDC (Testnet) | `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af` | [Nearblocks](https://testnet.nearblocks.io/address/3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af) |
| NEAR AI Cloud Vision TEE | `Qwen/Qwen3.8-27B` | Registered Ed25519 signer `89154a43...30cb2d93` |

---

## Do X → See Y Verification Guide

```bash
# 1. Cryptographic signature, criteria-hash binding & live testnet contract audit
npm run attack

# 2. Rust escrow unit tests (34 tests including real captured TEE signature + criteria_hash binding)
cargo test --manifest-path contracts/escrow/Cargo.toml --lib

# 3. Install, lint, build & start the local workspace (uses embedded PGlite)
npm install
cp .env.example .env.local   # Configure NEARAI_API_KEY + NEAR_AGENT_PRIVATE_KEY
npm run lint
npm run build
npm run dev
```

- **Visit `/`** → Inspect the 6-stage remittance stack, `Observe → Reason → Move` architecture, and FAQ.
- **Visit `/build` (`(01) ESCROW`)** → Click stages `01–06` on the cut-plane gauge, toggle `USDC / ₦ NGN`, and view the **Always-Visible Owner Sovereignty & Escape Hatches** (`refund_stage`, `override_release`, `set_agent`).
- **Visit `/site` (`(02) SITE CAMERA`)** → Confirm **Gasless Relay Active (0 NEAR)**, drag the CAD-vs-Photo comparison slider, and click `Cast Lintel Beam` to grade a real EXIF-stamped photo in NEAR AI Cloud TEE and submit on-chain.
- **Visit `/verify` (`(03) LEDGER & RULES`)** → Inspect the Quantity Surveyor table, download **`GET /api/ledger/csv`**, review the 2×2 failure recovery matrix, and click **`Verify Live TEE Attestation`**.

---

## Hackathon Context & Baseline Disclosure

Targeted tracks for NEAR Hackathon:
- **`[ 08 / RWM ]` Real-World Money** — Stage-locked Circle USDC remittances, gasless worker UX, bookkeeper CSV exports, and trusted payment statuses.
- **`[ 13 / NEW ]` Open Innovation** — Coordinated money + TEE intelligence + `1 yoctoNEAR` human ownership, cryptographic `criteria_hash` verdict binding, public contract release rules, and visible owner escape hatches.

Built from a clean milestone scheduling schema originally explored in an unsubmitted PayPal/Postgres prototype ([`emarc99/HomeBound`](https://github.com/emarc99/HomeBound), started Nov 3, 2026), re-architected around NEAR Circle USDC escrow, on-chain Ed25519 TEE verification via NEAR AI Cloud, criteria-hash binding, scoped gasless agent keys, and an ARCA-inspired architectural UI.
