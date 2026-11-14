import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, type Db } from "@/db";
import { evidence, ledgerEvents, parties, payments, projects, stages } from "@/db/schema";
import { appendLedger } from "@/lib/ledger";
import { usdCentsToNgn } from "@/lib/money";
import type { SignedVerdict } from "@/lib/ai/nearai";
import { isAgentConfigured, nearPublicConfig } from "@/lib/near/config";
import { AgentCallError, anchorLedgerOnChain, proposeReleaseOnChain, submitVerdictOnChain } from "@/lib/near/agent";
import { getChainProject, readTransaction, usdcStorageMinimum, usdcStorageRegistered, type EscrowEvent } from "@/lib/near/views";
import { chainProjectId, usdcForCents, verdictReference, type ChainVerdict } from "@/lib/near/shared";

export class FlowError extends Error {}

const CREATE_PROJECT_DEPOSIT = "100000000000000000000000"; // 0.1 NEAR; unused storage deposit is refunded by the contract

async function anchorLedgerHead(db: Db, nearProjectId: string): Promise<string | null> {
  if (!isAgentConfigured()) return null;
  const [head] = await db.select({ seq: ledgerEvents.seq, hash: ledgerEvents.hash }).from(ledgerEvents).orderBy(desc(ledgerEvents.seq)).limit(1);
  if (!head) return null;
  try {
    return await anchorLedgerOnChain(nearProjectId, head.seq, head.hash);
  } catch (err) {
    console.warn("ledger anchor skipped", err instanceof Error ? err.message : err);
    return null;
  }
}

export type NearProjectPlan = {
  projectId: string;
  agent: string;
  deposit: string;
  stages: { stageId: string; name: string; payee: string; amount: string; criteria_hash: string }[];
  payeesNeedingStorage: string[];
  storageDeposit: string;
};

export async function nearProjectPlan(projectId: string): Promise<NearProjectPlan> {
  const db = await getDb();
  const cfg = nearPublicConfig();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) throw new FlowError("Project not found");
  if (project.nearProjectId) throw new FlowError("This project is already on NEAR.");
  const open = (await db.select().from(stages).where(eq(stages.projectId, projectId)).orderBy(asc(stages.seq))).filter(
    (s) => s.status !== "paid",
  );
  if (!open.length) throw new FlowError("Every stage is already paid.");
  const contractorIds = [...new Set(open.map((s) => s.contractorId).filter((id): id is string => Boolean(id)))];
  const payees = contractorIds.length ? await db.select().from(parties).where(inArray(parties.id, contractorIds)) : [];
  const payeeOf = new Map(payees.map((p) => [p.id, p.nearAccountId]));

  const planStages = open.map((s) => {
    const payee = s.contractorId ? payeeOf.get(s.contractorId) : null;
    if (!payee) throw new FlowError(`Stage "${s.name}" has no contractor NEAR account to pay.`);
    return {
      stageId: s.id,
      name: s.name,
      payee,
      amount: usdcForCents(s.laborTrancheUsdCents, cfg.demoDivisor).toString(),
      criteria_hash: createHash("sha256").update(s.acceptanceCriteria).digest("hex"),
    };
  });
  const uniquePayees = [...new Set(planStages.map((s) => s.payee))];
  const registered = await Promise.all(uniquePayees.map(usdcStorageRegistered));
  return {
    projectId: chainProjectId(project.id),
    agent: cfg.agent,
    deposit: CREATE_PROJECT_DEPOSIT,
    stages: planStages,
    payeesNeedingStorage: uniquePayees.filter((_, i) => !registered[i]),
    storageDeposit: await usdcStorageMinimum(),
  };
}

function eventsFor(events: EscrowEvent[], name: string, nearProjectId: string, stage?: number) {
  return events.filter(
    (e) => e.event === name && e.data.project_id === nearProjectId && (stage === undefined || Number(e.data.stage) === stage),
  );
}

async function readEscrowTx(txHash: string, signerId: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(txHash)) throw new FlowError("That is not a NEAR transaction hash.");
  try {
    return await readTransaction(txHash, signerId);
  } catch {
    throw new FlowError("Couldn't find that transaction on NEAR yet. Try again in a few seconds.");
  }
}

export async function recordProjectCreated(projectId: string, txHash: string, signerId: string) {
  const db = await getDb();
  const cfg = nearPublicConfig();
  const plan = await nearProjectPlan(projectId);
  const tx = await readEscrowTx(txHash, signerId);
  if (tx.receiver !== cfg.escrow || !eventsFor(tx.escrowEvents, "project_created", plan.projectId).length) {
    throw new FlowError("That transaction didn't create this project on the escrow contract.");
  }
  const chain = await getChainProject(plan.projectId);
  if (!chain) throw new FlowError("The project isn't on chain yet.");
  const matches =
    chain.agent === cfg.agent &&
    chain.stages.length === plan.stages.length &&
    chain.stages.every((s, i) => s.payee === plan.stages[i].payee && s.amount === plan.stages[i].amount);
  if (!matches) throw new FlowError("The project on chain doesn't match this plan (agent, payees or amounts differ).");

  await db.update(projects).set({ nearProjectId: plan.projectId }).where(eq(projects.id, projectId));
  for (const [i, s] of plan.stages.entries()) {
    await db.update(stages).set({ nearStageIndex: i, nearStatus: chain.stages[i].status }).where(eq(stages.id, s.stageId));
  }
  await appendLedger(db, {
    projectId,
    type: "near.project_created",
    actor: `${chain.owner} (owner wallet)`,
    payload: { nearProjectId: plan.projectId, txHash, escrow: cfg.escrow, stages: plan.stages.length, agent: chain.agent },
  });
  await anchorLedgerHead(db, plan.projectId);
}

async function loadStage(stageId: string) {
  const db = await getDb();
  const [stage] = await db.select().from(stages).where(eq(stages.id, stageId));
  if (!stage) throw new FlowError("Stage not found");
  const [project] = await db.select().from(projects).where(eq(projects.id, stage.projectId));
  if (!project.nearProjectId || stage.nearStageIndex == null) throw new FlowError("This stage isn't on NEAR yet.");
  return { db, stage, project, nearProjectId: project.nearProjectId, index: stage.nearStageIndex };
}

const centsForRaw = (raw: bigint, demoDivisor: number) => Number((raw * BigInt(demoDivisor)) / 10_000n);

async function tryAutoPropose(db: Db, projectId: string, stageId: string, nearProjectId: string, index: number) {
  if (!isAgentConfigured()) return null;
  const chain = await getChainProject(nearProjectId);
  const cs = chain?.stages[index];
  if (!cs || cs.status !== "funded" || !cs.verdict) return null;
  const prevReleased = index === 0 || chain.stages[index - 1]?.status === "released";
  const checksOk = cs.verdict.checks.taken_in_window && cs.verdict.checks.on_site && cs.verdict.checks.not_reused;
  if (!prevReleased || cs.verdict.verdict !== "pass" || cs.verdict.confidence < 60 || !checksOk) return null;
  const proposeTx = await proposeReleaseOnChain(nearProjectId, index);
  await db.update(stages).set({ nearStatus: "proposed" }).where(eq(stages.id, stageId));
  await appendLedger(db, {
    projectId,
    type: "near.release_proposed",
    actor: `${nearPublicConfig().agent} (agent key)`,
    payload: { stageId, nearProjectId, stage: index, txHash: proposeTx },
  });
  return proposeTx;
}

export async function recordStageFunding(stageId: string, txHash: string, signerId: string) {
  const { db, stage, project, nearProjectId, index } = await loadStage(stageId);
  const cfg = nearPublicConfig();
  const tx = await readEscrowTx(txHash, signerId);
  const funded = eventsFor(tx.escrowEvents, "funded", nearProjectId, index);
  if (tx.receiver !== cfg.usdc || !funded.length) throw new FlowError("That transaction didn't fund this stage.");
  const accepted = funded.reduce((a, e) => a + BigInt(String(e.data.amount)), 0n);
  const fully = funded.some((e) => e.data.fully_funded === true);
  const cents = centsForRaw(accepted, cfg.demoDivisor);

  const inserted = await db
    .insert(payments)
    .values({
      projectId: project.id,
      stageId: stage.id,
      kind: "funding",
      direction: "in",
      amountUsdCents: cents,
      amountNgn: usdCentsToNgn(cents, project.ngnPerUsd),
      status: "completed",
      idempotencyKey: `near:${txHash}`,
      nearTxHash: txHash,
      approvedBy: tx.signer,
    })
    .onConflictDoNothing()
    .returning({ id: payments.id });
  if (!inserted.length) return;

  await db
    .update(stages)
    .set({ nearStatus: fully ? "funded" : "planned", ...(fully ? { status: "funded" as const } : {}) })
    .where(and(eq(stages.id, stage.id), inArray(stages.status, ["planned", "funded", "evidence_submitted", "verified"])));
  await appendLedger(db, {
    projectId: project.id,
    type: "near.stage_funded",
    actor: `${tx.signer} (owner wallet)`,
    payload: { stageId: stage.id, nearProjectId, stage: index, usdcRaw: accepted.toString(), fullyFunded: fully, txHash },
  });
  if (fully) {
    try {
      await tryAutoPropose(db, project.id, stage.id, nearProjectId, index);
    } catch (err) {
      console.warn("post-funding auto-propose skipped", err instanceof Error ? err.message : err);
    }
  }
  await anchorLedgerHead(db, nearProjectId);
}

export async function proposeStageRelease(stageId: string): Promise<string> {
  const { db, stage, project, nearProjectId, index } = await loadStage(stageId);
  if (!isAgentConfigured()) throw new FlowError("Agent key is not configured.");
  try {
    const txHash = await proposeReleaseOnChain(nearProjectId, index);
    await db.update(stages).set({ nearStatus: "proposed" }).where(eq(stages.id, stage.id));
    await appendLedger(db, {
      projectId: project.id,
      type: "near.release_proposed",
      actor: `${nearPublicConfig().agent} (agent key)`,
      payload: { stageId: stage.id, nearProjectId, stage: index, txHash },
    });
    await anchorLedgerHead(db, nearProjectId);
    return txHash;
  } catch (err) {
    throw new FlowError(err instanceof AgentCallError ? err.message : "Could not propose release on NEAR.");
  }
}

export async function recordStageRelease(stageId: string, txHash: string, signerId: string) {
  const { db, stage, project, nearProjectId, index } = await loadStage(stageId);
  const cfg = nearPublicConfig();
  const tx = await readEscrowTx(txHash, signerId);
  if (tx.receiver !== cfg.escrow) throw new FlowError("That transaction wasn't sent to the escrow contract.");
  if (eventsFor(tx.escrowEvents, "payout_failed", nearProjectId, index).length) {
    throw new FlowError("NEAR couldn't pay the contractor (is their account registered with USDC?). The stage was rolled back.");
  }
  const [released] = eventsFor(tx.escrowEvents, "released", nearProjectId, index);
  if (!released) throw new FlowError("That transaction didn't release this stage.");
  const raw = BigInt(String(released.data.amount));
  const cents = centsForRaw(raw, cfg.demoDivisor);
  const override = typeof released.data.override_reason === "string" ? released.data.override_reason : null;

  const inserted = await db
    .insert(payments)
    .values({
      projectId: project.id,
      stageId: stage.id,
      kind: "labor",
      direction: "out",
      amountUsdCents: cents,
      amountNgn: usdCentsToNgn(cents, project.ngnPerUsd),
      payeeId: stage.contractorId,
      status: "completed",
      idempotencyKey: `near:${txHash}`,
      nearTxHash: txHash,
      approvedBy: tx.signer,
    })
    .onConflictDoNothing()
    .returning({ id: payments.id });
  if (!inserted.length) return;

  await db.update(stages).set({ status: "paid", nearStatus: "released" }).where(eq(stages.id, stage.id));
  await appendLedger(db, {
    projectId: project.id,
    type: override ? "near.stage_released_override" : "near.stage_released",
    actor: `${tx.signer} (owner wallet)`,
    payload: { stageId: stage.id, nearProjectId, stage: index, to: released.data.to, usdcRaw: raw.toString(), override, txHash },
  });
  await anchorLedgerHead(db, nearProjectId);
}

export async function recordStageRefund(stageId: string, txHash: string, signerId: string) {
  const { db, stage, project, nearProjectId, index } = await loadStage(stageId);
  const tx = await readEscrowTx(txHash, signerId);
  const [refunded] = eventsFor(tx.escrowEvents, "refunded", nearProjectId, index);
  if (tx.receiver !== nearPublicConfig().escrow || !refunded) throw new FlowError("That transaction didn't refund this stage.");
  if (stage.nearStatus === "refunded") return;

  await db
    .update(payments)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(and(eq(payments.stageId, stage.id), eq(payments.kind, "funding"), eq(payments.status, "completed")));
  await db.update(stages).set({ status: "planned", nearStatus: "refunded" }).where(eq(stages.id, stage.id));
  await appendLedger(db, {
    projectId: project.id,
    type: "near.stage_refunded",
    actor: `${tx.signer} (owner wallet)`,
    payload: { stageId: stage.id, nearProjectId, stage: index, to: refunded.data.to, usdcRaw: String(refunded.data.amount), txHash },
  });
  await anchorLedgerHead(db, nearProjectId);
}

export async function recordAgentRotated(projectId: string, txHash: string, signerId: string) {
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project?.nearProjectId) throw new FlowError("This project isn't on NEAR yet.");
  const nearProjectId = project.nearProjectId;
  const tx = await readEscrowTx(txHash, signerId);
  const [changed] = eventsFor(tx.escrowEvents, "agent_changed", nearProjectId);
  if (tx.receiver !== nearPublicConfig().escrow || !changed) {
    throw new FlowError("That transaction didn't update the project's relayer agent on the escrow contract.");
  }

  await appendLedger(db, {
    projectId: project.id,
    type: "near.agent_changed",
    actor: `${tx.signer} (owner wallet)`,
    payload: { nearProjectId, agent: String(changed.data.agent ?? ""), txHash },
  });
  await anchorLedgerHead(db, nearProjectId);
}

export async function pushVerdictToChain(input: {
  projectId: string;
  stageId: string;
  evidenceId: string;
  evidenceSha256: string;
  signed: SignedVerdict;
  verdict: "pass" | "fail" | "needs_review";
  confidence: number;
  checks: { taken_in_window: boolean; on_site: boolean; not_reused: boolean };
  propose: boolean;
}): Promise<ChainVerdict> {
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId));
  const [stage] = await db.select().from(stages).where(eq(stages.id, input.stageId));
  const record: ChainVerdict = {
    modelId: input.signed.modelId,
    reference: input.signed.reference,
    requestHash: input.signed.requestHash,
    responseHash: input.signed.responseHash,
    signature: input.signed.signature,
    signingAddress: input.signed.signingAddress,
    verdict: input.verdict,
    confidence: Math.round(input.confidence * 100),
  };
  const save = () => db.update(evidence).set({ chainVerdict: record }).where(eq(evidence.id, input.evidenceId));

  if (!project?.nearProjectId || stage?.nearStageIndex == null || !isAgentConfigured()) {
    record.error = "This stage isn't on NEAR yet, so the signed verdict was kept off chain.";
    await save();
    return record;
  }
  const nearProjectId = project.nearProjectId;
  const index = stage.nearStageIndex;
  const criteriaHash = createHash("sha256").update(stage.acceptanceCriteria).digest("hex");
  const expectedWithCriteria = verdictReference(nearProjectId, index, input.evidenceSha256, criteriaHash);
  const expectedLegacy = verdictReference(nearProjectId, index, input.evidenceSha256);
  if (input.signed.reference !== expectedWithCriteria && input.signed.reference !== expectedLegacy) {
    record.error =
      "The model's answer named a different stage, criteria hash, or photo, so it can't go on chain. Upload the photo again.";
    await save();
    return record;
  }

  try {
    record.submitTx = await submitVerdictOnChain({
      projectId: nearProjectId,
      stage: index,
      evidenceSha256: input.evidenceSha256,
      modelId: input.signed.modelId,
      requestHash: input.signed.requestHash,
      responseBody: input.signed.responseBody,
      signature: input.signed.signature,
      checks: input.checks,
    });
    await appendLedger(db, {
      projectId: project.id,
      type: "near.verdict_submitted",
      actor: `${nearPublicConfig().agent} (agent key)`,
      payload: { stageId: stage.id, evidenceId: input.evidenceId, verdict: input.verdict, responseHash: record.responseHash, txHash: record.submitTx },
    });

    if (input.propose) {
      const proposeTx = await tryAutoPropose(db, project.id, stage.id, nearProjectId, index);
      if (proposeTx) record.proposeTx = proposeTx;
    }
    await anchorLedgerHead(db, nearProjectId);
  } catch (err) {
    record.error = err instanceof AgentCallError ? err.message : "Couldn't reach NEAR; the verdict is saved here and can be retried.";
    if (!(err instanceof AgentCallError)) console.error("pushVerdictToChain", err);
  }
  await save();
  return record;
}
