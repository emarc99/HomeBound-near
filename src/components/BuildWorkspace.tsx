"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientView } from "@/lib/client-view";
import { NearProjectBanner, NearStageEscrow } from "./NearPanels";
import { StagePipeline } from "./StagePipeline";
import { StageProofSummary } from "./StageProofSummary";

export function BuildWorkspace({ initial }: { initial: ClientView }) {
  const defaultStage =
    initial.stages.find((s) => s.nearStatus === "proposed") ??
    initial.stages.find((s) => s.nearStatus === "funded") ??
    initial.stages.find((s) => s.status !== "paid") ??
    initial.stages[0];

  const [selectedId, setSelectedId] = useState<string>(defaultStage?.id ?? "");
  const selectedStage = initial.stages.find((s) => s.id === selectedId) ?? initial.stages[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-4 pb-16">
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
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <NearStageEscrow view={initial} stage={selectedStage} />
          <StageProofSummary stage={selectedStage} evidence={initial.evidence} near={initial.near} />
        </div>
      )}

      <p className="font-mono text-xs text-muted">
        Every photo hash, Ed25519 verdict, and tx appends to the audit ledger.{" "}
        <Link href="/verify" className="text-ink underline underline-offset-2 hover:text-pepper">
          Inspect live TEE attestation &amp; SHA-256 ledger →
        </Link>
      </p>
    </main>
  );
}
