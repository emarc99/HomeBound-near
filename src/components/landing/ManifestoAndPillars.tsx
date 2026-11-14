import { CadFrame, SectionEyebrow } from "./CadPrimitives";

function HalftoneFriezeSvg() {
  return (
    <svg
      viewBox="0 0 1200 220"
      className="h-44 w-full select-none md:h-56"
      role="img"
      aria-label="Monochrome halftone classical colonnade and masonry frieze"
    >
      <defs>
        <pattern id="frieze-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#111110" fillOpacity="0.28" />
        </pattern>
        <pattern id="frieze-fine" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.95" fill="#111110" fillOpacity="0.16" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="1200" height="220" fill="url(#frieze-fine)" />
      {/* Architectural arches */}
      {[120, 360, 600, 840, 1080].map((cx) => (
        <g key={cx}>
          <path
            d={`M ${cx - 88} 220 L ${cx - 88} 118 A 88 88 0 0 1 ${cx + 88} 118 L ${cx + 88} 220`}
            fill="#edece8"
            stroke="#111110"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <rect
            x={cx - 108}
            y="42"
            width="20"
            height="178"
            fill="url(#frieze-dots)"
            stroke="#111110"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Top architrave & vermilion cut mark */}
      <rect x="20" y="24" width="1160" height="18" fill="url(#frieze-dots)" stroke="#111110" strokeOpacity="0.4" />
      <line x1="20" y1="118" x2="1180" y2="118" stroke="#f04600" strokeOpacity="0.45" strokeDasharray="5 5" />
      <text x="36" y="110" fill="#f04600" fontFamily="monospace" fontSize="10" letterSpacing="2">
        DATUM +2.85M · STRUCTURAL CONTINUITY
      </text>
    </svg>
  );
}

const PILLARS = [
  {
    index: "01",
    code: "VERIFIABLE VISION",
    title: "Criteria-bound NEAR AI Cloud TEE",
    body: "Qwen3.8-27B evaluates masonry progress inside an attested TEE enclave and signs its JSON verdict with its registered Ed25519 key against {project}/{stage}/{criteria_hash}/{evidence_sha256}.",
    foot: "Ed25519 · on-chain signature check",
  },
  {
    index: "02",
    code: "BOUNDED GEOFENCE",
    title: "Physical Proof, Not Stock Photos",
    body: "Every upload undergoes SHA-256 content hashing, 64-bit dHash perceptual duplicate detection, EXIF timestamp checks, and a 150m Haversine perimeter lock on the Akobo plot.",
    foot: "150m Haversine · dHash <= 6 barrier",
  },
  {
    index: "03",
    code: "SOVEREIGN ESCROW",
    title: "Owner Keeps the Keys",
    body: "The foreman needs zero NEAR or wallet setup. Meanwhile the autonomous agent can only propose releases: Circle USDC never moves without the owner's 1 yoctoNEAR wallet approval, override, or refund.",
    foot: "1 yoctoNEAR · non-custodial vault",
  },
];

export function ManifestoAndPillars() {
  return (
    <>
      {/* SECTION 03: HALFTONE FRIEZE & MANIFESTO */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <CadFrame className="overflow-hidden bg-card">
          <div className="border-b border-dashed border-ink/20 bg-paper">
            <HalftoneFriezeSvg />
          </div>
          <div className="space-y-8 p-8 md:p-16">
            <p className="font-mono text-[10px] tracking-[0.18em] text-vermilion uppercase">
              + MANIFESTO · LONDON → IBADAN
            </p>
            <blockquote className="max-w-4xl font-sans text-3xl font-medium tracking-[-0.04em] text-ink md:text-5xl md:leading-[1.08]">
              “Construction money doesn’t fail at the transfer. It fails between receipts.”
            </blockquote>
            <p className="max-w-2xl text-base leading-relaxed text-muted">
              A wire settles in seconds; verifying whether twelve courses of nine-inch sandcrete block were actually
              laid on Plot 14 takes boots on the ground — or cryptographic telemetry bound directly to your Circle USDC
              escrow rules.
            </p>
          </div>
        </CadFrame>
      </section>

      {/* SECTION 04: DEPENDABLE AUTONOMY (3 PILLARS) */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="mb-14">
          <SectionEyebrow
            tag="04 / DEPENDABLE AUTONOMY"
            title="Three controls before a dollar moves."
            subtitle="Designed jointly for Real-World Money rails and Open Innovation: an AI agent proposes, cryptography narrows what can be forged, and the property owner retains absolute finality."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <CadFrame key={p.index} className="flex flex-col justify-between bg-card p-8 md:p-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-dashed border-ink/20 pb-4 font-mono text-[10px] tracking-[0.16em] uppercase">
                  <span className="text-vermilion">{p.index}</span>
                  <span className="text-muted">{p.code}</span>
                </div>
                <h3 className="font-sans text-2xl font-medium tracking-[-0.03em] text-ink">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted md:text-[15px]">{p.body}</p>
              </div>

              <div className="mt-10 border-t border-dashed border-ink/20 pt-4 font-mono text-[10px] tracking-[0.14em] text-ink uppercase">
                {p.foot}
              </div>
            </CadFrame>
          ))}
        </div>
      </section>
    </>
  );
}
