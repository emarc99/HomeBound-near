"use client";

import { useState } from "react";
import type { ClientView } from "@/lib/client-view";
import { EvidencePanel } from "./EvidencePanel";
import { LedgerFeed, type ClientLedgerEvent, type LedgerIntegrity } from "./LedgerFeed";
import { AttestationCard, NearProjectBanner, NearStageEscrow } from "./NearPanels";
import { StagePipeline } from "./StagePipeline";

export function BuildWorkspace({
  initial,
  ledger,
  integrity,
  nearAiModelName,
}: {
  initial: ClientView;
  ledger: ClientLedgerEvent[];
  integrity: LedgerIntegrity;
  nearAiModelName: string;
}) {
  const defaultStage =
    initial.stages.find((s) => s.nearStatus === "proposed") ??
    initial.stages.find((s) => s.nearStatus === "funded") ??
    initial.stages[0];

  const [selectedId, setSelectedId] = useState<string>(defaultStage?.id ?? "");
  const selectedStage = initial.stages.find((s) => s.id === selectedId) ?? initial.stages[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <NearProjectBanner view={initial} />

      <StagePipeline
        stages={initial.stages}
        chainStages={initial.near.chain?.stages ?? null}
        evidence={initial.evidence}
        selectedId={selectedStage?.id ?? ""}
        demoDivisor={initial.near.config.demoDivisor}
        onSelect={setSelectedId}
      />

      {selectedStage && (
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <NearStageEscrow view={initial} stage={selectedStage} />
            <AttestationCard model={nearAiModelName} registeredSigner={initial.near.registeredSigner} />
          </div>
          <EvidencePanel stage={selectedStage} evidence={initial.evidence} near={initial.near} />
        </div>
      )}

      <LedgerFeed events={ledger} integrity={integrity} config={initial.near.config} />
    </main>
  );
}
