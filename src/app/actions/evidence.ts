"use server";

import { readFileSync } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stages } from "@/db/schema";
import { FlowError } from "@/lib/flows/near";
import { findForeman, submitStagePhoto } from "@/lib/flows/evidence";
import { UnsupportedImageError } from "@/lib/evidence/image";
import { SAMPLE_PHOTOS, type SamplePhotoKey } from "@/lib/samples";
import type { ActionResult } from "./types";

const MAX_BYTES = 10 * 1024 * 1024;

export type PhotoSubmissionResult = {
  verdict: string;
  onChain: boolean;
  proposed: boolean;
  chainError: string | null;
};

async function runPhotoSubmission(stageId: string, file: Buffer): Promise<ActionResult<PhotoSubmissionResult>> {
  try {
    const [stage] = await (await getDb()).select({ projectId: stages.projectId }).from(stages).where(eq(stages.id, stageId));
    if (!stage) return { ok: false, error: "Stage not found" };
    const foreman = await findForeman(stage.projectId);
    const row = await submitStagePhoto({
      stageId,
      file,
      uploadedById: foreman?.id ?? null,
      actor: foreman ? `${foreman.name} (foreman)` : "site upload",
    });
    revalidatePath("/");
    revalidatePath("/build");
    revalidatePath("/site");
    revalidatePath("/verify");
    const chain = row.chainVerdict;
    return {
      ok: true,
      data: {
        verdict: row.verdict?.verdict ?? "needs_review",
        onChain: Boolean(chain?.submitTx),
        proposed: Boolean(chain?.proposeTx),
        chainError: chain?.error ?? null,
      },
    };
  } catch (err) {
    if (err instanceof FlowError || err instanceof UnsupportedImageError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Check the server log." };
  }
}

export async function uploadStagePhotoAction(formData: FormData): Promise<ActionResult<PhotoSubmissionResult>> {
  const stageId = formData.get("stageId");
  const file = formData.get("photo");
  if (typeof stageId !== "string" || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo to upload." };
  }
  if (file.size > MAX_BYTES) return { ok: false, error: "That photo is over 10 MB. Send a smaller copy." };
  return runPhotoSubmission(stageId, Buffer.from(await file.arrayBuffer()));
}

export async function submitSamplePhotoAction(
  stageId: string,
  sampleKey: SamplePhotoKey,
): Promise<ActionResult<PhotoSubmissionResult>> {
  if (typeof stageId !== "string" || !(sampleKey in SAMPLE_PHOTOS)) {
    return { ok: false, error: "Invalid sample photo selection." };
  }
  const filePath = path.join(process.cwd(), "public", "samples", SAMPLE_PHOTOS[sampleKey].file);
  const buffer = readFileSync(filePath);
  return runPhotoSubmission(stageId, buffer);
}
