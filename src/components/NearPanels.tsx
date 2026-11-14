"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClientStage, ClientView } from "@/lib/client-view";
import type { AttestationReport } from "@/lib/ai/nearai";
import { formatNgn } from "@/lib/money";
import { accountUrl, formatUsdc, ONE_YOCTO, txUrl, usdcForCents, type ChainStageStatus } from "@/lib/near/shared";
import {
  nearProjectPlanAction,
  proposeStageReleaseAction,
  recordNearTxAction,
  type NearTxKind,
} from "@/app/actions/near";
import { useNearWallet, type WalletCall } from "./near/NearProvider";

const short = (id: string) => (id.length > 26 ? `${id.slice(0, 12)}…${id.slice(-8)}` : id);

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-mono underline decoration-current/40 underline-offset-2 hover:text-vermilion"
    >
      {children}
    </a>
  );
}

function useWalletAction() {
  const router = useRouter();
  const { send, accountId } = useNearWallet();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = (
    label: string,
    calls: () => Promise<WalletCall[]>,
    record?: { kind: NearTxKind; id: string },
  ) =>
    start(async () => {
      setError(null);
      setInfo(null);
      try {
        const hashes = await send(await calls());
        const hash = hashes[hashes.length - 1];
        if (record) {
          const res = await recordNearTxAction(record.kind, record.id, hash, accountId ?? "");
          if (!res.ok) {
            setError(res.error);
            return;
          }
        }
        setInfo(`${label} confirmed on NEAR (${short(hash)}).`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "The wallet did not sign the transaction.");
      }
    });

  return { pending, error, info, run };
}

function StatusAlerts({ error, info }: { error: string | null; info: string | null }) {
  return (
    <>
      {error && (
        <div className="border border-crimson/35 bg-crimson/10 px-4 py-3 font-mono text-xs text-crimson">
          {error}
        </div>
      )}
      {info && (
        <div className="border border-leaf/35 bg-mint px-4 py-3 font-mono text-xs text-leaf">
          {info}
        </div>
      )}
    </>
  );
}

export function NearProjectBanner({ view }: { view: ClientView }) {
  const { near } = view;
  const { accountId, connect } = useNearWallet();
  const { pending, error, info, run } = useWalletAction();
  const { config, chain } = near;

  const unpaidCount = view.stages.filter((s) => s.status !== "paid").length;

  const createOnNear = () =>
    run(
      "Escrow project creation",
      async () => {
        const res = await nearProjectPlanAction(view.project.id);
        if (!res.ok) throw new Error(res.error);
        if (!res.data) throw new Error("Could not prepare NEAR project.");
        const plan = res.data;
        const calls: WalletCall[] = [
          ...plan.payeesNeedingStorage.map((acct) => ({
            receiverId: config.usdc,
            methodName: "storage_deposit",
            args: { account_id: acct, registration_only: true },
            gasTgas: 30,
            deposit: plan.storageDeposit,
          })),
          {
            receiverId: config.escrow,
            methodName: "create_project",
            args: { project_id: plan.projectId, agent: plan.agent, stages: plan.stages },
            gasTgas: 100,
            deposit: plan.deposit,
          },
        ];
        return calls;
      },
      { kind: "project", id: view.project.id },
    );

  if (!near.nearProjectId) {
    return (
      <section className="space-y-4 border border-dashed border-ink/25 bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
              + STEP 01 · DEPLOY ESCROW PROJECT ON NEAR ({config.network.toUpperCase()})
            </p>
            <h2 className="font-sans text-xl font-medium tracking-[-0.02em] text-ink">
              Initialize the {unpaidCount}-stage Circle USDC vault on {config.escrow}
            </h2>
          </div>
          {accountId ? (
            <button type="button" disabled={pending} onClick={createOnNear} className="btn-pop">
              {pending ? "Creating Vault…" : "Create Project on NEAR"}
            </button>
          ) : (
            <button type="button" onClick={() => void connect()} className="btn">
              Connect Owner Wallet
            </button>
          )}
        </div>
        <StatusAlerts error={error} info={info} />
      </section>
    );
  }

  return (
    <section className="space-y-4 border border-line bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-[2px] border border-leaf/35 bg-mint px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-leaf uppercase">
            <span className="size-1.5 rounded-full bg-leaf" />
            LIVE ESCROW · {config.network.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-ink">
            Project ID: <Ext href={accountUrl(config, config.escrow)}>{near.nearProjectId}</Ext>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
          {accountId ? (
            <span>
              Wallet: <strong className="text-ink">{accountId}</strong>
            </span>
          ) : (
            <button type="button" onClick={() => void connect()} className="btn px-3.5 py-2 text-[10px]">
              Connect Owner Wallet
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 font-mono text-[11px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-dashed border-ink/20 bg-paper/60 p-3.5">
          <span className="label block">Owner Authority (1 yoctoNEAR)</span>
          <span className="mt-1 block truncate font-medium text-ink">
            {chain?.owner ?? "tightrat3805.testnet"}
          </span>
        </div>
        <div className="border border-dashed border-ink/20 bg-paper/60 p-3.5">
          <span className="label block">Gasless Relayer Agent</span>
          <span className="mt-1 block truncate font-medium text-ink">
            {chain?.agent ?? config.agent}
          </span>
        </div>
        <div className="border border-dashed border-ink/20 bg-paper/60 p-3.5">
          <span className="label block">Payee (Nigeria Builder)</span>
          <span className="mt-1 block truncate font-medium text-ink">
            {near.contractorAccount ?? "chidi.homebound-hq.testnet"}
          </span>
        </div>
        <div className="border border-dashed border-ink/20 bg-paper/60 p-3.5">
          <span className="label block">Builder Settled Balance</span>
          <span className="mt-1 block truncate font-medium text-ink">
            {near.contractorUsdc ? formatUsdc(near.contractorUsdc) : "0.00 USDC"} (1:{config.demoDivisor})
          </span>
        </div>
      </div>

      <StatusAlerts error={error} info={info} />
    </section>
  );
}

const CHAIN_STATUS_TEXT: Record<ChainStageStatus, string> = {
  planned: "Planned on-chain — awaiting Circle USDC funding.",
  funded: "Funded in Circle USDC — awaiting gasless site verification.",
  proposed: "VERIFIED & PROPOSED — awaiting owner 1 yoctoNEAR signature (24h window).",
  released: "Paid — Circle USDC settled to builder.",
  refunded: "Refunded — Circle USDC returned to owner wallet.",
};

export function NearStageEscrow({
  view,
  stage,
  currency = "USDC",
}: {
  view: ClientView;
  stage: ClientStage;
  currency?: "USDC" | "NGN";
}) {
  const router = useRouter();
  const { near } = view;
  const { config, chain } = near;
  const { accountId, connect } = useNearWallet();
  const { pending, error, info, run } = useWalletAction();
  const [overrideReason, setOverrideReason] = useState("");
  const [newAgent, setNewAgent] = useState(chain?.agent ?? config.agent);
  const [proposeMsg, setProposeMsg] = useState<{ err: string | null; ok: string | null }>({ err: null, ok: null });
  const [proposing, startPropose] = useTransition();

  const index = stage.nearStageIndex;
  const cs = index != null && chain ? chain.stages[index] : null;
  const projectId = near.nearProjectId;

  const evWithChain = view.evidence.find((e) => e.stageId === stage.id && e.chainVerdict);
  const fundTx = view.payments.find((p) => p.stageId === stage.id && p.kind === "funding" && p.nearTxHash);
  const payoutTx = view.payments.find((p) => p.stageId === stage.id && p.kind === "labor" && p.nearTxHash);

  if (stage.status === "paid" && index == null) {
    return (
      <section className="border border-line bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] text-leaf uppercase">
              STAGE 0{stage.seq} · PREVIOUSLY SETTLED TRANCHE
            </p>
            <h3 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">
              {stage.name}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Settled prior to live on-chain vault activation. Select Stage 03+ above to inspect active NEAR escrow controls.
            </p>
          </div>
          <div className="border border-leaf/35 bg-mint px-4 py-2 font-mono text-xs font-semibold text-leaf">
            Paid · {currency === "NGN" ? formatNgn(stage.laborTrancheNgn) : `$${(stage.laborTrancheUsdCents / 100).toLocaleString()} USD`}
          </div>
        </div>
      </section>
    );
  }

  const demoAmountRaw = usdcForCents(stage.laborTrancheUsdCents, config.demoDivisor);
  const amountRaw = BigInt(cs?.amount ?? demoAmountRaw.toString());
  const fundedRaw = BigInt(cs?.funded ?? "0");
  const needed = amountRaw > fundedRaw ? amountRaw - fundedRaw : 0n;

  const connectedIsOwner = accountId != null && chain != null && accountId === chain.owner;
  const isFinal = cs?.status === "released" || cs?.status === "refunded";
  const hasFunds = fundedRaw > 0n;
  const hasPassingVerdict =
    cs?.status === "funded" &&
    cs.verdict?.verdict === "pass" &&
    cs.verdict.confidence >= 60 &&
    cs.verdict.checks.taken_in_window &&
    cs.verdict.checks.on_site &&
    cs.verdict.checks.not_reused;

  const escrowCall = (methodName: string, args: Record<string, unknown>, includeStage = true): WalletCall => ({
    receiverId: config.escrow,
    methodName,
    args: includeStage ? { project_id: projectId, stage: index, ...args } : { project_id: projectId, ...args },
    gasTgas: 100,
    deposit: ONE_YOCTO,
  });

  const fundStage = () =>
    run(
      "Stage Circle USDC funding",
      async () => [
        {
          receiverId: config.usdc,
          methodName: "ft_transfer_call",
          args: {
            receiver_id: config.escrow,
            amount: (needed > 0n ? needed : amountRaw).toString(),
            msg: JSON.stringify({ project_id: projectId, stage: index }),
          },
          gasTgas: 100,
          deposit: ONE_YOCTO,
        },
      ],
      { kind: "fund", id: stage.id },
    );

  const approveRelease = () =>
    run("1 yoctoNEAR stage payout", async () => [escrowCall("approve_release", {})], { kind: "release", id: stage.id });

  const overrideRelease = () =>
    run(
      "1 yoctoNEAR manual override",
      async () => [escrowCall("override_release", { reason: overrideReason.trim() })],
      { kind: "release", id: stage.id },
    );

  const refundStage = () => {
    if (!window.confirm(`Return ${formatUsdc(cs?.funded ?? "0")} from escrow back to owner wallet? This stage cannot be re-funded.`)) {
      return;
    }
    run("1 yoctoNEAR stage refund", async () => [escrowCall("refund_stage", {})], { kind: "refund", id: stage.id });
  };

  const rotateAgent = () => {
    if (!newAgent.trim()) return;
    run(
      "Relayer rotation",
      async () => [escrowCall("set_agent", { agent: newAgent.trim() }, false)],
      { kind: "agent", id: view.project.id },
    );
  };

  const triggerPropose = () =>
    startPropose(async () => {
      setProposeMsg({ err: null, ok: null });
      const res = await proposeStageReleaseAction(stage.id);
      if (!res.ok) setProposeMsg({ err: res.error, ok: null });
      else {
        setProposeMsg({ err: null, ok: `propose_release landed (${res.data?.txHash.slice(0, 12)}…)` });
        router.refresh();
      }
    });

  return (
    <section className="space-y-6 border border-line bg-card p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-ink/20 pb-5">
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            THREE-SEAL ESCROW VAULT · SHEET A-10{stage.seq}
          </p>
          <h2 className="font-sans text-2xl font-medium tracking-[-0.03em] text-ink md:text-3xl">
            0{stage.seq}. {stage.name}
          </h2>
          <p className="text-sm text-muted">
            {cs ? CHAIN_STATUS_TEXT[cs.status] : "Connect project on NEAR to inspect live escrow seals."}
          </p>
        </div>

        <div className="text-right font-mono">
          <p className="text-xl font-semibold text-ink">
            {currency === "NGN"
              ? formatNgn(stage.laborTrancheNgn)
              : `$${(stage.laborTrancheUsdCents / 100).toLocaleString()} USD`}
          </p>
          <p className="text-[11px] text-muted">
            Escrow Tranche: {formatUsdc(amountRaw.toString())} (1:{config.demoDivisor} demo scale)
          </p>
        </div>
      </div>

      {/* Three Seals Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SEAL 01 */}
        <div className="flex flex-col justify-between border border-dashed border-ink/25 bg-paper/60 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.15em] uppercase">
              <span className="text-vermilion">SEAL 01 · CAPITAL LOCKED</span>
              <span className={fundedRaw >= amountRaw && amountRaw > 0n ? "text-leaf" : "text-muted"}>
                {fundedRaw >= amountRaw && amountRaw > 0n ? "FUNDED" : "OPEN"}
              </span>
            </div>
            <p className="font-mono text-lg font-medium text-ink">
              {formatUsdc(fundedRaw.toString())} / {formatUsdc(amountRaw.toString())}
            </p>
            <p className="text-xs leading-relaxed text-muted">
              USDC rests isolated in {config.escrow} for Stage 0{stage.seq} until verified masonry earns release.
            </p>
            {fundTx?.nearTxHash && (
              <p className="font-mono text-[11px] text-leaf">
                Receipt: <Ext href={txUrl(config, fundTx.nearTxHash)}>{short(fundTx.nearTxHash)}</Ext>
              </p>
            )}
          </div>

          <div className="mt-6 pt-4">
            {projectId && index != null && cs?.status === "planned" && needed > 0n ? (
              accountId ? (
                <button type="button" disabled={pending} onClick={fundStage} className="btn w-full">
                  {pending ? "Signing ft_transfer_call…" : `Fund ${formatUsdc(needed.toString())}`}
                </button>
              ) : (
                <button type="button" onClick={() => void connect()} className="btn-ghost w-full">
                  Connect Wallet to Fund
                </button>
              )
            ) : (
              <div className="border border-line bg-card px-3 py-2 text-center font-mono text-[10px] text-muted uppercase">
                {cs?.status === "released" ? "Tranche Disbursed" : "Capital Locked in Vault"}
              </div>
            )}
          </div>
        </div>

        {/* SEAL 02 */}
        <div className="flex flex-col justify-between border border-dashed border-ink/25 bg-paper/60 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.15em] uppercase">
              <span className="text-vermilion">SEAL 02 · CRITERIA-BOUND AI</span>
              <span className={cs?.verdict?.verdict === "pass" ? "text-leaf" : "text-muted"}>
                {cs?.verdict ? `${cs.verdict.verdict.toUpperCase()} · ${cs.verdict.confidence}%` : "AWAITING PHOTO"}
              </span>
            </div>

            <div className="border border-line bg-card p-3 font-mono text-[10px]">
              <span className="label block">On-Chain Criteria SHA-256</span>
              <span className="mt-1 block break-all text-ink">{cs?.criteria_hash ?? stage.criteriaHash}</span>
            </div>

            {cs?.verdict ? (
              <div className="space-y-1 font-mono text-[10px] text-muted">
                <p>
                  Window: {String(cs.verdict.checks.taken_in_window)} · Site: {String(cs.verdict.checks.on_site)} · Novel:{" "}
                  {String(cs.verdict.checks.not_reused)}
                </p>
                {evWithChain?.chainVerdict?.submitTx && (
                  <p className="text-ink">
                    Verdict Tx: <Ext href={txUrl(config, evWithChain.chainVerdict.submitTx)}>{short(evWithChain.chainVerdict.submitTx)}</Ext>
                  </p>
                )}
                {evWithChain?.chainVerdict?.proposeTx && (
                  <p className="text-ink">
                    Proposal Tx: <Ext href={txUrl(config, evWithChain.chainVerdict.proposeTx)}>{short(evWithChain.chainVerdict.proposeTx)}</Ext>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted">
                Site engineer submits EXIF-geofenced masonry photos from /site with zero NEAR gas.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-2 pt-4">
            {hasPassingVerdict && (
              <button type="button" disabled={proposing} onClick={triggerPropose} className="btn-pop w-full">
                {proposing ? "Submitting propose_release…" : "Propose Release via Agent"}
              </button>
            )}
            <a href={`/site?stage=${stage.id}`} className="btn-ghost w-full">
              Open (02) Site Camera →
            </a>
            {proposeMsg.ok && <p className="font-mono text-[10px] text-leaf">{proposeMsg.ok}</p>}
            {proposeMsg.err && <p className="font-mono text-[10px] text-crimson">{proposeMsg.err}</p>}
          </div>
        </div>

        {/* SEAL 03 */}
        <div className="flex flex-col justify-between border border-dashed border-ink/25 bg-paper/60 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.15em] uppercase">
              <span className="text-vermilion">SEAL 03 · 1 YOCTONEAR RELEASE</span>
              <span className={cs?.status === "proposed" ? "text-vermilion font-semibold" : cs?.status === "released" ? "text-leaf" : "text-muted"}>
                {cs?.status === "proposed" ? "READY TO SIGN" : cs?.status === "released" ? "SETTLED" : "LOCKED"}
              </span>
            </div>

            <p className="font-sans text-lg font-medium tracking-[-0.02em] text-ink">
              {cs?.status === "released"
                ? `Settled to ${short(cs.payee)}`
                : cs?.status === "proposed"
                  ? "Owner wallet signature unlocks USDC"
                  : "Requires Passing TEE Verdict First"}
            </p>
            <p className="text-xs leading-relaxed text-muted">
              Neither Homebound servers nor agent.homebound-hq.testnet can trigger approve_release. Only {chain?.owner ?? "the owner"} with 1 yoctoNEAR settles cash to {short(cs?.payee ?? "chidi.homebound-hq.testnet")}.
            </p>
            {payoutTx?.nearTxHash && (
              <p className="font-mono text-[11px] text-leaf">
                Payout Tx: <Ext href={txUrl(config, payoutTx.nearTxHash)}>{short(payoutTx.nearTxHash)}</Ext>
              </p>
            )}
          </div>

          <div className="mt-6 pt-4">
            {cs?.status === "proposed" ? (
              connectedIsOwner ? (
                <button type="button" disabled={pending} onClick={approveRelease} className="btn-pop w-full">
                  {pending ? "Signing 1 yoctoNEAR…" : `Release ${formatUsdc(cs.funded)} (1 yoctoNEAR)`}
                </button>
              ) : (
                <button type="button" onClick={() => void connect()} className="btn w-full">
                  Connect {short(chain?.owner ?? "Owner")} to Release
                </button>
              )
            ) : (
              <div className="border border-line bg-card px-3 py-2 text-center font-mono text-[10px] text-muted uppercase">
                {cs?.status === "released" ? "Finality Complete" : "Awaiting Seal 02 Proposal"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALWAYS-VISIBLE OWNER SOVEREIGNTY & ESCAPE HATCHES BAR */}
      <div className="border-2 border-dashed border-vermilion/45 bg-paper p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-vermilion uppercase">
              OWNER SOVEREIGNTY &amp; ESCAPE HATCHES · 1 YOCTONEAR AUTHORITY
            </p>
            <p className="mt-1 text-xs text-muted">
              Track 13 Open Innovation guarantee: human ownership overrides AI errors, halts work with instant refunds, and rotates compromised agent keys on-chain.
            </p>
          </div>
          {!connectedIsOwner && (
            <button type="button" onClick={() => void connect()} className="btn-ghost px-3.5 py-2 text-[10px]">
              {accountId ? `Switch to Owner (${short(chain?.owner ?? "tightrat3805.testnet")})` : "Connect Owner Wallet"}
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Escape Hatch 1: refund_stage */}
          <div className="flex flex-col justify-between border border-line bg-card p-5">
            <div className="space-y-2">
              <p className="font-mono text-[10px] tracking-[0.14em] text-crimson uppercase">
                01 · REFUND STAGE (refund_stage)
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Work halted, delayed, or rejected? Reclaim locked Circle USDC directly back to {short(chain?.owner ?? "owner wallet")} before payout.
              </p>
            </div>
            <button
              type="button"
              disabled={!connectedIsOwner || isFinal || !hasFunds || pending}
              onClick={refundStage}
              className="btn-ghost mt-4 w-full border-crimson/40 text-crimson hover:border-crimson hover:bg-crimson hover:text-[#f5f4f0]"
            >
              Refund Stage to Owner
            </button>
          </div>

          {/* Escape Hatch 2: override_release */}
          <div className="flex flex-col justify-between border border-line bg-card p-5">
            <div className="space-y-2">
              <p className="font-mono text-[10px] tracking-[0.14em] text-ink uppercase">
                02 · MANUAL OVERRIDE (override_release)
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Verified masonry via independent surveyor or AI offline? Attach a public reason string and settle with 1 yoctoNEAR.
              </p>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason: e.g. In-person surveyor sign-off"
                className="field mt-2 py-2 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={!connectedIsOwner || isFinal || !hasFunds || !overrideReason.trim() || pending}
              onClick={overrideRelease}
              className="btn mt-4 w-full"
            >
              Override &amp; Release USDC
            </button>
          </div>

          {/* Escape Hatch 3: set_agent */}
          <div className="flex flex-col justify-between border border-line bg-card p-5">
            <div className="space-y-2">
              <p className="font-mono text-[10px] tracking-[0.14em] text-ink uppercase">
                03 · ROTATE RELAYER AGENT (set_agent)
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Freeze or replace the project relayer key immediately if the AI agent endpoint behaves unexpectedly.
              </p>
              <input
                type="text"
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                placeholder="new-agent.testnet"
                className="field mt-2 py-2 font-mono text-xs"
              />
            </div>
            <button
              type="button"
              disabled={!connectedIsOwner || !projectId || !newAgent.trim() || pending}
              onClick={rotateAgent}
              className="btn-ghost mt-4 w-full"
            >
              Update Agent Account
            </button>
          </div>
        </div>
      </div>

      <StatusAlerts error={error} info={info} />
    </section>
  );
}

export function AttestationCard({
  model,
  registeredSigner,
}: {
  model: string;
  registeredSigner: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AttestationReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const checkLive = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/attestation");
      const body = (await res.json()) as { ok: boolean; report?: AttestationReport; error?: string };
      if (!body.ok || !body.report) throw new Error(body.error || "Attestation request failed");
      setReport(body.report);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Attestation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5 border border-line bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            NEAR AI CLOUD · HARDWARE TEE SIGNER
          </p>
          <h2 className="mt-1 font-sans text-2xl font-medium tracking-[-0.03em] text-ink">{model}</h2>
        </div>
        <button type="button" disabled={loading} onClick={() => void checkLive()} className="btn-pop">
          {loading ? "Checking Intel TDX + NRAS…" : "Verify Live TEE Attestation"}
        </button>
      </div>

      {registeredSigner && (
        <div className="border border-dashed border-ink/20 bg-paper p-4 font-mono text-[11px]">
          <span className="label block">On-Chain Registered Ed25519 Public Key</span>
          <span className="mt-1.5 block break-all text-ink">{registeredSigner}</span>
        </div>
      )}

      {err && <p className="border border-crimson/35 bg-crimson/10 px-4 py-3 font-mono text-xs text-crimson">{err}</p>}

      {report && (
        <div className="space-y-2 border border-leaf/35 bg-mint/60 p-4 font-mono text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink">Intel TDX · {report.tcbStatus}</span>
            <span className="rounded-[2px] border border-leaf/35 bg-card px-2 py-0.5 text-[10px] font-semibold text-leaf uppercase">
              {report.matchesOnChain ? "Matches On-Chain Signer" : "Attested"}
            </span>
          </div>
          <p className="break-all text-ink">Signing Address: {report.signingAddress}</p>
          <p className="text-muted">
            GPU NRAS: {report.gpuVerified ? "Verified" : "TDX quote verified"} · Checked{" "}
            {new Date(report.verifiedAt).toLocaleTimeString("en-GB")}
          </p>
        </div>
      )}
    </section>
  );
}
