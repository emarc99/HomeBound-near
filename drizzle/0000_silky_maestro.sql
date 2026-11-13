CREATE TABLE "blobs" (
	"key" text PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"uploaded_by_id" text,
	"blob_key" text,
	"mime" text,
	"sha256" text,
	"dhash" text,
	"taken_at" timestamp with time zone,
	"lat" double precision,
	"lng" double precision,
	"verdict" jsonb,
	"chain_verdict" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_events" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"seq" integer NOT NULL,
	"type" text NOT NULL,
	"actor" text NOT NULL,
	"payload" jsonb NOT NULL,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"near_account_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"stage_id" text,
	"kind" text NOT NULL,
	"direction" text NOT NULL,
	"amount_usd_cents" integer NOT NULL,
	"amount_ngn" integer NOT NULL,
	"payee_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"idempotency_key" text NOT NULL,
	"near_tx_hash" text,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_name" text NOT NULL,
	"owner_city" text NOT NULL,
	"owner_country" text NOT NULL,
	"site_city" text NOT NULL,
	"site_state" text NOT NULL,
	"site_lat" double precision NOT NULL,
	"site_lng" double precision NOT NULL,
	"site_radius_m" integer DEFAULT 150 NOT NULL,
	"ngn_per_usd" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"near_project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"seq" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"duration_days" integer NOT NULL,
	"labor_tranche_usd_cents" integer NOT NULL,
	"depends_on_stage_id" text,
	"contractor_id" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"acceptance_criteria" text NOT NULL,
	"near_stage_index" integer,
	"near_status" text
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaded_by_id_parties_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_events" ADD CONSTRAINT "ledger_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payee_id_parties_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_contractor_id_parties_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_project_idx" ON "evidence" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "evidence_stage_idx" ON "evidence" USING btree ("stage_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_seq_idx" ON "ledger_events" USING btree ("seq");--> statement-breakpoint
CREATE INDEX "ledger_project_idx" ON "ledger_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "parties_project_idx" ON "parties" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idem_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_project_idx" ON "payments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "stages_project_idx" ON "stages" USING btree ("project_id");