"use client";

import type { ClientEvidence, ClientStage } from "@/lib/client-view";
import { formatNgn } from "@/lib/money";
import { formatUsdc, usdcForCents, type ChainStage, type ChainStageStatus } from "@/lib/near/shared";

const STATUS_TAG: Record<ChainStageStatus | "db_planned" | "db_paid", { tag: string; cls: string }> = {
  planned: { tag: "", cls: "text-muted" },
  db_planned: { tag: "", cls: "text-muted" },
  funded: { tag: "[FUNDED]", cls: "text-pepper font-semibold" },
  proposed: { tag: "[PROPOSED]", cls: "text-pepper font-semibold" },
  released: { tag: "[DONE]", cls: "text-leaf font-semibold" },
  db_paid: { tag: "[DONE]", cls: "text-leaf font-semibold" },
  refunded: { tag: "[REFUND]", cls: "text-muted" },
};

export function StagePipeline({
  stages,
  chainStages,
  evidence,
  selectedId,
  demoDivisor,
  onSelect,
}: {
  stages: ClientStage[];
  chainStages: ChainStage[] | null;
  evidence: ClientEvidence[];
  selectedId: string;
  demoDivisor: number;
  onSelect: (stageId: string) => void;
}) {
  const bySeq = new Map(stages.map((s) => [s.seq, s]));
  const styleFor = (seq: number) => {
    const stage = bySeq.get(seq);
    if (!stage) return { stroke: "#0f1d2d", fill: "transparent", opacity: 0.45, active: false };
    const active = stage.id === selectedId;
    const cs = stage.nearStageIndex != null && chainStages ? chainStages[stage.nearStageIndex] : null;
    const done = cs?.status === "released" || stage.status === "paid";
    if (active) {
      return { stroke: "#d4882a", fill: "rgba(212, 136, 42, 0.16)", opacity: 1, active: true };
    }
    if (done) {
      return { stroke: "#0f1d2d", fill: "rgba(13, 138, 90, 0.08)", opacity: 0.85, active: false };
    }
    return { stroke: "#0f1d2d", fill: "transparent", opacity: 0.6, active: false };
  };

  const s1 = styleFor(1);
  const s2 = styleFor(2);
  const s3 = styleFor(3);
  const s4 = styleFor(4);
  const s5 = styleFor(5);
  const s6 = styleFor(6);

  const clickSeq = (seq: number) => {
    const st = bySeq.get(seq);
    if (st) onSelect(st.id);
  };

  return (
    <section aria-label="Architectural stage elevation" className="relative space-y-2 pt-1">
      {/* Subtle CAD crosshairs */}
      <div className="pointer-events-none hidden justify-between font-mono text-xs text-ink/35 sm:flex">
        <span>+</span>
        <span>ELEVATION A-A // SCALE 1:100</span>
        <span>+</span>
      </div>

      {/* Interactive Bungalow Wireframe Cross-Section */}
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 960 206"
          className="mx-auto block h-auto w-full min-w-[640px]"
          role="img"
          aria-label="Interactive 6-stage bungalow cross-section blueprint"
        >
          <defs>
            <pattern id="blockHatch" width="16" height="8" patternUnits="userSpaceOnUse">
              <path d="M 0 8 L 16 8 M 8 0 L 8 8" fill="none" stroke="#d4882a" strokeWidth="0.65" opacity="0.55" />
            </pattern>
            <pattern id="earthHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#0f1d2d" strokeWidth="0.7" opacity="0.35" />
            </pattern>
          </defs>

          {/* Elevation datum guide lines */}
          <g stroke="#cdc5b4" strokeWidth="0.7" strokeDasharray="4 4">
            <line x1="65" y1="36" x2="890" y2="36" />
            <line x1="65" y1="88" x2="890" y2="88" />
            <line x1="65" y1="164" x2="890" y2="164" />
          </g>
          <g fill="#55606e" fontSize="8.5" fontFamily="monospace">
            <text x="12" y="39">+6.40m</text>
            <text x="12" y="91">+3.00m</text>
            <text x="12" y="167">±0.00m</text>
            <text x="12" y="189">-1.20m</text>
          </g>

          {/* Stage 01: Site Clearing & Setting Out (ground datum & profile pegs) */}
          <g
            onClick={() => clickSeq(1)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s1.opacity}
            stroke={s1.stroke}
            strokeWidth={s1.active ? 2 : 1.25}
          >
            <line x1="48" y1="164" x2="912" y2="164" />
            <line x1="92" y1="150" x2="92" y2="174" />
            <line x1="108" y1="150" x2="108" y2="174" />
            <line x1="88" y1="154" x2="112" y2="154" />
            <line x1="852" y1="150" x2="852" y2="174" />
            <line x1="868" y1="150" x2="868" y2="174" />
            <line x1="848" y1="154" x2="872" y2="154" />
          </g>

          {/* Stage 02: Foundation & DPC (footings + sub-base slab) */}
          <g
            onClick={() => clickSeq(2)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s2.opacity}
            stroke={s2.stroke}
            strokeWidth={s2.active ? 2 : 1.25}
          >
            <rect x="200" y="164" width="560" height="8" fill={s2.fill === "transparent" ? "url(#earthHatch)" : s2.fill} />
            {[212, 344, 480, 616, 742].map((cx) => (
              <g key={cx}>
                <rect x={cx - 8} y="164" width="16" height="22" fill={s2.fill} />
                <rect x={cx - 16} y="186" width="32" height="9" fill={s2.fill} />
              </g>
            ))}
          </g>

          {/* Stage 03: Blockwork to Lintel (3-bay masonry walls + lintel ring beam) */}
          <g
            onClick={() => clickSeq(3)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s3.opacity}
            stroke={s3.stroke}
            strokeWidth={s3.active ? 2.1 : 1.25}
          >
            {/* Left bay */}
            <rect x="206" y="88" width="142" height="76" fill={s3.fill} />
            {/* Center featured bay with blockwork texture & columns */}
            <rect
              x="348"
              y="88"
              width="256"
              height="76"
              fill={s3.active ? "url(#blockHatch)" : s3.fill}
            />
            {/* Verandah / Right bay */}
            <rect x="604" y="88" width="146" height="76" fill={s3.fill} />
            {/* Cast concrete lintel ring beam */}
            <rect
              x="198"
              y="84"
              width="558"
              height="8"
              fill={s3.active ? "rgba(212, 136, 42, 0.32)" : s3.fill}
            />
            {/* Structural RC columns */}
            {[206, 348, 480, 604, 742].map((x) => (
              <rect key={x} x={x} y="88" width="8" height="76" fill={s3.active ? "rgba(212, 136, 42, 0.28)" : s3.fill} />
            ))}
          </g>

          {/* Stage 04: Roofing & Trusses */}
          <g
            onClick={() => clickSeq(4)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s4.opacity}
            stroke={s4.stroke}
            strokeWidth={s4.active ? 2.1 : 1.25}
            fill={s4.fill}
          >
            {/* Main roof outline */}
            <polygon points="184,84 252,32 710,32 778,84" />
            {/* Center gable truss highlighting architectural profile */}
            <polygon points="344,84 476,22 610,84" />
            {/* Internal truss web & roof ridge lines */}
            <line x1="252" y1="32" x2="252" y2="84" />
            <line x1="476" y1="22" x2="476" y2="84" />
            <line x1="410" y1="53" x2="410" y2="84" />
            <line x1="542" y1="53" x2="542" y2="84" />
            {[275, 298, 321, 634, 657, 680, 703].map((rx) => (
              <line key={rx} x1={rx} y1="32" x2={rx} y2="84" strokeWidth="0.9" />
            ))}
          </g>

          {/* Stage 05: Plumbing & Electrical (MEP conduits & ceiling fixtures) */}
          <g
            onClick={() => clickSeq(5)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s5.opacity}
            stroke={s5.stroke}
            strokeWidth={s5.active ? 2 : 1.15}
            fill="none"
          >
            <path d="M 278 92 L 278 134 M 415 92 L 415 118 L 444 118" strokeDasharray="3 2" />
            <path d="M 672 92 L 672 146 L 716 146" strokeDasharray="3 2" />
            <circle cx="278" cy="110" r="3" fill={s5.fill} />
            <circle cx="444" cy="118" r="3" fill={s5.fill} />
            <circle cx="672" cy="122" r="3" fill={s5.fill} />
          </g>

          {/* Stage 06: Doors, Windows & Finishes */}
          <g
            onClick={() => clickSeq(6)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s6.opacity}
            stroke={s6.stroke}
            strokeWidth={s6.active ? 2 : 1.2}
            fill={s6.fill === "transparent" ? "#eae5dc" : s6.fill}
          >
            {/* Left bay windows */}
            <rect x="234" y="108" width="32" height="28" />
            <rect x="292" y="108" width="32" height="28" />
            {/* Center bay double window + entry door */}
            <rect x="378" y="108" width="54" height="32" />
            <line x1="405" y1="108" x2="405" y2="140" />
            <rect x="502" y="102" width="34" height="62" />
            <rect x="554" y="108" width="32" height="28" />
            {/* Right bay window */}
            <rect x="646" y="108" width="46" height="30" />
            <line x1="669" y1="108" x2="669" y2="138" />
          </g>
        </svg>
      </div>

      {/* 6-Stage CAD Dimension Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((s) => {
          const cs = s.nearStageIndex != null && chainStages ? chainStages[s.nearStageIndex] : null;
          const key = cs?.status ?? s.nearStatus ?? (s.status === "paid" ? "db_paid" : "db_planned");
          const status = STATUS_TAG[key] ?? STATUS_TAG.db_planned;
          const active = s.id === selectedId;
          const usdcRaw = cs ? cs.amount : usdcForCents(s.laborTrancheUsdCents, demoDivisor).toString();
          const latestEv = evidence.find((e) => e.stageId === s.id);
          const displayTag = active ? "[ACTIVE]" : status.tag;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`group flex cursor-pointer flex-col border-t-2 pt-2.5 text-left transition ${
                active ? "border-pepper" : "border-ink/30 hover:border-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                <span className={active ? "font-bold text-pepper" : "font-semibold text-ink"}>
                  {String(s.seq).padStart(2, "0")} {s.name.split(" ")[0]}
                </span>
                {displayTag && (
                  <span className={active ? "font-bold text-pepper" : status.cls}>{displayTag}</span>
                )}
              </div>
              <span className="mt-0.5 line-clamp-1 text-xs font-medium text-ink">{s.name}</span>
              <span className="mt-1 font-mono text-[11px] text-muted">
                {formatUsdc(usdcRaw)} · {formatNgn(s.laborTrancheNgn)}
                {latestEv?.verdict && !active ? ` · ${latestEv.verdict.verdict.toUpperCase()}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
