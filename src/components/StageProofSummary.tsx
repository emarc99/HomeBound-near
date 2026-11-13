"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientEvidence, ClientNear, ClientStage } from "@/lib/client-view";
import { txUrl } from "@/lib/near/shared";
import { GeofenceRadar } from "./GeofenceRadar";

type ViewTab = "viewfinder" | "radar";

const shortHex = (h: string) => (h.length > 28 ? `${h.slice(0, 14)}…${h.slice(-8)}` : h);

const RULER_TICKS = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "110", "120"];

export function StageProofSummary({
  stage,
  evidence,
  near,
}: {
  stage: ClientStage;
  evidence: ClientEvidence[];
  near: ClientNear;
}) {
  const [tab, setTab] = useState<ViewTab>("viewfinder");
  const latest = evidence.find((e) => e.stageId === stage.id) ?? null;
  const siteHref = `/site?stage=${encodeURIComponent(stage.id)}`;

  const verdict = latest?.verdict ?? null;
  const confidencePct = verdict ? Math.round(verdict.confidence * 100) : null;
  const isPass = verdict?.verdict === "pass";
  const gpsLabel =
    latest?.lat != null && latest?.lng != null
      ? `${latest.lat.toFixed(4)}° N, ${latest.lng.toFixed(4)}° E · Akobo, Ibadan`
      : "7.4370° N, 3.9470° E · Akobo, Ibadan · 150m Geofence";
  const takenLabel = latest?.takenAt
    ? `${new Date(latest.takenAt).toISOString().slice(0, 16).replace("T", " ")} UTC`
    : "SAMPLE PREVIEW · STAGE READY";
  const evHash = latest ? (latest.chainVerdict?.responseHash ?? latest.blobKey ?? latest.id) : null;
  const hashLabel = evHash ? `TEE hash: ${shortHex(evHash)}` : "SHA-256 pending live capture";

  return (
    <section className="card-blueprint flex flex-col justify-between space-y-4 p-4 sm:p-5">
      {/* Top CAD Header + Viewfinder / Geofence Radar Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line pb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] text-[#8ea1b8] uppercase">
            Site Inspection · Stage {String(stage.seq).padStart(2, "0")}
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#f4f0e8]">
            {tab === "viewfinder" ? "CAD Inspection Viewfinder" : "Live Plot Geofence Radar"}
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

      {tab === "viewfinder" ? (
        <div className="space-y-3">
          {/* Top millimeter CAD ruler */}
          <div className="flex justify-between px-1 font-mono text-[9px] text-[#7c90a8]">
            {RULER_TICKS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {/* Calibrated CAD Photo Viewport */}
          <div className="relative overflow-hidden rounded-lg border border-blueprint-line bg-[#09111c]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latest?.blobKey ? `/api/blobs/${encodeURIComponent(latest.blobKey)}` : "/samples/lintel-pass.jpg"}
              alt={latest ? `Site proof for ${stage.name}` : `Reference site preview for ${stage.name}`}
              className={`h-60 w-full object-cover ${latest ? "" : "opacity-75 grayscale-[15%]"}`}
            />

            {/* Viewfinder corner crop brackets */}
            <div className="pointer-events-none absolute inset-3 border border-white/20">
              <span className="absolute -top-px -left-px size-3 border-t-2 border-l-2 border-white/80" />
              <span className="absolute -top-px -right-px size-3 border-t-2 border-r-2 border-white/80" />
              <span className="absolute -bottom-px -left-px size-3 border-b-2 border-l-2 border-white/80" />
              <span className="absolute -right-px -bottom-px size-3 border-r-2 border-b-2 border-white/80" />
            </div>

            {/* Top telemetry pills */}
            <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#09111c]/85 px-2.5 py-1 font-mono text-[10px] text-[#f4f0e8] backdrop-blur-sm">
                {gpsLabel}
              </span>
              <span className="rounded bg-[#09111c]/85 px-2.5 py-1 font-mono text-[10px] text-[#f4f0e8] backdrop-blur-sm">
                {takenLabel}
              </span>
            </div>

            {/* Bottom telemetry & verdict pills */}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#09111c]/85 px-2.5 py-1 font-mono text-[10px] text-[#c7d3e3] backdrop-blur-sm">
                {hashLabel}
              </span>
              {verdict ? (
                <span
                  className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase ${
                    isPass
                      ? "bg-radar text-blueprint"
                      : verdict.verdict === "fail"
                        ? "bg-red-500 text-white"
                        : "bg-pepper text-blueprint"
                  }`}
                >
                  {confidencePct}% CONFIDENCE · {verdict.verdict}
                </span>
              ) : (
                <span className="rounded bg-pepper px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-blueprint uppercase">
                  AWAITING LIVE SUBMISSION
                </span>
              )}
            </div>
          </div>

          {/* Bottom millimeter CAD ruler */}
          <div className="flex justify-between px-1 font-mono text-[9px] text-[#7c90a8]">
            {RULER_TICKS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {/* 5-Gate Checks or Acceptance Criteria */}
          {verdict ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {verdict.checks.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-2 rounded-lg border border-blueprint-line bg-blueprint-card/70 px-3 py-2 text-[11px]"
                >
                  <span className="truncate text-[#e6edf5]">{c.name}</span>
                  <span
                    className={`shrink-0 font-mono text-[10px] font-bold uppercase ${
                      c.status === "pass" ? "text-radar" : c.status === "fail" ? "text-red-400" : "text-pepper"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-blueprint-line bg-blueprint-card/70 p-3 text-xs">
              <span className="block font-mono text-[10px] tracking-wider text-pepper uppercase">
                Stage Acceptance Criteria
              </span>
              <p className="mt-1 text-[#d2dce8]">{stage.acceptanceCriteria}</p>
            </div>
          )}

          {latest?.chainVerdict?.submitTx && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blueprint-line bg-[#09111c] px-3 py-2 font-mono text-[10px] text-[#9cb0c7]">
              <span>Ed25519 TEE Sig: {shortHex(latest.chainVerdict.signature)}</span>
              <a
                href={txUrl(near.config, latest.chainVerdict.submitTx)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-radar underline"
              >
                Verified on NEAR ↗
              </a>
            </div>
          )}
        </div>
      ) : (
        <GeofenceRadar
          photoLat={latest?.lat}
          photoLng={latest?.lng}
          photoLabel={latest ? `Stage ${String(stage.seq).padStart(2, "0")} upload` : undefined}
          takenAt={latest?.takenAt}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blueprint-line pt-3">
        <button
          type="button"
          onClick={() => setTab(tab === "viewfinder" ? "radar" : "viewfinder")}
          className="cursor-pointer font-mono text-[11px] text-[#a7b3c2] underline underline-offset-2 hover:text-white"
        >
          {tab === "viewfinder" ? "Switch to Live Geofence Radar →" : "← Back to CAD Photo Viewfinder"}
        </button>
        <Link href={siteHref} className="btn-pop px-4 py-2 text-[11px]">
          {latest ? "Submit new photo (/site) →" : "Inspect in Foreman Studio (/site) →"}
        </Link>
      </div>
    </section>
  );
}
