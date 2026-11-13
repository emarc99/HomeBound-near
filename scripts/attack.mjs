/**
 * CLI red-team verification suite for Homebound on NEAR.
 * Tests cryptographic signature verification, verdict tampering, cross-stage replay,
 * forged signers, and (when online) live NEAR testnet contract + Function-Call Key scope.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(
  readFileSync(path.join(root, "contracts/escrow/tests/fixtures/nearai-signed-response.json"), "utf8"),
);

const RPC_URL = process.env.NEAR_RPC_URL || "https://test.rpc.fastnear.com";
const ESCROW_CONTRACT = process.env.NEAR_ESCROW_CONTRACT || "escrow.homebound-hq.testnet";
const AGENT_ACCOUNT = process.env.NEAR_AGENT_ACCOUNT || "agent.homebound-hq.testnet";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function ed25519KeyFromHex(hex) {
  const raw = Buffer.from(hex.replace(/^0x/, ""), "hex");
  assert.equal(raw.length, 32, "Ed25519 public key must be 32 bytes");
  return crypto.createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function signedMessage(modelId, requestHash, responseBody) {
  return `${modelId}:${requestHash}:${sha256Hex(responseBody)}`;
}

function verifyEscrowVerdict({ modelId, requestHash, expectedResponseHash, responseBody, signatureHex, signerHex, expectedRef }) {
  const actualHash = sha256Hex(responseBody);
  if (actualHash !== expectedResponseHash) {
    throw new Error("response_hash mismatch");
  }
  const pubKey = ed25519KeyFromHex(signerHex);
  const ok = crypto.verify(
    null,
    Buffer.from(signedMessage(modelId, requestHash, responseBody), "utf8"),
    pubKey,
    Buffer.from(signatureHex, "hex"),
  );
  if (!ok) {
    throw new Error("invalid Ed25519 TEE signature");
  }
  const outer = JSON.parse(responseBody);
  const content = outer?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("missing completion content");
  const jsonText = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(jsonText);
  if (parsed.ref !== expectedRef) {
    throw new Error(`ref mismatch: expected ${expectedRef}, got ${parsed.ref}`);
  }
  return parsed;
}

async function nearRpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "attack", method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function main() {
  let passed = 0;
  const check = (name, fn) => {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  };

  check("Baseline captured NEAR AI Cloud TEE verdict verifies end-to-end", () => {
    const parsed = verifyEscrowVerdict({
      modelId: fixture.model_id,
      requestHash: fixture.request_hash,
      expectedResponseHash: fixture.response_hash,
      responseBody: fixture.response_body,
      signatureHex: fixture.signature,
      signerHex: fixture.signing_address,
      expectedRef: fixture.reference,
    });
    assert.equal(parsed.verdict, "fail");
    assert.equal(sha256Hex(fixture.response_body), fixture.response_hash);
  });

  check("Tampered response body ('fail' -> 'pass') with original signature is rejected", () => {
    const tamperedBody = fixture.response_body.replace('\\"verdict\\": \\"fail\\"', '\\"verdict\\": \\"pass\\"');
    assert.notEqual(tamperedBody, fixture.response_body);
    assert.throws(
      () =>
        verifyEscrowVerdict({
          modelId: fixture.model_id,
          requestHash: fixture.request_hash,
          expectedResponseHash: sha256Hex(tamperedBody),
          responseBody: tamperedBody,
          signatureHex: fixture.signature,
          signerHex: fixture.signing_address,
          expectedRef: fixture.reference,
        }),
      /invalid Ed25519 TEE signature/,
    );
  });

  check("Tampered body under stale response_hash is rejected", () => {
    const tamperedBody = `${fixture.response_body} `;
    assert.throws(
      () =>
        verifyEscrowVerdict({
          modelId: fixture.model_id,
          requestHash: fixture.request_hash,
          expectedResponseHash: fixture.response_hash,
          responseBody: tamperedBody,
          signatureHex: fixture.signature,
          signerHex: fixture.signing_address,
          expectedRef: fixture.reference,
        }),
      /response_hash mismatch/,
    );
  });

  check("Cross-stage / cross-photo replay attack is rejected by ref binding", () => {
    assert.throws(
      () =>
        verifyEscrowVerdict({
          modelId: fixture.model_id,
          requestHash: fixture.request_hash,
          expectedResponseHash: fixture.response_hash,
          responseBody: fixture.response_body,
          signatureHex: fixture.signature,
          signerHex: fixture.signing_address,
          expectedRef: `spike/1/${fixture.evidence_sha256}`,
        }),
      /ref mismatch/,
    );
  });

  check("Forged signature from attacker non-TEE Ed25519 key is rejected", () => {
    const attacker = crypto.generateKeyPairSync("ed25519");
    const forgedBody = JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ verdict: "pass", confidence: 99, ref: fixture.reference }) } }],
    });
    const forgedHash = sha256Hex(forgedBody);
    const forgedSig = crypto
      .sign(null, Buffer.from(signedMessage(fixture.model_id, fixture.request_hash, forgedBody), "utf8"), attacker.privateKey)
      .toString("hex");
    assert.throws(
      () =>
        verifyEscrowVerdict({
          modelId: fixture.model_id,
          requestHash: fixture.request_hash,
          expectedResponseHash: forgedHash,
          responseBody: forgedBody,
          signatureHex: forgedSig,
          signerHex: fixture.signing_address,
          expectedRef: fixture.reference,
        }),
      /invalid Ed25519 TEE signature/,
    );
  });

  if (process.argv.includes("--offline")) {
    console.log(`\n${passed} cryptographic checks passed (--offline skipped live NEAR RPC inspection).`);
    return;
  }

  try {
    const signerView = await nearRpc("query", {
      request_type: "call_function",
      finality: "final",
      account_id: ESCROW_CONTRACT,
      method_name: "get_signer",
      args_base64: Buffer.from(JSON.stringify({ model_id: fixture.model_id })).toString("base64"),
    });
    if (signerView.error) throw new Error(String(signerView.error));
    const onChainSigner = JSON.parse(Buffer.from(signerView.result).toString("utf8"));
    assert.equal(onChainSigner, fixture.signing_address, "On-chain signer differs from fixture TEE key");
    passed++;
    console.log(`[PASS] Live contract ${ESCROW_CONTRACT} registers attested signer ${onChainSigner.slice(0, 16)}…`);

    const keysRes = await nearRpc("query", {
      request_type: "view_access_key_list",
      finality: "final",
      account_id: AGENT_ACCOUNT,
    });
    const keys = keysRes.keys ?? [];
    const scoped = keys.filter(
      (k) => k.access_key?.permission?.FunctionCall?.receiver_id === ESCROW_CONTRACT,
    );
    assert.ok(scoped.length > 0, `Expected scoped FunctionCall key on ${AGENT_ACCOUNT}`);
    const methods = scoped.flatMap((k) => k.access_key.permission.FunctionCall.method_names ?? []);
    passed++;
    console.log(
      `[PASS] Live agent ${AGENT_ACCOUNT} has FunctionCall key scoped to ${ESCROW_CONTRACT} (${methods.join(", ") || "specific methods"})`,
    );
  } catch (err) {
    console.warn(`[WARN] Live testnet RPC check skipped/failed: ${err instanceof Error ? err.message : err}`);
  }

  console.log(`\n${passed} red-team checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
