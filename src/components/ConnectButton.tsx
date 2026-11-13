"use client";

import { useNearWallet } from "@/components/near/NearProvider";

function shortAccount(id: string): string {
  if (id.length <= 22) return id;
  return `${id.slice(0, 10)}…${id.slice(-10)}`;
}

export function ConnectButton() {
  const { accountId, ready, connect, disconnect } = useNearWallet();

  if (!ready) {
    return (
      <span className="rounded-full border border-line bg-card px-4 py-2 font-mono text-xs text-muted">
        Wallet loading…
      </span>
    );
  }

  if (accountId) {
    return (
      <button
        type="button"
        onClick={() => void disconnect()}
        title={`Connected as ${accountId} — click to disconnect`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-medium text-ink transition hover:border-ink"
      >
        <span className="size-2 rounded-full bg-leaf" />
        {shortAccount(accountId)}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => void connect()} className="btn px-4 py-2 text-xs">
      Connect NEAR wallet
    </button>
  );
}
