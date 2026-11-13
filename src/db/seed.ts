import "server-only";
import { count, eq } from "drizzle-orm";
import type { Db } from "./index";
import { projects, parties, payments, stages } from "./schema";
import { appendLedger } from "@/lib/ledger";
import { usdCentsToNgn } from "@/lib/money";

const NGN_PER_USD = 1550;
const DAY = 86_400_000;

type StageSeed = {
  name: string;
  description: string;
  days: number;
  laborUsd: number;
  criteria: string;
};

const HERO_STAGES: StageSeed[] = [
  {
    name: "Site clearing & setting out",
    description: "Clear vegetation, survey pegs, set out the building lines.",
    days: 7,
    laborUsd: 300,
    criteria: "Site cleared of vegetation; profile boards and string lines visible marking the building footprint.",
  },
  {
    name: "Foundation & DPC",
    description: "Excavate trenches, cast strip footing, raise foundation blockwork, cast the damp-proof course slab.",
    days: 28,
    laborUsd: 1200,
    criteria:
      "Trenches excavated and concreted; foundation blockwork raised to DPC level; reinforcement mesh visible before the DPC slab is cast; footprint matches the plan.",
  },
  {
    name: "Blockwork to lintel",
    description: "Raise walls with 9-inch and 6-inch blocks to lintel level and cast the lintel beam.",
    days: 35,
    laborUsd: 1500,
    criteria:
      "Walls raised to lintel height on all elevations; door and window openings formed; lintel reinforcement and formwork in place or lintel cast.",
  },
  {
    name: "Roofing",
    description: "Timber roof trusses, purlins and longspan aluminium sheets.",
    days: 21,
    laborUsd: 1100,
    criteria: "Roof trusses fixed on wall plates; longspan sheets covering the full roof; fascia boards installed.",
  },
  {
    name: "Plumbing & electrical first fix",
    description: "Conduits, cable runs, soil and water pipes chased into walls before plastering.",
    days: 21,
    laborUsd: 900,
    criteria: "Electrical conduits and back boxes chased into walls; soil and water pipes laid and visible before plastering.",
  },
  {
    name: "Finishes",
    description: "Plaster, tiling, sanitary fittings, doors and painting.",
    days: 42,
    laborUsd: 2000,
    criteria:
      "Walls plastered and painted; floor tiles laid; WC, basin and shower fittings installed and matching the approved specification; exterior steel door hung.",
  },
];

export async function syncContractorAccount(db: Db): Promise<void> {
  const acct = process.env.NEAR_CONTRACTOR_ACCOUNT;
  if (acct) await db.update(parties).set({ nearAccountId: acct }).where(eq(parties.role, "contractor"));
}

export async function isSeeded(db: Db): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(projects);
  return (row?.n ?? 0) > 0;
}

export async function seed(db: Db): Promise<void> {
  if (await isSeeded(db)) return;

  const [hero] = await db
    .insert(projects)
    .values({
      name: "3-bedroom bungalow, Akobo",
      ownerName: "Tunde Adeyemi",
      ownerCity: "London",
      ownerCountry: "GB",
      siteCity: "Ibadan",
      siteState: "Oyo",
      siteLat: 7.437,
      siteLng: 3.947,
      siteRadiusM: 150,
      ngnPerUsd: NGN_PER_USD,
      startDate: new Date("2026-09-25T08:00:00Z"),
    })
    .returning();

  const [owner, contractor, foreman] = await db
    .insert(parties)
    .values([
      { projectId: hero.id, role: "owner", name: "Tunde Adeyemi", city: "London" },
      {
        projectId: hero.id,
        role: "contractor",
        name: "Adewale Builders Ltd",
        city: "Ibadan",
        nearAccountId: process.env.NEAR_CONTRACTOR_ACCOUNT ?? "chidi.homebound-hq.testnet",
      },
      { projectId: hero.id, role: "foreman", name: "Kunle Ogundipe (site foreman)", city: "Ibadan" },
    ])
    .returning();

  let cursor = hero.startDate.getTime();
  let prevStageId: string | null = null;
  const stageRows: (typeof stages.$inferSelect)[] = [];
  for (const [i, s] of HERO_STAGES.entries()) {
    const status = i < 2 ? "paid" : "planned";
    const [row]: (typeof stages.$inferSelect)[] = await db
      .insert(stages)
      .values({
        projectId: hero.id,
        seq: i + 1,
        name: s.name,
        description: s.description,
        startDate: new Date(cursor),
        durationDays: s.days,
        laborTrancheUsdCents: s.laborUsd * 100,
        dependsOnStageId: prevStageId,
        contractorId: contractor.id,
        status,
        acceptanceCriteria: s.criteria,
      })
      .returning();
    stageRows.push(row);
    prevStageId = row.id;
    cursor += s.days * DAY;
  }

  const prePaidPayments: (typeof payments.$inferInsert)[] = [];
  for (const [i, s] of stageRows.slice(0, 2).entries()) {
    const ngn = usdCentsToNgn(s.laborTrancheUsdCents, NGN_PER_USD);
    prePaidPayments.push(
      {
        projectId: hero.id,
        stageId: s.id,
        kind: "funding",
        direction: "in",
        amountUsdCents: s.laborTrancheUsdCents,
        amountNgn: ngn,
        status: "completed",
        idempotencyKey: `seed-fund-stage-${i + 1}`,
      },
      {
        projectId: hero.id,
        stageId: s.id,
        kind: "labor",
        direction: "out",
        amountUsdCents: s.laborTrancheUsdCents,
        amountNgn: ngn,
        payeeId: contractor.id,
        status: "completed",
        idempotencyKey: `seed-labor-stage-${i + 1}`,
        approvedBy: owner.name,
      },
    );
  }
  await db.insert(payments).values(prePaidPayments);

  await appendLedger(db, {
    projectId: hero.id,
    type: "project.created",
    actor: owner.name,
    payload: { name: hero.name, stages: HERO_STAGES.length, contractor: contractor.name, foreman: foreman.name },
  });
}
