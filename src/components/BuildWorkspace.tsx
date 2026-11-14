"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientStage, ClientView } from "@/lib/client-view";
import { formatNgn } from "@/lib/money";
import { formatUsdc, txUrl, usdcForCents } from "@/lib/near/shared";
import { NearProjectBanner, NearStageEscrow } from "./NearPanels";
import { StagePipeline } from "./StagePipeline";
import { StageProofSummary } from "./StageProofSummary";

function trustedStatusFor(
  stage: ClientStage,
  chainStatus?: string | null,
): { label: "Paid" | "Proposed" | "Funded" | "Refunded" | "Planned"; cls: string } {
  const effective = chainStatus ?? stage.nearStatus;
  if (effective === "refunded") return { label: "Refunded", cls: "border-crimson/35 bg-crimson/10 text-crimson" };
  if (effective === "released" || stage.status === "paid") return { label: "Paid", cls: "border-leaf/35 bg-mint text-leaf" };
  if (effective === "proposed") return { label: "Proposed", cls: "border-vermilion/40 bg-vermilion/12 text-vermilion" };
  if (effective === "funded" || stage.fundedUsdCents > 0) return { label: "Funded", cls: "border-amber/40 bg-amber/15 text-amber" };
  return { label: "Planned", cls: "border-line bg-paper text-muted" };
}

export function BuildWorkspace({ initial }: { initial: ClientView }) {
  const defaultStage =
    initial.stages.find((s) => s.nearStatus === "proposed") ??
    initial.stages.find((s) => s.nearStatus === "funded") ??
    initial.stages.find((s) => s.status !== "paid") ??
    initial.stages[0];

  const [selectedId, setSelectedId] = useState<string>(defaultStage?.id ?? "");
  const [currency, setCurrency] = useState<"USDC" | "NGN">("USDC");

  const selectedStage = initial.stages.find((s) => s.id === selectedId) ?? initial.stages[0];
  const totalUsdCents = initial.stages.reduce((a, s) => a + s.laborTrancheUsdCents, 0);
  const totalNgn = initial.stages.reduce((a, s) => a + s.laborTrancheNgn, 0);
  const completedCount = initial.stages.filter((s) => {
    const cs = s.nearStageIndex != null && initial.near.chain ? initial.near.chain.stages[s.nearStageIndex] : null;
    return s.status === "paid" || cs?.status === "released";
  }).length;

  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 px-4 py-10 md:px-10 md:py-14">
      {/* Moss Keld Outer Blueprint Coordinate Border */}
      <div className="border border-line bg-paper/70">
        {/* Top Coordinate Numbers 1 - 8 */}
        <div className="grid grid-cols-8 border-b border-dashed border-ink/20 bg-card/70 py-2 text-center font-mono text-[10px] tracking-[0.14em] text-annotation">
          {["1", "2", "3", "4", "5", "6", "7", "8"].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>

        <div className="grid grid-cols-[28px_1fr_28px]">
          {/* Left Vertical Grid Letters A - F */}
          <div className="hidden flex-col justify-between border-r border-dashed border-ink/20 bg-card/70 py-10 text-center font-mono text-[10px] text-annotation sm:flex">
            {["A", "B", "C", "D", "E", "F"].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>

          {/* Spacious Architectural Drawing Sheet Body */}
          <div className="col-span-3 space-y-12 p-6 sm:col-span-1 md:p-12">
            {/* Sheet Title & Unit Switcher */}
            <header className="flex flex-wrap items-end justify-between gap-6 border-b border-dashed border-ink/20 pb-8">
              <div className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.18em] text-vermilion uppercase">
                  (01) OWNER ESCROW SHEET · {initial.project.ownerCity.toUpperCase()} → {initial.project.siteCity.toUpperCase()}
                </p>
                <h1 className="font-sans text-4xl font-medium tracking-[-0.045em] text-ink md:text-5xl">
                  {initial.project.name}
                </h1>
                <p className="font-mono text-xs text-muted">
                  Owner: {initial.project.ownerName} · {completedCount}/{initial.stages.length} milestones paid · Total tranche:{" "}
                  {currency === "NGN" ? formatNgn(totalNgn) : `$${(totalUsdCents / 100).toLocaleString()} USD`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Hart Oliveira Currency Toggle */}
                <div
                  role="group"
                  aria-label="Display currency toggle"
                  className="inline-flex rounded-[3px] border border-line bg-card p-1 font-mono text-[10px] tracking-[0.12em] uppercase"
                >
                  <button
                    type="button"
                    onClick={() => setCurrency("USDC")}
                    className={`cursor-pointer rounded-[2px] px-3 py-1.5 transition ${
                      currency === "USDC" ? "bg-ink text-paper" : "text-muted hover:text-ink"
                    }`}
                  >
                    USD / USDC
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("NGN")}
                    className={`cursor-pointer rounded-[2px] px-3 py-1.5 transition ${
                      currency === "NGN" ? "bg-ink text-paper" : "text-muted hover:text-ink"
                    }`}
                  >
                    ₦ NGN
                  </button>
                </div>

                <a href="/api/ledger/csv" className="btn-ghost px-4 py-2.5 text-[10px]">
                  Export Bookkeeper CSV ↓
                </a>
              </div>
            </header>

            <NearProjectBanner view={initial} />

            <StagePipeline
              stages={initial.stages}
              chainStages={initial.near.chain?.stages ?? null}
              evidence={initial.evidence}
              selectedId={selectedStage?.id ?? ""}
              demoDivisor={initial.near.config.demoDivisor}
              currency={currency}
              onSelect={setSelectedId}
            />

            {selectedStage && (
              <div className="space-y-12">
                <NearStageEscrow view={initial} stage={selectedStage} currency={currency} />
                <StageProofSummary stage={selectedStage} evidence={initial.evidence} near={initial.near} />
              </div>
            )}

            {/* 6-Stage Drawing Register Table (Sheets A-101 to A-106) */}
            <section className="space-y-6 border border-line bg-card p-6 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                    DRAWING REGISTER · SHEETS A-101 TO A-106
                  </p>
                  <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
                    Milestone Schedule &amp; Criteria Hashes
                  </h2>
                </div>
                <Link href="/verify" className="btn-ghost px-4 py-2 text-[10px]">
                  View Full Rules &amp; Recovery →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                      <th className="py-3 pr-4">Sheet</th>
                      <th className="py-3 pr-4">Milestone</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Tranche ({currency})</th>
                      <th className="py-3 pr-4">Criteria SHA-256</th>
                      <th className="py-3 pr-4">Receipt</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-ink/15 text-sm">
                    {initial.stages.map((s) => {
                      const cs = s.nearStageIndex != null && initial.near.chain ? initial.near.chain.stages[s.nearStageIndex] : null;
                      const trusted = trustedStatusFor(s, cs?.status);
                      const payment = initial.payments.find((p) => p.stageId === s.id && p.nearTxHash);
                      const active = s.id === selectedStage?.id;
                      const demoUsdc = formatUsdc(usdcForCents(s.laborTrancheUsdCents, initial.near.config.demoDivisor));

                      return (
                        <tr key={s.id} className={active ? "bg-paper/80" : "hover:bg-paper/45"}>
                          <td className="py-4 pr-4 font-mono text-xs text-vermilion">A-10{s.seq}</td>
                          <td className="py-4 pr-4 font-medium text-ink">{s.name}</td>
                          <td className="py-4 pr-4">
                            <span className={`inline-block rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase ${trusted.cls}`}>
                              {trusted.label}
                            </span>
                          </td>
                          <td className="py-4 pr-4 font-mono text-xs text-ink">
                            {currency === "NGN"
                              ? formatNgn(s.laborTrancheNgn)
                              : `$${(s.laborTrancheUsdCents / 100).toLocaleString()} (${demoUsdc})`}
                          </td>
                          <td className="py-4 pr-4 font-mono text-[11px] text-muted" title={s.criteriaHash}>
                            {s.criteriaHash.slice(0, 12)}…{s.criteriaHash.slice(-6)}
                          </td>
                          <td className="py-4 pr-4 font-mono text-[11px]">
                            {payment?.nearTxHash ? (
                              <a
                                href={txUrl(initial.near.config, payment.nearTxHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-ink underline underline-offset-2 hover:text-vermilion"
                              >
                                {payment.nearTxHash.slice(0, 10)}…
                              </a>
                            ) : (
                              <span className="text-annotation">—</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedId(s.id)}
                              className="cursor-pointer font-mono text-[10px] tracking-[0.14em] text-ink uppercase underline-offset-4 hover:text-vermilion hover:underline"
                            >
                              {active ? "Selected" : "Inspect"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sheet A-999 Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-ink/25 pt-6 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              <span>SHEET A-999 · HOMEBOUND ESCROW WORKBENCH</span>
              <div className="flex flex-wrap gap-6">
                <Link href="/site" className="text-ink hover:text-vermilion">
                  (02) Gasless Site Camera →
                </Link>
                <Link href="/verify" className="text-ink hover:text-vermilion">
                  (03) Ledger &amp; Public Rules →
                </Link>
              </div>
            </footer>
          </div>

          {/* Right Vertical Grid Letters A - F */}
          <div className="hidden flex-col justify-between border-l border-dashed border-ink/20 bg-card/70 py-10 text-center font-mono text-[10px] text-annotation sm:flex">
            {["A", "B", "C", "D", "E", "F"].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </div>

        {/* Bottom Coordinate Numbers 1 - 8 */}
        <div className="grid grid-cols-8 border-t border-dashed border-ink/20 bg-card/70 py-2 text-center font-mono text-[10px] tracking-[0.14em] text-annotation">
          {["1", "2", "3", "4", "5", "6", "7", "8"].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
