"use client";

import Image from "next/image";
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

const shortHex = (h: string) => (h.length > 26 ? `${h.slice(0, 12)}…${h.slice(-8)}` : h);

function CadSpecLayer({ stageSeq, criteriaHash }: { stageSeq: number; criteriaHash: string }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-paper p-6">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">
        <span>CAD SPEC OVERLAY · STAGE 0{stageSeq}</span>
        <span>CRITERIA SHA-256: {criteriaHash.slice(0, 14)}…</span>
      </div>

      <svg viewBox="0 0 640 280" className="my-auto h-auto w-full select-none" aria-hidden>
        <defs>
          <pattern id="compare-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#111110" strokeOpacity="0.1" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="640" height="280" fill="url(#compare-grid)" />
        <rect x="60" y="64" width="520" height="164" fill="none" stroke="#111110" strokeWidth="1.5" />
        {/* Lintel beam */}
        <rect
          x="60"
          y="64"
          width="520"
          height="28"
          fill="#f04600"
          fillOpacity="0.14"
          stroke="#f04600"
          strokeWidth="1.4"
          strokeDasharray="5 3"
        />
        <text x="76" y="82" fill="#f04600" fontFamily="monospace" fontSize="11" fontWeight="600">
          REINFORCED LINTEL RING BEAM (+2.85M)
        </text>
        {/* Window voids */}
        <rect x="112" y="114" width="128" height="70" fill="none" stroke="#111110" strokeWidth="1.2" strokeDasharray="3 3" />
        <rect x="400" y="114" width="128" height="70" fill="none" stroke="#111110" strokeWidth="1.2" strokeDasharray="3 3" />
        <rect x="278" y="114" width="84" height="114" fill="none" stroke="#111110" strokeWidth="1.4" />
        <text x="62" y="250" fill="#6b6a64" fontFamily="monospace" fontSize="9.5">
          AKOBO BUNGALOW ELEVATION · 9-INCH OUTER / 6-INCH PARTITION MASONRY
        </text>
      </svg>

      <div className="flex items-center justify-between font-mono text-[10px] text-muted uppercase">
        <span>DATUM ±0.00M TO +3.20M</span>
        <span>DRAG SLIDER TO COMPARE PHOTO →</span>
      </div>
    </div>
  );
}

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
  const [comparePct, setComparePct] = useState<number>(62);
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
      setStatusNote("Passed all verification checks inside NEAR AI TEE and proposed payout on-chain.");
    } else if (d?.onChain) {
      setStatusNote(`TEE signed verdict (${d.verdict}) recorded on NEAR via gasless relayer.`);
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
      handleResult(res);
    });
  };

  const compareImageSrc = latest?.blobKey
    ? `/api/blobs/${encodeURIComponent(latest.blobKey)}`
    : "/samples/lintel-pass.jpg";

  return (
    <main className="mx-auto w-full max-w-[1340px] flex-1 space-y-12 px-6 py-12 md:px-10 md:py-16">
      {/* Hart Oliveira Sheet Header + Gasless Relay Pill */}
      <header className="space-y-6 border-b border-dashed border-ink/25 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.18em] text-vermilion uppercase">
            SHEET S-10{selectedStage?.seq ?? 3} · (02) FOREMAN STUDIO · {view.project.siteCity.toUpperCase()}, {view.project.siteState.toUpperCase()}
          </span>

          <span className="inline-flex items-center gap-2 rounded-[2px] border border-leaf/40 bg-mint px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-leaf uppercase">
            <span className="size-2 rounded-full bg-leaf" />
            Gasless Relay Active — Foreman Needs 0 NEAR ({view.near.config.agent})
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-sans text-4xl font-medium tracking-[-0.045em] text-ink md:text-5xl">
              Submit masonry proof &amp; run TEE verification.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              No wallet extension or NEAR gas balance needed on site. Every photograph is hashed (SHA-256 + perceptual dHash), checked against the 150m Akobo geofence, and graded by <span className="font-mono text-xs text-ink">Qwen/Qwen3.8-27B</span>.
            </p>
          </div>
          <Link href="/build" className="btn-ghost">
            ← Back to (01) Escrow Vault
          </Link>
        </div>
      </header>

      {/* Shared Moss Keld Interactive Stage Selector */}
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

      {/* HART OLIVEIRA FIG. 1: CAD LINE-DRAWING VS FOREMAN PHOTO SLIDER */}
      <section className="space-y-5 border border-line bg-card p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
              FIG. 1 · LINE DRAWING VS. SITE PHOTOGRAPH COMPARE
            </p>
            <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
              0{selectedStage?.seq ?? 3}. {selectedStage?.name ?? "Blockwork to lintel"}
            </h2>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] uppercase">
            <span className="text-muted">Split: {comparePct}% Photo</span>
            <input
              type="range"
              min={5}
              max={95}
              value={comparePct}
              onChange={(e) => setComparePct(Number(e.target.value))}
              aria-label="Drag to compare architectural CAD specification with site photo"
              className="w-36 accent-[#f04600] cursor-ew-resize"
            />
          </div>
        </div>

        <div className="relative h-[340px] w-full overflow-hidden border border-line bg-paper md:h-[420px]">
          {/* Bottom layer: Architectural CAD Spec */}
          <CadSpecLayer stageSeq={selectedStage?.seq ?? 3} criteriaHash={selectedStage?.criteriaHash ?? ""} />

          {/* Clipped foreground layer: Field Photo */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - comparePct}% 0 0)` }}
          >
            <Image
              unoptimized
              src={compareImageSrc}
              alt="Site evidence photograph"
              fill
              className="object-cover"
            />
            <span className="absolute top-4 left-4 bg-ink/85 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-paper uppercase">
              {latest ? "LIVE SITE EVIDENCE" : "SAMPLE · LINTEL BEAM"}
            </span>
          </div>

          {/* Vermilion divider hairline */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-vermilion shadow"
            style={{ left: `${comparePct}%` }}
          >
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-[2px] border border-vermilion bg-paper px-1.5 py-1 font-mono text-[9px] font-bold text-vermilion shadow">
              |
            </div>
          </div>
        </div>
      </section>

      {/* FIELD CAPTURE PANEL: 1-CLICK EXIF SAMPLES + CUSTOM UPLOAD */}
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 border border-line bg-card p-6 md:p-8 lg:col-span-7">
          <div className="border-b border-dashed border-ink/20 pb-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
              01 · 1-CLICK EXIF FIELD SAMPLES &amp; UPLOAD
            </p>
            <p className="mt-1 text-sm text-muted">
              Click any real EXIF-stamped test frame to watch live NEAR AI Cloud vision grading + gasless NEAR contract submission.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.entries(SAMPLE_PHOTOS) as [SamplePhotoKey, (typeof SAMPLE_PHOTOS)[SamplePhotoKey]][]).map(
              ([key, sample]) => {
                const isRunning = pending && activeSample === key;
                const isFail = sample.tag.toLowerCase().includes("fail");
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={pending}
                    onClick={() => triggerSample(key)}
                    className="group flex cursor-pointer flex-col overflow-hidden border border-dashed border-ink/25 bg-paper/55 text-left transition hover:border-vermilion disabled:opacity-50"
                  >
                    <div className="relative h-32 w-full overflow-hidden border-b border-line bg-plaster">
                      <Image
                        src={`/samples/${sample.file}`}
                        alt={sample.label}
                        width={360}
                        height={220}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="space-y-1.5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans text-base font-medium text-ink">
                          {isRunning ? "Inspecting in TEE…" : sample.label}
                        </span>
                        <span
                          className={`rounded-[2px] border px-2 py-0.5 font-mono text-[9px] uppercase ${
                            isFail
                              ? "border-crimson/35 bg-crimson/10 text-crimson"
                              : "border-leaf/35 bg-mint text-leaf"
                          }`}
                        >
                          {sample.tag}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-muted">{sample.hint}</p>
                    </div>
                  </button>
                );
              },
            )}
          </div>

          <form onSubmit={uploadCustom} className="space-y-4 border-t border-dashed border-ink/20 pt-6">
            <label className="label block">Or upload custom JPEG / PNG / WebP site frame</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="field flex-1 py-2 text-xs"
              />
              <button type="submit" disabled={pending || !file} className="btn-pop">
                {pending && !activeSample ? "Submitting to NEAR AI TEE…" : "Upload & Grade (0 NEAR Gas)"}
              </button>
            </div>
          </form>

          {error && (
            <div className="border border-crimson/35 bg-crimson/10 px-4 py-3 font-mono text-xs text-crimson">
              {error}
            </div>
          )}
          {statusNote && (
            <div className="border border-leaf/35 bg-mint px-4 py-3 font-mono text-xs text-leaf">
              {statusNote}
            </div>
          )}
        </div>

        {/* FIG. 2: 150M GEOFENCE RADAR */}
        <div className="border border-line bg-card p-6 md:p-8 lg:col-span-5">
          <GeofenceRadar
            photoLat={latest?.lat}
            photoLng={latest?.lng}
            photoLabel={latest?.uploadedByName}
            takenAt={latest?.takenAt}
          />
        </div>
      </section>

      {/* HART OLIVEIRA 3-COLUMN CRITERIA-BOUND TELEMETRY */}
      <section className="grid gap-6 border border-line bg-card p-6 md:grid-cols-3 md:p-10">
        <div className="space-y-3 border-b border-dashed border-ink/20 pb-5 md:border-r md:border-b-0 md:pr-6 md:pb-0">
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">01 / PHYSICAL TELEMETRY</p>
          <h3 className="font-sans text-xl font-medium text-ink">Latest Verdict Status</h3>
          {latest?.verdict ? (
            <div className="space-y-2">
              <p className="font-mono text-sm font-semibold text-ink uppercase">
                {latest.verdict.verdict} · {Math.round(latest.verdict.confidence * 100)}% CONFIDENCE
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-muted">
                {latest.verdict.checks.map((c) => (
                  <li key={c.name} className={c.status === "pass" ? "text-leaf" : "text-crimson"}>
                    [{c.status.toUpperCase()}] {c.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">Trigger a sample or upload a photo above to run all physical &amp; AI checks.</p>
          )}
        </div>

        <div className="space-y-3 border-b border-dashed border-ink/20 pb-5 md:border-r md:border-b-0 md:pr-6 md:pb-0">
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">02 / ON-CHAIN CRITERIA LOCK</p>
          <h3 className="font-sans text-xl font-medium text-ink">Stage Criteria SHA-256</h3>
          <p className="text-sm leading-relaxed text-muted">{selectedStage?.acceptanceCriteria}</p>
          <p className="border border-dashed border-ink/20 bg-paper p-2.5 font-mono text-[10px] break-all text-ink">
            {selectedStage?.criteriaHash}
          </p>
        </div>

        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">03 / GASLESS RELAY RECEIPTS</p>
            <h3 className="font-sans text-xl font-medium text-ink">NEAR Settlement Status</h3>
            {latest?.chainVerdict ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                <p className="text-ink">Photo SHA-256: {shortHex(latest.sha256 ?? latest.id)}</p>
                {latest.chainVerdict.submitTx && (
                  <p>
                    <a
                      href={txUrl(view.near.config, latest.chainVerdict.submitTx)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline hover:text-vermilion"
                    >
                      submit_verdict tx: {shortHex(latest.chainVerdict.submitTx)}
                    </a>
                  </p>
                )}
                {latest.chainVerdict.proposeTx && (
                  <p>
                    <a
                      href={txUrl(view.near.config, latest.chainVerdict.proposeTx)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-vermilion underline"
                    >
                      propose_release tx: {shortHex(latest.chainVerdict.proposeTx)}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Passing verdicts automatically invoke submit_verdict and propose_release on NEAR.</p>
            )}
          </div>

          <Link href="/build" className="btn w-full">
            Proceed to (01) 1 yoctoNEAR Release →
          </Link>
        </div>
      </section>
    </main>
  );
}
