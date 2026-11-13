import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";
import type { ChainStageStatus, ChainVerdict } from "@/lib/near/shared";

const bytea = customType<{ data: Buffer; driverData: Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => Buffer.from(v),
});

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const projects = pgTable("projects", {
  id: id(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerCity: text("owner_city").notNull(),
  ownerCountry: text("owner_country").notNull(),
  siteCity: text("site_city").notNull(),
  siteState: text("site_state").notNull(),
  siteLat: doublePrecision("site_lat").notNull(),
  siteLng: doublePrecision("site_lng").notNull(),
  siteRadiusM: integer("site_radius_m").notNull().default(150),
  ngnPerUsd: integer("ngn_per_usd").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  nearProjectId: text("near_project_id"),
  createdAt: createdAt(),
});

export type PartyRole = "owner" | "contractor" | "foreman";

export const parties = pgTable(
  "parties",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    role: text("role").$type<PartyRole>().notNull(),
    name: text("name").notNull(),
    city: text("city"),
    nearAccountId: text("near_account_id"),
    createdAt: createdAt(),
  },
  (t) => [index("parties_project_idx").on(t.projectId)],
);

export type StageStatus =
  | "planned"
  | "funded"
  | "evidence_submitted"
  | "verified"
  | "paid";

export const stages = pgTable(
  "stages",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    seq: integer("seq").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    durationDays: integer("duration_days").notNull(),
    laborTrancheUsdCents: integer("labor_tranche_usd_cents").notNull(),
    dependsOnStageId: text("depends_on_stage_id"),
    contractorId: text("contractor_id").references(() => parties.id),
    status: text("status").$type<StageStatus>().notNull().default("planned"),
    acceptanceCriteria: text("acceptance_criteria").notNull(),
    nearStageIndex: integer("near_stage_index"),
    nearStatus: text("near_status").$type<ChainStageStatus>(),
  },
  (t) => [index("stages_project_idx").on(t.projectId)],
);

export type EvidenceVerdict = {
  verdict: "pass" | "fail" | "needs_review";
  confidence: number;
  observations: string[];
  checks: { name: string; status: "pass" | "fail" | "unavailable"; detail: string }[];
  extracted?: Record<string, unknown>;
  model: string;
};

export const evidence = pgTable(
  "evidence",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    stageId: text("stage_id")
      .notNull()
      .references(() => stages.id),
    uploadedById: text("uploaded_by_id").references(() => parties.id),
    blobKey: text("blob_key"),
    mime: text("mime"),
    sha256: text("sha256"),
    dhash: text("dhash"),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    verdict: jsonb("verdict").$type<EvidenceVerdict>(),
    chainVerdict: jsonb("chain_verdict").$type<ChainVerdict>(),
    createdAt: createdAt(),
  },
  (t) => [index("evidence_project_idx").on(t.projectId), index("evidence_stage_idx").on(t.stageId)],
);

export const blobs = pgTable("blobs", {
  key: text("key").primaryKey(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
});

export type PaymentKind = "funding" | "labor";
export type PaymentStatus = "completed" | "refunded";

export const payments = pgTable(
  "payments",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    stageId: text("stage_id").references(() => stages.id),
    kind: text("kind").$type<PaymentKind>().notNull(),
    direction: text("direction").$type<"in" | "out">().notNull(),
    amountUsdCents: integer("amount_usd_cents").notNull(),
    amountNgn: integer("amount_ngn").notNull(),
    payeeId: text("payee_id").references(() => parties.id),
    status: text("status").$type<PaymentStatus>().notNull().default("completed"),
    idempotencyKey: text("idempotency_key").notNull(),
    nearTxHash: text("near_tx_hash"),
    approvedBy: text("approved_by"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_idem_idx").on(t.idempotencyKey),
    index("payments_project_idx").on(t.projectId),
  ],
);

export const ledgerEvents = pgTable(
  "ledger_events",
  {
    id: id(),
    projectId: text("project_id").references(() => projects.id),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    actor: text("actor").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    prevHash: text("prev_hash").notNull(),
    hash: text("hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("ledger_seq_idx").on(t.seq), index("ledger_project_idx").on(t.projectId)],
);
