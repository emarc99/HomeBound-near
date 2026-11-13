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
import { GeofenceRadar } from "./GeofenceRadar";
import { StagePipeline } from "./StagePipeline";

type SiteViewTab = "viewfinder" | "radar";

const shortHex = (h: string) => (h.length > 26 ? `${h.slice(0, 12)}…${h.slice(-8)}` : h);
const RULER_TICKS = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "110", "120"];

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
  const [tab, setTab] = useState<SiteViewTab>("viewfinder");
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
  const verdict = latest?.verdict ?? null;
  const confidencePct = verdict ? Math.round(verdict.confidence * 100) : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pt-4 pb-16">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="label">
            Foreman Field Inspection · {view.project.siteCity}, {view.project.siteState} (7.4370° N, 3.9470° E · 150m Geofence)
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">Submit site progress proof.</h1>
        </div>
        <Link href="/build" className="btn-ghost px-4 py-2 text-xs">
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
          {/* Left Sheet: Vellum Field Camera & 1-Click EXIF Samples */}
          <section className="card space-y-5">
            <div>
              <p className="label">Stage {String(selectedStage.seq).padStart(2, "0")} Field Dispatch</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{selectedStage.name}</h2>
              <p className="mt-2 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-xs text-muted">
                <strong className="text-ink">Acceptance criteria:</strong> {selectedStage.acceptanceCriteria}
              </p>
            </div>

            {selectedStage.status === "paid" ? (
              <p className="rounded-lg border border-leaf/30 bg-mint px-3 py-2 text-xs font-medium text-leaf">
                This stage is already settled. Select Stage 03 or later above to run live TEE inspections.
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
                            className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-paper text-left transition hover:-translate-y-0.5 hover:border-ink disabled:pointer-events-none disabled:opacity-50"
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
                                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                    isPass ? "bg-mint text-leaf" : "bg-amber-100 text-amber-900"
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
                    className="block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper hover:file:opacity-90"
                  />
                  <button type="submit" disabled={pending || !file} className="btn-pop self-start px-5 py-2.5 text-xs">
                    {pending && !activeSample ? "Inspecting in NEAR AI TEE…" : "Run TEE photo check"}
                  </button>
                </form>
              </>
            )}

            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}
            {statusNote && (
              <p className="rounded-lg border border-leaf/25 bg-mint px-3 py-2 text-xs text-leaf">{statusNote}</p>
            )}
          </section>

          {/* Right Card: Prussian CAD Viewfinder + Plot Geofence Radar Tab */}
          <section className="card-blueprint space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line pb-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] text-[#8ea1b8] uppercase">
                  Live 5-Gate TEE Verification
                </p>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#f4f0e8]">
                  {tab === "viewfinder" ? "CAD Inspection & TEE Receipt" : "Plot IB-04 Geofence Radar"}
                </h2>
              </div>

              <div className="inline-flex rounded-lg border border-blueprint-line bg-[#09111c] p-0.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setTab("viewfinder")}
                  className={`cursor-pointer rounded-md px-3 py-1.5 transition ${
                    tab === "viewfinder" ? "bg-pepper font-bold text-blueprint" : "text-[#9cb0c7] hover:text-white"
                  }`}
                >
                  CAD Viewfinder
                </button>
                <button
                  type="button"
                  onClick={() => setTab("radar")}
                  className={`cursor-pointer rounded-md px-3 py-1.5 transition ${
                    tab === "radar" ? "bg-radar font-bold text-blueprint" : "text-[#9cb0c7] hover:text-white"
                  }`}
                >
                  Geofence Radar
                </button>
              </div>
            </div>

            {tab === "radar" ? (
              <GeofenceRadar
                photoLat={latest?.lat}
                photoLng={latest?.lng}
                photoLabel={latest ? `Stage ${String(selectedStage.seq).padStart(2, "0")} upload` : undefined}
                takenAt={latest?.takenAt}
              />
            ) : latest ? (
              <div className="space-y-3.5">
                <div className="flex justify-between px-1 font-mono text-[9px] text-[#7c90a8]">
                  {RULER_TICKS.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                {latest.blobKey && (
                  <div className="relative overflow-hidden rounded-lg border border-blueprint-line bg-[#09111c]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/blobs/${encodeURIComponent(latest.blobKey)}`}
                      alt={`Inspected photo for ${selectedStage.name}`}
                      className="h-56 w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-3 border border-white/20">
                      <span className="absolute -top-px -left-px size-3 border-t-2 border-l-2 border-white/80" />
                      <span className="absolute -top-px -right-px size-3 border-t-2 border-r-2 border-white/80" />
                      <span className="absolute -bottom-px -left-px size-3 border-b-2 border-l-2 border-white/80" />
                      <span className="absolute -right-px -bottom-px size-3 border-r-2 border-b-2 border-white/80" />
                    </div>
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap justify-between gap-2">
                      {latest.lat != null && latest.lng != null && (
                        <span className="rounded bg-[#09111c]/85 px-2 py-1 font-mono text-[10px] text-[#f4f0e8]">
                          {latest.lat.toFixed(4)}° N, {latest.lng.toFixed(4)}° E
                        </span>
                      )}
                      {latest.takenAt && (
                        <span className="rounded bg-[#09111c]/85 px-2 py-1 font-mono text-[10px] text-[#f4f0e8]">
                          {new Date(latest.takenAt).toISOString().slice(0, 16).replace("T", " ")} UTC
                        </span>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap justify-between gap-2">
                      <span className="rounded bg-[#09111c]/85 px-2 py-1 font-mono text-[10px] text-[#c7d3e3]">
                        SHA-256: {shortHex(latest.chainVerdict?.responseHash ?? latest.blobKey ?? latest.id)}
                      </span>
                      {verdict && (
                        <span
                          className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase ${
                            verdict.verdict === "pass"
                              ? "bg-radar text-blueprint"
                              : verdict.verdict === "fail"
                                ? "bg-red-500 text-white"
                                : "bg-pepper text-blueprint"
                          }`}
                        >
                          {confidencePct}% CONFIDENCE · {verdict.verdict}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between px-1 font-mono text-[9px] text-[#7c90a8]">
                  {RULER_TICKS.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                {cameraLabel && (
                  <p className="font-mono text-[11px] text-[#9cb0c7]">
                    EXIF Device: <span className="text-[#f4f0e8]">{cameraLabel}</span>
                  </p>
                )}

                {verdict && (
                  <>
                    {verdict.observations.length > 0 && (
                      <ul className="space-y-1 text-xs text-[#c7d3e3]">
                        {verdict.observations.map((obs, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-pepper">›</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-1.5">
                      {verdict.checks.map((c) => (
                        <div
                          key={c.name}
                          className="rounded-lg border border-blueprint-line bg-blueprint-card/75 px-3.5 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#f4f0e8]">{c.name}</span>
                            <span
                              className={`font-mono text-[10px] font-bold uppercase ${
                                c.status === "pass"
                                  ? "text-radar"
                                  : c.status === "fail"
                                    ? "text-red-400"
                                    : "text-pepper"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#9db0c7]">{c.detail}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {latest.chainVerdict && (
                  <div className="space-y-1 rounded-lg border border-blueprint-line bg-[#09111c] p-3 font-mono text-[11px] text-[#9cb0c7]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[#f4f0e8]">
                      <span className="font-semibold">TEE Ed25519 Receipt ({latest.chainVerdict.modelId})</span>
                      {latest.chainVerdict.submitTx ? (
                        <a
                          href={txUrl(view.near.config, latest.chainVerdict.submitTx)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-radar underline"
                        >
                          Verified on NEAR ↗
                        </a>
                      ) : (
                        <span className="text-pepper">Saved locally</span>
                      )}
                    </div>
                    <p>Request hash: {shortHex(latest.chainVerdict.requestHash)}</p>
                    <p>Response hash: {shortHex(latest.chainVerdict.responseHash)}</p>
                    <p>Signature: {shortHex(latest.chainVerdict.signature)}</p>
                    {latest.chainVerdict.error && <p className="text-pepper">{latest.chainVerdict.error}</p>}
                  </div>
                )}

                <Link href="/build" className="btn-pop w-full justify-center py-3 text-xs">
                  Go to Owner Escrow (/build) →
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-blueprint-line bg-[#09111c] p-8 text-center text-xs text-[#9db0c7]">
                Click one of the 4 EXIF-stamped field samples on the left or upload a site photo to watch all 5 checks
                and NEAR AI Cloud&apos;s TEE signature execute — then switch to <strong className="text-mint">Geofence Radar</strong> to inspect the plot pin.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
