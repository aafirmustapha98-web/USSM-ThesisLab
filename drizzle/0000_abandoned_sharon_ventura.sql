CREATE TABLE "challenge_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"thesis_id" text NOT NULL,
	"date" text NOT NULL,
	"mode" text NOT NULL,
	"model" text,
	"prompt_version" text,
	"raw_output" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"name" text NOT NULL,
	"sector" text,
	"industry" text,
	"status" text NOT NULL,
	"idea_origin" text NOT NULL,
	"idea_note" text,
	"created_at" text,
	CONSTRAINT "companies_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "company_filings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"period" text NOT NULL,
	"published_at" text,
	"entered_at" text,
	"source" text,
	"source_url" text,
	"market_cap" double precision,
	"price" double precision,
	"shares" double precision,
	"revenue" double precision,
	"eps" double precision,
	"ebitda" double precision,
	"ebit" double precision,
	"net_income" double precision,
	"fcf" double precision,
	"cfo" double precision,
	"gross_margin" double precision,
	"operating_margin" double precision,
	"net_margin" double precision,
	"ebitda_margin" double precision,
	"roa" double precision,
	"roe" double precision,
	"roic" double precision,
	"total_debt" double precision,
	"long_term_debt" double precision,
	"cash" double precision,
	"debt_to_equity" double precision,
	"interest_coverage" double precision,
	"current_ratio" double precision,
	"quick_ratio" double precision,
	"equity" double precision,
	"revenue_growth" double precision,
	"eps_growth" double precision,
	"ebitda_growth" double precision,
	"net_income_growth" double precision,
	"fcf_growth" double precision,
	"pe" double precision,
	"forward_pe" double precision,
	"peg" double precision,
	"pb" double precision,
	"ps" double precision,
	"ev_ebitda" double precision,
	"ev_ebit" double precision,
	"ev_fcf" double precision,
	"fcf_yield" double precision,
	"dividend_yield" double precision
);
--> statement-breakpoint
CREATE TABLE "company_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"filing_id" text,
	"date" text NOT NULL,
	"growth_interpretation" text NOT NULL,
	"profitability_interpretation" text NOT NULL,
	"strength_interpretation" text NOT NULL,
	"quality_flag" text NOT NULL,
	"growth_flag" text NOT NULL,
	"strength_flag" text NOT NULL,
	"confidence" integer,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"date" text NOT NULL,
	"decision" text NOT NULL,
	"horizon" text,
	"why" text NOT NULL,
	"thesis_id" text,
	"snapshot_id" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"scope" text NOT NULL,
	"target" text,
	"note" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "geo_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"countries" text,
	"description" text,
	"estimated_duration" text,
	"probability" integer,
	"potential_impact" text,
	"channels" jsonb,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "horizon_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"position_id" text NOT NULL,
	"from_horizon" text NOT NULL,
	"to_horizon" text NOT NULL,
	"pl_pct_at_change" double precision,
	"reason" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invalidator_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"invalidator_id" text NOT NULL,
	"review_id" text,
	"date" text NOT NULL,
	"answer" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "invalidators" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"ref_id" text NOT NULL,
	"label" text NOT NULL,
	"metric" text,
	"operator" text,
	"threshold" double precision,
	"unit" text,
	"persistence" text,
	"horizon_date" text,
	"source" text,
	"status" text NOT NULL,
	"status_at" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"position_id" text,
	"snapshot_id" text,
	"date" text NOT NULL,
	"horizon" text,
	"result_pct" double precision,
	"result_r" double precision,
	"expected" text,
	"happened" text,
	"verdict" text NOT NULL,
	"main_error" text,
	"error_tags" jsonb,
	"lesson" text NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "macro_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"category_code" text NOT NULL,
	"indicator_code" text NOT NULL,
	"value" double precision,
	"previous" double precision,
	"unit" text,
	"ref_date" text NOT NULL,
	"obs_date" text,
	"entered_at" text,
	"trend" text,
	"source" text,
	"source_url" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "macro_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"category_code" text NOT NULL,
	"date" text NOT NULL,
	"what_happens" text NOT NULL,
	"why" text NOT NULL,
	"impacts" jsonb,
	"uncertainties" jsonb,
	"diagnostic" text NOT NULL,
	"confidence" integer,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "market_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"diagnostic" text NOT NULL,
	"justification" text NOT NULL,
	"breadth_note" text,
	"confidence" integer,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "objections" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_run_id" text NOT NULL,
	"category" text NOT NULL,
	"text" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"user_response" text,
	"resulting_thesis_id" text,
	"handled_at" text,
	"origin" text NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "position_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"position_id" text NOT NULL,
	"date" text NOT NULL,
	"thesis_status" text NOT NULL,
	"confidence" integer,
	"note" text,
	"stop_changed_to" double precision,
	"stop_change_reason" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"thesis_id" text NOT NULL,
	"snapshot_id" text,
	"setup_id" text,
	"horizon" text NOT NULL,
	"opened_at" text NOT NULL,
	"entry" double precision NOT NULL,
	"shares" double precision NOT NULL,
	"stop_initial" double precision NOT NULL,
	"target_initial" double precision,
	"stop_current" double precision,
	"status" text NOT NULL,
	"closed_at" text,
	"exit_price" double precision,
	"fees" double precision,
	"exit_reason" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"price" double precision NOT NULL,
	"at" text NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_code" text NOT NULL,
	"scope" text NOT NULL,
	"target_id" text NOT NULL,
	"detected_at" text,
	"status" text NOT NULL,
	"user_response" text,
	"answered_at" text
);
--> statement-breakpoint
CREATE TABLE "sector_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"sector" text NOT NULL,
	"industry" text,
	"date" text NOT NULL,
	"cycle" text,
	"demand" text,
	"pricing_power" text,
	"capex" text,
	"competition" text,
	"regulation" text,
	"catalysts" jsonb,
	"risks" jsonb,
	"tailwind" text NOT NULL,
	"justification" text NOT NULL,
	"confidence" integer,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"capital" double precision,
	"max_risk_per_trade_pct" double precision,
	"max_open_risk_pct" double precision,
	"max_sector_pct" double precision,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"date" text NOT NULL,
	"trigger" text NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technical_setups" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"date" text NOT NULL,
	"trend" text,
	"support" double precision,
	"resistance" double precision,
	"entry" double precision,
	"stop" double precision,
	"target" double precision,
	"horizon_days" integer,
	"max_loss" double precision,
	"event_risk_reviewed" boolean,
	"event_risk_note" text,
	"notes" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "theses" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"version" integer NOT NULL,
	"parent_id" text,
	"revision_reason" text,
	"triggering_objection_id" text,
	"horizon" text NOT NULL,
	"direction" text NOT NULL,
	"why" text NOT NULL,
	"bull_case" text NOT NULL,
	"bear_case" text NOT NULL,
	"catalysts" jsonb,
	"risks" jsonb,
	"uncertainties" jsonb,
	"confidence" integer NOT NULL,
	"confidence_post_challenge" integer,
	"status" text NOT NULL,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "valuation_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"filing_id" text,
	"date" text NOT NULL,
	"diagnostic" text NOT NULL,
	"justification" text NOT NULL,
	"peers" jsonb,
	"confidence" integer,
	"created_at" text
);
--> statement-breakpoint
ALTER TABLE "challenge_runs" ADD CONSTRAINT "challenge_runs_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_filings" ADD CONSTRAINT "company_filings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_readings" ADD CONSTRAINT "company_readings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_readings" ADD CONSTRAINT "company_readings_filing_id_company_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."company_filings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horizon_changes" ADD CONSTRAINT "horizon_changes_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invalidator_checks" ADD CONSTRAINT "invalidator_checks_invalidator_id_invalidators_id_fk" FOREIGN KEY ("invalidator_id") REFERENCES "public"."invalidators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objections" ADD CONSTRAINT "objections_challenge_run_id_challenge_runs_id_fk" FOREIGN KEY ("challenge_run_id") REFERENCES "public"."challenge_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_reviews" ADD CONSTRAINT "position_reviews_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_setups" ADD CONSTRAINT "technical_setups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theses" ADD CONSTRAINT "theses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuation_readings" ADD CONSTRAINT "valuation_readings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuation_readings" ADD CONSTRAINT "valuation_readings_filing_id_company_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."company_filings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "filing_company_idx" ON "company_filings" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "macro_obs_idx" ON "macro_observations" USING btree ("category_code","indicator_code","ref_date");--> statement-breakpoint
CREATE INDEX "finding_target_idx" ON "rule_findings" USING btree ("target_id","rule_code");--> statement-breakpoint
CREATE INDEX "thesis_company_idx" ON "theses" USING btree ("company_id","version");