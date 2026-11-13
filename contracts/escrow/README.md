# Escrow Contract (`escrow.homebound-hq.testnet`)

Rust smart contract (`near-sdk` 5.30.1) holding stage-by-stage Circle USDC (NEP-141) in escrow for diaspora construction milestones.

## Security Model (Three Locks)

1. **Scoped Agent Account**: The AI agent account can only call `submit_verdict`, `propose_release`, and `anchor_ledger` via a NEAR function-call access key. It cannot attach NEAR deposits, call `approve_release`, or transfer USDC.
2. **On-Chain Ed25519 Verification**: `submit_verdict` hashes the exact NEAR AI Cloud `response_body` on-chain, reconstructs `{model_id}:{request_hash}:{response_hash}`, verifies the `ed25519` signature against a registered model key in `signers`, blocks replays via `used_responses`, and checks that the JSON answer's `ref` matches `{project_id}/{stage}/{evidence_sha256}`.
3. **1-yoctoNEAR Owner Approval**: `approve_release`, `override_release`, and `refund_stage` require `assert_one_yocto()` and `predecessor == project.owner`, forcing a full-access wallet signature. Payees and amounts are immutable once created.

## Run Tests

```bash
cargo test --lib
```

The test suite includes unit tests for every invariant plus an end-to-end verification test against a real captured NEAR AI Cloud `provider_tee` response (`tests/fixtures/nearai-signed-response.json`).

## Build WASM

```bash
cargo near build non-reproducible-wasm
```
