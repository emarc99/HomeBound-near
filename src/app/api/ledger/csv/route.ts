import { getHeroProject, getProjectView } from "@/lib/queries";
import { nearPublicConfig } from "@/lib/near/config";
import { formatUsdc, usdcForCents } from "@/lib/near/shared";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function trustedPaymentStatus(
  stageStatus: string,
  nearStatus: string | null,
  fundedCents: number,
  paidCents: number,
): "Paid" | "Proposed" | "Funded" | "Refunded" | "Planned" {
  if (nearStatus === "refunded") return "Refunded";
  if (stageStatus === "paid" || nearStatus === "released" || paidCents > 0) return "Paid";
  if (nearStatus === "proposed") return "Proposed";
  if (
    nearStatus === "funded" ||
    fundedCents > 0 ||
    stageStatus === "funded" ||
    stageStatus === "evidence_submitted" ||
    stageStatus === "verified"
  ) {
    return "Funded";
  }
  return "Planned";
}

export async function GET() {
  const hero = await getHeroProject();
  if (!hero) {
    return new Response("No project found\n", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  const view = await getProjectView(hero.id);
  if (!view) {
    return new Response("Project not found\n", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  const cfg = nearPublicConfig();
  const contractor = view.parties.find((p) => p.role === "contractor");
  const payeeAccount = contractor?.nearAccountId ?? "chidi.homebound-hq.testnet";

  const headers = [
    "seq",
    "stage_name",
    "status_trusted",
    "escrow_project_id",
    "near_stage_index",
    "amount_usd",
    "demo_usdc",
    "amount_ngn",
    "payee_account",
    "criteria_hash",
    "evidence_sha256",
    "near_tx_hash",
    "explorer_url",
    "updated_at",
  ];

  const rows = view.stages.map((s) => {
    const stagePayments = view.payments.filter((p) => p.stageId === s.id);
    const refundedPayment = stagePayments.find((p) => p.status === "refunded");
    const fundedCents = stagePayments
      .filter((p) => p.kind === "funding" && p.status === "completed")
      .reduce((sum, p) => sum + p.amountUsdCents, 0);
    const paidCents = stagePayments
      .filter((p) => p.kind === "labor" && p.status === "completed")
      .reduce((sum, p) => sum + p.amountUsdCents, 0);
    const txPayment =
      stagePayments.find((p) => p.kind === "labor" && p.nearTxHash) ??
      stagePayments.find((p) => p.nearTxHash);
    const stageEvidence = view.evidence.find((e) => e.stageId === s.id);
    const nearTxHash =
      txPayment?.nearTxHash ??
      stageEvidence?.chainVerdict?.proposeTx ??
      stageEvidence?.chainVerdict?.submitTx ??
      "";
    const status = refundedPayment
      ? "Refunded"
      : trustedPaymentStatus(s.status, s.nearStatus, fundedCents, paidCents);
    const amountUsd = (s.laborTrancheUsdCents / 100).toFixed(2);
    const demoUsdc = formatUsdc(usdcForCents(s.laborTrancheUsdCents, cfg.demoDivisor));
    const amountNgn = Math.round((s.laborTrancheUsdCents / 100) * view.project.ngnPerUsd);
    const explorerUrl = nearTxHash ? `${cfg.explorer}/transactions/${nearTxHash}` : "";
    const updatedAt =
      (txPayment?.updatedAt ?? txPayment?.createdAt ?? stageEvidence?.createdAt ?? s.startDate).toISOString();

    return [
      s.seq,
      s.name,
      status,
      view.project.nearProjectId ?? "",
      s.nearStageIndex ?? "",
      amountUsd,
      demoUsdc,
      amountNgn,
      payeeAccount,
      s.criteriaHash,
      stageEvidence?.sha256 ?? "",
      nearTxHash,
      explorerUrl,
      updatedAt,
    ]
      .map(csvCell)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n") + "\r\n";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="homebound-ledger.csv"',
      "Cache-Control": "no-store",
    },
  });
}
