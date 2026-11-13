"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientEvidence, ClientNear, ClientStage } from "@/lib/client-view";
import { txUrl } from "@/lib/near/shared";
import { uploadStagePhotoAction } from "@/app/actions/evidence";

const VERDICT_PILL: Record<"pass" | "fail" | "needs_review", { label: string; cls: string }> = {
  pass: { label: "AI Verdict · PASS", cls: "bg-mint text-leaf" },
  fail: { label: "AI Verdict · FAIL", cls: "bg-red-100 text-red-800" },
  needs_review: { label: "Needs review", cls: "bg-amber-50 text-amber-800 border border-amber-200" },
};

const shortHex = (h: string) => (h.length > 22 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h);

export function EvidencePanel({
  stage,
  evidence,
  near,
}: {
  stage: ClientStage;
  evidence: ClientEvidence[];
  near: ClientNear;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const stageEvidence = evidence.filter((e) => e.stageId === stage.id);
  const latest = stageEvidence[0] ?? null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Pick a site photo first (JPG, PNG, or WebP).");
      return;
    }
    setError(null);
    setStatusNote(null);
    const fd = new FormData();
    fd.append("stageId", stage.id);
    fd.append("photo", file);
    start(async () => {
      const res = await uploadStagePhotoAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFile(null);
      const d = res.data;
      if (d?.chainError) {
        setStatusNote(`Verdict: ${d.verdict}. ${d.chainError}`);
      } else if (d?.proposed) {
        setStatusNote("Photo passed TEE inspection and proposed payout on NEAR.");
      } else if (d?.onChain) {
        setStatusNote(`TEE signed verdict (${d.verdict}) recorded on NEAR.`);
      } else {
        setStatusNote(`Inspection finished (${d?.verdict ?? "done"}).`);
      }
      router.refresh();
    });
  };

  return (
    <section className="card space-y-5">
      <div>
        <p className="label">03 · Contractor Photo Proof</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">Site evidence & TEE verdict</h2>
        <p className="mt-1 text-xs text-muted">Criteria: {stage.acceptanceCriteria}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-dashed border-ink/25 bg-paper p-4">
        <label className="flex cursor-pointer flex-col gap-1 text-sm">
          <span className="font-medium text-ink">{file ? `Selected: ${file.name}` : "Choose site progress photo"}</span>
          <span className="text-xs text-muted">Checks EXIF GPS, freshness, duplicate SHA-256, and NEAR AI vision</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper hover:file:opacity-90"
          />
        </label>
        <button type="submit" disabled={pending || !file} className="btn-pop self-start px-5 py-2.5 text-xs">
          {pending ? "Inspecting inside NEAR AI TEE…" : "Run TEE photo check"}
        </button>
      </form>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}
      {statusNote && <p className="rounded-xl border border-leaf/25 bg-mint px-3 py-2 text-xs text-leaf">{statusNote}</p>}

      {latest ? (
        <div className="space-y-4 border-t border-dashed border-line pt-4">
          {latest.blobKey && (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/blobs/${encodeURIComponent(latest.blobKey)}`}
                alt={`Uploaded evidence for ${stage.name}`}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          {latest.verdict && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VERDICT_PILL[latest.verdict.verdict].cls}`}>
                  {VERDICT_PILL[latest.verdict.verdict].label} · {Math.round(latest.verdict.confidence * 100)}%
                </span>
                <span className="font-mono text-[11px] text-muted">{latest.verdict.model}</span>
              </div>

              {latest.verdict.observations.length > 0 && (
                <ul className="space-y-1 text-xs text-muted">
                  {latest.verdict.observations.map((obs, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-pepper">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid gap-1.5 sm:grid-cols-2">
                {latest.verdict.checks.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs">
                    <span className="font-medium capitalize text-ink">{c.name.replace(/_/g, " ")}</span>
                    <span
                      className={`font-mono text-[11px] ${
                        c.status === "pass" ? "text-leaf" : c.status === "fail" ? "text-red-700" : "text-amber-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
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
              <p>Req hash: {shortHex(latest.chainVerdict.requestHash)}</p>
              <p>Res hash: {shortHex(latest.chainVerdict.responseHash)}</p>
              <p>Signature: {shortHex(latest.chainVerdict.signature)}</p>
              {latest.chainVerdict.error && <p className="text-amber-800">{latest.chainVerdict.error}</p>}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">No photo uploaded for this stage yet.</p>
      )}
    </section>
  );
}
