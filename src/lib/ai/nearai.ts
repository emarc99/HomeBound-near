import "server-only";
import { createHash, createPublicKey, verify } from "node:crypto";
import { z } from "zod";
import { INSPECTOR_SYSTEM, PhotoAssessment, stagePrompt, type StagePhotoInput } from "./verify-photo";

// NEAR AI Cloud runs the model inside a TEE and signs `model:sha256(request):sha256(response)`
// with an Ed25519 key. The escrow contract re-checks that signature over the exact bytes we keep here.

const BASE = "https://cloud-api.near.ai/v1";
const ED25519_SPKI_PREFIX = "302a300506032b6570032100";
const COMPLETION_TIMEOUT_MS = 120_000;

export const isNearAiConfigured = () => Boolean(process.env.NEARAI_API_KEY);
export const nearAiModel = () => process.env.NEARAI_MODEL || "Qwen/Qwen3.8-27B";

export type SignedVerdict = {
  modelId: string;
  reference: string;
  requestHash: string;
  responseHash: string;
  responseBody: string;
  signature: string;
  signingAddress: string;
};

export class NearAiError extends Error {}

const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

const NearAnswer = PhotoAssessment.extend({ confidence: z.number().min(0).max(100), ref: z.string() });

const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "confidence", "ref", "observations", "criteria", "authenticity", "authenticityNote"],
  properties: {
    verdict: { type: "string", enum: ["pass", "fail", "needs_review"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    ref: { type: "string" },
    observations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "status", "evidence"],
        properties: {
          criterion: { type: "string" },
          status: { type: "string", enum: ["met", "not_met", "not_visible"] },
          evidence: { type: "string" },
        },
      },
    },
    authenticity: { type: "string", enum: ["genuine_site_photo", "suspect"] },
    authenticityNote: { type: "string" },
  },
};

function verifyEd25519(publicKeyHex: string, message: string, signatureHex: string): boolean {
  const spki = Buffer.concat([Buffer.from(ED25519_SPKI_PREFIX, "hex"), Buffer.from(publicKeyHex.replace(/^0x/, ""), "hex")]);
  const key = createPublicKey({ key: spki, format: "der", type: "spki" });
  return verify(null, Buffer.from(message, "utf8"), key, Buffer.from(signatureHex.replace(/^0x/, ""), "hex"));
}

function stripFences(content: string): string {
  const t = content.trim();
  if (!t.startsWith("```")) return t;
  return t.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
}

async function fetchSignature(chatId: string, model: string, apiKey: string) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(
      `${BASE}/signature/${encodeURIComponent(chatId)}?model=${encodeURIComponent(model)}&signing_algo=ed25519`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
    );
    if (res.ok) {
      const body = (await res.json()) as { text?: string; signature?: string; signing_address?: string; signature_kind?: string };
      if (body.signature && body.text && body.signing_address) return body as Required<typeof body>;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new NearAiError("NEAR AI did not return a signature for the verdict");
}

export async function assessStagePhotoNearAi(
  input: StagePhotoInput & { reference: string },
): Promise<{ assessment: PhotoAssessment; model: string; signed: SignedVerdict }> {
  const apiKey = process.env.NEARAI_API_KEY;
  if (!apiKey) throw new NearAiError("NEARAI_API_KEY is not set");
  const model = nearAiModel();

  const requestBody = JSON.stringify({
    model,
    stream: false,
    temperature: 0,
    max_tokens: 1400,
    response_format: { type: "json_schema", json_schema: { name: "stage_verdict", strict: true, schema: ANSWER_SCHEMA } },
    messages: [
      { role: "system", content: `${INSPECTOR_SYSTEM} Copy the ref you are given into the ref field exactly.` },
      {
        role: "user",
        content: [
          { type: "text", text: `ref: ${input.reference}\n${stagePrompt(input)}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.image.toString("base64")}` } },
        ],
      },
    ],
  });

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept-Encoding": "identity",
      "x-no-aliasing": "true",
    },
    body: requestBody,
    signal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS),
  });
  const responseBytes = Buffer.from(await res.arrayBuffer());
  const responseBody = responseBytes.toString("utf8");
  if (!res.ok) throw new NearAiError(`NEAR AI returned HTTP ${res.status}: ${responseBody.slice(0, 200)}`);

  const completion = JSON.parse(responseBody) as { id: string; choices?: { message?: { content?: string } }[] };
  const answer = NearAnswer.parse(JSON.parse(stripFences(completion.choices?.[0]?.message?.content ?? "")));

  const requestHash = sha256(Buffer.from(requestBody, "utf8"));
  const responseHash = sha256(responseBytes);
  const sig = await fetchSignature(completion.id, model, apiKey);
  if (sig.text !== `${model}:${requestHash}:${responseHash}`) {
    throw new NearAiError("NEAR AI signed different bytes from the ones we sent and received");
  }
  if (!verifyEd25519(sig.signing_address, sig.text, sig.signature)) {
    throw new NearAiError("NEAR AI signature does not verify");
  }

  const { ref, ...rest } = answer;
  return {
    assessment: { ...rest, confidence: answer.confidence / 100 },
    model,
    signed: {
      modelId: model,
      reference: ref,
      requestHash,
      responseHash,
      responseBody,
      signature: sig.signature.replace(/^0x/, ""),
      signingAddress: sig.signing_address.replace(/^0x/, "").toLowerCase(),
    },
  };
}

export type AttestationReport = {
  model: string;
  verifiedAt: string;
  signingAddress: string;
  signingAlgo: string;
  tcbStatus: string;
  gpuVerified: boolean;
  onChainSigner: string | null;
  matchesOnChain: boolean;
};

/** Verifies the live Intel TDX + NVIDIA GPU attestation for the configured NEAR AI model. */
export async function verifyModelAttestationLive(onChainSigner: string | null): Promise<AttestationReport> {
  const apiKey = process.env.NEARAI_API_KEY;
  if (!apiKey) throw new NearAiError("NEARAI_API_KEY is not set");
  const model = nearAiModel();
  const { AttestationClient, verifyModelAttestation } = await import("@nearai/inference-sdk");
  const client = new AttestationClient({ baseUrl: BASE, apiKey });
  const fetched = await client.fetchModelAttestations({ model, signingAlgo: "ed25519" });
  const list = fetched.attestations;
  const nonce = fetched.clientBinding.nonce;
  if (!list.length) throw new NearAiError(`No attestation candidates returned for ${model}`);
  if (!nonce) throw new NearAiError(`Attestation response missing clientBinding.nonce for ${model}`);

  const verified: Record<string, unknown>[] = [];
  let lastErr: unknown = null;
  const realFetch = globalThis.fetch;
  // NVIDIA NRAS tokens set nbf = iat with zero leeway; wait briefly if the local clock lags NVIDIA's Date header.
  globalThis.fetch = async (input, init) => {
    const res = await realFetch(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("nras.attestation.nvidia.com/v3/attest")) {
      const serverDate = res.headers.get("date");
      const skewMs = serverDate ? Date.parse(serverDate) - Date.now() : 0;
      if (skewMs > -500 && skewMs < 10_000) {
        await new Promise((r) => setTimeout(r, Math.max(1500, skewMs + 1000)));
      }
    }
    return res;
  };
  try {
    for (const attestation of list) {
      try {
        const v = (await verifyModelAttestation({
          attestation,
          clientBinding: { nonce },
        })) as unknown as Record<string, unknown>;
        verified.push(v);
      } catch (err) {
        lastErr = err;
      }
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  if (!verified.length) {
    throw new NearAiError(lastErr instanceof Error ? lastErr.message : "TEE attestation verification failed");
  }

  const pickKey = (v: Record<string, unknown>) => {
    const candidates = [v.signingAddress, v.signingPublicKey, v.signer];
    for (const c of candidates) {
      if (typeof c === "string" && c) return c.replace(/^0x/, "").toLowerCase();
      if (c && typeof c === "object") {
        const obj = c as Record<string, unknown>;
        const k = obj.publicKey ?? obj.address ?? obj.signingAddress;
        if (typeof k === "string" && k) return k.replace(/^0x/, "").toLowerCase();
      }
    }
    return "";
  };

  const normalizedChain = onChainSigner?.replace(/^0x/, "").toLowerCase() ?? null;
  const matched = normalizedChain ? verified.find((v) => pickKey(v) === normalizedChain) : undefined;
  const chosen = matched ?? verified[0];
  const signingAddress = pickKey(chosen);
  const quote = chosen.quote as Record<string, unknown> | undefined;
  const gpu = chosen.gpuEvidence as Record<string, unknown> | undefined;

  return {
    model,
    verifiedAt: new Date().toISOString(),
    signingAddress,
    signingAlgo: String(chosen.signingAlgo ?? "ed25519"),
    tcbStatus: String(chosen.tcbStatus ?? quote?.tcbStatus ?? "verified"),
    gpuVerified: Boolean(gpu),
    onChainSigner: normalizedChain,
    matchesOnChain: Boolean(normalizedChain && signingAddress === normalizedChain),
  };
}
