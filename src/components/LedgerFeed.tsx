"use client";

import { useState } from "react";
import type { ClientStage, ClientView } from "@/lib/client-view";
import { formatNgn } from "@/lib/money";
import { formatUsdc, txUrl, usdcForCents, type NearPublicConfig } from "@/lib/near/shared";

export type ClientLedgerEvent = {
  id: string;
  seq: number;
  type: string;
  actor: string;
  hash: string;
  prevHash: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type LedgerIntegrity = {
  ok: boolean;
  count: number;
  brokenAtSeq?: number;
};

const shortHash = (h: string) => (h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);

function extractTx(payload: Record<string, unknown>): string | null {
  const tx = payload.txHash ?? payload.submitTx ?? payload.proposeTx ?? payload.nearTxHash ?? payload.nearCreateTx;
  return typeof tx === "string" && /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(tx) ? tx : null;
}

function trustedStatus(
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

export function BookkeeperStageLedger({ view }: { view: ClientView }) {
  const [currency, setCurrency] = useState<"USDC" | "NGN">("USDC");

  return (
    <section className="space-y-6 border border-line bg-card p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            [03] · QUANTITY SURVEYOR &amp; BOOKKEEPER LEDGER
          </p>
          <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink md:text-3xl">
            Stage-by-Stage Reconciliation Table
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Ledger currency unit"
            className="inline-flex rounded-[3px] border border-line bg-paper p-1 font-mono text-[10px] tracking-[0.12em] uppercase"
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

          <a href="/api/ledger/csv" className="btn-pop px-4 py-2 text-[10px]">
            Export Bookkeeper CSV ↓
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              <th className="py-3 pr-4">Stage</th>
              <th className="py-3 pr-4">Trusted Status</th>
              <th className="py-3 pr-4">Draw Amount ({currency})</th>
              <th className="py-3 pr-4">Criteria SHA-256</th>
              <th className="py-3 pr-4">Evidence SHA-256</th>
              <th className="py-3 text-right">NEAR Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ink/15 text-sm">
            {view.stages.map((s) => {
              const cs = s.nearStageIndex != null && view.near.chain ? view.near.chain.stages[s.nearStageIndex] : null;
              const badge = trustedStatus(s, cs?.status);
              const ev = view.evidence.find((e) => e.stageId === s.id);
              const evSha = ev?.sha256 ?? cs?.verdict?.evidence_sha256 ?? null;
              const pmt =
                view.payments.find((p) => p.stageId === s.id && p.kind === "labor" && p.nearTxHash) ??
                view.payments.find((p) => p.stageId === s.id && p.nearTxHash);
              const tx = pmt?.nearTxHash ?? ev?.chainVerdict?.proposeTx ?? ev?.chainVerdict?.submitTx ?? null;
              const demoUsdc = formatUsdc(usdcForCents(s.laborTrancheUsdCents, view.near.config.demoDivisor));

              return (
                <tr key={s.id} className="hover:bg-paper/45">
                  <td className="py-4 pr-4">
                    <span className="font-mono text-xs text-vermilion">0{s.seq}</span>{" "}
                    <span className="font-medium text-ink">{s.name}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`inline-block rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-ink">
                    {currency === "NGN"
                      ? formatNgn(s.laborTrancheNgn)
                      : `$${(s.laborTrancheUsdCents / 100).toLocaleString()} (${demoUsdc}u)`}
                  </td>
                  <td className="py-4 pr-4 font-mono text-[11px] text-muted" title={s.criteriaHash}>
                    {shortHash(s.criteriaHash)}
                  </td>
                  <td className="py-4 pr-4 font-mono text-[11px] text-muted" title={evSha ?? ""}>
                    {evSha ? shortHash(evSha) : <span className="text-annotation">—</span>}
                  </td>
                  <td className="py-4 text-right font-mono text-[11px]">
                    {tx ? (
                      <a
                        href={txUrl(view.near.config, tx)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline underline-offset-2 hover:text-vermilion"
                      >
                        {tx.slice(0, 10)}… ↗
                      </a>
                    ) : (
                      <span className="text-annotation">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LedgerFeed({
  events,
  integrity,
  config,
}: {
  events: ClientLedgerEvent[];
  integrity: LedgerIntegrity;
  config: NearPublicConfig;
}) {
  return (
    <section className="space-y-6 border border-line bg-card p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            HASH-CHAINED AUDIT STREAM
          </p>
          <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
            Append-Only Verification &amp; Payout Log
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-[2px] border px-3 py-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase ${
              integrity.ok ? "border-leaf/35 bg-mint text-leaf" : "border-crimson/35 bg-crimson/10 text-crimson"
            }`}
          >
            {integrity.ok
              ? `SHA-256 Chain Intact · ${integrity.count} Events`
              : `Broken at #${integrity.brokenAtSeq ?? "?"}`}
          </span>
          <a href="/api/ledger" target="_blank" rel="noreferrer" className="btn-ghost px-3.5 py-1.5 text-[10px]">
            Raw JSON ↗
          </a>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="font-mono text-xs text-muted">No ledger events recorded yet.</p>
      ) : (
        <div className="divide-y divide-dashed divide-ink/20 border border-line bg-paper">
          {events.map((ev) => {
            const tx = extractTx(ev.payload);
            return (
              <div key={ev.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold text-vermilion">#{ev.seq}</span>
                  <span className="border border-line bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase text-ink">
                    {ev.type}
                  </span>
                  <span className="text-muted">{ev.actor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-muted">
                  <span title={ev.hash}>{shortHash(ev.hash)}</span>
                  {tx && (
                    <a
                      href={txUrl(config, tx)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline underline-offset-2 hover:text-vermilion"
                    >
                      Nearblocks ↗
                    </a>
                  )}
                  <span>
                    {new Date(ev.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
