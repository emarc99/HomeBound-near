import "server-only";
import { createHash } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { evidence, ledgerEvents, parties, payments, projects, stages } from "@/db/schema";

export async function getHeroProject() {
  const db = await getDb();
  const [p] = await db.select().from(projects).orderBy(asc(projects.createdAt)).limit(1);
  return p ?? null;
}

export async function getProjectView(projectId: string) {
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) return null;

  const [stageRows, paymentRows, evidenceRows, partyRows] = await Promise.all([
    db.select().from(stages).where(eq(stages.projectId, projectId)).orderBy(asc(stages.seq)),
    db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(desc(payments.createdAt)),
    db.select().from(evidence).where(eq(evidence.projectId, projectId)).orderBy(desc(evidence.createdAt)),
    db.select().from(parties).where(eq(parties.projectId, projectId)),
  ]);

  return {
    project,
    stages: stageRows.map((s) => ({
      ...s,
      criteriaHash: createHash("sha256").update(s.acceptanceCriteria).digest("hex"),
    })),
    payments: paymentRows,
    evidence: evidenceRows,
    parties: partyRows,
  };
}

export type ProjectView = NonNullable<Awaited<ReturnType<typeof getProjectView>>>;

export async function getLedger(projectId: string, limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(ledgerEvents)
    .where(eq(ledgerEvents.projectId, projectId))
    .orderBy(desc(ledgerEvents.seq))
    .limit(limit);
}
