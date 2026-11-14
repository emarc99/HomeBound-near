"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CadFrame, openWaitlistModal, SectionEyebrow } from "./CadPrimitives";

const FAQ_ITEMS = [
  {
    q: "Why do site foremen in Ibadan need zero NEAR or wallet extensions?",
    a: "On /site, uploads are signed and gas-sponsored by the protocol relayer (agent.homebound-hq.testnet). Foremen only pick a site photo on mobile — no browser wallet popup, seed phrase, or NEAR gas balance is required at the construction site.",
  },
  {
    q: "How does the escrow contract bind AI vision verdicts to specific stage rules?",
    a: "When a project is created, each stage stores the SHA-256 hash of its written acceptance criteria on-chain (Stage.criteria_hash). submit_verdict rejects any NEAR AI Cloud TEE verdict whose signed ref fails to match {project_id}/{stage}/{criteria_hash}/{evidence_sha256}, and verifies both the registered Ed25519 key and response_hash uniqueness.",
  },
  {
    q: "What happens if a site photo is off-plot, stale, or reused from another stage?",
    a: "The server extracts EXIF timestamps, checks GPS coordinates against a 150m Haversine circle around Akobo (7.437°N, 3.947°E), and runs 64-bit perceptual dHash comparisons across prior uploads. Failed checks never earn propose_release, and any existing proposal resets safely back to Funded.",
  },
  {
    q: "Can the homeowner recover unspent USDC or settle an off-chain inspection?",
    a: "Yes. On /build, owner sovereignty controls are always visible: override_release(reason) allows settling after an independent quantity surveyor visit, refund_stage() returns funded Circle USDC back to tightrat3805.testnet, and set_agent() lets the owner rotate or freeze the relayer.",
  },
  {
    q: "How does bookkeeper reconciliation work for diaspora accounting?",
    a: "On /verify — (03) LEDGER & RULES — and via /api/ledger/csv, every stage exports a timestamped RFC-4180 CSV row carrying trusted payment status (Paid, Proposed, Funded, Refunded, Planned), USDC tranche amount, NGN equivalent, criteria hash, evidence SHA-256, and Nearblocks transaction URL.",
  },
];

export function TeamFaqCtaFooter({
  escrowAccount,
  agentAccount,
  network,
}: {
  escrowAccount: string;
  agentAccount: string;
  network: string;
}) {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <>
      {/* SECTION 07: HOMEBOUND'S TEAM (SOLO FOUNDER ONLY) */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <SectionEyebrow
              tag="HOMEBOUND'S TEAM"
              title="The people behind the intelligence."
              subtitle="Designed, written in Rust on NEAR, wired to NEAR AI Cloud TEE vision, and tested live against Circle Testnet USDC — purpose-built so diaspora builders never fund blind construction again."
            />
            <div className="grid max-w-md grid-cols-2 gap-4 pt-2 font-mono text-[11px] uppercase">
              <div className="border border-dashed border-ink/25 bg-card p-4">
                <p className="text-muted">Escrow Core</p>
                <p className="mt-1 font-medium text-ink">Rust · NEAR SDK 5</p>
              </div>
              <div className="border border-dashed border-ink/25 bg-card p-4">
                <p className="text-muted">Corridor Focus</p>
                <p className="mt-1 font-medium text-ink">London → Ibadan</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:flex lg:justify-end">
            <CadFrame className="w-full max-w-md bg-card p-4">
              <div className="relative overflow-hidden border border-line bg-plaster">
                <Image
                  src="/team-founder.png"
                  alt="Solo Founder and Protocol Architect — Homebound"
                  width={560}
                  height={560}
                  className="h-[340px] w-full object-cover object-top"
                />
                <span className="absolute top-3 left-3 bg-paper/90 px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] text-ink uppercase">
                  01 / SOLO BUILDER
                </span>
              </div>
              <div className="mt-3 bg-vermilion px-5 py-4 text-[#f5f4f0]">
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase opacity-85">
                  FOUNDER · CONTRACT &amp; FULL-STACK ARCHITECT
                </p>
                <p className="mt-1 font-sans text-xl font-medium tracking-[-0.02em]">
                  Emmanuel · @emarc99
                </p>
              </div>
            </CadFrame>
          </div>
        </div>
      </section>

      {/* SECTION 08: THE INQUIRY (VERMILION MONOLITHIC FAQ) */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <div className="border border-ink/15 bg-vermilion p-8 text-[#f5f4f0] md:p-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80">
                + FREQUENTLY ASKED QUESTIONS
              </p>
              <h2 className="font-sans text-4xl font-medium tracking-[-0.04em] md:text-5xl">
                The Inquiry.
              </h2>
              <p className="text-sm leading-relaxed opacity-85 md:text-base">
                Answers to the practical questions families, contractors, and bookkeepers ask before locking capital on-chain.
              </p>
            </div>

            <div className="divide-y divide-[#f5f4f0]/25 border-t border-b border-[#f5f4f0]/25 lg:col-span-8">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                    >
                      <span className="font-sans text-lg font-medium tracking-[-0.02em] md:text-xl">
                        {item.q}
                      </span>
                      <span className="shrink-0 font-mono text-xl leading-none">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90 md:text-[15px]">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 09: BEGIN WITH HOMEBOUND (STAIRCASE CTA) */}
      <section className="mx-auto max-w-[1340px] px-6 py-24 md:px-10">
        <CadFrame className="bg-card p-8 md:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <p className="font-mono text-[10px] tracking-[0.18em] text-vermilion uppercase">
                + BEGIN WITH HOMEBOUND
              </p>
              <h2 className="font-sans text-4xl font-medium tracking-[-0.045em] text-ink md:text-5xl md:leading-[1.03]">
                Put intelligence into motion.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-muted md:text-lg">
                Inspect our live Akobo Bungalow project on NEAR {network.toUpperCase()} — fund tranches in Circle USDC,
                upload a site check with zero foreman gas, and download bookkeeper-ready settlement CSVs.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button type="button" onClick={openWaitlistModal} className="btn px-6 py-3.5">
                  Join Waitlist
                </button>
                <Link href="/build" className="btn-ghost px-6 py-3.5">
                  Inspect Live Escrow →
                </Link>
                <Link href="/projects" className="btn-ghost px-6 py-3.5">
                  Completed Works →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Image
                src="/art/cta-stipple-pavilion.png"
                alt="Stipple-dithered cantilevered concrete pavilion with verified Stage 03 lintel beam"
                width={820}
                height={760}
                unoptimized
                className="h-auto w-full select-none"
              />
            </div>
          </div>
        </CadFrame>
      </section>

      {/* SECTION 10: DOTTED 4-COLUMN ARCHITECTURAL FOOTER */}
      <footer className="border-t border-dashed border-ink/25 bg-paper">
        <div className="mx-auto max-w-[1340px] px-6 py-16 md:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <p className="font-sans text-lg font-semibold tracking-[-0.04em] text-ink">
                HOMEBOUND<span className="text-vermilion">®</span>
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Milestone construction escrow bridging Diaspora savings and verifiable physical builds on NEAR Protocol.
              </p>
            </div>

            <div className="space-y-3">
              <p className="label">Workbench</p>
              <ul className="space-y-2 font-mono text-xs text-ink">
                <li>
                  <Link href="/" className="hover:text-vermilion">(00) Overview</Link>
                </li>
                <li>
                  <Link href="/build" className="hover:text-vermilion">(01) Owner Escrow &amp; Vault</Link>
                </li>
                <li>
                  <Link href="/site" className="hover:text-vermilion">(02) Gasless Site Camera</Link>
                </li>
                <li>
                  <Link href="/verify" className="hover:text-vermilion">(03) Ledger &amp; Public Rules</Link>
                </li>
                <li>
                  <Link href="/projects" className="hover:text-vermilion">(04) Projects &amp; Monographs</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="label">Live Infrastructure ({network})</p>
              <ul className="space-y-2 font-mono text-[11px] text-muted">
                <li>Escrow: <span className="text-ink">{escrowAccount}</span></li>
                <li>Relayer: <span className="text-ink">{agentAccount}</span></li>
                <li>Model: <span className="text-ink">Qwen/Qwen3.8-27B TEE</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="label">Bookkeeper &amp; Tracks</p>
              <ul className="space-y-2 font-mono text-xs text-ink">
                <li>
                  <a href="/api/ledger/csv" className="text-vermilion hover:underline">
                    Export Bookkeeper CSV ↓
                  </a>
                </li>
                <li className="text-muted">08 / Real-World Money</li>
                <li className="text-muted">13 / Open Innovation</li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-ink/20 pt-6 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
            <span>LONDON ↔ IBADAN CORRIDOR · CIRCLE USDC ESCROW</span>
            <span>NON-CUSTODIAL · 1 YOCTONEAR RELEASE AUTHORITY</span>
          </div>
        </div>
      </footer>
    </>
  );
}
