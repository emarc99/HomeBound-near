"use client";

import type { ClientEvidence, ClientStage } from "@/lib/client-view";
import { formatUsdc, usdcForCents, type ChainStage, type ChainStageStatus } from "@/lib/near/shared";

const STATUS_BADGE: Record<ChainStageStatus | "db_planned" | "db_paid", { label: string; dot: string; cls: string }> = {
  planned: { label: "Planned", dot: "bg-muted/40", cls: "text-muted" },
  db_planned: { label: "Planned", dot: "bg-muted/40", cls: "text-muted" },
  funded: { label: "Funded", dot: "bg-amber-500", cls: "text-amber-800" },
  proposed: { label: "Proposed", dot: "bg-pepper", cls: "text-pepper font-semibold" },
  released: { label: "Paid", dot: "bg-leaf", cls: "text-leaf font-semibold" },
  db_paid: { label: "Paid", dot: "bg-leaf", cls: "text-leaf font-semibold" },
  refunded: { label: "Refunded", dot: "bg-muted/40", cls: "text-muted" },
};

export function StagePipeline({
  stages,
  chainStages,
  evidence,
  selectedId,
  demoDivisor,
  onSelect,
}: {
  stages: ClientStage[];
  chainStages: ChainStage[] | null;
  evidence: ClientEvidence[];
  selectedId: string;
  demoDivisor: number;
  onSelect: (stageId: string) => void;
}) {
  return (
    <section aria-label="Construction stages" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {stages.map((s) => {
        const cs = s.nearStageIndex != null && chainStages ? chainStages[s.nearStageIndex] : null;
        const key = cs?.status ?? s.nearStatus ?? (s.status === "paid" ? "db_paid" : "db_planned");
        const badge = STATUS_BADGE[key] ?? STATUS_BADGE.db_planned;
        const active = s.id === selectedId;
        const usdcRaw = cs ? cs.amount : usdcForCents(s.laborTrancheUsdCents, demoDivisor).toString();
        const latestEv = evidence.find((e) => e.stageId === s.id);

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`flex cursor-pointer flex-col justify-between rounded-2xl border px-3.5 py-3 text-left transition ${
              active
                ? "border-2 border-ink bg-card shadow-[3px_3px_0_var(--color-ink)]"
                : "border-line bg-card/70 hover:border-ink/40 hover:bg-card"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-mono text-[11px] font-semibold text-pepper">
                {String(s.seq).padStart(2, "0")}
              </span>
              <span className={`inline-flex items-center gap-1 font-mono text-[10px] ${badge.cls}`}>
                <span className={`size-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>

            <p className="mt-2 line-clamp-1 text-xs font-bold tracking-tight text-ink">{s.name}</p>

            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
              <span>{formatUsdc(usdcRaw)}</span>
              {latestEv?.verdict ? (
                <span className={latestEv.verdict.verdict === "pass" ? "text-leaf" : "text-amber-700"}>
                  {latestEv.verdict.verdict}
                </span>
              ) : (
                <span>{s.durationDays}d</span>
              )}
            </div>
          </button>
        );
      })}
    </section>
  );
}
