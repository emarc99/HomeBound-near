import Link from "next/link";
import { Header } from "@/components/Header";
import { nearPublicConfig } from "@/lib/near/config";
import { accountUrl } from "@/lib/near/shared";

const steps = [
  {
    n: "01",
    title: "Fund by stage",
    body: "Lock Circle USDC per construction phase — clearing, foundation, walls, roof — on NEAR instead of wiring lump sums nobody can audit.",
  },
  {
    n: "02",
    title: "Verify inside a TEE",
    body: "The foreman uploads a site photo. Checks inspect EXIF GPS, image hash, and stage criteria; NEAR AI Cloud signs the verdict inside an attested enclave.",
  },
  {
    n: "03",
    title: "Release with 1 yoctoNEAR",
    body: "Even a passing AI verdict cannot pay out by itself. The stage enters Proposed Release until your owner wallet signs the final transfer.",
  },
];

const locks = [
  "AI agent holds a Function-Call Key scoped only to verdicts, proposals, and ledger anchors — never transfers",
  "Contract checks env::ed25519_verify over model:request_hash:response_hash against the TEE-attested signer",
  "Owner wallet alone approves or overrides stage payouts, or refunds expired escrowed USDC",
  "Every photo SHA-256, signed verdict, and on-chain hash appends into a verifiable audit chain",
];

export default function Home() {
  const cfg = nearPublicConfig();

  return (
    <>
      <Header wallet={false} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-12 py-12 md:grid-cols-[1.2fr_1fr] md:py-22">
          <div>
            <p className="label">USDC milestone escrow · NEAR Protocol</p>
            <h1 className="mt-5 text-5xl leading-[0.95] font-black tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Every milestone earns its <span className="text-pepper">release.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Homebound lets diaspora builders fund home construction in Circle USDC, verify contractor progress photos
              with NEAR AI Cloud, and release money only when three independent locks agree.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/build" className="btn-pop px-7 py-4 text-base">
                Open owner escrow
              </Link>
              <Link href="/site" className="btn-ghost px-7 py-4 text-base">
                Try foreman camera
              </Link>
            </div>
          </div>

          <MilestonePreview escrowAccount={cfg.escrow} />
        </section>

        <section className="grid gap-4 py-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card">
              <p className="font-mono text-sm text-pepper">{s.n}</p>
              <h2 className="mt-8 text-2xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-3 text-muted">{s.body}</p>
            </div>
          ))}
        </section>

        <section id="locks" className="my-14 rounded-[2rem] bg-ink p-8 text-paper md:p-14">
          <p className="label text-paper/60">Three locks before payout</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            No single party can move the money alone.
          </h2>
          <ul className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {locks.map((item) => (
              <li key={item} className="flex gap-3 text-lg">
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-pepper" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-10 font-mono text-xs text-paper/65">
            Deployed contract:{" "}
            <a href={accountUrl(cfg, cfg.escrow)} target="_blank" rel="noreferrer" className="text-paper underline">
              {cfg.escrow}
            </a>{" "}
            · Red-team check via <span className="text-paper">npm run attack</span> &amp;{" "}
            <span className="text-paper">cargo test --lib</span>
          </p>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 px-6 py-8 text-sm text-muted">
        <span>Built for the NEAR Hackathon · runs on NEAR {cfg.network}</span>
        <div className="flex gap-5">
          <Link href="/build" className="hover:text-ink">
            Owner Escrow
          </Link>
          <Link href="/site" className="hover:text-ink">
            Foreman Site
          </Link>
          <Link href="/verify" className="hover:text-ink">
            TEE &amp; Ledger
          </Link>
          <a href="https://github.com/emarc99/HomeBound-near" target="_blank" rel="noreferrer" className="hover:text-ink">
            Source
          </a>
        </div>
      </footer>
    </>
  );
}

function MilestonePreview({ escrowAccount }: { escrowAccount: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-pepper" />
      <div className="relative rounded-3xl border-2 border-ink bg-card p-7">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold">Stage 03 · Blockwork to lintel</span>
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-leaf">Passed</span>
        </div>
        <div className="mt-6 space-y-2 text-sm">
          <Row a="EXIF & freshness" b="Ibadan · Verified" />
          <Row a="Vision model" b="Qwen3.8-27B · Pass" />
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-dashed border-line pt-5">
          <span className="label">Escrowed</span>
          <span className="text-right">
            <span className="block text-3xl font-black tracking-tight">1.50 USDC</span>
            <span className="font-mono text-xs text-muted">₦2,325,000 budget · 1:1000 demo</span>
          </span>
        </div>
        <div className="mt-6 space-y-2 rounded-2xl bg-paper p-4 text-sm">
          <Row a="1. Contract lock" b="USDC escrowed" />
          <Row a="2. TEE verdict" b="Ed25519 verified" />
          <Row a="3. Owner approval" b="1 yoctoNEAR" />
        </div>
        <p className="mt-5 font-mono text-xs text-muted">{escrowAccount}</p>
      </div>
    </div>
  );
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{a}</span>
      <span className="font-mono font-medium">{b}</span>
    </div>
  );
}
