import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function ensurePortfolioColumns(db: Db): Promise<void> {
  const ddlStatements = [
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS code text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS typology text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_status text NOT NULL DEFAULT 'in_progress'`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_year integer`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS area_sqm integer`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration_weeks integer`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS summary text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS architectural_brief text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS spatial_notes text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS structural_notes text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS hero_image text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS section_image text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS detail_image text`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS layout_variant text NOT NULL DEFAULT 'monograph'`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS specs_json text`,
  ];
  for (const stmt of ddlStatements) {
    await db.execute(stmt);
  }
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 5, prepare: false });
    const db = drizzle(client, { schema }) as unknown as Db;
    await migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: MIGRATIONS });
    await ensurePortfolioColumns(db);
    return db;
  }

  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: MIGRATIONS });
  await ensurePortfolioColumns(db);
  return db;
}

async function openAndSeed(): Promise<Db> {
  const db = await open();
  if (process.env.SEED_ON_START !== "false") {
    const { ensurePortfolioSeeded, seed } = await import("./seed");
    await seed(db);
    await ensurePortfolioSeeded(db);
  }
  const { syncContractorAccount } = await import("./seed");
  await syncContractorAccount(db);
  return db;
}

const globalForDb = globalThis as unknown as { __escrowDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.__escrowDb ??= openAndSeed().catch((err) => {
    globalForDb.__escrowDb = undefined;
    throw err;
  });
  return globalForDb.__escrowDb;
}

export { schema };
