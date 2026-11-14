import Link from "next/link";
import { Header } from "@/components/Header";
import { BookkeeperStageLedger, LedgerFeed, type ClientLedgerEvent } from "@/components/LedgerFeed";
import { AttestationCard } from "@/components/NearPanels";
import { getDb } from "@/db";
import { nearAiModel } from "@/lib/ai/nearai";
import { toClientView, type ClientNear } from "@/lib/client-view";
import { verifyLedger } from "@/lib/ledger";
import { nearPublicConfig } from "@/lib/near/config";
import { accountUrl, formatUsdc, usdcForCents } from "@/lib/near/shared";
import { getChainProject, getRegisteredSigner, usdcBalance } from "@/lib/near/views";
import { getHeroProject, getLedger, getProjectView } from "@/lib/queries";

export const dynamic = "force-dynamic";

const FAILURE_MATRIX = [
  {
    code: "CASE 01 · AI FALSE NEGATIVE / HALLUCINATION",
    title: "AI rejects valid masonry or cloud endpoint stalls",
    rule: "override_release(project_id, stage, reason)",
    body: "The owner reviews the uploaded site photo (or an independent quantity surveyor memo) and signs with 1 yoctoNEAR + mandatory public reason string to settle Circle USDC manually.",
    authority: "1 yoctoNEAR · Owner Only",
  },
  {
    code: "CASE 02 · ABANDONED OR FAILED MILESTONE",
    title: "Contractor halts work or submits repeated failures",
    rule: "refund_stage(project_id, stage)",
    body: "Any un-released funded tranche stays locked inside the escrow contract. The homeowner reclaims remaining Circle USDC back to tightrat3805.testnet with zero intermediary permission.",
    authority: "1 yoctoNEAR · Owner Only",
  },
  {
    code: "CASE 03 · STALE OR EXPIRED RELEASE PROPOSAL",
    title: "Owner takes longer than 24 hours to sign approve_release",
    rule: "PROPOSAL_TTL_NS = 24h",
    body: "Stale release proposals cannot settle silently later. The foreman simply uploads a fresh dated site photo (or re-runs propose_release), or the owner exercises refund_stage.",
    authority: "Contract Block Timestamp Guard",
  },
  {
    code: "CASE 04 · RELAYER KEY COMPROMISED OR ROTATED",
    title: "Gasless site agent behaves unexpectedly or needs key rotation",
    rule: "set_agent(project_id, new_agent)",
    body: "Agents can only submit TEE-signed verdicts and propose releases — they can never transfer USDC. The owner can rotate or revoke project.agent on-chain immediately.",
    authority: "1 yoctoNEAR · Owner Only",
  },
];

export default async function VerifyPage() {
  const cfg = nearPublicConfig();
  const db = await getDb();
  const hero = await getHeroProject();
  const model = nearAiModel();
  const view = hero ? await getProjectView(hero.id) : null;

  const contractorAcct = view?.parties.find((p) => p.role === "contractor")?.nearAccountId ?? null;
  const nearProjectId = view?.project.nearProjectId ?? null;

  const [ledgerRows, integrity, registeredSigner, chain, contractorUsdc] = await Promise.all([
    hero ? getLedger(hero.id, 60) : Promise.resolve([]),
    verifyLedger(db),
    getRegisteredSigner(model).catch(() => null),
    nearProjectId ? getChainProject(nearProjectId).catch(() => null) : Promise.resolve(null),
    contractorAcct ? usdcBalance(contractorAcct).catch(() => null) : Promise.resolve(null),
  ]);

  const near: ClientNear = {
    config: cfg,
    nearProjectId,
    chain,
    contractorAccount: contractorAcct,
    contractorUsdc,
    registeredSigner,
    readError: null,
  };

  const clientView = view ? toClientView(view, near) : null;
  const clientLedger: ClientLedgerEvent[] = ledgerRows.map((e) => ({
    id: e.id,
    seq: e.seq,
    type: e.type,
    actor: e.actor,
    hash: e.hash,
    prevHash: e.prevHash,
    payload: e.payload,
    createdAt: e.createdAt.toISOString(),
  }));

  const totalUsdCents = clientView?.stages.reduce((sum, s) => sum + s.laborTrancheUsdCents, 0) ?? 700_000;
  const paidUsdCents =
    clientView?.stages
      .filter((s) => s.status === "paid" || s.nearStatus === "released")
      .reduce((sum, s) => sum + s.laborTrancheUsdCents, 0) ?? 150_000;
  const inEscrowUsdCents =
    clientView?.stages
      .filter((s) => s.status !== "paid" && (s.nearStatus === "funded" || s.nearStatus === "proposed"))
      .reduce((sum, s) => sum + s.laborTrancheUsdCents, 0) ?? 150_000;

  return (
    <>
      <Header wallet={false} />
      <main className="mx-auto w-full max-w-[1340px] flex-1 space-y-12 px-6 py-12 md:px-10 md:py-16">
        {/* Iris Vale Tearsheet Header */}
        <header className="space-y-8 border border-line bg-card p-8 md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-5 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            <span>NO. 03 | DIASPORA CONSTRUCTION LEDGER | IBADAN, NG | 2026</span>
            <span className="inline-flex items-center gap-2 rounded-[2px] border border-leaf/35 bg-mint px-3 py-1 font-semibold text-leaf">
              <span className="size-1.5 rounded-full bg-leaf" />
              {integrity.ok ? "HASH-CHAINED LEDGER INTACT" : "AUDIT WARNING"}
            </span>
          </div>

          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-8">
              <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                (03) LEDGER &amp; PUBLIC ON-CHAIN RULES
              </p>
              <h1 className="font-sans text-4xl font-medium tracking-[-0.05em] text-ink md:text-6xl">
                {formatUsdc(usdcForCents(paidUsdCents, cfg.demoDivisor))} /{" "}
                {formatUsdc(usdcForCents(totalUsdCents, cfg.demoDivisor))} Settled
              </h1>
              <p className="text-base leading-relaxed text-muted md:text-lg">
                <strong className="text-ink">${(paidUsdCents / 100).toLocaleString()} Paid</strong> ·{" "}
                <strong className="text-ink">${(inEscrowUsdCents / 100).toLocaleString()} Locked in Active Escrow</strong> ·
                Bookkeeper CSV reconciliation paired with publicly readable failure recovery rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <a href="/api/ledger/csv" className="btn-pop px-5 py-3">
                Export Bookkeeper CSV ↓
              </a>
              <Link href="/build" className="btn-ghost px-5 py-3">
                Owner Escrow →
              </Link>
            </div>
          </div>

          {/* 3-Column Executive Summary */}
          <div className="grid gap-6 border-t border-dashed border-ink/20 pt-8 md:grid-cols-3">
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">01 / REMITTANCE RAIL</p>
              <p className="font-sans text-lg font-medium text-ink">London → Ibadan Circle USDC</p>
              <p className="text-sm text-muted">
                Escrow contract:{" "}
                <a href={accountUrl(cfg, cfg.escrow)} target="_blank" rel="noreferrer" className="font-mono text-xs text-ink underline">
                  {cfg.escrow}
                </a>
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">02 / VERIFICATION ORACLE</p>
              <p className="font-sans text-lg font-medium text-ink">{model} + criteria_hash</p>
              <p className="text-sm text-muted">
                Relayer:{" "}
                <a href={accountUrl(cfg, cfg.agent)} target="_blank" rel="noreferrer" className="font-mono text-xs text-ink underline">
                  {cfg.agent}
                </a>{" "}
                (foreman needs 0 NEAR)
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">03 / OWNER FINALITY</p>
              <p className="font-sans text-lg font-medium text-ink">1 yoctoNEAR Release Gate</p>
              <p className="text-sm text-muted">
                Owner wallet: <span className="font-mono text-xs text-ink">{chain?.owner ?? "tightrat3805.testnet"}</span>
              </p>
            </div>
          </div>
        </header>

        {/* [03] Quantity Surveyor Stage Ledger Table */}
        {clientView && <BookkeeperStageLedger view={clientView} />}

        {/* [04] Public On-Chain Rules & Failure-Case Recovery Matrix */}
        <section className="space-y-6 border border-line bg-card p-6 md:p-10">
          <div className="border-b border-dashed border-ink/20 pb-5">
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
              [04] · PUBLIC ON-CHAIN RULES &amp; FAILURE-CASE RECOVERY
            </p>
            <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink md:text-3xl">
              What Happens When Reality Goes Off-Script
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Every state transition is governed publicly in{" "}
              <span className="font-mono text-xs text-ink">contracts/escrow/src/lib.rs</span> so neither AI
              misjudgment nor halted field work traps family capital.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {FAILURE_MATRIX.map((c) => (
              <div key={c.code} className="flex flex-col justify-between border border-dashed border-ink/25 bg-paper/65 p-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">{c.code}</span>
                    <span className="border border-line bg-card px-2 py-0.5 font-mono text-[9px] text-ink uppercase">
                      {c.authority}
                    </span>
                  </div>
                  <h3 className="font-sans text-xl font-medium tracking-[-0.02em] text-ink">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{c.body}</p>
                </div>
                <div className="mt-5 border-t border-dashed border-ink/20 pt-3 font-mono text-[11px] text-ink">
                  Rule: <span className="text-vermilion">{c.rule}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live NEAR AI Cloud TEE Signer Verification */}
        <AttestationCard model={model} registeredSigner={registeredSigner} />

        {/* Hash-Chained Append-Only Event Stream */}
        <LedgerFeed events={clientLedger} integrity={integrity} config={cfg} />

        {/* Sheet L-003 Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-ink/25 pt-6 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          <span>DWG L-003 · PUBLIC ESCROW AUDIT &amp; RECOVERY LEDGER</span>
          <div className="flex flex-wrap gap-6">
            <Link href="/build" className="text-ink hover:text-vermilion">
              (01) Owner Escrow →
            </Link>
            <Link href="/site" className="text-ink hover:text-vermilion">
              (02) Gasless Site Camera →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
