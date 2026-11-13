"use client";

import type { ClientEvidence, ClientStage } from "@/lib/client-view";
import { formatUsdc, usdcForCents, type ChainStage, type ChainStageStatus } from "@/lib/near/shared";
import { formatNgn } from "@/lib/money";

const STATUS_STYLE: Record<ChainStageStatus | "db_planned" | "db_paid", { label: string; badge: string }> = {
  planned: { label: "Planned", badge: "bg-paper text-muted border border-line" },
  db_planned: { label: "Planned", badge: "bg-paper text-muted border border-line" },
  funded: { label: "Funded · Needs photo", badge: "bg-amber-50 text-amber-800 border border-amber-200" },
  proposed: { label: "Proposed · Sign 1 yoctoNEAR", badge: "bg-mint text-leaf border border-leaf/25 font-semibold" },
  released: { label: "Released · Paid", badge: "bg-leaf text-paper" },
  db_paid: { label: "Paid", badge: "bg-leaf text-paper" },
  refunded: { label: "Refunded", badge: "bg-paper text-muted border border-line" },
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
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label">01 · Construction stages ({stages.length})</p>
        <p className="font-mono text-xs text-muted">
          Click a milestone to fund USDC, upload site proof, or approve release
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((s) => {
          const cs = s.nearStageIndex != null && chainStages ? chainStages[s.nearStageIndex] : null;
          const key = cs?.status ?? s.nearStatus ?? (s.status === "paid" ? "db_paid" : "db_planned");
          const pill = STATUS_STYLE[key] ?? STATUS_STYLE.db_planned;
          const active = s.id === selectedId;
          const usdcRaw = cs ? cs.amount : usdcForCents(s.laborTrancheUsdCents, demoDivisor).toString();
          const latestEv = evidence.find((e) => e.stageId === s.id);

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-2 border-ink bg-card shadow-[4px_4px_0_var(--color-ink)]"
                  : "border-line bg-card hover:border-ink/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-pepper">
                    {String(s.seq).padStart(2, "0")}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${pill.badge}`}>
                    {pill.label}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold tracking-tight text-ink">{s.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{s.acceptanceCriteria}</p>
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-dashed border-line pt-3">
                <div>
                  <span className="block font-mono text-sm font-semibold text-ink">
                    {formatUsdc(usdcRaw)}
                  </span>
                  <span className="font-mono text-[11px] text-muted">{formatNgn(s.laborTrancheNgn)}</span>
                </div>
                {latestEv?.verdict ? (
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      latestEv.verdict.verdict === "pass"
                        ? "text-leaf"
                        : latestEv.verdict.verdict === "fail"
                          ? "text-red-700"
                          : "text-amber-700"
                    }`}
                  >
                    AI: {latestEv.verdict.verdict}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-muted">{s.durationDays}d</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
