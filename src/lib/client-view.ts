import type { ProjectView } from "./queries";
import type { EvidenceVerdict } from "@/db/schema";
import type { ChainProject, ChainStageStatus, ChainVerdict, NearPublicConfig } from "./near/shared";

export type ClientNear = {
  config: NearPublicConfig;
  nearProjectId: string | null;
  chain: ChainProject | null;
  contractorAccount: string | null;
  contractorUsdc: string | null;
  registeredSigner: string | null;
  readError: string | null;
};

export type ClientStage = {
  id: string;
  seq: number;
  name: string;
  description: string;
  startDate: string;
  durationDays: number;
  laborTrancheUsdCents: number;
  laborTrancheNgn: number;
  status: string;
  dependsOnStageId: string | null;
  acceptanceCriteria: string;
  fundedUsdCents: number;
  laborPaidUsdCents: number;
  nearStageIndex: number | null;
  nearStatus: ChainStageStatus | null;
  criteriaHash: string;
};

export type ClientPayment = {
  id: string;
  stageId: string | null;
  kind: string;
  direction: "in" | "out";
  amountUsdCents: number;
  amountNgn: number;
  payeeName: string | null;
  status: string;
  nearTxHash: string | null;
  createdAt: string;
};

export type ClientEvidence = {
  id: string;
  stageId: string;
  blobKey: string | null;
  sha256: string | null;
  takenAt: string | null;
  lat: number | null;
  lng: number | null;
  uploadedByName: string | null;
  verdict: EvidenceVerdict | null;
  chainVerdict: ChainVerdict | null;
  createdAt: string;
};

export type ClientView = {
  project: {
    id: string;
    name: string;
    ownerName: string;
    ownerCity: string;
    ownerCountry: string;
    siteCity: string;
    siteState: string;
    ngnPerUsd: number;
  };
  stages: ClientStage[];
  payments: ClientPayment[];
  evidence: ClientEvidence[];
  near: ClientNear;
};

export function toClientView(v: ProjectView, near: ClientNear): ClientView {
  const partyName = new Map(v.parties.map((p) => [p.id, p.name]));
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    project: {
      id: v.project.id,
      name: v.project.name,
      ownerName: v.project.ownerName,
      ownerCity: v.project.ownerCity,
      ownerCountry: v.project.ownerCountry,
      siteCity: v.project.siteCity,
      siteState: v.project.siteState,
      ngnPerUsd: v.project.ngnPerUsd,
    },
    stages: v.stages.map((s) => {
      const cs = s.nearStageIndex != null && near.chain ? near.chain.stages[s.nearStageIndex] : null;
      const effectiveNearStatus = cs?.status ?? s.nearStatus;
      const effectiveStatus =
        effectiveNearStatus === "released"
          ? "paid"
          : effectiveNearStatus === "proposed"
            ? "verified"
            : effectiveNearStatus === "funded" && s.status === "planned"
              ? "funded"
              : s.status;
      const fundedFromPayments = v.payments
        .filter((p) => p.stageId === s.id && p.kind === "funding" && p.status === "completed")
        .reduce((a, p) => a + p.amountUsdCents, 0);
      const paidFromPayments = v.payments
        .filter((p) => p.stageId === s.id && p.kind === "labor" && p.status === "completed")
        .reduce((a, p) => a + p.amountUsdCents, 0);
      const isFundedOnChain =
        effectiveNearStatus === "funded" || effectiveNearStatus === "proposed" || effectiveNearStatus === "released";
      return {
        id: s.id,
        seq: s.seq,
        name: s.name,
        description: s.description,
        startDate: s.startDate.toISOString(),
        durationDays: s.durationDays,
        laborTrancheUsdCents: s.laborTrancheUsdCents,
        laborTrancheNgn: Math.round((s.laborTrancheUsdCents / 100) * v.project.ngnPerUsd),
        status: effectiveStatus,
        dependsOnStageId: s.dependsOnStageId,
        acceptanceCriteria: s.acceptanceCriteria,
        fundedUsdCents: isFundedOnChain ? Math.max(fundedFromPayments, s.laborTrancheUsdCents) : fundedFromPayments,
        laborPaidUsdCents: effectiveNearStatus === "released" ? Math.max(paidFromPayments, s.laborTrancheUsdCents) : paidFromPayments,
        nearStageIndex: s.nearStageIndex,
        nearStatus: effectiveNearStatus,
        criteriaHash: cs?.criteria_hash ?? s.criteriaHash,
      };
    }),
    payments: v.payments.map((p) => ({
      id: p.id,
      stageId: p.stageId,
      kind: p.kind,
      direction: p.direction,
      amountUsdCents: p.amountUsdCents,
      amountNgn: p.amountNgn,
      payeeName: p.payeeId ? (partyName.get(p.payeeId) ?? null) : null,
      status: p.status,
      nearTxHash: p.nearTxHash,
      createdAt: p.createdAt.toISOString(),
    })),
    evidence: v.evidence.map((e) => ({
      id: e.id,
      stageId: e.stageId,
      blobKey: e.blobKey,
      sha256: e.sha256,
      takenAt: iso(e.takenAt),
      lat: e.lat,
      lng: e.lng,
      uploadedByName: e.uploadedById ? (partyName.get(e.uploadedById) ?? null) : null,
      verdict: e.verdict,
      chainVerdict: e.chainVerdict,
      createdAt: e.createdAt.toISOString(),
    })),
    near,
  };
}
