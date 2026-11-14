import "server-only";
import { createHash } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { evidence, ledgerEvents, parties, payments, projects, stages } from "@/db/schema";

import type { PortfolioSpecs } from "@/db/portfolio-seed-data";

export async function getHeroProject() {
  const db = await getDb();
  const [hero] = await db
    .select()
    .from(projects)
    .where(eq(projects.nearProjectId, "hb-akobo-bungalow-v2"))
    .limit(1);
  if (hero) return hero;
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

export function parsePortfolioSpecs(specsJson: string | null): PortfolioSpecs | null {
  if (!specsJson) return null;
  try {
    return JSON.parse(specsJson) as PortfolioSpecs;
  } catch {
    return null;
  }
}

export interface PortfolioStageRow {
  id: string;
  seq: number;
  name: string;
  description: string;
  durationDays: number;
  laborTrancheUsdCents: number;
  laborNgn: number;
  status: string;
  nearStatus: string | null;
  acceptanceCriteria: string;
  criteriaHash: string;
  fundTxHash: string | null;
  releaseTxHash: string | null;
}

export interface PortfolioProjectSummary {
  id: string;
  slug: string;
  code: string;
  name: string;
  typology: string;
  completionStatus: "completed" | "in_progress";
  completedYear: number | null;
  areaSqm: number | null;
  durationWeeks: number | null;
  ownerName: string;
  ownerCity: string;
  ownerCountry: string;
  siteCity: string;
  siteState: string;
  siteLat: number;
  siteLng: number;
  ngnPerUsd: number;
  nearProjectId: string | null;
  layoutVariant: string;
  heroImage: string;
  sectionImage: string;
  detailImage: string;
  summary: string;
  totalUsdCents: number;
  settledUsdCents: number;
  totalNgn: number;
  stageCount: number;
  settledStageCount: number;
  contractorName: string;
  foremanName: string;
}

export interface PortfolioProjectDetail extends PortfolioProjectSummary {
  architecturalBrief: string;
  spatialNotes: string;
  structuralNotes: string;
  specs: PortfolioSpecs | null;
  parties: Array<{
    id: string;
    role: string;
    name: string;
    city: string | null;
    nearAccountId: string | null;
  }>;
  stages: PortfolioStageRow[];
  ledgerEvents: Array<{
    id: string;
    seq: number;
    type: string;
    actor: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  prevProject: { slug: string; code: string; name: string; siteCity: string } | null;
  nextProject: { slug: string; code: string; name: string; siteCity: string } | null;
}

function buildPortfolioSummary(
  p: typeof projects.$inferSelect,
  stageRows: (typeof stages.$inferSelect)[],
  partyRows: (typeof parties.$inferSelect)[],
): PortfolioProjectSummary {
  const totalUsdCents = stageRows.reduce((sum, s) => sum + s.laborTrancheUsdCents, 0);
  const settledUsdCents = stageRows
    .filter((s) => s.status === "paid" || s.nearStatus === "released")
    .reduce((sum, s) => sum + s.laborTrancheUsdCents, 0);
  const settledStageCount = stageRows.filter(
    (s) => s.status === "paid" || s.nearStatus === "released",
  ).length;
  const contractor = partyRows.find((r) => r.role === "contractor");
  const foreman = partyRows.find((r) => r.role === "foreman");

  return {
    id: p.id,
    slug: p.slug ?? p.id,
    code: p.code ?? "HB-00",
    name: p.name,
    typology: p.typology ?? "Residential Commission",
    completionStatus: p.completionStatus === "completed" ? "completed" : "in_progress",
    completedYear: p.completedYear ?? null,
    areaSqm: p.areaSqm ?? null,
    durationWeeks: p.durationWeeks ?? null,
    ownerName: p.ownerName,
    ownerCity: p.ownerCity,
    ownerCountry: p.ownerCountry,
    siteCity: p.siteCity,
    siteState: p.siteState,
    siteLat: p.siteLat,
    siteLng: p.siteLng,
    ngnPerUsd: p.ngnPerUsd,
    nearProjectId: p.nearProjectId,
    layoutVariant: p.layoutVariant ?? "monograph",
    heroImage: p.heroImage ?? "/art/hero-tee-scan-morph.png",
    sectionImage: p.sectionImage ?? "/art/stages-exploded-axonometric.png",
    detailImage: p.detailImage ?? "/art/cta-stipple-pavilion.png",
    summary: p.summary ?? `${p.name} in ${p.siteCity}, ${p.siteState}.`,
    totalUsdCents,
    settledUsdCents,
    totalNgn: Math.round((totalUsdCents / 100) * p.ngnPerUsd),
    stageCount: stageRows.length,
    settledStageCount,
    contractorName: contractor?.name ?? "Verified Builder",
    foremanName: foreman?.name ?? "Site Foreman",
  };
}

export async function getAllPortfolioProjects(): Promise<PortfolioProjectSummary[]> {
  const db = await getDb();
  const [allProjects, allStages, allParties] = await Promise.all([
    db.select().from(projects),
    db.select().from(stages).orderBy(asc(stages.seq)),
    db.select().from(parties),
  ]);

  return allProjects
    .map((p) =>
      buildPortfolioSummary(
        p,
        allStages.filter((s) => s.projectId === p.id),
        allParties.filter((r) => r.projectId === p.id),
      ),
    )
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getPortfolioProjectBySlug(slug: string): Promise<PortfolioProjectDetail | null> {
  const db = await getDb();
  const [projBySlug] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  const project =
    projBySlug ?? (await db.select().from(projects).where(eq(projects.id, slug)).limit(1))[0];
  if (!project) return null;

  const [stageRows, partyRows, paymentRows, ledgerRows, allSummaries] = await Promise.all([
    db.select().from(stages).where(eq(stages.projectId, project.id)).orderBy(asc(stages.seq)),
    db.select().from(parties).where(eq(parties.projectId, project.id)),
    db.select().from(payments).where(eq(payments.projectId, project.id)),
    db.select().from(ledgerEvents).where(eq(ledgerEvents.projectId, project.id)).orderBy(desc(ledgerEvents.seq)).limit(25),
    getAllPortfolioProjects(),
  ]);

  const summary = buildPortfolioSummary(project, stageRows, partyRows);
  const idx = allSummaries.findIndex((item) => item.id === project.id);
  const prev = idx > 0 ? allSummaries[idx - 1] : allSummaries[allSummaries.length - 1];
  const next = idx >= 0 && idx < allSummaries.length - 1 ? allSummaries[idx + 1] : allSummaries[0];

  const mappedStages: PortfolioStageRow[] = stageRows.map((s) => {
    const fundPayment = paymentRows.find((pm) => pm.stageId === s.id && pm.kind === "funding");
    const laborPayment = paymentRows.find((pm) => pm.stageId === s.id && pm.kind === "labor");
    return {
      id: s.id,
      seq: s.seq,
      name: s.name,
      description: s.description,
      durationDays: s.durationDays,
      laborTrancheUsdCents: s.laborTrancheUsdCents,
      laborNgn: Math.round((s.laborTrancheUsdCents / 100) * project.ngnPerUsd),
      status: s.status,
      nearStatus: s.nearStatus,
      acceptanceCriteria: s.acceptanceCriteria,
      criteriaHash: createHash("sha256").update(s.acceptanceCriteria).digest("hex"),
      fundTxHash: fundPayment?.nearTxHash ?? null,
      releaseTxHash: laborPayment?.nearTxHash ?? null,
    };
  });

  return {
    ...summary,
    architecturalBrief: project.architecturalBrief ?? summary.summary,
    spatialNotes: project.spatialNotes ?? "",
    structuralNotes: project.structuralNotes ?? "",
    specs: parsePortfolioSpecs(project.specsJson),
    parties: partyRows.map((r) => ({
      id: r.id,
      role: r.role,
      name: r.name,
      city: r.city,
      nearAccountId: r.nearAccountId,
    })),
    stages: mappedStages,
    ledgerEvents: ledgerRows.map((ev) => ({
      id: ev.id,
      seq: ev.seq,
      type: ev.type,
      actor: ev.actor,
      payload: ev.payload,
      createdAt: ev.createdAt.toISOString(),
    })),
    prevProject:
      prev && prev.id !== project.id
        ? { slug: prev.slug, code: prev.code, name: prev.name, siteCity: prev.siteCity }
        : null,
    nextProject:
      next && next.id !== project.id
        ? { slug: next.slug, code: next.code, name: next.name, siteCity: next.siteCity }
        : null,
  };
}
