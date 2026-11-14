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
