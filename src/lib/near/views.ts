import "server-only";
import { JsonRpcProvider } from "near-api-js";
import { nearPublicConfig, nearRpcUrl } from "./config";
import type { ChainProject } from "./shared";

let provider: JsonRpcProvider | null = null;
export function nearProvider(): JsonRpcProvider {
  provider ??= new JsonRpcProvider({ url: nearRpcUrl() });
  return provider;
}

async function view<T>(contractId: string, method: string, args: Record<string, unknown>): Promise<T | undefined> {
  return (await nearProvider().callFunction({ contractId, method, args })) as T | undefined;
}

export async function getChainProject(projectId: string): Promise<ChainProject | null> {
  return (await view<ChainProject | null>(nearPublicConfig().escrow, "get_project", { project_id: projectId })) ?? null;
}

export async function getRegisteredSigner(modelId: string): Promise<string | null> {
  return (await view<string | null>(nearPublicConfig().escrow, "get_signer", { model_id: modelId })) ?? null;
}

export async function usdcStorageRegistered(accountId: string): Promise<boolean> {
  const bal = await view<unknown>(nearPublicConfig().usdc, "storage_balance_of", { account_id: accountId });
  return bal != null;
}

export async function usdcBalance(accountId: string): Promise<string> {
  return (await view<string>(nearPublicConfig().usdc, "ft_balance_of", { account_id: accountId })) ?? "0";
}

export async function usdcStorageMinimum(): Promise<string> {
  const b = await view<{ min: string }>(nearPublicConfig().usdc, "storage_balance_bounds", {});
  return b?.min ?? "1250000000000000000000";
}

export type EscrowEvent = { event: string; data: Record<string, unknown> };

export type TxSummary = {
  hash: string;
  signer: string;
  receiver: string;
  methods: string[];
  succeeded: boolean;
  escrowEvents: EscrowEvent[];
};

export async function readTransaction(txHash: string, signerId: string): Promise<TxSummary> {
  const escrow = nearPublicConfig().escrow;
  const tx = await nearProvider().viewTransactionStatus({ txHash, accountId: signerId, waitUntil: "FINAL" });
  const methods = tx.transaction.actions.flatMap((a) =>
    typeof a === "object" && "FunctionCall" in a ? [a.FunctionCall.method_name] : [],
  );
  const failedReceipt = tx.receipts_outcome.some(
    (r) => typeof r.outcome.status === "object" && "Failure" in r.outcome.status,
  );
  const escrowEvents: EscrowEvent[] = [];
  for (const r of tx.receipts_outcome) {
    if (r.outcome.executor_id !== escrow) continue;
    for (const log of r.outcome.logs) {
      if (!log.startsWith("EVENT_JSON:")) continue;
      try {
        const parsed = JSON.parse(log.slice("EVENT_JSON:".length));
        if (parsed.standard === "homebound_escrow") {
          const data = Array.isArray(parsed.data) ? parsed.data[0] : parsed.data;
          escrowEvents.push({ event: parsed.event, data: data ?? {} });
        }
      } catch {
        // ignore unrelated logs
      }
    }
  }
  const status = tx.status;
  const succeeded = typeof status === "object" && "SuccessValue" in status && !failedReceipt;
  return {
    hash: txHash,
    signer: tx.transaction.signer_id,
    receiver: tx.transaction.receiver_id,
    methods,
    succeeded,
    escrowEvents,
  };
}
