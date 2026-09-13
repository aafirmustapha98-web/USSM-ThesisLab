CREATE TABLE `challenge_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`thesis_id` text NOT NULL,
	`date` text NOT NULL,
	`mode` text NOT NULL,
	`model` text,
	`prompt_version` text,
	`raw_output` text,
	`created_at` text,
	FOREIGN KEY (`thesis_id`) REFERENCES `theses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`sector` text,
	`industry` text,
	`status` text NOT NULL,
	`idea_origin` text NOT NULL,
	`idea_note` text,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_ticker_unique` ON `companies` (`ticker`);--> statement-breakpoint
CREATE TABLE `company_filings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`period` text NOT NULL,
	`published_at` text,
	`entered_at` text,
	`source` text,
	`source_url` text,
	`market_cap` real,
	`price` real,
	`shares` real,
	`revenue` real,
	`eps` real,
	`ebitda` real,
	`ebit` real,
	`net_income` real,
	`fcf` real,
	`cfo` real,
	`gross_margin` real,
	`operating_margin` real,
	`net_margin` real,
	`ebitda_margin` real,
	`roa` real,
	`roe` real,
	`roic` real,
	`total_debt` real,
	`long_term_debt` real,
	`cash` real,
	`debt_to_equity` real,
	`interest_coverage` real,
	`current_ratio` real,
	`quick_ratio` real,
	`equity` real,
	`revenue_growth` real,
	`eps_growth` real,
	`ebitda_growth` real,
	`net_income_growth` real,
	`fcf_growth` real,
	`pe` real,
	`forward_pe` real,
	`peg` real,
	`pb` real,
	`ps` real,
	`ev_ebitda` real,
	`ev_ebit` real,
	`ev_fcf` real,
	`fcf_yield` real,
	`dividend_yield` real,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `filing_company_idx` ON `company_filings` (`company_id`,`period`);--> statement-breakpoint
CREATE TABLE `company_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`filing_id` text,
	`date` text NOT NULL,
	`growth_interpretation` text NOT NULL,
	`profitability_interpretation` text NOT NULL,
	`strength_interpretation` text NOT NULL,
	`quality_flag` text NOT NULL,
	`growth_flag` text NOT NULL,
	`strength_flag` text NOT NULL,
	`confidence` integer,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`filing_id`) REFERENCES `company_filings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`date` text NOT NULL,
	`decision` text NOT NULL,
	`horizon` text,
	`why` text NOT NULL,
	`thesis_id` text,
	`snapshot_id` text,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`scope` text NOT NULL,
	`target` text,
	`note` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `geo_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`countries` text,
	`description` text,
	`estimated_duration` text,
	`probability` integer,
	`potential_impact` text,
	`channels` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `horizon_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`position_id` text NOT NULL,
	`from_horizon` text NOT NULL,
	`to_horizon` text NOT NULL,
	`pl_pct_at_change` real,
	`reason` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invalidator_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`invalidator_id` text NOT NULL,
	`review_id` text,
	`date` text NOT NULL,
	`answer` text NOT NULL,
	`note` text,
	FOREIGN KEY (`invalidator_id`) REFERENCES `invalidators`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invalidators` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`ref_id` text NOT NULL,
	`label` text NOT NULL,
	`metric` text,
	`operator` text,
	`threshold` real,
	`unit` text,
	`persistence` text,
	`horizon_date` text,
	`source` text,
	`status` text NOT NULL,
	`status_at` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`position_id` text,
	`snapshot_id` text,
	`date` text NOT NULL,
	`horizon` text,
	`result_pct` real,
	`result_r` real,
	`expected` text,
	`happened` text,
	`verdict` text NOT NULL,
	`main_error` text,
	`error_tags` text,
	`lesson` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `macro_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`category_code` text NOT NULL,
	`indicator_code` text NOT NULL,
	`value` real,
	`previous` real,
	`unit` text,
	`ref_date` text NOT NULL,
	`obs_date` text,
	`entered_at` text,
	`trend` text,
	`source` text,
	`source_url` text,
	`note` text
);
--> statement-breakpoint
CREATE INDEX `macro_obs_idx` ON `macro_observations` (`category_code`,`indicator_code`,`ref_date`);--> statement-breakpoint
CREATE TABLE `macro_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`category_code` text NOT NULL,
	`date` text NOT NULL,
	`what_happens` text NOT NULL,
	`why` text NOT NULL,
	`impacts` text,
	`uncertainties` text,
	`diagnostic` text NOT NULL,
	`confidence` integer,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `market_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`diagnostic` text NOT NULL,
	`justification` text NOT NULL,
	`breadth_note` text,
	`confidence` integer,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `objections` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_run_id` text NOT NULL,
	`category` text NOT NULL,
	`text` text NOT NULL,
	`severity` text NOT NULL,
	`status` text NOT NULL,
	`user_response` text,
	`resulting_thesis_id` text,
	`handled_at` text,
	`origin` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`challenge_run_id`) REFERENCES `challenge_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `position_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`position_id` text NOT NULL,
	`date` text NOT NULL,
	`thesis_status` text NOT NULL,
	`confidence` integer,
	`note` text,
	`stop_changed_to` real,
	`stop_change_reason` text,
	`created_at` text,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`thesis_id` text NOT NULL,
	`snapshot_id` text,
	`setup_id` text,
	`horizon` text NOT NULL,
	`opened_at` text NOT NULL,
	`entry` real NOT NULL,
	`shares` real NOT NULL,
	`stop_initial` real NOT NULL,
	`target_initial` real,
	`stop_current` real,
	`status` text NOT NULL,
	`closed_at` text,
	`exit_price` real,
	`fees` real,
	`exit_reason` text,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`price` real NOT NULL,
	`at` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rule_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_code` text NOT NULL,
	`scope` text NOT NULL,
	`target_id` text NOT NULL,
	`detected_at` text,
	`status` text NOT NULL,
	`user_response` text,
	`answered_at` text
);
--> statement-breakpoint
CREATE INDEX `finding_target_idx` ON `rule_findings` (`target_id`,`rule_code`);--> statement-breakpoint
CREATE TABLE `sector_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`sector` text NOT NULL,
	`industry` text,
	`date` text NOT NULL,
	`cycle` text,
	`demand` text,
	`pricing_power` text,
	`capex` text,
	`competition` text,
	`regulation` text,
	`catalysts` text,
	`risks` text,
	`tailwind` text NOT NULL,
	`justification` text NOT NULL,
	`confidence` integer,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`capital` real,
	`max_risk_per_trade_pct` real,
	`max_open_risk_pct` real,
	`max_sector_pct` real,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`date` text NOT NULL,
	`trigger` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `technical_setups` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`date` text NOT NULL,
	`trend` text,
	`support` real,
	`resistance` real,
	`entry` real,
	`stop` real,
	`target` real,
	`horizon_days` integer,
	`max_loss` real,
	`event_risk_reviewed` integer,
	`event_risk_note` text,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `theses` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`version` integer NOT NULL,
	`parent_id` text,
	`revision_reason` text,
	`triggering_objection_id` text,
	`horizon` text NOT NULL,
	`direction` text NOT NULL,
	`why` text NOT NULL,
	`bull_case` text NOT NULL,
	`bear_case` text NOT NULL,
	`catalysts` text,
	`risks` text,
	`uncertainties` text,
	`confidence` integer NOT NULL,
	`confidence_post_challenge` integer,
	`status` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `thesis_company_idx` ON `theses` (`company_id`,`version`);--> statement-breakpoint
CREATE TABLE `valuation_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`filing_id` text,
	`date` text NOT NULL,
	`diagnostic` text NOT NULL,
	`justification` text NOT NULL,
	`peers` text,
	`confidence` integer,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`filing_id`) REFERENCES `company_filings`(`id`) ON UPDATE no action ON DELETE no action
);
