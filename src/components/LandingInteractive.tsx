"use client";

import { HeroAndStack } from "./landing/HeroAndStack";
import { ManifestoAndPillars } from "./landing/ManifestoAndPillars";

export function LandingInteractive({
  escrowAccount,
  agentAccount,
  network,
}: {
  escrowAccount: string;
  agentAccount: string;
  network: string;
}) {
  void agentAccount;
  return (
    <main className="flex-1 bg-paper">
      <HeroAndStack escrowAccount={escrowAccount} network={network} />
      <ManifestoAndPillars />
    </main>
  );
}
