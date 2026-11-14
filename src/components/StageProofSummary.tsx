"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ClientEvidence, ClientNear, ClientStage } from "@/lib/client-view";
import { txUrl } from "@/lib/near/shared";
import { GeofenceRadar } from "./GeofenceRadar";

const shortHex = (h: string) => (h.length > 26 ? `${h.slice(0, 12)}…${h.slice(-8)}` : h);

export function StageProofSummary({
  stage,
  evidence,
  near,
}: {
  stage: ClientStage;
  evidence: ClientEvidence[];
  near: ClientNear;
}) {
  const [tab, setTab] = useState<"photo" | "radar">("photo");
  const stageEvidence = evidence.filter((e) => e.stageId === stage.id);
  const latest = stageEvidence[0] ?? null;
  const verdict = latest?.verdict ?? null;

  return (
    <section className="space-y-6 border border-line bg-card p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            SITE EVIDENCE &amp; VERIFICATION LOG · STAGE 0{stage.seq}
          </p>
          <h3 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
            Physical Proof vs. Specification Criteria
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-[3px] border border-line bg-paper p-1 font-mono text-[10px] uppercase">
            <button
              type="button"
              onClick={() => setTab("photo")}
              className={`cursor-pointer rounded-[2px] px-3 py-1 transition ${
                tab === "photo" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              Evidence
            </button>
            <button
              type="button"
              onClick={() => setTab("radar")}
              className={`cursor-pointer rounded-[2px] px-3 py-1 transition ${
                tab === "radar" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              150m Radar
            </button>
          </div>

          <Link href={`/site?stage=${encodeURIComponent(stage.id)}`} className="btn-ghost px-3.5 py-2 text-[10px]">
            Open (02) Site Camera →
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          {tab === "photo" ? (
            <div className="overflow-hidden border border-line bg-paper">
              <Image
                unoptimized
                src={latest?.blobKey ? `/api/blobs/${encodeURIComponent(latest.blobKey)}` : "/samples/lintel-pass.jpg"}
                alt={latest ? `Uploaded evidence for ${stage.name}` : "Sample Akobo site photo preview"}
                width={720}
                height={440}
                className="h-72 w-full object-cover"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 font-mono text-[10px] text-muted uppercase">
                <span>{latest ? `Captured ${latest.takenAt ?? latest.createdAt}` : "Preview · No upload on this stage yet"}</span>
                {latest?.sha256 && <span>SHA-256: {shortHex(latest.sha256)}</span>}
              </div>
            </div>
          ) : (
            <GeofenceRadar
              photoLat={latest?.lat}
              photoLng={latest?.lng}
              photoLabel={latest?.uploadedByName}
              takenAt={latest?.takenAt}
            />
          )}
        </div>

        <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
          <div className="space-y-4">
            <div className="border border-dashed border-ink/20 bg-paper/60 p-4">
              <p className="label">Acceptance Specification ( criteria_hash )</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{stage.acceptanceCriteria}</p>
              <p className="mt-2 font-mono text-[10px] text-muted break-all">
                SHA-256: {stage.criteriaHash}
              </p>
            </div>

            {verdict ? (
              <div className="space-y-3 border border-line bg-paper/60 p-4">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                  <span className="font-semibold text-ink">
                    TEE Verdict: {verdict.verdict} ({Math.round(verdict.confidence * 100)}%)
                  </span>
                  <span className="text-muted">{verdict.model}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {verdict.checks.map((c) => (
                    <div
                      key={c.name}
                      className={`border px-2.5 py-2 font-mono text-[10px] ${
                        c.status === "pass"
                          ? "border-leaf/35 bg-mint/60 text-leaf"
                          : "border-crimson/35 bg-crimson/10 text-crimson"
                      }`}
                    >
                      <span className="font-semibold uppercase">{c.name}: {c.status}</span>
                      <span className="mt-0.5 block opacity-85">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-ink/20 bg-paper/45 p-4 text-sm text-muted">
                No field photograph submitted yet for this milestone. Visit{" "}
                <Link href={`/site?stage=${encodeURIComponent(stage.id)}`} className="font-medium text-vermilion underline">
                  (02) Site Camera
                </Link>{" "}
                to upload via our gasless foreman relayer.
              </div>
            )}
          </div>

          {latest?.chainVerdict && (
            <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-ink/20 pt-3 font-mono text-[11px]">
              {latest.chainVerdict.submitTx && (
                <a
                  href={txUrl(near.config, latest.chainVerdict.submitTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline hover:text-vermilion"
                >
                  submit_verdict tx ({shortHex(latest.chainVerdict.submitTx)})
                </a>
              )}
              {latest.chainVerdict.proposeTx && (
                <a
                  href={txUrl(near.config, latest.chainVerdict.proposeTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vermilion underline"
                >
                  propose_release tx ({shortHex(latest.chainVerdict.proposeTx)})
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
