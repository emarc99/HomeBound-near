"use client";

import Link from "next/link";
import type { ClientStage } from "@/lib/client-view";
import { CadFrame, HalftoneBungalowSvg, openWaitlistModal, SectionEyebrow } from "./CadPrimitives";

type StackStatus = "Paid" | "Proposed" | "Funded" | "Refunded" | "Planned";

type StackStage = {
  seq: string;
  code: string;
  name: string;
  spec: string;
  trancheUsd: string;
  trancheNgn: string;
  status: StackStatus;
  href: string;
};

const REMITTANCE_STACK: StackStage[] = [
  {
    seq: "01",
    code: "SITE CLEAR",
    name: "Site Clearing & Setting Out",
    spec: "Profile boards, string lines, perimeter pegs cleared to architectural datum.",
    trancheUsd: "$300 USDC",
    trancheNgn: "₦465,000",
    status: "Paid",
    href: "/verify",
  },
  {
    seq: "02",
    code: "FOUNDATION",
    name: "Foundation & DPC Slab",
    spec: "Strip footing trenches, foundation blockwork, reinforcement mesh & damp-proof slab.",
    trancheUsd: "$1,200 USDC",
    trancheNgn: "₦1,860,000",
    status: "Paid",
    href: "/verify",
  },
  {
    seq: "03",
    code: "ACTIVE · BLOCKWORK",
    name: "Blockwork to Lintel",
    spec: "9-inch outer & 6-inch partition walls raised, window voids formed, lintel beam reinforced.",
    trancheUsd: "$1,500 USDC",
    trancheNgn: "₦2,325,000",
    status: "Funded",
    href: "/site",
  },
  {
    seq: "04",
    code: "ROOF TRUSSES",
    name: "Roofing & Longspan Sheets",
    spec: "Seasoned hardwood trusses on wall plates, longspan aluminium roofing & fascia boards.",
    trancheUsd: "$1,100 USDC",
    trancheNgn: "₦1,705,000",
    status: "Planned",
    href: "/build",
  },
  {
    seq: "05",
    code: "MEP FIRST FIX",
    name: "Plumbing & Electrical First Fix",
    spec: "Conduits & knockout boxes chased into blockwork; pressure-tested soil & cold water lines.",
    trancheUsd: "$900 USDC",
    trancheNgn: "₦1,395,000",
    status: "Planned",
    href: "/build",
  },
  {
    seq: "06",
    code: "HANDOVER",
    name: "Finishes & Fittings",
    spec: "Interior plastering, porcelain floor tiling, sanitary ware installation & exterior security doors.",
    trancheUsd: "$2,000 USDC",
    trancheNgn: "₦3,100,000",
    status: "Planned",
    href: "/build",
  },
];

function badgeTone(status: StackStatus) {
  if (status === "Paid") return "border-leaf/35 bg-mint text-leaf";
  if (status === "Proposed") return "border-vermilion/40 bg-vermilion/12 text-vermilion";
  if (status === "Funded") return "border-amber/35 bg-amber/15 text-amber";
  if (status === "Refunded") return "border-crimson/35 bg-crimson/10 text-crimson";
  return "border-line bg-paper text-muted";
}

function liveStackStatus(live?: ClientStage): StackStatus | null {
  if (!live) return null;
  if (live.nearStatus === "refunded") return "Refunded";
  if (live.nearStatus === "released" || live.status === "paid") return "Paid";
  if (live.nearStatus === "proposed") return "Proposed";
  if (live.nearStatus === "funded" || live.fundedUsdCents > 0) return "Funded";
  return "Planned";
}

export function HeroAndStack({
  escrowAccount,
  network,
  stages,
}: {
  escrowAccount: string;
  network: string;
  stages?: ClientStage[];
}) {
  const bySeq = new Map((stages ?? []).map((s) => [s.seq, s]));
  const totalUsd = stages?.length
    ? `$${Math.round(stages.reduce((a, s) => a + s.laborTrancheUsdCents, 0) / 100).toLocaleString()}`
    : "$7,000";
  const stageCount = stages?.length || 6;

  const cards = REMITTANCE_STACK.map((s) => {
    const live = bySeq.get(Number(s.seq));
    const status = liveStackStatus(live) ?? s.status;
    return {
      ...s,
      name: live?.name ?? s.name,
      trancheUsd: live ? `$${Math.round(live.laborTrancheUsdCents / 100).toLocaleString()} USDC` : s.trancheUsd,
      trancheNgn: live ? `₦${live.laborTrancheNgn.toLocaleString()}` : s.trancheNgn,
      status,
    };
  });
  return (
    <>
      {/* SECTION 01: HERO */}
      <section className="mx-auto max-w-[1340px] px-6 pt-16 pb-24 md:px-10 md:pt-24 md:pb-32">
        <CadFrame className="bg-card/55 p-8 md:p-14">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-5">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              AUTONOMOUS SETTLEMENT FOR PHYSICAL INFRASTRUCTURE
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-leaf uppercase">
              <span className="size-2 rounded-full bg-leaf" />
              LIVE ON NEAR {network.toUpperCase()} · {escrowAccount}
            </span>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-6">
              <h1 className="font-sans text-5xl font-medium tracking-[-0.055em] text-ink sm:text-6xl lg:text-[72px] lg:leading-[0.98]">
                Intelligence, built to{" "}
                <span className="inline-block rounded-[4px] bg-vermilion px-3 py-0.5 text-[#f5f4f0]">
                  settle
                </span>
                .
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
                Homebound gives remote builders and local contractors the rails to fund, grade, and release stablecoin
                construction tranches through attested AI; without losing visibility or control.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={openWaitlistModal}
                  className="btn cursor-pointer px-6 py-3.5 text-[11px]"
                >
                  Join Waitlist · Secure Access
                </button>
                <Link href="/build" className="btn-ghost px-6 py-3.5 text-[11px]">
                  Open Live Escrow · Explore
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="border border-dashed border-ink/25 bg-paper p-5 md:p-6">
                <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                  <span>ELEVATION · AKOBO BUNGALOW</span>
                  <span>SHEET A-101 · SCALE 1:100</span>
                </div>
                <HalftoneBungalowSvg />
              </div>
            </div>
          </div>

          {/* ARCA Architectural Dimension Ruler */}
          <div className="mt-12 border-t border-dashed border-ink/20 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              <span>|← 150 000 MM GEOFENCE RADIUS</span>
              <span className="hidden text-ink sm:inline">
                {stageCount} STAGES · {totalUsd} ESCROW · 1 YOCTONEAR RELEASE AUTHORITY
              </span>
              <span>IBADAN, OYO →|</span>
            </div>
          </div>
        </CadFrame>
      </section>

      {/* SECTION 02: REMITTANCE STACK CARDS (6 STAGES) */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <SectionEyebrow
            tag="02 / STAGE-LOCKED REMITTANCE"
            title="Built around real stages."
            subtitle="Instead of wiring lump-sum cash abroad on trust, every construction draw sits isolated in Circle USDC on NEAR until physical masonry satisfies the stage specification."
          />
          <Link href="/build" className="btn-ghost">
            Inspect Full Drawing Sheet →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((s) => (
            <Link key={s.seq} href={s.href} className="group block">
              <CadFrame className="flex h-full flex-col justify-between bg-card p-8 transition group-hover:border-ink">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                      {s.seq} · {s.code}
                    </span>
                    <span
                      className={`rounded-[2px] border px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase ${badgeTone(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="font-sans text-2xl font-medium tracking-[-0.03em] text-ink transition group-hover:text-vermilion">
                      {s.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{s.spec}</p>
                  </div>
                </div>

                <div className="mt-8 flex items-baseline justify-between border-t border-dashed border-ink/20 pt-5">
                  <div>
                    <p className="font-mono text-lg font-medium text-ink">{s.trancheUsd}</p>
                    <p className="font-mono text-[11px] text-muted">{s.trancheNgn} est.</p>
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase transition group-hover:text-ink">
                    Open →
                  </span>
                </div>
              </CadFrame>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
