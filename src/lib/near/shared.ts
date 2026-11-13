// Types and helpers shared by the server and the browser. No secrets here.

export type ChainStageStatus = "planned" | "funded" | "proposed" | "released" | "refunded";

export type ChainVerdictRecord = {
  evidence_sha256: string;
  model_id: string;
  request_hash: string;
  response_hash: string;
  verdict: "pass" | "fail" | "needs_review";
  confidence: number;
  checks: { taken_in_window: boolean; on_site: boolean; not_reused: boolean };
  submitted_at: string;
};

export type ChainStage = {
  name: string;
  payee: string;
  amount: string;
  funded: string;
  criteria_hash: string;
  status: ChainStageStatus;
  verdict: ChainVerdictRecord | null;
  proposal_expires_at: string | null;
};

export type ChainProject = {
  owner: string;
  agent: string;
  stages: ChainStage[];
  ledger_seq: number;
  ledger_head: string | null;
};

export type NearPublicConfig = {
  network: "testnet" | "mainnet";
  escrow: string;
  usdc: string;
  agent: string;
  explorer: string;
  /** Testnet demo scale: on-chain USDC = real tranche / demoDivisor. */
  demoDivisor: number;
};

/** What the server stores about the on-chain side of a photo verdict. */
export type ChainVerdict = {
  modelId: string;
  reference: string;
  requestHash: string;
  responseHash: string;
  signature: string;
  signingAddress: string;
  verdict: "pass" | "fail" | "needs_review";
  confidence: number;
  submitTx?: string;
  proposeTx?: string;
  error?: string;
};

export const USDC_DECIMALS = 6;
export const ONE_YOCTO = "1";
export const TGAS = 1_000_000_000_000n;

export const txUrl = (cfg: Pick<NearPublicConfig, "explorer">, hash: string) => `${cfg.explorer}/txns/${hash}`;
export const accountUrl = (cfg: Pick<NearPublicConfig, "explorer">, id: string) => `${cfg.explorer}/address/${id}`;

/** USD cents of a real tranche to raw on-chain USDC (6 decimals), scaled down for the testnet demo. */
export function usdcForCents(cents: number, demoDivisor: number): bigint {
  return (BigInt(cents) * 10_000n) / BigInt(demoDivisor);
}

export function formatUsdc(raw: string | bigint): string {
  const v = BigInt(raw);
  const whole = v / 1_000_000n;
  const frac = (v % 1_000_000n).toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole}.${frac} USDC`;
}

/** The escrow's project IDs can't contain '/' and must be at most 64 characters. */
export const chainProjectId = (projectId: string) => `hb-${projectId.replace(/-/g, "").slice(0, 16)}`;

/** The string the model must echo back so a verdict can't be replayed on another stage or photo. */
export const verdictReference = (chainProject: string, stageIndex: number, evidenceSha256: string) =>
  `${chainProject}/${stageIndex}/${evidenceSha256}`;
