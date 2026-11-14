"use client";

import { ArchitectureAndSequence } from "./landing/ArchitectureAndSequence";
import { HeroAndStack } from "./landing/HeroAndStack";
import { ManifestoAndPillars } from "./landing/ManifestoAndPillars";
import { TeamFaqCtaFooter } from "./landing/TeamFaqCtaFooter";

export function LandingInteractive({
  escrowAccount,
  agentAccount,
  network,
}: {
  escrowAccount: string;
  agentAccount: string;
  network: string;
}) {
  return (
    <main className="flex-1 bg-paper">
      <HeroAndStack escrowAccount={escrowAccount} network={network} />
      <ManifestoAndPillars />
      <ArchitectureAndSequence />
      <TeamFaqCtaFooter
        escrowAccount={escrowAccount}
        agentAccount={agentAccount}
        network={network}
      />
    </main>
  );
}
