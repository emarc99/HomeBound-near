import Link from "next/link";
import { Header } from "@/components/Header";
import { nearPublicConfig } from "@/lib/near/config";
import { accountUrl } from "@/lib/near/shared";

const plates = [
  {
    n: "PLATE 01",
    title: "Stage-locked Circle USDC",
    body: "Escrow each architectural phase separately — clearing, foundation, blockwork to lintel, roofing — on NEAR instead of wiring unverified lump sums abroad.",
  },
  {
    n: "PLATE 02",
    title: "Geofenced TEE Vision",
    body: "Foreman uploads run against Haversine plot geofencing (150m Akobo radius), EXIF timestamps, SHA-256 uniqueness, and Qwen3.8-27B inside a NEAR AI Cloud enclave.",
  },
  {
    n: "PLATE 03",
    title: "Three-Seal Owner Release",
    body: "Even a passing TEE verdict cannot transfer funds alone. Payout waits in Proposed Release until the homeowner countersigns with 1 yoctoNEAR.",
  },
];

const securitySpecs = [
  "AI agent signer holds a Function-Call Key scoped strictly to submit_verdict, propose_release, and ledger anchors",
  "Contract verifies env::ed25519_verify over model:request_hash:response_hash against the TEE-attested public key",
  "Plot geofence + EXIF capture window + photo SHA-256 anti-reuse checks run deterministically before release proposals",
  "Intel TDX + NVIDIA H200 attestation quotes match the on-chain get_signer key with full SHA-256 audit logging",
];

export default function Home() {
  const cfg = nearPublicConfig();

  return (
    <>
      <Header wallet={false} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-10 py-10 md:grid-cols-[1.15fr_1fr] md:py-16">
          <div>
            <p className="label">PLOT IB-04 // AKOBO, IBADAN · 7.4370° N, 3.9470° E</p>
            <h1 className="mt-4 text-5xl leading-[0.96] font-black tracking-tight text-balance sm:text-6xl">
              Every structural milestone earns its <span className="text-pepper">release.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Homebound pairs architectural milestone escrow in Circle USDC on NEAR with hardware-attested vision
              verification and live plot geofence telemetry for diaspora builders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/build" className="btn-pop px-6 py-3.5 text-xs">
                Open Escrow Cockpit →
              </Link>
              <Link href="/site" className="btn-ghost px-6 py-3.5 text-xs">
                Open Foreman Studio
              </Link>
              <Link href="/verify" className="btn-ghost px-5 py-3.5 text-xs">
                TEE &amp; Ledger
              </Link>
            </div>
          </div>

          <BlueprintPreviewCard escrowAccount={cfg.escrow} />
        </section>

        {/* CAD Engineering Plates */}
        <section className="grid gap-4 border-t border-line py-10 md:grid-cols-3">
          {plates.map((p) => (
            <div key={p.n} className="card flex flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span className="font-semibold text-pepper">{p.n}</span>
                <span>SPECIFICATION</span>
              </div>
              <div className="mt-6">
                <h2 className="text-xl font-bold tracking-tight text-ink">{p.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Prussian Blueprint Security Architecture Block */}
        <section id="locks" className="card-blueprint my-8 p-8 md:my-12 md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line pb-4">
            <span className="font-mono text-xs tracking-[0.14em] text-pepper uppercase">
              CRYPTOGRAPHIC ESCROW SPECIFICATION
            </span>
            <span className="font-mono text-xs text-[#8ea1b8]">ZERO SINGLE-KEY CUSTODY</span>
          </div>

          <h2 className="mt-6 max-w-2xl text-3xl font-black tracking-tight text-[#f4f0e8] md:text-4xl">
            No single party can move the money alone.
          </h2>

          <ul className="mt-8 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {securitySpecs.map((item, idx) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#cfdbe8]">
                <span className="mt-0.5 font-mono text-xs font-bold text-pepper">0{idx + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-blueprint-line pt-5 font-mono text-xs text-[#9db0c7]">
            <span>
              Deployed contract:{" "}
              <a
                href={accountUrl(cfg, cfg.escrow)}
                target="_blank"
                rel="noreferrer"
                className="text-[#f4f0e8] underline decoration-pepper underline-offset-2"
              >
                {cfg.escrow}
              </a>
            </span>
            <span>
              Red-team verified: <strong className="text-mint">npm run attack (7/7)</strong> ·{" "}
              <strong className="text-mint">cargo test --lib (32/32)</strong>
            </span>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 border-t border-line px-6 py-7 font-mono text-xs text-muted">
        <span>HOMEBOUND // NEAR {cfg.network.toUpperCase()}</span>
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
    </>
  );
}

function BlueprintPreviewCard({ escrowAccount }: { escrowAccount: string }) {
  return (
    <div className="card-blueprint space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-blueprint-line pb-3 font-mono text-[11px]">
        <span className="text-pepper">STAGE 03 · BLOCKWORK TO LINTEL</span>
        <span className="rounded bg-radar/20 px-2 py-0.5 font-semibold text-mint">92% PASS</span>
      </div>

      {/* Mini Bungalow CAD Elevation Graphic */}
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
          <circle cx="298" cy="24" r="3" fill="#10b981" />
          <text x="16" y="104" fill="#7c90a8" fontSize="8" fontFamily="monospace">
            ELEVATION +3.00M · 7.4371°N, 3.9471°E · 18M GEOFENCE VERIFIED
          </text>
        </svg>
      </div>

      {/* Mini Three Seals */}
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
