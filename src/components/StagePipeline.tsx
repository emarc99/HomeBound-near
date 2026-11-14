"use client";

import type { ClientEvidence, ClientStage } from "@/lib/client-view";
import { formatNgn } from "@/lib/money";
import { formatUsdc, usdcForCents, type ChainStage, type ChainStageStatus } from "@/lib/near/shared";

const STATUS_BADGE: Record<ChainStageStatus | "db_planned" | "db_paid", { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "border-line bg-paper text-muted" },
  db_planned: { label: "Planned", cls: "border-line bg-paper text-muted" },
  funded: { label: "Funded", cls: "border-amber/40 bg-amber/15 text-amber" },
  proposed: { label: "Proposed", cls: "border-vermilion/40 bg-vermilion/12 text-vermilion" },
  released: { label: "Paid", cls: "border-leaf/35 bg-mint text-leaf" },
  db_paid: { label: "Paid", cls: "border-leaf/35 bg-mint text-leaf" },
  refunded: { label: "Refunded", cls: "border-crimson/35 bg-crimson/10 text-crimson" },
};

const ELEVATION_BY_SEQ: Record<number, { datum: string; yPct: number }> = {
  1: { datum: "-0.40M", yPct: 86 },
  2: { datum: "±0.00M", yPct: 74 },
  3: { datum: "+2.85M", yPct: 48 },
  4: { datum: "+5.10M", yPct: 24 },
  5: { datum: "+2.10M", yPct: 58 },
  6: { datum: "+1.40M", yPct: 64 },
};

export function StagePipeline({
  stages,
  chainStages,
  evidence,
  selectedId,
  demoDivisor,
  currency = "USDC",
  onSelect,
}: {
  stages: ClientStage[];
  chainStages: ChainStage[] | null;
  evidence: ClientEvidence[];
  selectedId: string;
  demoDivisor: number;
  currency?: "USDC" | "NGN";
  onSelect: (stageId: string) => void;
}) {
  const bySeq = new Map(stages.map((s) => [s.seq, s]));
  const selected = stages.find((s) => s.id === selectedId) ?? stages[0];
  const cut = ELEVATION_BY_SEQ[selected?.seq ?? 3] ?? ELEVATION_BY_SEQ[3];

  const tone = (seq: number) => {
    const stage = bySeq.get(seq);
    if (!stage) return { stroke: "#111110", fill: "transparent", opacity: 0.35 };
    const active = stage.id === selectedId;
    const cs = stage.nearStageIndex != null && chainStages ? chainStages[stage.nearStageIndex] : null;
    const done = cs?.status === "released" || stage.status === "paid";
    if (active) return { stroke: "#f04600", fill: "rgba(240, 70, 0, 0.14)", opacity: 1 };
    if (done) return { stroke: "#2f7a4a", fill: "rgba(47, 122, 74, 0.08)", opacity: 0.9 };
    return { stroke: "#111110", fill: "transparent", opacity: 0.55 };
  };

  const s1 = tone(1);
  const s2 = tone(2);
  const s3 = tone(3);
  const s4 = tone(4);
  const s5 = tone(5);
  const s6 = tone(6);

  const pick = (seq: number) => {
    const st = bySeq.get(seq);
    if (st) onSelect(st.id);
  };

  return (
    <section aria-label="Moss Keld Architectural Drawing Sheet" className="border border-line bg-card">
      {/* Top drawing metadata header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-ink/20 bg-paper/70 px-6 py-3.5 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        <span>SECTION A-A &amp; AXONOMETRIC GRID · AKOBO BUNGALOW</span>
        <span className="text-vermilion">
          CUT LEVEL {cut.datum} · SHEET A-10{selected?.seq ?? 3}
        </span>
      </div>

      {/* Main Drafting Plane: Cut-Plane Gauge + Elevation CAD + Red-Grid Plan */}
      <div className="grid divide-y divide-dashed divide-ink/20 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left: Vertical Cut-Plane Elevation Gauge */}
        <div className="flex flex-row items-center justify-between gap-4 bg-paper/45 px-5 py-4 lg:col-span-2 lg:flex-col lg:items-stretch lg:py-6">
          <p className="font-mono text-[9px] tracking-[0.16em] text-muted uppercase">Elevation Gauge</p>
          <div className="relative flex-1 py-4 lg:min-h-[200px]">
            <div className="hidden h-full flex-col justify-between font-mono text-[10px] text-muted lg:flex">
              <span>+6.40M RIDGE</span>
              <span>+3.00M LINTEL</span>
              <span>±0.00M DPC</span>
              <span>-1.20M FOOTING</span>
            </div>
            <div
              className="flex items-center gap-2 font-mono text-[10px] font-semibold text-vermilion lg:absolute lg:right-0 lg:left-0 lg:bg-vermilion lg:px-2 lg:py-1 lg:text-[#f5f4f0]"
              style={{ top: `${cut.yPct}%` }}
            >
              <span>CUT {cut.datum}</span>
            </div>
          </div>
          <p className="font-mono text-[9px] text-muted uppercase">1:100 DATUM</p>
        </div>

        {/* Center: Interactive 6-Stage Bungalow Cross-Section SVG */}
        <div className="p-6 md:p-8 lg:col-span-7">
          <svg
            viewBox="0 0 820 230"
            className="h-auto w-full select-none"
            role="img"
            aria-label="Interactive 6-stage Akobo bungalow architectural section"
          >
            <defs>
              <pattern id="mk-hatch" width="12" height="6" patternUnits="userSpaceOnUse">
                <path d="M 0 6 L 12 6 M 6 0 L 6 6" fill="none" stroke="#f04600" strokeWidth="0.6" strokeOpacity="0.45" />
              </pattern>
              <pattern id="mk-earth" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#111110" strokeWidth="0.7" strokeOpacity="0.24" />
              </pattern>
            </defs>

            {/* Datum hairlines */}
            <g stroke="#111110" strokeOpacity="0.16" strokeWidth="0.75" strokeDasharray="4 4">
              <line x1="20" y1="44" x2="800" y2="44" />
              <line x1="20" y1="102" x2="800" y2="102" />
              <line x1="20" y1="184" x2="800" y2="184" />
            </g>

            {/* Stage 01: Site clearing & profile boards */}
            <g onClick={() => pick(1)} className="cursor-pointer">
              <line x1="34" y1="184" x2="786" y2="184" stroke={s1.stroke} strokeWidth="1.6" />
              <rect x="34" y="184" width="752" height="16" fill="url(#mk-earth)" opacity={s1.opacity} />
              <line x1="68" y1="162" x2="68" y2="188" stroke={s1.stroke} strokeWidth="1.4" />
              <line x1="752" y1="162" x2="752" y2="188" stroke={s1.stroke} strokeWidth="1.4" />
              <text x="40" y="216" fill={s1.stroke} fontFamily="monospace" fontSize="9.5">
                01 SITE CLEAR
              </text>
            </g>

            {/* Stage 02: Foundation & DPC */}
            <g onClick={() => pick(2)} className="cursor-pointer">
              <rect x="132" y="168" width="556" height="16" fill={s2.fill} stroke={s2.stroke} strokeWidth="1.5" />
              <rect x="120" y="184" width="60" height="14" fill={s2.fill} stroke={s2.stroke} strokeWidth="1.2" />
              <rect x="640" y="184" width="60" height="14" fill={s2.fill} stroke={s2.stroke} strokeWidth="1.2" />
              <text x="144" y="179" fill={s2.stroke} fontFamily="monospace" fontSize="8.5">
                02 FOUNDATION &amp; DPC SLAB
              </text>
            </g>

            {/* Stage 03: Blockwork to lintel */}
            <g onClick={() => pick(3)} className="cursor-pointer">
              <rect x="140" y="102" width="540" height="66" fill={s3.fill} stroke={s3.stroke} strokeWidth="1.7" />
              {selected?.seq === 3 && <rect x="140" y="102" width="540" height="16" fill="url(#mk-hatch)" stroke="#f04600" strokeWidth="1" />}
              <rect x="184" y="124" width="84" height="28" fill="#f5f4f0" stroke={s3.stroke} strokeWidth="1.1" />
              <rect x="552" y="124" width="84" height="28" fill="#f5f4f0" stroke={s3.stroke} strokeWidth="1.1" />
              <text x="292" y="113" fill={s3.stroke} fontFamily="monospace" fontSize="9" fontWeight="600">
                03 BLOCKWORK TO LINTEL (+2.85M)
              </text>
            </g>

            {/* Stage 04: Roofing & Longspan */}
            <g onClick={() => pick(4)} className="cursor-pointer">
              <polygon
                points="108,102 410,32 712,102"
                fill={s4.fill}
                stroke={s4.stroke}
                strokeWidth="1.6"
              />
              <line x1="259" y1="67" x2="259" y2="102" stroke={s4.stroke} strokeOpacity="0.45" />
              <line x1="410" y1="32" x2="410" y2="102" stroke={s4.stroke} strokeOpacity="0.45" />
              <line x1="561" y1="67" x2="561" y2="102" stroke={s4.stroke} strokeOpacity="0.45" />
              <text x="360" y="24" fill={s4.stroke} fontFamily="monospace" fontSize="9.5">
                04 ROOFING &amp; TRUSSES
              </text>
            </g>

            {/* Stage 05: Plumbing & Electrical first fix */}
            <g onClick={() => pick(5)} className="cursor-pointer">
              <path
                d="M 308 168 L 308 134 L 460 134 L 460 156"
                fill="none"
                stroke={s5.stroke}
                strokeWidth="2.2"
                strokeDasharray="5 3"
              />
              <circle cx="308" cy="134" r="4" fill={s5.stroke} />
              <circle cx="460" cy="156" r="4" fill={s5.stroke} />
              <text x="322" y="148" fill={s5.stroke} fontFamily="monospace" fontSize="8.5">
                05 MEP CHASED CONDUITS
              </text>
            </g>

            {/* Stage 06: Finishes & Fixtures */}
            <g onClick={() => pick(6)} className="cursor-pointer">
              <rect x="488" y="122" width="44" height="46" fill={s6.fill} stroke={s6.stroke} strokeWidth="1.4" />
              <circle cx="524" cy="146" r="2.2" fill={s6.stroke} />
              <text x="484" y="216" fill={s6.stroke} fontFamily="monospace" fontSize="9.5">
                06 FINISHES &amp; HANDOVER
              </text>
            </g>
          </svg>
        </div>

        {/* Right: Red-Grid Floor Plan + Moss Keld Title Block */}
        <div className="flex flex-col justify-between bg-paper/45 p-6 lg:col-span-3">
          <div>
            <p className="mb-3 font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
              RED-GRID PLAN · 1:200
            </p>
            <svg viewBox="0 0 220 130" className="h-auto w-full border border-line bg-card p-2">
              {[40, 110, 180].map((x, idx) => (
                <g key={x}>
                  <line x1={x} y1="14" x2={x} y2="116" stroke="#f04600" strokeOpacity="0.4" strokeWidth="0.8" />
                  <text x={x - 3} y="11" fill="#f04600" fontFamily="monospace" fontSize="8">
                    {idx + 1}
                  </text>
                </g>
              ))}
              {[32, 72, 104].map((y, idx) => (
                <g key={y}>
                  <line x1="18" y1={y} x2="206" y2={y} stroke="#f04600" strokeOpacity="0.4" strokeWidth="0.8" />
                  <text x="6" y={y + 3} fill="#f04600" fontFamily="monospace" fontSize="8">
                    {["A", "B", "C"][idx]}
                  </text>
                </g>
              ))}
              <rect x="40" y="32" width="140" height="72" fill="none" stroke="#111110" strokeWidth="1.5" />
              <rect x="40" y="32" width="70" height="40" fill="rgba(240,70,0,0.08)" stroke="#111110" strokeWidth="1" />
              <rect x="110" y="32" width="70" height="40" fill="none" stroke="#111110" strokeWidth="1" />
            </svg>
          </div>

          <div className="mt-5 border border-ink/25 bg-card p-3 font-mono text-[9.5px] leading-snug uppercase">
            <div className="flex justify-between border-b border-dashed border-ink/20 pb-1.5">
              <span className="text-muted">PRACTICE</span>
              <span className="font-semibold text-ink">HOMEBOUND®</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-ink/20 py-1.5">
              <span className="text-muted">DRAWING</span>
              <span className="text-ink">STAGE 0{selected?.seq ?? 3} CUT</span>
            </div>
            <div className="flex justify-between pt-1.5">
              <span className="text-muted">SHEET</span>
              <span className="font-semibold text-vermilion">A-10{selected?.seq ?? 3}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive 6-Stage Index Strip */}
      <div className="grid grid-cols-2 divide-x divide-y divide-dashed divide-ink/20 border-t border-dashed border-ink/20 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {stages.map((s) => {
          const cs = s.nearStageIndex != null && chainStages ? chainStages[s.nearStageIndex] : null;
          const key = (cs?.status ?? (s.status === "paid" ? "db_paid" : "db_planned")) as keyof typeof STATUS_BADGE;
          const badge = STATUS_BADGE[key] ?? STATUS_BADGE.db_planned;
          const active = s.id === selectedId;
          const proofCount = evidence.filter((e) => e.stageId === s.id).length;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`flex cursor-pointer flex-col justify-between p-4 text-left transition ${
                active ? "bg-paper ring-1 ring-inset ring-vermilion" : "bg-card hover:bg-paper/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[10px] font-semibold ${active ? "text-vermilion" : "text-muted"}`}>
                  0{s.seq}
                </span>
                <span className={`rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-2 font-sans text-sm font-medium tracking-[-0.01em] text-ink line-clamp-2">
                {s.name}
              </p>
              <div className="mt-3 flex items-baseline justify-between font-mono text-[10px]">
                <span className="font-semibold text-ink">
                  {currency === "NGN"
                    ? formatNgn(s.laborTrancheNgn)
                    : `$${(s.laborTrancheUsdCents / 100).toLocaleString()} (${formatUsdc(usdcForCents(s.laborTrancheUsdCents, demoDivisor))})`}
                </span>
                {proofCount > 0 && <span className="text-leaf">{proofCount}p</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
