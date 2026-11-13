"use client";

import Link from "next/link";
import type { ClientEvidence, ClientNear, ClientStage } from "@/lib/client-view";
import { txUrl } from "@/lib/near/shared";

const VERDICT_PILL: Record<"pass" | "fail" | "needs_review", { label: string; cls: string }> = {
  pass: { label: "AI Verdict · PASS", cls: "bg-mint text-leaf" },
  fail: { label: "AI Verdict · FAIL", cls: "bg-red-100 text-red-800" },
  needs_review: { label: "Needs review", cls: "bg-amber-50 text-amber-800 border border-amber-200" },
};

const shortHex = (h: string) => (h.length > 22 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h);

export function StageProofSummary({
  stage,
  evidence,
  near,
}: {
  stage: ClientStage;
  evidence: ClientEvidence[];
  near: ClientNear;
}) {
  const latest = evidence.find((e) => e.stageId === stage.id) ?? null;
  const siteHref = `/site?stage=${encodeURIComponent(stage.id)}`;

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Site Inspection Summary</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Latest proof &amp; TEE receipt</h2>
        </div>
        {latest?.verdict && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERDICT_PILL[latest.verdict.verdict].cls}`}>
            {VERDICT_PILL[latest.verdict.verdict].label} · {Math.round(latest.verdict.confidence * 100)}%
          </span>
        )}
      </div>

      {latest ? (
        <div className="space-y-4">
          {latest.blobKey && (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/blobs/${encodeURIComponent(latest.blobKey)}`}
                alt={`Latest proof for ${stage.name}`}
                className="h-52 w-full object-cover"
              />
            </div>
          )}

          {latest.verdict && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {latest.verdict.checks.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs"
                >
                  <span className="truncate font-medium text-ink">{c.name}</span>
                  <span
                    className={`shrink-0 font-mono text-[11px] ${
                      c.status === "pass" ? "text-leaf" : c.status === "fail" ? "text-red-700" : "text-amber-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {latest.chainVerdict && (
            <div className="space-y-1 rounded-2xl border border-line bg-paper p-3 font-mono text-[11px] text-muted">
              <div className="flex flex-wrap items-center justify-between gap-2 text-ink">
                <span className="font-semibold">TEE Ed25519 Receipt</span>
                {latest.chainVerdict.submitTx ? (
                  <a
                    href={txUrl(near.config, latest.chainVerdict.submitTx)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-leaf underline"
                  >
                    Verified on NEAR ↗
                  </a>
                ) : (
                  <span className="text-amber-700">Saved locally</span>
                )}
              </div>
              <p>Response hash: {shortHex(latest.chainVerdict.responseHash)}</p>
              <p>Signature: {shortHex(latest.chainVerdict.signature)}</p>
              {latest.chainVerdict.error && <p className="text-amber-800">{latest.chainVerdict.error}</p>}
            </div>
          )}

          <Link href={siteHref} className="btn-ghost w-full justify-center py-2.5 text-xs">
            Submit another photo on /site →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="label">Acceptance criteria</p>
            <p className="mt-2 text-sm text-ink">{stage.acceptanceCriteria}</p>
          </div>

          <p className="text-sm text-muted">
            Foremen upload site photos directly on the field page — or test right away with 1-click EXIF-stamped Ibadan
            and Lagos samples.
          </p>

          {stage.status === "paid" ? (
            <p className="rounded-xl bg-mint px-3 py-2 text-xs font-medium text-leaf">
              This stage was settled prior to on-chain migration.
            </p>
          ) : (
            <Link href={siteHref} className="btn-pop w-full justify-center py-3 text-xs">
              Open Foreman Site Camera (/site) →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
