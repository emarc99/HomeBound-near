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
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Logo />
      <nav className="flex items-center gap-2 text-sm font-medium">
        <Link href="/build" className="hidden rounded-full px-4 py-2 hover:bg-ink/5 sm:block">
          Workspace
        </Link>
        <Link href="/#locks" className="hidden rounded-full px-4 py-2 hover:bg-ink/5 sm:block">
          Three Locks
        </Link>
        {wallet && <ConnectButton />}
      </nav>
    </header>
  );
}
