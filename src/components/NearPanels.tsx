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
    <a href={href} target="_blank" rel="noreferrer" className="font-mono text-ink underline decoration-ink/35 underline-offset-2 hover:text-pepper">
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

  const run = (label: string, calls: () => Promise<WalletCall[]>, record: { kind: NearTxKind; id: string }) =>
    start(async () => {
      setError(null);
      setInfo(null);
      try {
        const hashes = await send(await calls());
        const hash = hashes[hashes.length - 1];
        const res = await recordNearTxAction(record.kind, record.id, hash, accountId ?? "");
        if (!res.ok) setError(res.error);
        else {
          setInfo(`${label} confirmed on NEAR.`);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "The wallet did not sign the transaction.");
      }
    });

  return { pending, error, info, run };
}

function StatusAlerts({ error, info }: { error: string | null; info: string | null }) {
  return (
    <>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}
      {info && <p className="rounded-xl border border-leaf/25 bg-mint px-3 py-2 text-xs text-leaf">{info}</p>}
    </>
  );
}

export function NearProjectBanner({ view }: { view: ClientView }) {
  const { near } = view;
  const { config, chain } = near;
  const wallet = useNearWallet();
  const { pending, error, info, run } = useWalletAction();

  const totalRaw = chain
    ? chain.stages.reduce((a, s) => a + BigInt(s.amount), 0n)
    : view.stages.reduce((a, s) => a + usdcForCents(s.laborTrancheUsdCents, config.demoDivisor), 0n);
  const escrowedRaw = chain
    ? chain.stages
        .filter((s) => s.status === "funded" || s.status === "proposed")
        .reduce((a, s) => a + BigInt(s.funded), 0n)
    : 0n;
  const releasedRaw = chain
    ? chain.stages.filter((s) => s.status === "released").reduce((a, s) => a + BigInt(s.amount), 0n)
    : 0n;

  const putOnChain = () =>
    run(
      "Project",
      async () => {
        const res = await nearProjectPlanAction(view.project.id);
        if (!res.ok || !res.data) throw new Error(res.ok ? "No plan returned" : res.error);
        const plan = res.data;
        const storage: WalletCall[] = plan.payeesNeedingStorage.map((account_id) => ({
          receiverId: config.usdc,
          methodName: "storage_deposit",
          args: { account_id, registration_only: true },
          gasTgas: 30,
          deposit: plan.storageDeposit,
        }));
        return [
          ...storage,
          {
            receiverId: config.escrow,
            methodName: "create_project",
            args: {
              project_id: plan.projectId,
              agent: plan.agent,
              stages: plan.stages.map(({ name, payee, amount, criteria_hash }) => ({
                name,
                payee,
                amount,
                criteria_hash,
              })),
            },
            gasTgas: 100,
            deposit: plan.deposit,
          },
        ];
      },
      { kind: "project", id: view.project.id },
    );

  return (
    <section className="space-y-3 border-b border-line pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">
            {view.project.siteCity}, {view.project.siteState} · Built from {view.project.ownerCity}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{view.project.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!near.nearProjectId && wallet.accountId ? (
            <button type="button" disabled={pending} onClick={putOnChain} className="btn-pop px-5 py-2.5 text-xs">
              {pending ? "Waiting for wallet…" : "Put project on NEAR"}
            </button>
          ) : null}
          {!near.nearProjectId && !wallet.accountId ? (
            <button type="button" onClick={() => void wallet.connect()} className="btn-pop px-5 py-2.5 text-xs">
              Connect wallet to deploy
            </button>
          ) : null}
          {chain ? (
            <span className="rounded-full bg-mint px-3 py-1.5 font-mono text-xs font-semibold text-leaf">
              Live on NEAR {config.network}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-muted">
        <span>
          Pool <strong className="text-ink">{formatUsdc(totalRaw.toString())}</strong>
        </span>
        <span>
          Escrowed <strong className="text-ink">{formatUsdc(escrowedRaw.toString())}</strong>
        </span>
        <span>
          Paid <strong className="text-ink">{formatUsdc(releasedRaw.toString())}</strong>
        </span>
        <span>
          Contract <Ext href={accountUrl(config, config.escrow)}>{config.escrow}</Ext>
        </span>
        {near.contractorAccount && (
          <span>
            Payee <Ext href={accountUrl(config, near.contractorAccount)}>{short(near.contractorAccount)}</Ext>
          </span>
        )}
      </div>

      {near.readError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{near.readError}</p>
      )}
      <StatusAlerts error={error} info={info} />
    </section>
  );
}

const CHAIN_STATUS_TEXT: Record<ChainStageStatus, string> = {
  planned: "Awaiting owner USDC funding",
  funded: "USDC locked · awaiting TEE photo verdict",
  proposed: "AI proposed payout · owner 1 yoctoNEAR required",
  released: "Paid out to contractor",
  refunded: "Refunded to owner",
};

export function NearStageEscrow({ view, stage }: { view: ClientView; stage: ClientStage }) {
  const router = useRouter();
  const { near } = view;
  const { config, chain } = near;
  const wallet = useNearWallet();
  const { pending, error, info, run } = useWalletAction();
  const [proposePending, startPropose] = useTransition();
  const [proposeMsg, setProposeMsg] = useState<{ err: string | null; ok: string | null }>({ err: null, ok: null });
  const [overrideReason, setOverrideReason] = useState("");

  const stageUsdcRaw =
    stage.nearStageIndex != null && chain
      ? chain.stages[stage.nearStageIndex].amount
      : usdcForCents(stage.laborTrancheUsdCents, config.demoDivisor).toString();

  if (stage.status === "paid" && stage.nearStageIndex == null) {
    return (
      <section className="card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="label">Escrow & Owner Locks</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {String(stage.seq).padStart(2, "0")}. {stage.name}
            </h2>
          </div>
          <span className="rounded-full bg-mint px-3 py-1 font-mono text-xs font-semibold text-leaf">
            Settled
          </span>
        </div>

        <p className="text-sm text-muted">{stage.description}</p>

        <div className="space-y-2.5 rounded-2xl border border-line bg-paper p-4 text-xs">
          <LockRow done={true} label="Completed & paid before on-chain rollout" detail={`${formatUsdc(stageUsdcRaw)} · ${formatNgn(stage.laborTrancheNgn)}`} />
          <LockRow done={true} label="Contract schedule begins at next open stage" detail="Select Stage 03 (Blockwork to lintel) for live NEAR escrow" />
        </div>
      </section>
    );
  }

  if (stage.nearStageIndex == null || !chain || !near.nearProjectId) {
    return (
      <section className="card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="label">Escrow & Owner Locks</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {String(stage.seq).padStart(2, "0")}. {stage.name}
            </h2>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 font-mono text-xs font-medium ring-1 ring-line">
            {formatUsdc(stageUsdcRaw)} · {formatNgn(stage.laborTrancheNgn)}
          </span>
        </div>

        <p className="text-sm text-muted">{stage.description}</p>

        <div className="space-y-2.5 rounded-2xl border border-line bg-paper p-4 text-xs">
          <LockRow done={false} label="Lock 1 · Register & fund USDC on NEAR" detail="Connect wallet and click 'Put project on NEAR' first" />
          <LockRow done={false} label="Lock 2 · NEAR AI Cloud TEE photo verdict" detail="Submit or test a site photo on Foreman Site (/site)" />
          <LockRow done={false} label="Lock 3 · Owner 1 yoctoNEAR approval" detail="Unlocks after Locks 1 & 2 pass" />
        </div>
      </section>
    );
  }

  const index = stage.nearStageIndex;
  const projectId = near.nearProjectId;
  const cs = chain.stages[index];
  const isOwner = wallet.accountId === chain.owner;
  const needed = BigInt(cs.amount) - BigInt(cs.funded);
  const canFund = (cs.status === "planned" || needed > 0n) && cs.status !== "released" && cs.status !== "refunded";
  const stageTxs = view.payments.filter((p) => p.stageId === stage.id && p.nearTxHash);
  const matchingEv = view.evidence.find((e) => e.stageId === stage.id && e.chainVerdict?.responseHash === cs.verdict?.response_hash);
  const canRetryPropose =
    cs.status === "funded" &&
    cs.verdict?.verdict === "pass" &&
    cs.verdict.confidence >= 60 &&
    cs.verdict.checks.taken_in_window &&
    cs.verdict.checks.on_site &&
    cs.verdict.checks.not_reused;

  const escrowCall = (methodName: string, args: Record<string, unknown>): WalletCall => ({
    receiverId: config.escrow,
    methodName,
    args: { project_id: projectId, stage: index, ...args },
    gasTgas: 100,
    deposit: ONE_YOCTO,
  });

  const fundStage = () =>
    run(
      "Stage funding",
      async () => [
        {
          receiverId: config.usdc,
          methodName: "ft_transfer_call",
          args: { receiver_id: config.escrow, amount: needed.toString(), msg: JSON.stringify({ project_id: projectId, stage: index }) },
          gasTgas: 100,
          deposit: ONE_YOCTO,
        },
      ],
      { kind: "fund", id: stage.id },
    );

  const approveRelease = () => run("Stage payout", async () => [escrowCall("approve_release", {})], { kind: "release", id: stage.id });

  const overrideRelease = () =>
    run("Manual override payout", async () => [escrowCall("override_release", { reason: overrideReason.trim() })], {
      kind: "release",
      id: stage.id,
    });

  const refundStage = () => {
    if (!window.confirm(`Return ${formatUsdc(cs.funded)} from escrow back to owner wallet? This stage cannot be re-funded.`)) return;
    run("Stage refund", async () => [escrowCall("refund_stage", {})], { kind: "refund", id: stage.id });
  };

  const retryPropose = () =>
    startPropose(async () => {
      setProposeMsg({ err: null, ok: null });
      const res = await proposeStageReleaseAction(stage.id);
      if (!res.ok) setProposeMsg({ err: res.error, ok: null });
      else {
        setProposeMsg({ err: null, ok: `Release proposed on NEAR (${res.data?.txHash.slice(0, 10)}…).` });
        router.refresh();
      }
    });

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Escrow & Owner Locks</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {String(stage.seq).padStart(2, "0")}. {stage.name}
          </h2>
          <p className="mt-1 text-xs text-muted">{CHAIN_STATUS_TEXT[cs.status]}</p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 font-mono text-xs font-medium ring-1 ring-line">
          {formatUsdc(cs.funded)} / {formatUsdc(cs.amount)}
        </span>
      </div>

      <p className="text-sm text-muted">{stage.description}</p>

      <div className="space-y-2.5 rounded-2xl border border-line bg-paper p-4 text-xs">
        <LockRow
          done={BigInt(cs.funded) >= BigInt(cs.amount) || cs.status === "released"}
          label="Lock 1 · USDC escrowed on contract"
          detail={`Payee locked to ${short(cs.payee)}`}
        />
        <LockRow
          done={Boolean(cs.verdict && cs.verdict.verdict === "pass")}
          label="Lock 2 · NEAR AI TEE verdict on chain"
          detail={
            cs.verdict
              ? `${cs.verdict.verdict.toUpperCase()} (${cs.verdict.confidence}%) · Ed25519 verified`
              : "Awaiting passing photo from Foreman Site (/site)"
          }
        />
        <LockRow
          done={cs.status === "released"}
          label="Lock 3 · Owner 1 yoctoNEAR wallet approval"
          detail={
            cs.status === "released"
              ? "Approved & paid to contractor"
              : cs.status === "proposed"
                ? "Unlocked! Waiting for owner wallet"
                : "Locked until Locks 1 & 2 clear"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {!wallet.accountId ? (
          <button type="button" onClick={() => void wallet.connect()} className="btn px-4 py-2 text-xs">
            Connect NEAR wallet
          </button>
        ) : (
          <>
            {canFund && (
              <button type="button" disabled={pending || !isOwner} onClick={fundStage} className="btn-pop px-5 py-2.5 text-xs">
                {pending ? "Signing…" : `Fund ${formatUsdc(needed.toString())}`}
              </button>
            )}
            {canRetryPropose && (
              <button type="button" disabled={proposePending} onClick={retryPropose} className="btn px-5 py-2.5 text-xs">
                {proposePending ? "Proposing…" : "Submit AI release proposal"}
              </button>
            )}
            {cs.status === "proposed" && (
              <button type="button" disabled={pending || !isOwner} onClick={approveRelease} className="btn-pop px-5 py-2.5 text-xs">
                {pending ? "Signing 1 yoctoNEAR…" : `Approve & pay ${formatUsdc(cs.amount)}`}
              </button>
            )}
          </>
        )}
      </div>

      {wallet.accountId && !isOwner && cs.status !== "released" && cs.status !== "refunded" && (
        <p className="text-xs text-muted">
          Signed in as <span className="font-mono text-ink">{short(wallet.accountId)}</span>. Only owner{" "}
          <span className="font-mono text-ink">{short(chain.owner)}</span> can fund, approve, override, or refund.
        </p>
      )}

      {isOwner && (cs.status === "funded" || cs.status === "proposed") && (
        <details className="rounded-2xl border border-line bg-paper/70 px-4 py-3 text-xs">
          <summary className="cursor-pointer font-medium text-ink">Owner escape controls (override / refund)</summary>
          <div className="mt-3 space-y-3">
            {cs.status === "funded" && (
              <div className="flex flex-wrap gap-2">
                <input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason to override AI block"
                  className="field min-w-[180px] flex-1 py-2 text-xs"
                />
                <button
                  type="button"
                  disabled={pending || overrideReason.trim().length < 4}
                  onClick={overrideRelease}
                  className="btn-ghost px-3 py-2 text-xs"
                >
                  Override & pay
                </button>
              </div>
            )}
            {BigInt(cs.funded) > 0n && (
              <button type="button" disabled={pending} onClick={refundStage} className="btn-ghost px-3 py-2 text-xs text-red-700 ring-red-300">
                Refund {formatUsdc(cs.funded)} to owner
              </button>
            )}
          </div>
        </details>
      )}

      {matchingEv?.chainVerdict?.submitTx && (
        <p className="font-mono text-[11px] text-muted">
          Verdict tx: <Ext href={txUrl(config, matchingEv.chainVerdict.submitTx)}>{short(matchingEv.chainVerdict.submitTx)}</Ext>
          {matchingEv.chainVerdict.proposeTx && (
            <>
              {" · Proposal tx: "}
              <Ext href={txUrl(config, matchingEv.chainVerdict.proposeTx)}>{short(matchingEv.chainVerdict.proposeTx)}</Ext>
            </>
          )}
        </p>
      )}

      {stageTxs.length > 0 && (
        <ul className="space-y-1 border-t border-dashed border-line pt-3 text-xs">
          {stageTxs.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <Ext href={txUrl(config, p.nearTxHash as string)}>
                {p.direction === "in" ? (p.status === "refunded" ? "Funded (refunded)" : "USDC funded") : `Paid ${p.payeeName ?? "contractor"}`}
              </Ext>
              <span className="font-mono text-[11px] text-muted">
                {new Date(p.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}

      <StatusAlerts error={error ?? proposeMsg.err} info={info ?? proposeMsg.ok} />
    </section>
  );
}

function LockRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          done ? "bg-mint text-leaf" : "bg-card text-muted ring-1 ring-line"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <div>
        <span className="font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-muted">{detail}</span>
      </div>
    </div>
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
    <section className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">NEAR AI Cloud · Confidential TEE</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{model}</h2>
        </div>
        <button type="button" disabled={loading} onClick={() => void checkLive()} className="btn-pop px-4 py-2 text-xs">
          {loading ? "Checking TDX + GPU…" : "Verify live TEE attestation"}
        </button>
      </div>

      {registeredSigner && (
        <div className="rounded-2xl border border-line bg-paper p-3 font-mono text-[11px] text-muted">
          <span className="block text-[10px] uppercase tracking-wider">On-chain contract signer</span>
          <span className="mt-1 block break-all text-ink">{registeredSigner}</span>
        </div>
      )}

      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">{err}</p>}

      {report && (
        <div className="space-y-1.5 rounded-2xl border border-line bg-paper p-3 font-mono text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-ink">Intel TDX · {report.tcbStatus}</span>
            <span className={`rounded-full px-2 py-0.5 ${report.matchesOnChain ? "bg-mint text-leaf" : "bg-amber-50 text-amber-800"}`}>
              {report.matchesOnChain ? "Matches on-chain signer" : "Attested"}
            </span>
          </div>
          <p className="break-all text-muted">Signing key: {report.signingAddress}</p>
          <p className="text-muted">GPU NRAS: {report.gpuVerified ? "Verified" : "TDX quote verified"} · Checked {new Date(report.verifiedAt).toLocaleTimeString("en-GB")}</p>
        </div>
      )}
    </section>
  );
}
