"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientView } from "@/lib/client-view";
import { txUrl } from "@/lib/near/shared";
import { SAMPLE_PHOTOS, type SamplePhotoKey } from "@/lib/samples";
import {
  submitSamplePhotoAction,
  uploadStagePhotoAction,
  type PhotoSubmissionResult,
} from "@/app/actions/evidence";
import { StagePipeline } from "./StagePipeline";

const VERDICT_PILL: Record<"pass" | "fail" | "needs_review", { label: string; cls: string }> = {
  pass: { label: "AI Verdict · PASS", cls: "bg-mint text-leaf" },
  fail: { label: "AI Verdict · FAIL", cls: "bg-red-100 text-red-800" },
  needs_review: { label: "Needs review", cls: "bg-amber-50 text-amber-800 border border-amber-200" },
};

const shortHex = (h: string) => (h.length > 22 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h);

export function SiteStudio({
  view,
  initialStageId,
}: {
  view: ClientView;
  initialStageId?: string;
}) {
  const router = useRouter();
  const requested = initialStageId ? view.stages.find((s) => s.id === initialStageId) : undefined;
  const defaultStage =
    requested ??
    view.stages.find((s) => s.nearStatus === "funded") ??
    view.stages.find((s) => s.status !== "paid") ??
    view.stages[0];

  const [selectedId, setSelectedId] = useState<string>(defaultStage?.id ?? "");
  const selectedStage = view.stages.find((s) => s.id === selectedId) ?? view.stages[0];
  const [file, setFile] = useState<File | null>(null);
  const [activeSample, setActiveSample] = useState<SamplePhotoKey | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const stageEvidence = selectedStage ? view.evidence.filter((e) => e.stageId === selectedStage.id) : [];
  const latest = stageEvidence[0] ?? null;

  const handleResult = (res: { ok: true; data?: PhotoSubmissionResult } | { ok: false; error: string }) => {
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const d = res.data;
    if (d?.chainError) {
      setStatusNote(`Verdict: ${d.verdict}. ${d.chainError}`);
    } else if (d?.proposed) {
      setStatusNote("Passed all 5 checks inside TEE and proposed payout on NEAR.");
    } else if (d?.onChain) {
      setStatusNote(`TEE signed verdict (${d.verdict}) recorded on NEAR.`);
    } else {
      setStatusNote(`Inspection finished (${d?.verdict ?? "done"}).`);
    }
    router.refresh();
  };

  const triggerSample = (key: SamplePhotoKey) => {
    if (!selectedStage || pending) return;
    setError(null);
    setStatusNote(null);
    setActiveSample(key);
    start(async () => {
      try {
        const res = await submitSamplePhotoAction(selectedStage.id, key);
        handleResult(res);
      } finally {
        setActiveSample(null);
      }
    });
  };

  const uploadCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) return;
    if (!file) {
      setError("Pick a site photo first (JPG, PNG, or WebP).");
      return;
    }
    setError(null);
    setStatusNote(null);
    const fd = new FormData();
    fd.append("stageId", selectedStage.id);
    fd.append("photo", file);
    start(async () => {
      const res = await uploadStagePhotoAction(fd);
      if (res.ok) setFile(null);
      handleResult(res);
    });
  };

  const cameraLabel =
    latest?.verdict?.extracted && typeof latest.verdict.extracted.camera === "string"
      ? latest.verdict.extracted.camera
      : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-4 pb-16">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label">
            Field inspection · {view.project.siteCity}, {view.project.siteState} (7.4370°N, 3.9470°E · 150m radius)
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Submit site progress proof.</h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Foremen upload a live camera photo — or judges can click a real EXIF-stamped field sample below to watch
            NEAR AI Cloud&apos;s TEE grade and sign the verdict.
          </p>
        </div>
        <Link href="/build" className="btn-ghost px-5 py-2.5 text-xs">
          Owner Escrow (/build) →
        </Link>
      </section>

      <StagePipeline
        stages={view.stages}
        chainStages={view.near.chain?.stages ?? null}
        evidence={view.evidence}
        selectedId={selectedStage?.id ?? ""}
        demoDivisor={view.near.config.demoDivisor}
        onSelect={(id) => {
          setSelectedId(id);
          setError(null);
          setStatusNote(null);
        }}
      />

      {selectedStage && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="card space-y-5">
            <div>
              <p className="label">Stage {String(selectedStage.seq).padStart(2, "0")} Camera Studio</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{selectedStage.name}</h2>
              <p className="mt-2 rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs text-muted">
                <strong className="text-ink">Done when:</strong> {selectedStage.acceptanceCriteria}
              </p>
            </div>

            {selectedStage.status === "paid" ? (
              <p className="rounded-xl bg-mint px-3 py-2 text-xs font-medium text-leaf">
                This stage is already paid. Select Stage 03 or later above to run live TEE inspections.
              </p>
            ) : (
              <>
                <div className="space-y-2.5">
                  <p className="label">1-Click Field Samples (Real EXIF GPS + Timestamps)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.entries(SAMPLE_PHOTOS) as [SamplePhotoKey, (typeof SAMPLE_PHOTOS)[SamplePhotoKey]][]).map(
                      ([key, sample]) => {
                        const isPass = key === "lintel-pass";
                        const isRunning = pending && activeSample === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={pending}
                            onClick={() => triggerSample(key)}
                            className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-paper text-left transition hover:-translate-y-0.5 hover:border-ink disabled:pointer-events-none disabled:opacity-50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/samples/${sample.file}`}
                              alt={sample.label}
                              className="h-24 w-full object-cover"
                            />
                            <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-ink">
                                  {isRunning ? "Inspecting in TEE…" : sample.label}
                                </span>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                                    isPass ? "bg-mint text-leaf" : "bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {sample.tag}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted">{sample.hint}</span>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <form
                  onSubmit={uploadCustom}
                  className="flex flex-col gap-3 border-t border-dashed border-line pt-4"
                >
                  <p className="label">Or upload your own JPEG / PNG / WebP</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper hover:file:opacity-90"
                  />
                  <button type="submit" disabled={pending || !file} className="btn-pop self-start px-5 py-2.5 text-xs">
                    {pending && !activeSample ? "Inspecting in NEAR AI TEE…" : "Run TEE photo check"}
                  </button>
                </form>
              </>
            )}

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}
            {statusNote && (
              <p className="rounded-xl border border-leaf/25 bg-mint px-3 py-2 text-xs text-leaf">{statusNote}</p>
            )}
          </section>

          <section className="card space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="label">Live 5-Gate Inspection</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">TEE verdict &amp; evidence</h2>
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
                      alt={`Inspected photo for ${selectedStage.name}`}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                )}

                {(cameraLabel || latest.lat != null || latest.takenAt) && (
                  <div className="flex flex-wrap gap-2 font-mono text-[11px] text-muted">
                    {cameraLabel && (
                      <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-ink">
                        Camera: {cameraLabel}
                      </span>
                    )}
                    {latest.lat != null && latest.lng != null && (
                      <span className="rounded-full border border-line bg-paper px-2.5 py-0.5">
                        GPS: {latest.lat.toFixed(4)}°N, {latest.lng.toFixed(4)}°E
                      </span>
                    )}
                    {latest.takenAt && (
                      <span className="rounded-full border border-line bg-paper px-2.5 py-0.5">
                        Captured: {new Date(latest.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                )}

                {latest.verdict && (
                  <>
                    {latest.verdict.observations.length > 0 && (
                      <ul className="space-y-1.5 text-xs text-muted">
                        {latest.verdict.observations.map((obs, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-pepper">•</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-2">
                      {latest.verdict.checks.map((c) => (
                        <div
                          key={c.name}
                          className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink">{c.name}</span>
                            <span
                              className={`font-mono text-[11px] font-medium ${
                                c.status === "pass"
                                  ? "text-leaf"
                                  : c.status === "fail"
                                    ? "text-red-700"
                                    : "text-amber-700"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted">{c.detail}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {latest.chainVerdict && (
                  <div className="space-y-1 rounded-2xl border border-line bg-paper p-3 font-mono text-[11px] text-muted">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-ink">
                      <span className="font-semibold">TEE Ed25519 Receipt ({latest.chainVerdict.modelId})</span>
                      {latest.chainVerdict.submitTx ? (
                        <a
                          href={txUrl(view.near.config, latest.chainVerdict.submitTx)}
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
                    <p>Request hash: {shortHex(latest.chainVerdict.requestHash)}</p>
                    <p>Response hash: {shortHex(latest.chainVerdict.responseHash)}</p>
                    <p>Signature: {shortHex(latest.chainVerdict.signature)}</p>
                    {latest.chainVerdict.error && <p className="text-amber-800">{latest.chainVerdict.error}</p>}
                  </div>
                )}

                <Link href="/build" className="btn-pop w-full justify-center py-3 text-xs">
                  Go to Owner Escrow (/build) →
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-xs text-muted">
                Pick one of the 4 EXIF-stamped field samples on the left or upload a site photo to watch all 5 checks
                and NEAR AI Cloud&apos;s TEE signature run live.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
