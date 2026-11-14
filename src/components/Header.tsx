"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "./ConnectButton";

const NAV_ITEMS = [
  { href: "/build", code: "(01)", label: "ESCROW" },
  { href: "/site", code: "(02)", label: "SITE CAMERA" },
  { href: "/verify", code: "(03)", label: "LEDGER & RULES" },
] as const;

export function Header({ wallet = true }: { wallet?: boolean }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistCorridor, setWaitlistCorridor] = useState("London -> Ibadan");
  const [waitlistBudget, setWaitlistBudget] = useState("$10,000 - $35,000 USDC");
  const [waitlistDone, setWaitlistDone] = useState(false);

  useEffect(() => {
    const onOpenWaitlist = () => setWaitlistOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setWaitlistOpen(false);
      }
    };
    window.addEventListener("homebound:open-waitlist", onOpenWaitlist);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("homebound:open-waitlist", onOpenWaitlist);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistDone(true);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-dashed border-ink/25 bg-paper/95 backdrop-blur-sm">
        <div className="relative mx-auto flex max-w-[1340px] items-center justify-between gap-4 border-x border-dashed border-ink/20 px-6 py-4 md:px-10">
          <span aria-hidden className="pointer-events-none absolute -bottom-[7px] -left-[4px] font-mono text-[11px] leading-none text-muted">+</span>
          <span aria-hidden className="pointer-events-none absolute -right-[4px] -bottom-[7px] font-mono text-[11px] leading-none text-muted">+</span>

          <Link href="/" className="group flex items-baseline gap-1 font-sans text-[18px] font-semibold tracking-[-0.045em] text-ink">
            <span>HOMEBOUND</span>
            <span className="text-vermilion">®</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-[11px] tracking-[0.14em] uppercase transition ${
                    active ? "font-semibold text-vermilion" : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="mr-1.5 text-annotation">{item.code}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {wallet && (
              <div className="hidden sm:block">
                <ConnectButton />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setWaitlistDone(false);
                setWaitlistOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] bg-ink px-4 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-paper uppercase transition hover:bg-vermilion hover:text-[#f5f4f0]"
            >
              Join Waitlist
            </button>

            <button
              type="button"
              aria-label="Open menu drawer"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex size-9 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[3px] border border-line bg-card transition hover:border-ink"
            >
              <span className="block h-[1.5px] w-4 bg-ink" />
              <span className="block h-[1.5px] w-4 bg-ink" />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[1px]" onClick={() => setDrawerOpen(false)}>
          <aside
            className="flex h-full w-full max-w-md flex-col justify-between border-l border-line bg-paper p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-dashed border-ink/25 pb-5">
                <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                  INDEX · NAVIGATION
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="cursor-pointer rounded-[3px] border border-line bg-card px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase hover:border-ink"
                >
                  Close [ESC]
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { href: "/", code: "(00)", title: "Overview", note: "Architecture & sequence" },
                  { href: "/build", code: "(01)", title: "Owner Escrow", note: "USDC vault, 1 yoctoNEAR & escape hatches" },
                  { href: "/site", code: "(02)", title: "Site Camera", note: "Gasless foreman relay, geofence & TEE AI" },
                  { href: "/verify", code: "(03)", title: "Ledger & Rules", note: "Bookkeeper CSV, on-chain rules & recovery" },
                ].map((row) => (
                  <Link
                    key={row.href}
                    href={row.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block border border-dashed border-ink/25 bg-card p-4 transition hover:border-vermilion"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-sans text-lg font-medium tracking-[-0.02em] text-ink">{row.title}</span>
                      <span className="font-mono text-[11px] text-vermilion">{row.code}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">{row.note}</p>
                  </Link>
                ))}
              </div>

              <div className="space-y-3 border-t border-dashed border-ink/25 pt-6">
                <p className="label">Bookkeeper & Wallet</p>
                <div className="flex flex-wrap gap-2">
                  <ConnectButton />
                  <a
                    href="/api/ledger/csv"
                    className="btn-ghost px-3.5 py-2 text-[10px]"
                  >
                    Export CSV ↓
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-dashed border-ink/25 pt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                TRACKS: 08 / REAL-WORLD MONEY · 13 / OPEN INNOVATION
              </p>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setWaitlistDone(false);
                  setWaitlistOpen(true);
                }}
                className="btn-pop w-full"
              >
                Join Waitlist →
              </button>
            </div>
          </aside>
        </div>
      )}

      {waitlistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-6 backdrop-blur-[2px]"
          onClick={() => setWaitlistOpen(false)}
        >
          <div
            className="w-full max-w-lg border border-dashed border-ink/30 bg-paper p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-dashed border-ink/25 pb-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                  + EARLY ACCESS CORRIDORS
                </p>
                <h2 className="mt-2 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
                  Reserve a diaspora build slot.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWaitlistOpen(false)}
                className="cursor-pointer font-mono text-[11px] text-muted hover:text-ink"
              >
                [X]
              </button>
            </div>

            {waitlistDone ? (
              <div className="mt-6 space-y-4 border border-leaf/30 bg-mint/70 p-6">
                <p className="font-mono text-[10px] tracking-[0.16em] text-leaf uppercase">
                  ● REQUEST RECORDED IN QUEUE
                </p>
                <p className="text-sm leading-relaxed text-ink">
                  Added <span className="font-mono font-semibold">{waitlistEmail}</span> for the{" "}
                  <span className="font-semibold">{waitlistCorridor}</span> corridor ({waitlistBudget}). You can test
                  live NEAR Testnet escrow right now in <Link href="/build" className="underline text-vermilion" onClick={() => setWaitlistOpen(false)}>(01) ESCROW</Link>.
                </p>
                <button type="button" onClick={() => setWaitlistOpen(false)} className="btn">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitWaitlist} className="mt-6 space-y-5">
                <div>
                  <label className="label block">Work or personal email</label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="tunde@london-family-office.uk"
                    className="field mt-2"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label block">Remittance corridor</label>
                    <select value={waitlistCorridor} onChange={(e) => setWaitlistCorridor(e.target.value)} className="field mt-2">
                      <option>London -&gt; Ibadan</option>
                      <option>Toronto -&gt; Lagos</option>
                      <option>Houston -&gt; Enugu</option>
                      <option>Manchester -&gt; Abuja</option>
                      <option>Accra / Nairobi custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="label block">Initial escrow tranche</label>
                    <select value={waitlistBudget} onChange={(e) => setWaitlistBudget(e.target.value)} className="field mt-2">
                      <option>$10,000 - $35,000 USDC</option>
                      <option>$35,000 - $120,000 USDC</option>
                      <option>$120,000+ multi-unit</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[10px] text-muted uppercase">Non-custodial · NEAR + Circle USDC</span>
                  <button type="submit" className="btn-pop">
                    Confirm Request →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
