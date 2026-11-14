"use client";

import { useState } from "react";
import { CadFrame, SectionEyebrow } from "./CadPrimitives";

function ObserveEmblem() {
  return (
    <svg viewBox="0 0 120 120" className="size-24 shrink-0 text-ink" aria-hidden>
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeDasharray="3 3" />
      <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="7" fill="#f04600" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="60"
          y1="14"
          x2="60"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.1"
          transform={`rotate(${deg} 60 60)`}
        />
      ))}
    </svg>
  );
}

function ReasonEmblem() {
  return (
    <svg viewBox="0 0 120 120" className="size-24 shrink-0 text-ink" aria-hidden>
      <path d="M 24 98 L 24 54 A 36 36 0 0 1 96 54 L 96 98" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M 38 98 L 38 58 A 22 22 0 0 1 82 58 L 82 98" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeDasharray="3 3" />
      <rect x="52" y="18" width="16" height="14" fill="#f04600" />
      <line x1="16" y1="98" x2="104" y2="98" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MoveEmblem() {
  return (
    <svg viewBox="0 0 120 120" className="size-24 shrink-0 text-ink" aria-hidden>
      <path d="M 18 86 Q 58 22 102 36" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M 22 96 Q 62 42 100 54" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeDasharray="3 3" />
      <polygon points="102,36 90,32 95,45" fill="#f04600" />
      <line x1="18" y1="100" x2="104" y2="100" stroke="currentColor" strokeOpacity="0.3" />
    </svg>
  );
}

const ARCHITECTURE_TIERS = [
  {
    code: "01 · OBSERVE",
    title: "Observe — Gasless Site Capture",
    body: "Foremen upload progress photos on /site with zero NEAR tokens and zero wallet extension. The gasless relayer computes SHA-256 and 64-bit dHash fingerprints, checks EXIF recency, and enforces a 150m Haversine geofence around the Akobo site.",
    tag: "RELAYER: agent.homebound-hq.testnet",
    Emblem: ObserveEmblem,
  },
  {
    code: "02 · REASON",
    title: "Reason — Criteria-Bound TEE AI",
    body: "NEAR AI Cloud (Qwen3.8-27B) grades visible masonry against the stage acceptance criteria and signs the JSON payload inside its enclave. The escrow contract checks both Ed25519 signature and expected ref {project}/{stage}/{criteria_hash}/{sha256}.",
    tag: "ORACLE: TEE Ed25519 SIGNATURE",
    Emblem: ReasonEmblem,
  },
  {
    code: "03 · MOVE",
    title: "Move — Sovereign Circle USDC Settlement",
    body: "Passing inspections earn a 24-hour release proposal, never an automatic transfer. Funds settle from escrow to the Ibadan builder only on the London owner's 1 yoctoNEAR wallet signature, updating the bookkeeper CSV ledger immediately.",
    tag: "SETTLEMENT: 1 YOCTONEAR FINALITY",
    Emblem: MoveEmblem,
  },
];

const SEQUENCE_PHASES = [
  {
    id: "phase-1",
    tab: "Phase I — Lock",
    title: "Escrow project & fund Circle USDC per stage",
    signer: "tightrat3805.testnet (Diaspora Owner)",
    method: "create_project() + ft_transfer_call(amount)",
    summary:
      "The homeowner locks only one construction tranche at a time (e.g., $1,500 USD / 1.50 demo USDC for Stage 03 Blockwork to lintel) alongside the immutable SHA-256 criteria_hash of the written specification.",
    guarantees: [
      "Rejects non-USDC tokens or malformed stage indices",
      "Refunds any excess USDC above stage tranche automatically",
      "Stages strictly unlock in architectural sequence (Stage N-1 must be Released)",
    ],
  },
  {
    id: "phase-2",
    tab: "Phase II — Verify",
    title: "Foreman uploads site photo; agent files TEE verdict",
    signer: "agent.homebound-hq.testnet (Gasless Relayer)",
    method: "submit_verdict(...) + propose_release()",
    summary:
      "The site foreman needs zero NEAR or wallet app. The backend verifies 150m geofence, EXIF timing, and dHash novelty before forwarding the NEAR AI TEE-signed response on-chain.",
    guarantees: [
      "Contract checks response_hash uniqueness against replay attacks",
      "Binds {project_id}/{stage}/{criteria_hash}/{evidence_sha256} inside signed body",
      "Requires verdict == Pass, confidence >= 60, and all 3 physical PhotoChecks true",
    ],
  },
  {
    id: "phase-3",
    tab: "Phase III — Settle",
    title: "Owner signs 1 yoctoNEAR approval or exercises escape hatches",
    signer: "tightrat3805.testnet (Owner Wallet)",
    method: "approve_release() | override_release(reason) | refund_stage()",
    summary:
      "Before the 24h proposal expires, the owner inspects the verdict and signs a 1 yoctoNEAR confirmation to stream Circle USDC directly to chidi.homebound-hq.testnet — or intervenes using visible owner escape hatches.",
    guarantees: [
      "1 yoctoNEAR prevents silent background key drainage",
      "override_release(reason) settles disputes when an in-person architect signs off",
      "refund_stage() claws back unspent USDC if construction halts or fails",
    ],
  },
];

export function ArchitectureAndSequence() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const current = SEQUENCE_PHASES[phaseIdx];

  return (
    <>
      {/* SECTION 05: SYSTEM FOUNDATION — THE ARCHITECTURE */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="mb-14">
          <SectionEyebrow
            tag="05 / SYSTEM FOUNDATION"
            title="The architecture."
            subtitle="A continuous operational loop that transforms physical site information into deliberate, verifiable financial settlement."
          />
        </div>

        <div className="space-y-6">
          {ARCHITECTURE_TIERS.map(({ code, title, body, tag, Emblem }) => (
            <CadFrame key={code} className="bg-card p-8 md:p-12">
              <div className="grid items-center gap-8 md:grid-cols-12">
                <div className="flex items-center gap-6 md:col-span-4">
                  <div className="border border-dashed border-ink/20 bg-paper p-5">
                    <Emblem />
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">{code}</p>
                    <p className="font-mono text-[11px] text-muted uppercase">{tag}</p>
                  </div>
                </div>
                <div className="space-y-3 md:col-span-8">
                  <h3 className="font-sans text-2xl font-medium tracking-[-0.03em] text-ink md:text-3xl">{title}</h3>
                  <p className="max-w-3xl text-base leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            </CadFrame>
          ))}
        </div>
      </section>

      {/* SECTION 06: FROM INTENT TO OPERATION — THE SEQUENCE */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="mb-12">
          <SectionEyebrow
            tag="06 / FROM INTENT TO OPERATION"
            title="The Sequence."
            subtitle="Every transition between Diaspora owner, site agent, and builder follows a deterministic on-chain state machine."
          />
        </div>

        <div className="halftone-vermilion border border-vermilion/40 p-6 md:p-10">
          <div className="border border-line bg-card p-8 shadow-xl md:p-12">
            <div className="flex flex-wrap items-center gap-3 border-b border-dashed border-ink/20 pb-6">
              {SEQUENCE_PHASES.map((p, idx) => {
                const active = idx === phaseIdx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPhaseIdx(idx)}
                    className={`cursor-pointer rounded-[3px] border px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition ${
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {p.tab}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-7">
                <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                  SIGNER · {current.signer}
                </p>
                <h3 className="font-sans text-3xl font-medium tracking-[-0.035em] text-ink">{current.title}</h3>
                <p className="text-base leading-relaxed text-muted">{current.summary}</p>
                <div className="inline-block border border-dashed border-ink/25 bg-paper px-4 py-2.5 font-mono text-xs text-ink">
                  {current.method}
                </div>
              </div>

              <div className="space-y-4 border-t border-dashed border-ink/20 pt-6 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                <p className="label">Enforced Contract Invariants</p>
                <ul className="space-y-4">
                  {current.guarantees.map((g) => (
                    <li key={g} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                      <span className="mt-1.5 size-1.5 shrink-0 bg-vermilion" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
