"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appendLedger } from "@/lib/ledger";
import { getHeroProject } from "@/lib/queries";
import {
  FlowError,
  nearProjectPlan,
  proposeStageRelease,
  recordAgentRotated,
  recordProjectCreated,
  recordStageFunding,
  recordStageRefund,
  recordStageRelease,
  type NearProjectPlan,
} from "@/lib/flows/near";
import type { ActionResult } from "./types";

function toError(err: unknown): string {
  if (err instanceof FlowError) return err.message;
  console.error(err);
  return "Something went wrong. Check the server log.";
}

export async function nearProjectPlanAction(projectId: string): Promise<ActionResult<NearProjectPlan>> {
  try {
    return { ok: true, data: await nearProjectPlan(projectId) };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

function revalidateWorkspace() {
  revalidatePath("/");
  revalidatePath("/build");
  revalidatePath("/site");
  revalidatePath("/verify");
}

export async function proposeStageReleaseAction(stageId: string): Promise<ActionResult<{ txHash: string }>> {
  try {
    const txHash = await proposeStageRelease(stageId);
    revalidateWorkspace();
    return { ok: true, data: { txHash } };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

export type NearTxKind = "project" | "fund" | "release" | "refund" | "agent";

export async function recordNearTxAction(kind: NearTxKind, id: string, txHash: string, signerId: string): Promise<ActionResult> {
  if (typeof id !== "string" || typeof txHash !== "string" || typeof signerId !== "string") {
    return { ok: false, error: "Bad request" };
  }
  try {
    if (kind === "project") await recordProjectCreated(id, txHash, signerId);
    else if (kind === "fund") await recordStageFunding(id, txHash, signerId);
    else if (kind === "release") await recordStageRelease(id, txHash, signerId);
    else if (kind === "refund") await recordStageRefund(id, txHash, signerId);
    else if (kind === "agent") await recordAgentRotated(id, txHash, signerId);
    else return { ok: false, error: "Unknown transaction kind" };
    revalidateWorkspace();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

export async function joinWaitlistAction(input: {
  email: string;
  corridor: string;
  budget: string;
}): Promise<ActionResult<{ seq: number }>> {
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const corridor = typeof input?.corridor === "string" ? input.corridor.trim() : "";
  const budget = typeof input?.budget === "string" ? input.budget.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  try {
    const db = await getDb();
    const hero = await getHeroProject();
    const event = await appendLedger(db, {
      projectId: hero?.id ?? null,
      type: "waitlist.joined",
      actor: email,
      payload: {
        email,
        corridor: corridor || "London -> Ibadan",
        budget: budget || "$10,000 - $35,000 USDC",
      },
    });
    revalidatePath("/verify");
    return { ok: true, data: { seq: event.seq } };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}
