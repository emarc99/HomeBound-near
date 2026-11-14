"use client";

import { useNearWallet } from "@/components/near/NearProvider";

function shortAccount(id: string): string {
  if (id.length <= 22) return id;
  return `${id.slice(0, 10)}…${id.slice(-10)}`;
}

function WalletIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="shrink-0 text-muted"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h4" />
      <circle cx="16.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function ConnectButton() {
  const { accountId, connect, disconnect } = useNearWallet();

  if (accountId) {
    return (
      <button
        type="button"
        onClick={() => void disconnect()}
        title={`Connected as ${accountId} — click to disconnect`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-line bg-card px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.12em] text-ink transition hover:border-ink"
      >
        <span className="size-2 rounded-full bg-leaf" />
        <WalletIcon />
        <span>{shortAccount(accountId)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void connect()}
      className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-line bg-card px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.12em] uppercase text-ink transition hover:border-ink"
    >
      <WalletIcon />
      <span>Connect NEAR Wallet</span>
    </button>
  );
}
