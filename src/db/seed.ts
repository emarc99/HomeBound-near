import "server-only";
import { and, count, eq } from "drizzle-orm";
import type { Db } from "./index";
import { projects, parties, payments, stages } from "./schema";
import {
  COMPLETED_PORTFOLIO_PROJECTS,
  HERO_PORTFOLIO_META,
} from "./portfolio-seed-data";
import { appendLedger } from "@/lib/ledger";
import { usdCentsToNgn } from "@/lib/money";
import type { ChainStageStatus } from "@/lib/near/shared";

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
  if (!acct) return;
  const [hero] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.nearProjectId, "hb-akobo-bungalow-v2"))
    .limit(1);
  if (!hero) return;
  await db
    .update(parties)
    .set({ nearAccountId: acct })
    .where(and(eq(parties.projectId, hero.id), eq(parties.role, "contractor")));
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
      nearProjectId: "hb-akobo-bungalow-v2",
    })
    .returning();

  const [, contractor, foreman] = await db
    .insert(parties)
    .values([
      {
        projectId: hero.id,
        role: "owner",
        name: "Tunde Adeyemi",
        city: "London",
        nearAccountId: "tightrat3805.testnet",
      },
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
    const status = i < 2 ? "paid" : i === 2 ? "funded" : "planned";
    const nearStageIndex = i;
    const nearStatus: ChainStageStatus = i < 2 ? "released" : i === 2 ? "funded" : "planned";
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
        nearStageIndex,
        nearStatus,
      })
      .returning();
    stageRows.push(row);
    prevStageId = row.id;
    cursor += s.days * DAY;
  }

  const settledReceipts = [
    {
      fundTx: "9a3GCDthu2oVfpAJcjDmpYYYetSoV86xS4KQLorv4crZ",
      releaseTx: "2gmDDiKYD2NZa2NZPyFZT4tCCtRJXKozMtv22Ukenh4G",
      usdcRaw: "300000",
    },
    {
      fundTx: "TpzxN6hyqKo47MXoE1oYKBDqEWFz4Za6uJCp4dSRfyp",
      releaseTx: "ApzRwzd58MgyxZz6uM2ufSbTQ9rvcHZGm5rZGTfPQGP2",
      usdcRaw: "1200000",
    },
  ] as const;

  const prePaidPayments: (typeof payments.$inferInsert)[] = [];
  for (const [i, s] of stageRows.slice(0, 2).entries()) {
    const ngn = usdCentsToNgn(s.laborTrancheUsdCents, NGN_PER_USD);
    const receipts = settledReceipts[i];
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
        nearTxHash: receipts.fundTx,
        approvedBy: "tightrat3805.testnet",
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
        nearTxHash: receipts.releaseTx,
        approvedBy: "tightrat3805.testnet",
      },
    );
  }
  const stageThree = stageRows[2];
  if (stageThree) {
    prePaidPayments.push({
      projectId: hero.id,
      stageId: stageThree.id,
      kind: "funding",
      direction: "in",
      amountUsdCents: stageThree.laborTrancheUsdCents,
      amountNgn: usdCentsToNgn(stageThree.laborTrancheUsdCents, NGN_PER_USD),
      status: "completed",
      idempotencyKey: "seed-fund-stage-3",
      nearTxHash: "PW1xrcYmz8LydDTc3eQ834tKhz7J1xBDkectu29bzPD",
      approvedBy: "tightrat3805.testnet",
    });
  }
  await db.insert(payments).values(prePaidPayments);

  await appendLedger(db, {
    projectId: hero.id,
    type: "project.created",
    actor: "tightrat3805.testnet (owner wallet)",
    payload: {
      name: hero.name,
      stages: HERO_STAGES.length,
      contractor: contractor.name,
      foreman: foreman.name,
      nearProjectId: "hb-akobo-bungalow-v2",
      nearCreateTx: "HCgdx6HMJTnc8LXJkGNLoDYMn3JcWPfWPQJCGYn46y4e",
    },
  });
  for (const [i, s] of stageRows.slice(0, 2).entries()) {
    const receipts = settledReceipts[i];
    await appendLedger(db, {
      projectId: hero.id,
      type: "near.stage_funded",
      actor: "tightrat3805.testnet (owner wallet)",
      payload: {
        nearProjectId: "hb-akobo-bungalow-v2",
        stageSeq: s.seq,
        stageName: s.name,
        usdcRaw: receipts.usdcRaw,
        fullyFunded: true,
        txHash: receipts.fundTx,
      },
    });
    await appendLedger(db, {
      projectId: hero.id,
      type: "near.stage_released_override",
      actor: "tightrat3805.testnet (owner wallet)",
      payload: {
        nearProjectId: "hb-akobo-bungalow-v2",
        stageSeq: s.seq,
        stageName: s.name,
        to: contractor.nearAccountId ?? "chidi.homebound-hq.testnet",
        usdcRaw: receipts.usdcRaw,
        override: true,
        txHash: receipts.releaseTx,
      },
    });
  }
  await appendLedger(db, {
    projectId: hero.id,
    type: "near.stage_funded",
    actor: "tightrat3805.testnet (owner wallet)",
      payload: {
        nearProjectId: "hb-akobo-bungalow-v2",
        stageSeq: 3,
        stageName: stageThree?.name ?? "Blockwork to lintel",
        usdcRaw: "1500000",
        fullyFunded: true,
        txHash: "PW1xrcYmz8LydDTc3eQ834tKhz7J1xBDkectu29bzPD",
      },
    });
}

export async function ensurePortfolioSeeded(db: Db): Promise<void> {
  // 1. Backfill portfolio metadata on the active hero project if missing
  const [hero] = await db
    .select()
    .from(projects)
    .where(eq(projects.nearProjectId, "hb-akobo-bungalow-v2"))
    .limit(1);

  if (hero && hero.slug !== HERO_PORTFOLIO_META.slug) {
    await db
      .update(projects)
      .set({
        slug: HERO_PORTFOLIO_META.slug,
        code: HERO_PORTFOLIO_META.code,
        typology: HERO_PORTFOLIO_META.typology,
        completionStatus: HERO_PORTFOLIO_META.completionStatus,
        completedYear: HERO_PORTFOLIO_META.completedYear,
        areaSqm: HERO_PORTFOLIO_META.areaSqm,
        durationWeeks: HERO_PORTFOLIO_META.durationWeeks,
        layoutVariant: HERO_PORTFOLIO_META.layoutVariant,
        heroImage: HERO_PORTFOLIO_META.heroImage,
        sectionImage: HERO_PORTFOLIO_META.sectionImage,
        detailImage: HERO_PORTFOLIO_META.detailImage,
        summary: HERO_PORTFOLIO_META.summary,
        architecturalBrief: HERO_PORTFOLIO_META.architecturalBrief,
        spatialNotes: HERO_PORTFOLIO_META.spatialNotes,
        structuralNotes: HERO_PORTFOLIO_META.structuralNotes,
        specsJson: JSON.stringify(HERO_PORTFOLIO_META.specs),
      })
      .where(eq(projects.id, hero.id));
  }

  // 2. Idempotently insert each completed diaspora work and its settled escrow stages
  for (const def of COMPLETED_PORTFOLIO_PROJECTS) {
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, def.slug))
      .limit(1);
    if (existing) continue;

    const startDate = new Date(def.startDateIso);
    const [proj] = await db
      .insert(projects)
      .values({
        name: def.name,
        ownerName: def.ownerName,
        ownerCity: def.ownerCity,
        ownerCountry: def.ownerCountry,
        siteCity: def.siteCity,
        siteState: def.siteState,
        siteLat: def.siteLat,
        siteLng: def.siteLng,
        siteRadiusM: def.siteRadiusM,
        ngnPerUsd: def.ngnPerUsd,
        startDate,
        nearProjectId: def.nearProjectId,
        slug: def.slug,
        code: def.code,
        typology: def.typology,
        completionStatus: def.completionStatus,
        completedYear: def.completedYear,
        areaSqm: def.areaSqm,
        durationWeeks: def.durationWeeks,
        summary: def.summary,
        architecturalBrief: def.architecturalBrief,
        spatialNotes: def.spatialNotes,
        structuralNotes: def.structuralNotes,
        heroImage: def.heroImage,
        sectionImage: def.sectionImage,
        detailImage: def.detailImage,
        layoutVariant: def.layoutVariant,
        specsJson: JSON.stringify(def.specs),
      })
      .returning();

    const [, contractor] = await db
      .insert(parties)
      .values([
        {
          projectId: proj.id,
          role: "owner",
          name: def.ownerName,
          city: def.ownerCity,
          nearAccountId: def.ownerNearAccount,
        },
        {
          projectId: proj.id,
          role: "contractor",
          name: def.contractorName,
          city: def.siteCity,
          nearAccountId: def.contractorNearAccount,
        },
        {
          projectId: proj.id,
          role: "foreman",
          name: def.foremanName,
          city: def.siteCity,
        },
      ])
      .returning();

    let cursor = startDate.getTime();
    let prevStageId: string | null = null;
    const insertedStages: (typeof stages.$inferSelect)[] = [];
    for (const s of def.stages) {
      const [row]: (typeof stages.$inferSelect)[] = await db
        .insert(stages)
        .values({
          projectId: proj.id,
          seq: s.seq,
          name: s.name,
          description: s.description,
          startDate: new Date(cursor),
          durationDays: s.days,
          laborTrancheUsdCents: s.laborUsd * 100,
          dependsOnStageId: prevStageId,
          contractorId: contractor.id,
          status: "paid",
          acceptanceCriteria: s.criteria,
          nearStageIndex: s.seq - 1,
          nearStatus: "released",
        })
        .returning();
      insertedStages.push(row);
      prevStageId = row.id;
      cursor += s.days * DAY;
    }

    const paymentRows: (typeof payments.$inferInsert)[] = [];
    for (const [idx, sRow] of insertedStages.entries()) {
      const sDef = def.stages[idx];
      const ngn = usdCentsToNgn(sRow.laborTrancheUsdCents, def.ngnPerUsd);
      paymentRows.push(
        {
          projectId: proj.id,
          stageId: sRow.id,
          kind: "funding",
          direction: "in",
          amountUsdCents: sRow.laborTrancheUsdCents,
          amountNgn: ngn,
          status: "completed",
          idempotencyKey: `seed-${def.slug}-fund-${sDef.seq}`,
          nearTxHash: sDef.fundTx,
          approvedBy: def.ownerNearAccount,
        },
        {
          projectId: proj.id,
          stageId: sRow.id,
          kind: "labor",
          direction: "out",
          amountUsdCents: sRow.laborTrancheUsdCents,
          amountNgn: ngn,
          payeeId: contractor.id,
          status: "completed",
          idempotencyKey: `seed-${def.slug}-labor-${sDef.seq}`,
          nearTxHash: sDef.releaseTx,
          approvedBy: def.ownerNearAccount,
        },
      );
    }
    await db.insert(payments).values(paymentRows);

    await appendLedger(db, {
      projectId: proj.id,
      type: "project.completed_archive",
      actor: `${def.ownerNearAccount} (owner wallet)`,
      payload: {
        slug: def.slug,
        code: def.code,
        nearProjectId: def.nearProjectId,
        stagesSettled: insertedStages.length,
        totalUsd: def.stages.reduce((sum, s) => sum + s.laborUsd, 0),
        completedYear: def.completedYear,
      },
    });
  }
}
