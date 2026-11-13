"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

function useTypewriter(text: string, speed = 26, startDelay = 450) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i += 1;
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function ScrollReveal({
  children,
  from = "bottom",
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  from?: "left" | "right" | "bottom";
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hiddenTransform =
    from === "left"
      ? "translateX(-40px)"
      : from === "right"
        ? "translateX(40px)"
        : "translateY(26px)";

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0, 0, 0)" : hiddenTransform,
        transition: `opacity 680ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delayMs}ms, transform 680ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delayMs}ms`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

type LandingStage = {
  seq: number;
  short: string;
  name: string;
  usdc: string;
  ngn: string;
  days: number;
  status: "DONE" | "ACTIVE" | "PLANNED";
  criteria: string;
};

const LANDING_STAGES: LandingStage[] = [
  {
    seq: 1,
    short: "01 Site",
    name: "Site clearing & setting out",
    usdc: "0.30 USDC",
    ngn: "₦465,000",
    days: 7,
    status: "DONE",
    criteria: "Site cleared of vegetation; profile boards and string lines visible marking the building footprint.",
  },
  {
    seq: 2,
    short: "02 Foundation",
    name: "Foundation & DPC",
    usdc: "1.20 USDC",
    ngn: "₦1,860,000",
    days: 28,
    status: "DONE",
    criteria:
      "Trenches excavated and concreted; foundation blockwork raised to DPC level; reinforcement mesh visible before DPC slab.",
  },
  {
    seq: 3,
    short: "03 Blockwork",
    name: "Blockwork to lintel",
    usdc: "1.50 USDC",
    ngn: "₦2,325,000",
    days: 35,
    status: "ACTIVE",
    criteria:
      "Walls raised to lintel height on all elevations; door and window openings formed; lintel reinforcement and formwork cast.",
  },
  {
    seq: 4,
    short: "04 Roofing",
    name: "Roofing",
    usdc: "1.10 USDC",
    ngn: "₦1,705,000",
    days: 21,
    status: "PLANNED",
    criteria: "Roof trusses fixed on wall plates; longspan sheets covering the full roof; fascia boards installed.",
  },
  {
    seq: 5,
    short: "05 Plumbing",
    name: "Plumbing & electrical first fix",
    usdc: "0.90 USDC",
    ngn: "₦1,395,000",
    days: 21,
    status: "PLANNED",
    criteria: "Electrical conduits and back boxes chased into walls; soil and water pipes laid and visible before plastering.",
  },
  {
    seq: 6,
    short: "06 Finishes",
    name: "Finishes",
    usdc: "2.00 USDC",
    ngn: "₦3,100,000",
    days: 42,
    status: "PLANNED",
    criteria:
      "Walls plastered and painted; floor tiles laid; WC, basin and shower fittings installed; exterior steel door hung.",
  },
];

type ArchNode = "owner" | "usdc" | "foreman" | "geofence" | "tee" | "agent" | "escrow" | "contractor";

type Scene = {
  id: string;
  tab: string;
  label: string;
  command: string;
  results: { text: string; tone: "emerald" | "brass" | "sky" | "slate" }[];
  activeNodes: ArchNode[];
};

const SCENES: Scene[] = [
  {
    id: "fund",
    tab: "01 · Fund Stage",
    label: "Circle USDC NEP-141 Escrow",
    command:
      'near call usdc.testnet ft_transfer_call \'{"receiver_id":"escrow.homebound-hq.testnet","amount":"1500000"}\'',
    results: [
      { text: "Locked 1.50 USDC (₦2,325,000 tranche) into Stage 03", tone: "emerald" },
      { text: "Payee bound on-chain: chidi.homebound-hq.testnet", tone: "sky" },
      { text: "Seal 01 engaged · SHA-256 audit event #14 anchored", tone: "brass" },
    ],
    activeNodes: ["owner", "usdc", "escrow"],
  },
  {
    id: "tee",
    tab: "02 · 5-Gate TEE",
    label: "NEAR AI Cloud Confidential Enclave",
    command: "homebound inspect --stage 03 --photo public/samples/lintel-pass.jpg",
    results: [
      { text: "GPS 7.4371°N, 3.9471°E (15m <= 150m Akobo geofence) · PASS", tone: "emerald" },
      { text: "Qwen/Qwen3.8-27B inside Intel TDX + H200 → PASS (92%)", tone: "emerald" },
      { text: "Signed Ed25519 over model:request_hash:response_hash", tone: "brass" },
    ],
    activeNodes: ["foreman", "geofence", "tee"],
  },
  {
    id: "propose",
    tab: "03 · Scoped Proposal",
    label: "On-Chain Ed25519 + Function-Call Key",
    command:
      'near call escrow.homebound-hq.testnet submit_verdict \'{"stage":0,"verdict":"pass","sig":"ed25519:8f3a..c91b"}\'',
    results: [
      { text: "env::ed25519_verify matched enclave key in get_signer()", tone: "emerald" },
      { text: "agent.homebound-hq.testnet proposed release (no transfer permission)", tone: "sky" },
      { text: "Seal 02 cleared · Stage moved Funded → Proposed Release", tone: "brass" },
    ],
    activeNodes: ["tee", "agent", "escrow"],
  },
  {
    id: "release",
    tab: "04 · 1 yoctoNEAR Payout",
    label: "Red-Team Verified Final Settlement",
    command:
      'npm run attack && near call escrow.homebound-hq.testnet approve_release \'{"stage":0}\' --depositYocto 1',
    results: [
      { text: "7/7 red-team attacks blocked (Lagos 121.6km spoof, forged sig, replay)", tone: "emerald" },
      { text: "Owner 1 yoctoNEAR signed → 1.50 USDC paid to contractor", tone: "brass" },
      { text: "All 3 Seals verified · Explorer TX receipt confirmed", tone: "sky" },
    ],
    activeNodes: ["owner", "escrow", "contractor"],
  },
];

const TONE_CLS: Record<Scene["results"][number]["tone"], string> = {
  emerald: "text-radar",
  brass: "text-[#f2b35c]",
  sky: "text-sky-300",
  slate: "text-[#9db0c7]",
};

const FEATURES = [
  {
    title: "Plot-Geofenced Photo & EXIF Verification",
    description:
      "Checks Haversine distance against the 150m Akobo site fence, EXIF capture timestamp within the stage window, and SHA-256 hash uniqueness.",
    tags: ["150m Geofence", "EXIF Window", "SHA-256"],
    badge: "GATE 01–03",
    tone: "emerald" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5 text-leaf">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.2" />
      </svg>
    ),
  },
  {
    title: "Hardware-Attested NEAR AI Cloud TEE",
    description:
      "Qwen/Qwen3.8-27B evaluates construction criteria inside Intel TDX + H200 and signs verdicts verified on-chain via env::ed25519_verify.",
    tags: ["Qwen3.8-27B", "Intel TDX", "ed25519_verify"],
    badge: "GATE 04–05",
    tone: "brass" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5 text-pepper">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Scoped Function-Call Key Agent Boundary",
    description:
      "The agent key is restricted strictly to submit_verdict, propose_release, and ledger anchors — never USDC transfers or withdrawals.",
    tags: ["submit_verdict", "propose_release", "Zero Withdraw"],
    badge: "KEY SECURITY",
    tone: "sky" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5 text-sky-700">
        <circle cx="8" cy="15" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.2 12.2L20 3.5M17 6.5l2.5 2.5" />
      </svg>
    ),
  },
  {
    title: "Owner 1 yoctoNEAR Release & Audit Chain",
    description:
      "Passing checks only unlock Proposed status. Payout moves solely on the owner's 1 yoctoNEAR wallet signature with full SHA-256 ledger logs.",
    tags: ["1 yoctoNEAR", "refund_stage", "SHA-256 Ledger"],
    badge: "THREE-SEAL VAULT",
    tone: "emerald" as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5 text-leaf">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" />
      </svg>
    ),
  },
];

export function LandingInteractive({
  escrowAccount,
  agentAccount,
  network,
}: {
  escrowAccount: string;
  agentAccount: string;
  network: string;
}) {
  const { displayed, done } = useTypewriter(
    "Lock Circle USDC per stage. Verify site photos in a NEAR AI TEE. Release with 1 yoctoNEAR.",
    26,
    450,
  );

  // Subtle hero scroll parallax (matching HackMoney2026)
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      setScrollY(Math.min(window.scrollY, 520));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroParallaxY = Math.round(scrollY * 0.14);
  const heroOpacity = Math.max(0.2, 1 - scrollY / 680);

  // Interactive 6-stage bungalow explorer state (default Stage 03)
  const [selectedSeq, setSelectedSeq] = useState(3);
  const activeStage = LANDING_STAGES.find((s) => s.seq === selectedSeq) ?? LANDING_STAGES[2];

  // Synced 4-scene terminal + architecture flow state
  const [sceneIdx, setSceneIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [visibleResults, setVisibleResults] = useState(0);
  const [phase, setPhase] = useState<"typing" | "results" | "pause">("typing");

  const scene = SCENES[sceneIdx];

  const selectScene = (idx: number) => {
    setSceneIdx(idx);
    setTypedChars(0);
    setVisibleResults(0);
    setPhase("typing");
  };

  useEffect(() => {
    if (phase === "typing") {
      if (typedChars < scene.command.length) {
        const t = setTimeout(() => setTypedChars((c) => c + 1), 22);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("results"), 240);
      return () => clearTimeout(t);
    }

    if (phase === "results") {
      if (visibleResults < scene.results.length) {
        const t = setTimeout(() => setVisibleResults((v) => v + 1), 320);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pause"), 2200);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setSceneIdx((i) => (i + 1) % SCENES.length);
      setTypedChars(0);
      setVisibleResults(0);
      setPhase("typing");
    }, 350);
    return () => clearTimeout(t);
  }, [phase, typedChars, visibleResults, scene]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6">
      {/* HERO: Preserved first-view layout + Stage 03 card, with typewriter & scroll parallax */}
      <section
        style={{
          transform: `translate3d(0, ${heroParallaxY}px, 0)`,
          opacity: heroOpacity,
        }}
        className="grid items-center gap-10 py-10 transition-opacity duration-150 md:grid-cols-[1.15fr_1fr] md:py-16"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-ink uppercase">
            <span className="size-2 animate-pulse rounded-full bg-radar" />
            PLOT IB-04 // AKOBO, IBADAN · 7.4370° N, 3.9470° E
          </div>

          <h1 className="mt-5 text-5xl leading-[0.95] font-black tracking-tight text-balance sm:text-6xl">
            Every structural milestone earns its <span className="text-pepper">release.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Homebound pairs architectural milestone escrow in Circle USDC on NEAR with hardware-attested vision
            verification and live plot geofence telemetry for diaspora builders.
          </p>

          {/* Typing subtitle */}
          <div className="mt-3 min-h-[28px] font-mono text-xs text-ink/80 sm:text-sm">
            <span className="text-pepper">$ </span>
            <span>{displayed}</span>
            <span
              className={`ml-0.5 inline-block h-[14px] w-[7px] translate-y-0.5 bg-pepper ${
                done ? "animate-pulse" : ""
              }`}
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/build" className="group btn-pop px-6 py-3.5 text-xs">
              Open Escrow Cockpit
              <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link href="/site" className="btn-ghost px-6 py-3.5 text-xs">
              Open Foreman Studio
            </Link>
            <Link href="/verify" className="btn-ghost px-5 py-3.5 text-xs">
              TEE &amp; Ledger
            </Link>
          </div>
        </div>

        <BlueprintPreviewCard escrowAccount={escrowAccount} />
      </section>

      {/* 4-STAT COUNTER BAR */}
      <ScrollReveal className="grid grid-cols-2 gap-4 border-y border-line py-7 sm:grid-cols-4">
        {[
          { value: "3 Seals", label: "Required before payout" },
          { value: "150m", label: "Akobo GPS geofence lock" },
          { value: "Ed25519", label: "On-chain TEE verification" },
          { value: "7 / 7", label: "Red-team attacks blocked" },
        ].map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <div className="font-mono text-2xl font-black tracking-tight text-ink sm:text-3xl">{stat.value}</div>
            <div className="mt-1 font-mono text-[11px] tracking-wider text-muted uppercase">{stat.label}</div>
          </div>
        ))}
      </ScrollReveal>

      {/* PROBLEM VS SOLUTION */}
      <section className="py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <ScrollReveal from="left" className="card flex flex-col justify-between border-l-4 border-l-red-500/80">
            <div>
              <span className="inline-flex items-center gap-2 rounded border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-red-700 uppercase">
                The Problem
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                Blind WhatsApp Remittance <br />
                Has Zero Recourse
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Diaspora homeowners wire lump sums based on unverified WhatsApp photos, recycled site shots, or off-site
                builds. Once cash clears, there is no programmatic proof check.
              </p>
            </div>
            <p className="mt-4 font-mono text-xs text-red-700">
              Unverified lump sums · Spoofed locations · Zero custody guardrails
            </p>
          </ScrollReveal>

          <ScrollReveal
            from="right"
            delayMs={80}
            className="card-blueprint flex flex-col justify-between border-l-4 border-l-radar"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded border border-radar/30 bg-radar/15 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-mint uppercase">
                The Solution
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-[#f4f0e8] sm:text-3xl">
                Three-Seal NEAR Escrow <br />
                Before Every Naira Moves
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b7c5d6]">
                Homebound escrows Circle USDC per architectural stage on NEAR. Site photos pass EXIF freshness, 150m
                Haversine geofencing, and an Intel TDX vision verdict before your wallet unlocks funds.
              </p>
            </div>
            <p className="mt-4 font-mono text-xs text-mint">
              Escrow USDC · TEE-Signed Ed25519 · 1 yoctoNEAR Finality
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* INTERACTIVE 6-STAGE BUNGALOW CROSS-SECTION EXPLORER */}
      <section className="border-t border-line py-16">
        <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-pepper">INTERACTIVE ARCHITECTURAL SCHEDULE</p>
            <h2 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">
              Explore the 6-Stage Bungalow Blueprint
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Click any structural layer on the Akobo elevation below to inspect its USDC tranche, timeline, and TEE
              acceptance criteria.
            </p>
          </div>
          <span className="rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-xs text-muted">
            ELEVATION A-A // 7.00 USDC DEMO POOL
          </span>
        </ScrollReveal>

        <ScrollReveal delayMs={60} className="mt-6 space-y-4">
          <LandingElevationExplorer selectedSeq={selectedSeq} onSelect={setSelectedSeq} activeStage={activeStage} />
        </ScrollReveal>
      </section>

      {/* HOW HOMEBOUND PROTECTS EVERY DRAWDOWN: COMPACT 2x2 GRID (2 CARDS IN 2 ROWS) */}
      <section className="border-t border-line py-16">
        <ScrollReveal className="text-center">
          <p className="label text-pepper">DETERMINISTIC + ENCLAVE PIPELINE</p>
          <h2 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">
            How Homebound Protects Every Drawdown
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Four enforcement layers split duties across your wallet, the geofenced camera, and NEAR.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, idx) => {
            const fromLeft = idx % 2 === 0;
            const badgeCls =
              f.tone === "emerald"
                ? "border-leaf/30 bg-mint text-leaf"
                : f.tone === "brass"
                  ? "border-pepper/40 bg-pepper/15 text-ink"
                  : "border-sky-300 bg-sky-50 text-sky-900";
            return (
              <ScrollReveal key={f.title} from={fromLeft ? "left" : "right"} delayMs={Math.floor(idx / 2) * 80}>
                <div className="card flex h-full flex-col justify-between p-5 transition hover:border-ink">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-paper">
                        {f.icon}
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${badgeCls}`}
                      >
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="mt-3.5 text-lg font-bold tracking-tight text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">{f.description}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.tags.map((tag) => (
                      <code
                        key={tag}
                        className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[10px] text-ink"
                      >
                        {tag}
                      </code>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* SEE IT WORK: SYNCED ANIMATED TERMINAL + ARCHITECTURE FLOW */}
      <section className="border-t border-line py-16">
        <ScrollReveal className="text-center">
          <p className="label text-pepper">LIVE EXECUTION TRACE</p>
          <h2 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">See It Work</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Real escrow calls. Confidential TEE signatures. Deterministic settlement.
          </p>
        </ScrollReveal>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {SCENES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScene(idx)}
              className={`cursor-pointer rounded-lg border px-3.5 py-2 font-mono text-xs transition ${
                sceneIdx === idx
                  ? "border-pepper bg-blueprint font-bold text-[#f4f0e8] shadow-sm"
                  : "border-line bg-card text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {s.tab}
            </button>
          ))}
        </div>

        <ScrollReveal delayMs={60} className="mt-7 grid items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Animated Terminal */}
          <div className="overflow-hidden rounded-xl border border-blueprint-line bg-[#09111c] shadow-lg">
            <div className="flex items-center justify-between border-b border-blueprint-line bg-blueprint px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-400/80" />
                <span className="size-2.5 rounded-full bg-pepper/90" />
                <span className="size-2.5 rounded-full bg-radar/85" />
                <span className="ml-2 font-mono text-[11px] text-[#8ea1b8]">homebound-cli // {network}</span>
              </div>
              <span className="font-mono text-[10px] text-pepper uppercase">{scene.tab}</span>
            </div>

            <div className="min-h-[235px] p-5 font-mono text-xs leading-relaxed sm:text-[13px]">
              <div className="break-all text-[#f4f0e8]">
                <span className="text-pepper">&gt; </span>
                <span>{scene.command.slice(0, typedChars)}</span>
                {phase === "typing" && (
                  <span className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-0.5 animate-pulse bg-pepper" />
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {scene.results.slice(0, visibleResults).map((r, i) => (
                  <div key={`${scene.id}-${i}`} className="flex items-start gap-2 transition-all duration-300">
                    <span className="mt-0.5 text-radar">✓</span>
                    <span className={TONE_CLS[r.tone]}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ArchitectureFlow scene={scene} escrowAccount={escrowAccount} agentAccount={agentAccount} />
        </ScrollReveal>
      </section>

      {/* THE TRUST ECONOMICS */}
      <section className="py-10">
        <ScrollReveal>
          <div className="card-blueprint p-7 md:p-10">
            <div className="text-center">
              <p className="font-mono text-[11px] tracking-[0.16em] text-pepper uppercase">SECURITY &amp; TRUST ECONOMICS</p>
              <h2 className="mt-1.5 text-3xl font-black tracking-tight text-[#f4f0e8]">Zero Single-Key Custody</h2>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-red-400/25 bg-red-950/20 p-5 text-center">
                <p className="font-mono text-[11px] font-semibold tracking-wider text-red-300 uppercase">
                  Traditional Remittance + WhatsApp
                </p>
                <div className="mt-2 font-mono text-4xl font-black text-red-200">0 Locks</div>
                <p className="mt-1.5 text-xs text-[#a7b7ca]">
                  Lump sums move unverified; recycled or off-site photos go uncaught
                </p>
              </div>

              <div className="rounded-xl border border-radar/35 bg-radar/10 p-5 text-center">
                <p className="font-mono text-[11px] font-semibold tracking-wider text-mint uppercase">
                  With Homebound on NEAR
                </p>
                <div className="mt-2 font-mono text-4xl font-black text-pepper">3 Seals</div>
                <p className="mt-1.5 text-xs text-[#d2dce8]">
                  Circle USDC escrow + 150m TEE Ed25519 quote + 1 yoctoNEAR owner signature
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* BUILT WITH + CTA */}
      <section className="py-14 text-center">
        <ScrollReveal>
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Built With</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left">
              <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 19V5l14 14V5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="font-mono text-xs font-bold text-ink">NEAR Protocol</p>
                <p className="text-[11px] text-muted">Smart Contract + 1 yoctoNEAR</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left">
              <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-pepper" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div>
                <p className="font-mono text-xs font-bold text-ink">NEAR AI Cloud</p>
                <p className="text-[11px] text-muted">Intel TDX + NVIDIA H200 TEE</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left">
              <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10M9.5 9.5a2.5 2.5 0 015 0c0 2-5 2-5 4a2.5 2.5 0 005 0" strokeLinecap="round" />
              </svg>
              <div>
                <p className="font-mono text-xs font-bold text-ink">Circle USDC</p>
                <p className="text-[11px] text-muted">Stage-Locked NEP-141 Escrow</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left">
              <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-radar" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="8" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              <div>
                <p className="font-mono text-xs font-bold text-ink">Plot Geofencing</p>
                <p className="text-[11px] text-muted">150m EXIF + SHA-256 Telemetry</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/build" className="btn-pop px-7 py-3.5 text-xs">
              Launch Escrow Cockpit (/build) →
            </Link>
            <Link href="/site" className="btn-ghost px-6 py-3.5 text-xs">
              Test Foreman Camera (/site)
            </Link>
            <Link href="/verify" className="btn-ghost px-6 py-3.5 text-xs">
              Verify TEE &amp; Ledger (/verify)
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-line py-7 font-mono text-xs text-muted">
        <span>HOMEBOUND // NEAR {network.toUpperCase()}</span>
        <div className="flex gap-5">
          <Link href="/build" className="hover:text-ink">
            Escrow Cockpit
          </Link>
          <Link href="/site" className="hover:text-ink">
            Foreman Studio
          </Link>
          <Link href="/verify" className="hover:text-ink">
            TEE Ledger
          </Link>
          <a href="https://github.com/emarc99/HomeBound-near" target="_blank" rel="noreferrer" className="hover:text-ink">
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}

function LandingElevationExplorer({
  selectedSeq,
  onSelect,
  activeStage,
}: {
  selectedSeq: number;
  onSelect: (seq: number) => void;
  activeStage: LandingStage;
}) {
  const styleFor = (seq: number) => {
    const active = seq === selectedSeq;
    const done = seq <= 2;
    if (active) return { stroke: "#d4882a", fill: "rgba(212, 136, 42, 0.16)", opacity: 1, active: true };
    if (done) return { stroke: "#0f1d2d", fill: "rgba(13, 138, 90, 0.08)", opacity: 0.85, active: false };
    return { stroke: "#0f1d2d", fill: "transparent", opacity: 0.6, active: false };
  };

  const s1 = styleFor(1);
  const s2 = styleFor(2);
  const s3 = styleFor(3);
  const s4 = styleFor(4);
  const s5 = styleFor(5);
  const s6 = styleFor(6);

  return (
    <div className="card space-y-5 p-5 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 960 206"
          className="mx-auto block h-auto w-full min-w-[620px]"
          role="img"
          aria-label="Interactive 6-stage bungalow cross-section explorer"
        >
          <defs>
            <pattern id="landingBlockHatch" width="16" height="8" patternUnits="userSpaceOnUse">
              <path d="M 0 8 L 16 8 M 8 0 L 8 8" fill="none" stroke="#d4882a" strokeWidth="0.65" opacity="0.55" />
            </pattern>
            <pattern id="landingEarthHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#0f1d2d" strokeWidth="0.7" opacity="0.35" />
            </pattern>
          </defs>

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

          <g
            onClick={() => onSelect(1)}
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

          <g
            onClick={() => onSelect(2)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s2.opacity}
            stroke={s2.stroke}
            strokeWidth={s2.active ? 2 : 1.25}
          >
            <rect x="200" y="164" width="560" height="8" fill={s2.fill === "transparent" ? "url(#landingEarthHatch)" : s2.fill} />
            {[212, 344, 480, 616, 742].map((cx) => (
              <g key={cx}>
                <rect x={cx - 8} y="164" width="16" height="22" fill={s2.fill} />
                <rect x={cx - 16} y="186" width="32" height="9" fill={s2.fill} />
              </g>
            ))}
          </g>

          <g
            onClick={() => onSelect(3)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s3.opacity}
            stroke={s3.stroke}
            strokeWidth={s3.active ? 2.1 : 1.25}
          >
            <rect x="206" y="88" width="142" height="76" fill={s3.fill} />
            <rect x="348" y="88" width="256" height="76" fill={s3.active ? "url(#landingBlockHatch)" : s3.fill} />
            <rect x="604" y="88" width="146" height="76" fill={s3.fill} />
            <rect x="198" y="84" width="558" height="8" fill={s3.active ? "rgba(212, 136, 42, 0.32)" : s3.fill} />
            {[206, 348, 480, 604, 742].map((x) => (
              <rect key={x} x={x} y="88" width="8" height="76" fill={s3.active ? "rgba(212, 136, 42, 0.28)" : s3.fill} />
            ))}
          </g>

          <g
            onClick={() => onSelect(4)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s4.opacity}
            stroke={s4.stroke}
            strokeWidth={s4.active ? 2.1 : 1.25}
            fill={s4.fill}
          >
            <polygon points="184,84 252,32 710,32 778,84" />
            <polygon points="344,84 476,22 610,84" />
            <line x1="252" y1="32" x2="252" y2="84" />
            <line x1="476" y1="22" x2="476" y2="84" />
            <line x1="410" y1="53" x2="410" y2="84" />
            <line x1="542" y1="53" x2="542" y2="84" />
            {[275, 298, 321, 634, 657, 680, 703].map((rx) => (
              <line key={rx} x1={rx} y1="32" x2={rx} y2="84" strokeWidth="0.9" />
            ))}
          </g>

          <g
            onClick={() => onSelect(5)}
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

          <g
            onClick={() => onSelect(6)}
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity={s6.opacity}
            stroke={s6.stroke}
            strokeWidth={s6.active ? 2 : 1.2}
            fill={s6.fill === "transparent" ? "#f4f0e8" : s6.fill}
          >
            <rect x="234" y="108" width="32" height="28" />
            <rect x="292" y="108" width="32" height="28" />
            <rect x="378" y="108" width="54" height="32" />
            <line x1="405" y1="108" x2="405" y2="140" />
            <rect x="502" y="102" width="34" height="62" />
            <rect x="554" y="108" width="32" height="28" />
            <rect x="646" y="108" width="46" height="30" />
            <line x1="669" y1="108" x2="669" y2="138" />
          </g>
        </svg>
      </div>

      {/* 6-Segment Dimension Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {LANDING_STAGES.map((st) => {
          const active = st.seq === selectedSeq;
          return (
            <button
              key={st.seq}
              type="button"
              onClick={() => onSelect(st.seq)}
              className={`flex cursor-pointer flex-col border-t-2 pt-2 text-left transition ${
                active ? "border-pepper" : "border-ink/25 hover:border-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                <span className={active ? "font-bold text-pepper" : "font-semibold text-ink"}>{st.short}</span>
                <span
                  className={
                    active
                      ? "font-bold text-pepper"
                      : st.status === "DONE"
                        ? "font-semibold text-leaf"
                        : "text-muted"
                  }
                >
                  [{active ? "SELECTED" : st.status}]
                </span>
              </div>
              <span className="mt-0.5 line-clamp-1 text-xs font-medium text-ink">{st.name}</span>
              <span className="mt-0.5 font-mono text-[11px] text-muted">
                {st.usdc} · {st.ngn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Layer Acceptance Criteria Readout */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-blueprint-line bg-blueprint p-4 text-[#f4f0e8] sm:flex-row sm:items-center sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="text-pepper">
              STAGE {String(activeStage.seq).padStart(2, "0")} {"//"} {activeStage.days} DAYS
            </span>
            <span className="rounded bg-blueprint-card px-2 py-0.5 text-[#d2dce8]">
              {activeStage.usdc} ({activeStage.ngn})
            </span>
          </div>
          <p className="text-base font-bold">{activeStage.name}</p>
          <p className="max-w-2xl text-xs leading-relaxed text-[#a7b7ca]">
            <strong className="text-[#f4f0e8]">TEE Verification Criteria:</strong> {activeStage.criteria}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/site" className="btn border border-blueprint-line bg-blueprint-card px-4 py-2.5 text-[11px] text-white">
            Inspect Photo (/site)
          </Link>
          <Link href="/build" className="btn-pop px-4 py-2.5 text-[11px]">
            Escrow Stage (/build) →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ArchitectureFlow({
  scene,
  escrowAccount,
  agentAccount,
}: {
  scene: Scene;
  escrowAccount: string;
  agentAccount: string;
}) {
  const active = (n: ArchNode) => scene.activeNodes.includes(n);

  const nodeBox = (node: ArchNode, title: string, sub: string, accent: "brass" | "emerald" | "sky") => {
    const on = active(node);
    const activeBorder =
      accent === "emerald"
        ? "border-radar bg-radar/15 shadow-[0_0_18px_rgba(16,185,129,0.22)]"
        : accent === "sky"
          ? "border-sky-400 bg-sky-400/15 shadow-[0_0_18px_rgba(56,189,248,0.2)]"
          : "border-pepper bg-pepper/20 shadow-[0_0_18px_rgba(212,136,42,0.24)]";
    return (
      <div
        className={`rounded-lg border px-3 py-2 transition-all duration-300 ${
          on ? activeBorder : "border-blueprint-line bg-blueprint-card/45 opacity-40"
        }`}
      >
        <p className="font-mono text-[10px] font-bold text-[#f4f0e8]">{title}</p>
        <p className="mt-0.5 truncate font-mono text-[9.5px] text-[#9db0c7]">{sub}</p>
      </div>
    );
  };

  const flowArrow = (lit: boolean) => (
    <div className="hidden items-center sm:flex" aria-hidden="true">
      <div
        className={`h-px w-5 transition-colors duration-300 ${
          lit ? "bg-gradient-to-r from-pepper to-radar" : "bg-blueprint-line"
        }`}
      />
      <div
        className={`size-0 border-y-[3.5px] border-l-[5px] border-y-transparent transition-colors duration-300 ${
          lit ? "border-l-radar" : "border-l-blueprint-line"
        }`}
      />
    </div>
  );

  const leftActive = active("owner") || active("foreman");
  const rightActive = active("escrow") || active("contractor");

  return (
    <div className="card-blueprint space-y-5 p-5">
      <div className="flex items-center justify-between border-b border-blueprint-line pb-3">
        <span className="font-mono text-[10px] tracking-wider text-[#8ea1b8] uppercase">ACTIVE EXECUTION PATH</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-radar/30 bg-radar/15 px-3 py-1 font-mono text-[10px] font-semibold text-mint">
          <span className="size-1.5 animate-pulse rounded-full bg-radar" />
          {scene.label}
        </span>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-2.5">
          {nodeBox("owner", "Diaspora Owner", "1 yoctoNEAR signer", "brass")}
          {nodeBox("foreman", "Foreman Studio", "EXIF + Camera proof", "emerald")}
        </div>

        {flowArrow(leftActive)}

        <div className="flex-1 space-y-2">
          {nodeBox("usdc", "Circle USDC", "NEP-141 ft_transfer", "brass")}
          {nodeBox("geofence", "150m Geofence", "7.4370°N, 3.9470°E", "emerald")}
          {nodeBox("tee", "NEAR AI TEE", "Qwen3.8 + Ed25519", "emerald")}
          {nodeBox("agent", "Scoped Agent", agentAccount.slice(0, 18), "sky")}
        </div>

        {flowArrow(rightActive)}

        <div className="flex-1 space-y-2.5">
          {nodeBox("escrow", "Escrow Vault", escrowAccount, "brass")}
          {nodeBox("contractor", "Contractor Payee", "chidi.homebound-hq", "emerald")}
        </div>
      </div>

      <p className="border-t border-blueprint-line pt-3 font-mono text-[10px] text-[#8ea1b8]">
        Auto-cycling 4 protocol scenes — click any step tab above to inspect individually.
      </p>
    </div>
  );
}

function BlueprintPreviewCard({ escrowAccount }: { escrowAccount: string }) {
  return (
    <div className="card-blueprint space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-blueprint-line pb-3 font-mono text-[11px]">
        <span className="text-pepper">STAGE 03 · BLOCKWORK TO LINTEL</span>
        <span className="rounded bg-radar/20 px-2 py-0.5 font-semibold text-mint">92% PASS</span>
      </div>

      <div className="rounded-lg border border-blueprint-line bg-[#09111c] p-3">
        <svg viewBox="0 0 360 110" className="block h-auto w-full" aria-hidden="true">
          <line x1="16" y1="92" x2="344" y2="92" stroke="#2c4461" strokeWidth="1" />
          <polygon points="48,46 86,20 274,20 312,46" fill="none" stroke="#536c8a" strokeWidth="1.2" />
          <polygon points="124,46 180,12 236,46" fill="none" stroke="#536c8a" strokeWidth="1.2" />
          <rect x="64" y="46" width="60" height="46" fill="none" stroke="#536c8a" strokeWidth="1.2" />
          <rect x="124" y="46" width="112" height="46" fill="rgba(212, 136, 42, 0.18)" stroke="#d4882a" strokeWidth="1.8" />
          <rect x="58" y="42" width="244" height="5" fill="rgba(212, 136, 42, 0.35)" stroke="#d4882a" strokeWidth="1.2" />
          <rect x="236" y="46" width="60" height="46" fill="none" stroke="#536c8a" strokeWidth="1.2" />
          <circle cx="298" cy="24" r="14" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="1" />
          <circle cx="298" cy="24" r="3" fill="#10b981" className="animate-pulse" />
          <text x="16" y="104" fill="#7c90a8" fontSize="8" fontFamily="monospace">
            ELEVATION +3.00M · 7.4371°N, 3.9471°E · 18M GEOFENCE VERIFIED
          </text>
        </svg>
      </div>

      <div className="space-y-2 font-mono text-xs">
        <SealLine label="SEAL 01 · CIRCLE USDC ESCROW" value="1.50 USDC" />
        <SealLine label="SEAL 02 · NEAR AI TEE VERDICT" value="ED25519 ✓" highlight />
        <SealLine label="SEAL 03 · OWNER APPROVAL" value="1 yoctoNEAR" />
      </div>

      <div className="flex items-center justify-between border-t border-blueprint-line pt-3 font-mono text-[11px] text-[#8ea1b8]">
        <span>{escrowAccount}</span>
        <span className="font-bold text-[#f4f0e8]">₦2,325,000 TRANCHE</span>
      </div>
    </div>
  );
}

function SealLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-blueprint-line bg-blueprint-card/75 px-3 py-2">
      <span className="text-[#c7d3e3]">{label}</span>
      <span className={highlight ? "font-bold text-mint" : "font-semibold text-[#f4f0e8]"}>{value}</span>
    </div>
  );
}
