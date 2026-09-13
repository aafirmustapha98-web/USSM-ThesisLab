import {
  pgTable, text, integer, doublePrecision, boolean, jsonb, index,
} from "drizzle-orm/pg-core";

const now = () => new Date().toISOString();
const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

/* ------------------------------------------------------------------ */
/* Settings — singleton. Empty by default: the app enforces only the   */
/* limits the user has declared himself (spec §19).                    */
/* ------------------------------------------------------------------ */
export const settings = pgTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => "singleton"),
  capital: doublePrecision("capital"),
  maxRiskPerTradePct: doublePrecision("max_risk_per_trade_pct"),
  maxOpenRiskPct: doublePrecision("max_open_risk_pct"),
  maxSectorPct: doublePrecision("max_sector_pct"),
  updatedAt: text("updated_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */
export const companies = pgTable("companies", {
  id: id(),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector"),
  industry: text("industry"),
  /* idee | recherche | watchlist | position | cloture | ecarte | archive */
  status: text("status").notNull().$defaultFn(() => "recherche"),
  /* screener | actualite | conversation | these_macro | intuition | autre */
  ideaOrigin: text("idea_origin").notNull(),
  ideaNote: text("idea_note"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Macro — observations, readings, geopolitics                         */
/* ------------------------------------------------------------------ */
export const macroObservations = pgTable(
  "macro_observations",
  {
    id: id(),
    categoryCode: text("category_code").notNull(),
    indicatorCode: text("indicator_code").notNull(),
    value: doublePrecision("value"),
    previous: doublePrecision("previous"),
    unit: text("unit"),
    /* the period the data describes — never only the entry date */
    refDate: text("ref_date").notNull(),
    /* publication by the source */
    obsDate: text("obs_date"),
    enteredAt: text("entered_at").$defaultFn(now),
    trend: text("trend"), // up | flat | down
    source: text("source"),
    sourceUrl: text("source_url"),
    note: text("note"),
  },
  (t) => [index("macro_obs_idx").on(t.categoryCode, t.indicatorCode, t.refDate)],
);

export const macroReadings = pgTable("macro_readings", {
  id: id(),
  categoryCode: text("category_code").notNull(),
  date: text("date").notNull(),
  whatHappens: text("what_happens").notNull(),
  why: text("why").notNull(),
  impacts: jsonb("impacts").$type<string[]>(),
  uncertainties: jsonb("uncertainties").$type<string[]>(),
  /* favorable | neutre | defavorable — written by the user, never computed */
  diagnostic: text("diagnostic").notNull(),
  confidence: integer("confidence"),
  createdAt: text("created_at").$defaultFn(now),
});

export const marketReadings = pgTable("market_readings", {
  id: id(),
  date: text("date").notNull(),
  /* bullish | bearish | neutral | transition */
  diagnostic: text("diagnostic").notNull(),
  justification: text("justification").notNull(),
  breadthNote: text("breadth_note"),
  confidence: integer("confidence"),
  createdAt: text("created_at").$defaultFn(now),
});

export const geoEvents = pgTable("geo_events", {
  id: id(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  countries: text("countries"),
  description: text("description"),
  estimatedDuration: text("estimated_duration"),
  probability: integer("probability"),
  potentialImpact: text("potential_impact"),
  /* oil | inflation | supply_chain | trade | dollar | rates | growth | sectors */
  channels: jsonb("channels").$type<string[]>(),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Sector — keyed by sector name, shared across its companies          */
/* ------------------------------------------------------------------ */
export const sectorReadings = pgTable("sector_readings", {
  id: id(),
  sector: text("sector").notNull(),
  industry: text("industry"),
  date: text("date").notNull(),
  cycle: text("cycle"),
  demand: text("demand"),
  pricingPower: text("pricing_power"),
  capex: text("capex"),
  competition: text("competition"),
  regulation: text("regulation"),
  catalysts: jsonb("catalysts").$type<string[]>(),
  risks: jsonb("risks").$type<string[]>(),
  /* favorable | neutre | defavorable — the user's own conclusion */
  tailwind: text("tailwind").notNull(),
  justification: text("justification").notNull(),
  confidence: integer("confidence"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Company financials — THE single data-entry table                    */
/* ------------------------------------------------------------------ */
export const companyFilings = pgTable(
  "company_filings",
  {
    id: id(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    /* 2026-Q2 | FY2025 — a fiscal period, never just an entry date */
    period: text("period").notNull(),
    publishedAt: text("published_at"),
    enteredAt: text("entered_at").$defaultFn(now),
    source: text("source").$defaultFn(() => "finviz"),
    sourceUrl: text("source_url"),

    marketCap: doublePrecision("market_cap"),
    price: doublePrecision("price"),
    shares: doublePrecision("shares"),

    revenue: doublePrecision("revenue"),
    eps: doublePrecision("eps"),
    ebitda: doublePrecision("ebitda"),
    ebit: doublePrecision("ebit"),
    netIncome: doublePrecision("net_income"),
    fcf: doublePrecision("fcf"),
    cfo: doublePrecision("cfo"),

    grossMargin: doublePrecision("gross_margin"),
    operatingMargin: doublePrecision("operating_margin"),
    netMargin: doublePrecision("net_margin"),
    ebitdaMargin: doublePrecision("ebitda_margin"),
    roa: doublePrecision("roa"),
    roe: doublePrecision("roe"),
    roic: doublePrecision("roic"),

    totalDebt: doublePrecision("total_debt"),
    longTermDebt: doublePrecision("long_term_debt"),
    cash: doublePrecision("cash"),
    debtToEquity: doublePrecision("debt_to_equity"),
    interestCoverage: doublePrecision("interest_coverage"),
    currentRatio: doublePrecision("current_ratio"),
    quickRatio: doublePrecision("quick_ratio"),
    equity: doublePrecision("equity"),

    revenueGrowth: doublePrecision("revenue_growth"),
    epsGrowth: doublePrecision("eps_growth"),
    ebitdaGrowth: doublePrecision("ebitda_growth"),
    netIncomeGrowth: doublePrecision("net_income_growth"),
    fcfGrowth: doublePrecision("fcf_growth"),

    pe: doublePrecision("pe"),
    forwardPe: doublePrecision("forward_pe"),
    peg: doublePrecision("peg"),
    pb: doublePrecision("pb"),
    ps: doublePrecision("ps"),
    evEbitda: doublePrecision("ev_ebitda"),
    evEbit: doublePrecision("ev_ebit"),
    evFcf: doublePrecision("ev_fcf"),
    fcfYield: doublePrecision("fcf_yield"),
    dividendYield: doublePrecision("dividend_yield"),
  },
  (t) => [index("filing_company_idx").on(t.companyId, t.period)],
);

export const companyReadings = pgTable("company_readings", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  filingId: text("filing_id").references(() => companyFilings.id),
  date: text("date").notNull(),
  growthInterpretation: text("growth_interpretation").notNull(),
  profitabilityInterpretation: text("profitability_interpretation").notNull(),
  strengthInterpretation: text("strength_interpretation").notNull(),
  /* vert | jaune | rouge — the user's own diagnostics */
  qualityFlag: text("quality_flag").notNull(),
  growthFlag: text("growth_flag").notNull(),
  strengthFlag: text("strength_flag").notNull(),
  confidence: integer("confidence"),
  createdAt: text("created_at").$defaultFn(now),
});

export const valuationReadings = pgTable("valuation_readings", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  filingId: text("filing_id").references(() => companyFilings.id),
  date: text("date").notNull(),
  /* attractive | reasonable | expensive | very_expensive */
  diagnostic: text("diagnostic").notNull(),
  justification: text("justification").notNull(),
  peers: jsonb("peers").$type<string[]>(),
  confidence: integer("confidence"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Thesis — immutable, versioned                                       */
/* ------------------------------------------------------------------ */
export const theses = pgTable(
  "theses",
  {
    id: id(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    parentId: text("parent_id"),
    revisionReason: text("revision_reason"),
    triggeringObjectionId: text("triggering_objection_id"),
    /* swing | long_term — chosen consciously (spec §3) */
    horizon: text("horizon").notNull(),
    /* long | no_interest | avoid */
    direction: text("direction").notNull(),
    why: text("why").notNull(),
    bullCase: text("bull_case").notNull(),
    bearCase: text("bear_case").notNull(),
    catalysts: jsonb("catalysts").$type<string[]>(),
    risks: jsonb("risks").$type<string[]>(),
    uncertainties: jsonb("uncertainties").$type<string[]>(),
    confidence: integer("confidence").notNull(),
    confidencePostChallenge: integer("confidence_post_challenge"),
    /* draft | active | revised | invalidated | closed */
    status: text("status").notNull().$defaultFn(() => "active"),
    createdAt: text("created_at").$defaultFn(now),
  },
  (t) => [index("thesis_company_idx").on(t.companyId, t.version)],
);

export const invalidators = pgTable("invalidators", {
  id: id(),
  /* thesis | market */
  scope: text("scope").notNull(),
  refId: text("ref_id").notNull(),
  label: text("label").notNull(),
  metric: text("metric"),
  operator: text("operator"),
  threshold: doublePrecision("threshold"),
  unit: text("unit"),
  persistence: text("persistence"),
  horizonDate: text("horizon_date"),
  source: text("source"),
  /* not_occurred | occurred | unknown */
  status: text("status").notNull().$defaultFn(() => "not_occurred"),
  statusAt: text("status_at"),
  createdAt: text("created_at").$defaultFn(now),
});

export const invalidatorChecks = pgTable("invalidator_checks", {
  id: id(),
  invalidatorId: text("invalidator_id").notNull().references(() => invalidators.id, { onDelete: "cascade" }),
  reviewId: text("review_id"),
  date: text("date").notNull(),
  /* yes | no | dont_know — "dont_know" is a tracked answer, not a blank */
  answer: text("answer").notNull(),
  note: text("note"),
});

/* ------------------------------------------------------------------ */
/* Challenge — resolution loop                                         */
/* ------------------------------------------------------------------ */
export const challengeRuns = pgTable("challenge_runs", {
  id: id(),
  thesisId: text("thesis_id").notNull().references(() => theses.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  /* coach | analyst | manual */
  mode: text("mode").notNull(),
  model: text("model"),
  promptVersion: text("prompt_version"),
  rawOutput: text("raw_output"),
  createdAt: text("created_at").$defaultFn(now),
});

export const objections = pgTable("objections", {
  id: id(),
  challengeRunId: text("challenge_run_id").notNull().references(() => challengeRuns.id, { onDelete: "cascade" }),
  /* the 10 axes of spec §16 */
  category: text("category").notNull(),
  text: text("text").notNull(),
  /* critical | major | minor */
  severity: text("severity").notNull(),
  /* open | accepted | refuted */
  status: text("status").notNull().$defaultFn(() => "open"),
  userResponse: text("user_response"),
  resultingThesisId: text("resulting_thesis_id"),
  handledAt: text("handled_at"),
  /* ai | manual */
  origin: text("origin").notNull().$defaultFn(() => "manual"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Deterministic control findings                                      */
/* ------------------------------------------------------------------ */
export const ruleFindings = pgTable(
  "rule_findings",
  {
    id: id(),
    ruleCode: text("rule_code").notNull(),
    scope: text("scope").notNull(),
    targetId: text("target_id").notNull(),
    detectedAt: text("detected_at").$defaultFn(now),
    /* open | answered */
    status: text("status").notNull().$defaultFn(() => "open"),
    userResponse: text("user_response"),
    answeredAt: text("answered_at"),
  },
  (t) => [index("finding_target_idx").on(t.targetId, t.ruleCode)],
);

/* ------------------------------------------------------------------ */
/* Timing, prices, events                                              */
/* ------------------------------------------------------------------ */
export const technicalSetups = pgTable("technical_setups", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  trend: text("trend"), // up | down | sideways
  support: doublePrecision("support"),
  resistance: doublePrecision("resistance"),
  entry: doublePrecision("entry"),
  stop: doublePrecision("stop"),
  target: doublePrecision("target"),
  horizonDays: integer("horizon_days"),
  /* the user sets his own risk — never imposed (spec §19) */
  maxLoss: doublePrecision("max_loss"),
  eventRiskReviewed: boolean("event_risk_reviewed").$defaultFn(() => false),
  eventRiskNote: text("event_risk_note"),
  notes: text("notes"),
  createdAt: text("created_at").$defaultFn(now),
});

export const priceObservations = pgTable("price_observations", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  price: doublePrecision("price").notNull(),
  at: text("at").notNull(),
  /* manual | api — separated so a quote feed can be plugged in later */
  source: text("source").notNull().$defaultFn(() => "manual"),
});

export const events = pgTable("events", {
  id: id(),
  date: text("date").notNull(),
  /* earnings | cpi | pce | ppi | nfp | fomc | fed_speech | other */
  type: text("type").notNull(),
  /* market | sector | ticker */
  scope: text("scope").notNull(),
  target: text("target"),
  note: text("note"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Decision, frozen snapshot                                           */
/* ------------------------------------------------------------------ */
export const snapshots = pgTable("snapshots", {
  id: id(),
  companyId: text("company_id").notNull(),
  date: text("date").notNull(),
  /* open_position | watchlist | reject | decision */
  trigger: text("trigger").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
});

export const decisions = pgTable("decisions", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  /* buy | watchlist | wait | avoid | sell | hold */
  decision: text("decision").notNull(),
  horizon: text("horizon"),
  why: text("why").notNull(),
  thesisId: text("thesis_id"),
  snapshotId: text("snapshot_id"),
  createdAt: text("created_at").$defaultFn(now),
});

/* ------------------------------------------------------------------ */
/* Positions                                                           */
/* ------------------------------------------------------------------ */
export const positions = pgTable("positions", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  thesisId: text("thesis_id").notNull(),
  snapshotId: text("snapshot_id"),
  setupId: text("setup_id"),
  horizon: text("horizon").notNull(),
  openedAt: text("opened_at").notNull(),
  entry: doublePrecision("entry").notNull(),
  shares: doublePrecision("shares").notNull(),
  stopInitial: doublePrecision("stop_initial").notNull(),
  targetInitial: doublePrecision("target_initial"),
  stopCurrent: doublePrecision("stop_current"),
  /* open | closed */
  status: text("status").notNull().$defaultFn(() => "open"),
  closedAt: text("closed_at"),
  exitPrice: doublePrecision("exit_price"),
  fees: doublePrecision("fees"),
  /* invalidator | stop | target | discretionary | event */
  exitReason: text("exit_reason"),
  createdAt: text("created_at").$defaultFn(now),
});

export const positionReviews = pgTable("position_reviews", {
  id: id(),
  positionId: text("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  /* intact | strengthened | weakened | invalidated — filled AFTER the checks */
  thesisStatus: text("thesis_status").notNull(),
  confidence: integer("confidence"),
  note: text("note"),
  stopChangedTo: doublePrecision("stop_changed_to"),
  stopChangeReason: text("stop_change_reason"),
  createdAt: text("created_at").$defaultFn(now),
});

/* A horizon change is never silent (spec §3) */
export const horizonChanges = pgTable("horizon_changes", {
  id: id(),
  positionId: text("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  fromHorizon: text("from_horizon").notNull(),
  toHorizon: text("to_horizon").notNull(),
  plPctAtChange: doublePrecision("pl_pct_at_change"),
  reason: text("reason").notNull(),
  date: text("date").notNull(),
});

/* ------------------------------------------------------------------ */
/* Journal & learning                                                  */
/* ------------------------------------------------------------------ */
export const journalEntries = pgTable("journal_entries", {
  id: id(),
  companyId: text("company_id").notNull(),
  positionId: text("position_id"),
  snapshotId: text("snapshot_id"),
  date: text("date").notNull(),
  horizon: text("horizon"),
  resultPct: doublePrecision("result_pct"),
  resultR: doublePrecision("result_r"),
  expected: text("expected"),
  happened: text("happened"),
  /* correct | partially_correct | incorrect */
  verdict: text("verdict").notNull(),
  mainError: text("main_error"),
  /* taxonomy of recurring errors (spec §25) */
  errorTags: jsonb("error_tags").$type<string[]>(),
  lesson: text("lesson").notNull(),
  createdAt: text("created_at").$defaultFn(now),
});

export type Company = typeof companies.$inferSelect;
export type CompanyFiling = typeof companyFilings.$inferSelect;
export type Thesis = typeof theses.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Invalidator = typeof invalidators.$inferSelect;
export type Objection = typeof objections.$inferSelect;
export type MacroReading = typeof macroReadings.$inferSelect;
export type MacroObservation = typeof macroObservations.$inferSelect;
