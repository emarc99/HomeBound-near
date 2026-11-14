import type { ReactNode } from "react";

export function CadFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative border border-dashed border-ink/25 ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[7px] -left-[4px] font-mono text-[11px] leading-none text-muted select-none"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[7px] -right-[4px] font-mono text-[11px] leading-none text-muted select-none"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[7px] -left-[4px] font-mono text-[11px] leading-none text-muted select-none"
      >
        +
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[4px] -bottom-[7px] font-mono text-[11px] leading-none text-muted select-none"
      >
        +
      </span>
      {children}
    </div>
  );
}

export function SectionEyebrow({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-vermilion uppercase">
        + {tag}
      </p>
      <h2 className="font-sans text-4xl font-medium tracking-[-0.04em] text-ink md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function openWaitlistModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("homebound:open-waitlist"));
  }
}

export function HalftoneBungalowSvg() {
  return (
    <svg
      viewBox="0 0 680 420"
      className="h-auto w-full select-none"
      role="img"
      aria-label="Halftone elevation wireframe of the 3-bedroom bungalow in Akobo, Ibadan"
    >
      <defs>
        <pattern id="hb-dots-dense" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="1.15" fill="#111110" fillOpacity="0.28" />
        </pattern>
        <pattern id="hb-dots-light" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#111110" fillOpacity="0.14" />
        </pattern>
      </defs>

      {/* Architectural datum lines */}
      <line x1="20" y1="340" x2="660" y2="340" stroke="#111110" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="60" y1="60" x2="60" y2="365" stroke="#111110" strokeOpacity="0.15" strokeDasharray="3 4" />
      <line x1="620" y1="60" x2="620" y2="365" stroke="#111110" strokeOpacity="0.15" strokeDasharray="3 4" />

      {/* Gable Roof volume with halftone fill */}
      <polygon
        points="85,175 340,70 595,175 565,186 340,94 115,186"
        fill="url(#hb-dots-dense)"
        stroke="#111110"
        strokeWidth="1.25"
      />
      <polygon
        points="115,186 340,94 565,186"
        fill="url(#hb-dots-light)"
        stroke="#111110"
        strokeWidth="1"
      />

      {/* Blockwork walls up to lintel level */}
      <rect x="115" y="186" width="450" height="154" fill="#f5f4f0" fillOpacity="0.72" stroke="#111110" strokeWidth="1.25" />

      {/* Lintel beam band highlighted in subtle vermilion wash */}
      <rect x="115" y="186" width="450" height="22" fill="#f04600" fillOpacity="0.12" stroke="#f04600" strokeWidth="1" strokeDasharray="4 3" />
      <text x="128" y="201" fill="#f04600" fontFamily="monospace" fontSize="9.5" letterSpacing="1.4">
        STAGE 03 CUT · LINTEL BEAM REINFORCEMENT +2.85M
      </text>

      {/* Left Wing Window Bay */}
      <rect x="150" y="226" width="96" height="62" fill="url(#hb-dots-light)" stroke="#111110" strokeWidth="1" />
      <line x1="198" y1="226" x2="198" y2="288" stroke="#111110" strokeOpacity="0.6" strokeWidth="0.9" />

      {/* Entrance Porch & Door */}
      <rect x="292" y="224" width="96" height="116" fill="url(#hb-dots-dense)" stroke="#111110" strokeWidth="1.15" />
      <rect x="314" y="236" width="52" height="104" fill="#edece8" stroke="#111110" strokeWidth="1" />
      <circle cx="356" cy="290" r="2.2" fill="#f04600" />

      {/* Right Wing Casement Bay */}
      <rect x="434" y="226" width="96" height="62" fill="url(#hb-dots-light)" stroke="#111110" strokeWidth="1" />
      <line x1="482" y1="226" x2="482" y2="288" stroke="#111110" strokeOpacity="0.6" strokeWidth="0.9" />

      {/* Foundation DPC Plinth */}
      <rect x="100" y="324" width="480" height="16" fill="url(#hb-dots-dense)" stroke="#111110" strokeWidth="1" />

      {/* Elevation markers */}
      <text x="26" y="182" fill="#6b6a64" fontFamily="monospace" fontSize="9">
        +3.20M
      </text>
      <text x="26" y="326" fill="#6b6a64" fontFamily="monospace" fontSize="9">
        ±0.00M DPC
      </text>
      <text x="582" y="128" fill="#111110" fontFamily="monospace" fontSize="9.5" letterSpacing="1">
        7.437°N
      </text>
      <text x="582" y="143" fill="#6b6a64" fontFamily="monospace" fontSize="9.5" letterSpacing="1">
        3.947°E
      </text>
    </svg>
  );
}
