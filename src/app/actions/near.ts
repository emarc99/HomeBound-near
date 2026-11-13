"use server";

import { revalidatePath } from "next/cache";
import {
  FlowError,
  nearProjectPlan,
  proposeStageRelease,
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

export async function proposeStageReleaseAction(stageId: string): Promise<ActionResult<{ txHash: string }>> {
  try {
    const txHash = await proposeStageRelease(stageId);
    revalidatePath("/");
    revalidatePath("/build");
    return { ok: true, data: { txHash } };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}

export type NearTxKind = "project" | "fund" | "release" | "refund";

export async function recordNearTxAction(kind: NearTxKind, id: string, txHash: string, signerId: string): Promise<ActionResult> {
  if (typeof id !== "string" || typeof txHash !== "string" || typeof signerId !== "string") {
    return { ok: false, error: "Bad request" };
  }
  try {
    if (kind === "project") await recordProjectCreated(id, txHash, signerId);
    else if (kind === "fund") await recordStageFunding(id, txHash, signerId);
    else if (kind === "release") await recordStageRelease(id, txHash, signerId);
    else if (kind === "refund") await recordStageRefund(id, txHash, signerId);
    else return { ok: false, error: "Unknown transaction kind" };
    revalidatePath("/");
    revalidatePath("/build");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}
