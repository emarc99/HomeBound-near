"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-wider sm:text-lg">
      <span className="text-ink">HOMEBOUND</span>
      <span className="font-mono text-pepper">{"//"}</span>
      <span className="font-mono text-sm font-semibold text-ink sm:text-base">PLOT IB-04</span>
    </Link>
  );
}

const NAV = [
  { href: "/build", label: "Escrow Cockpit" },
  { href: "/site", label: "Foreman Studio" },
  { href: "/verify", label: "TEE Ledger" },
];

export function Header({ wallet = true }: { wallet?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Logo />

        <nav className="flex items-center gap-5 text-xs sm:gap-7 sm:text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 py-1.5 transition ${
                  active
                    ? "border-ink font-semibold text-ink"
                    : "border-transparent font-medium text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {wallet ? (
            <ConnectButton />
          ) : (
            <Link
              href="/build"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 font-mono text-xs font-medium text-ink transition hover:border-ink"
            >
              <span className="size-1.5 rounded-full bg-leaf" />
              escrow.homebound-hq.testnet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
