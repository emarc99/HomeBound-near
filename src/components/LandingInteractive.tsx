"use client";

import type { ClientStage } from "@/lib/client-view";
import { ArchitectureAndSequence } from "./landing/ArchitectureAndSequence";
import { HeroAndStack } from "./landing/HeroAndStack";
import { ManifestoAndPillars } from "./landing/ManifestoAndPillars";
import { TeamFaqCtaFooter } from "./landing/TeamFaqCtaFooter";

export function LandingInteractive({
  escrowAccount,
  agentAccount,
  network,
  stages,
}: {
  escrowAccount: string;
  agentAccount: string;
  network: string;
  stages?: ClientStage[];
}) {
  return (
    <main className="flex-1 bg-paper">
      <HeroAndStack escrowAccount={escrowAccount} network={network} stages={stages} />
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
