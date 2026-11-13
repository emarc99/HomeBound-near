"use client";

import type { NearPublicConfig } from "@/lib/near/shared";
import { txUrl } from "@/lib/near/shared";

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
  const tx = payload.txHash ?? payload.submitTx ?? payload.proposeTx;
  return typeof tx === "string" && /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(tx) ? tx : null;
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
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label">Hash-Chained Audit Trail</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Verification & payment ledger</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-medium ${
              integrity.ok ? "bg-mint text-leaf" : "bg-red-100 text-red-800"
            }`}
          >
            {integrity.ok
              ? `SHA-256 chain intact · ${integrity.count} events`
              : `Broken at #${integrity.brokenAtSeq ?? "?"}`}
          </span>
          <a href="/api/ledger" target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
            JSON ↗
          </a>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted">No ledger events recorded yet.</p>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
          {events.map((ev) => {
            const tx = extractTx(ev.payload);
            return (
              <div key={ev.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold text-pepper">#{ev.seq}</span>
                  <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[11px] text-ink ring-1 ring-line">
                    {ev.type}
                  </span>
                  <span className="text-muted">{ev.actor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
                  <span title={ev.hash}>{shortHash(ev.hash)}</span>
                  {tx && (
                    <a
                      href={txUrl(config, tx)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline decoration-ink/30 underline-offset-2 hover:text-pepper"
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
