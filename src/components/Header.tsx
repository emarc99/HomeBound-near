import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export function Logo() {
  return (
    <Link href="/" className="flex items-baseline gap-0.5 text-2xl font-black tracking-tight">
      Homebound<span className="size-2 rounded-full bg-pepper" />
    </Link>
  );
}

export function Header({ wallet = true }: { wallet?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <Logo />
      <nav className="flex items-center gap-1.5 text-xs font-medium sm:gap-2 sm:text-sm">
        <Link href="/build" className="rounded-full px-3 py-1.5 hover:bg-ink/5 sm:px-4 sm:py-2">
          Owner Escrow
        </Link>
        <Link href="/site" className="rounded-full px-3 py-1.5 hover:bg-ink/5 sm:px-4 sm:py-2">
          Foreman Site
        </Link>
        <Link href="/verify" className="hidden rounded-full px-4 py-2 hover:bg-ink/5 md:block">
          TEE &amp; Ledger
        </Link>
        {wallet && <ConnectButton />}
      </nav>
    </header>
  );
}
