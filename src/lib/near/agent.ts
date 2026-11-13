import "server-only";
import { Account, KeyPairSigner, type KeyPairString } from "near-api-js";
import { nearPublicConfig } from "./config";
import { nearProvider } from "./views";
import { TGAS } from "./shared";

// The server holds only the agent's function-call key: it can call submit_verdict, propose_release
// and anchor_ledger on the escrow, attach no deposit, and do nothing else.

let agent: Account | null = null;
function agentAccount(): Account {
  const key = process.env.NEAR_AGENT_PRIVATE_KEY;
  if (!key) throw new Error("NEAR_AGENT_PRIVATE_KEY is not set");
  agent ??= new Account(nearPublicConfig().agent, nearProvider(), KeyPairSigner.fromSecretKey(key as KeyPairString));
  return agent;
}

export class AgentCallError extends Error {}

async function callEscrow(methodName: string, args: Record<string, unknown>, tgas: bigint): Promise<string> {
  try {
    const result = await agentAccount().callFunctionRaw({
      contractId: nearPublicConfig().escrow,
      methodName,
      args,
      gas: tgas * TGAS,
    });
    return result.transaction.hash;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AgentCallError(`${methodName} was refused on chain: ${message.slice(0, 300)}`);
  }
}

export function submitVerdictOnChain(input: {
  projectId: string;
  stage: number;
  evidenceSha256: string;
  modelId: string;
  requestHash: string;
  responseBody: string;
  signature: string;
  checks: { taken_in_window: boolean; on_site: boolean; not_reused: boolean };
}): Promise<string> {
  return callEscrow(
    "submit_verdict",
    {
      project_id: input.projectId,
      stage: input.stage,
      evidence_sha256: input.evidenceSha256,
      model_id: input.modelId,
      request_hash: input.requestHash,
      response_body: input.responseBody,
      signature: input.signature,
      checks: input.checks,
    },
    100n,
  );
}

export function proposeReleaseOnChain(projectId: string, stage: number): Promise<string> {
  return callEscrow("propose_release", { project_id: projectId, stage }, 30n);
}

export function anchorLedgerOnChain(projectId: string, seq: number, headHash: string): Promise<string> {
  return callEscrow("anchor_ledger", { project_id: projectId, seq, head_hash: headHash }, 30n);
}
