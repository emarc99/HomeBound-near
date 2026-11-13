import Link from "next/link";
import { Header } from "@/components/Header";
import { LedgerFeed } from "@/components/LedgerFeed";
import { AttestationCard } from "@/components/NearPanels";
import { getDb } from "@/db";
import { nearAiModel } from "@/lib/ai/nearai";
import { verifyLedger } from "@/lib/ledger";
import { nearPublicConfig } from "@/lib/near/config";
import { accountUrl } from "@/lib/near/shared";
import { getRegisteredSigner } from "@/lib/near/views";
import { getHeroProject, getLedger } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const cfg = nearPublicConfig();
  const model = nearAiModel();
  const db = await getDb();
  const hero = await getHeroProject();

  const [ledgerRows, integrity, registeredSigner] = await Promise.all([
    hero ? getLedger(hero.id, 60) : Promise.resolve([]),
    verifyLedger(db),
    getRegisteredSigner(model).catch(() => null),
  ]);

  const clientLedger = ledgerRows.map((ev) => ({
    id: ev.id,
    seq: ev.seq,
    type: ev.type,
    actor: ev.actor,
    hash: ev.hash,
    prevHash: ev.prevHash,
    payload: ev.payload,
    createdAt: ev.createdAt.toISOString(),
  }));

  return (
    <>
      <Header wallet={false} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pt-4 pb-16">
        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="label">Independent verification</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              Check the enclave and the ledger.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted">
              Verify the model&apos;s live Intel TDX &amp; NVIDIA H200 attestation against the signer registered in{" "}
              <a
                href={accountUrl(cfg, cfg.escrow)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-ink underline decoration-ink/35 underline-offset-2"
              >
                {cfg.escrow}
              </a>
              , and inspect every SHA-256 ledger event.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/site" className="btn-ghost px-4 py-2.5 text-xs">
              Foreman Site (/site)
            </Link>
            <Link href="/build" className="btn-pop px-5 py-2.5 text-xs">
              Owner Escrow (/build) →
            </Link>
          </div>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <AttestationCard model={model} registeredSigner={registeredSigner} />

            <div className="card space-y-3">
              <p className="label">Contract & Key Boundaries</p>
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Escrow contract</dt>
                  <dd className="font-mono">
                    <a href={accountUrl(cfg, cfg.escrow)} target="_blank" rel="noreferrer" className="underline">
                      {cfg.escrow}
                    </a>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Agent account (propose-only)</dt>
                  <dd className="font-mono">
                    <a href={accountUrl(cfg, cfg.agent)} target="_blank" rel="noreferrer" className="underline">
                      {cfg.agent}
                    </a>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Circle USDC token</dt>
                  <dd className="font-mono">{`${cfg.usdc.slice(0, 10)}…${cfg.usdc.slice(-6)}`}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">CLI red-team suite</dt>
                  <dd className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[11px] ring-1 ring-line">
                    npm run attack
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <LedgerFeed events={clientLedger} integrity={integrity} config={cfg} />
        </section>
      </main>
    </>
  );
}
