/** Company data-entry blocks — configuration, mirrors spec §11 and §13. */

export interface FieldDef {
  key: string;
  label: string;
  unit?: string;
  hint?: string;
}

export interface BlockDef {
  key: string;
  label: string;
  question?: string;
  fields: FieldDef[];
}

/** The ONLY place financial data is entered. Valuation re-uses it, never re-asks. */
export const COMPANY_BLOCKS: BlockDef[] = [
  {
    key: "basic",
    label: "Basic information",
    fields: [
      { key: "price", label: "Current Price", unit: "USD" },
      { key: "marketCap", label: "Market Cap", unit: "M USD" },
      { key: "shares", label: "Shares outstanding", unit: "M" },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    question: "Est-ce que l'entreprise croît réellement ? D'où vient cette croissance ?",
    fields: [
      { key: "revenue", label: "Revenue", unit: "M USD" },
      { key: "revenueGrowth", label: "Revenue Growth", unit: "%" },
      { key: "eps", label: "EPS", unit: "USD" },
      { key: "epsGrowth", label: "EPS Growth", unit: "%" },
      { key: "ebitda", label: "EBITDA", unit: "M USD" },
      { key: "ebitdaGrowth", label: "EBITDA Growth", unit: "%" },
      { key: "ebit", label: "EBIT", unit: "M USD" },
      { key: "netIncome", label: "Net Income", unit: "M USD" },
      { key: "netIncomeGrowth", label: "Net Income Growth", unit: "%" },
      { key: "fcf", label: "FCF", unit: "M USD" },
      { key: "fcfGrowth", label: "FCF Growth", unit: "%" },
    ],
  },
  {
    key: "profitability",
    label: "Profitability",
    question: "Les marges progressent-elles ? L'entreprise utilise-t-elle efficacement son capital ?",
    fields: [
      { key: "grossMargin", label: "Gross Margin", unit: "%" },
      { key: "operatingMargin", label: "Operating Margin", unit: "%" },
      { key: "netMargin", label: "Net Margin", unit: "%" },
      { key: "ebitdaMargin", label: "EBITDA Margin", unit: "%" },
      { key: "roa", label: "ROA", unit: "%" },
      { key: "roe", label: "ROE", unit: "%" },
      { key: "roic", label: "ROIC / ROCE", unit: "%" },
    ],
  },
  {
    key: "strength",
    label: "Financial strength",
    question: "L'entreprise peut-elle supporter une période difficile ?",
    fields: [
      { key: "totalDebt", label: "Total Debt", unit: "M USD" },
      { key: "longTermDebt", label: "Long-Term Debt", unit: "M USD" },
      { key: "cash", label: "Cash", unit: "M USD" },
      { key: "equity", label: "Equity", unit: "M USD" },
      { key: "debtToEquity", label: "Debt / Equity", unit: "x" },
      { key: "interestCoverage", label: "Interest Coverage", unit: "x" },
    ],
  },
  {
    key: "liquidity",
    label: "Liquidity",
    question: "L'entreprise peut-elle respecter ses obligations à court terme ?",
    fields: [
      { key: "currentRatio", label: "Current Ratio", unit: "x" },
      { key: "quickRatio", label: "Quick Ratio", unit: "x" },
      { key: "cfo", label: "CFO", unit: "M USD" },
    ],
  },
  {
    key: "valuation",
    label: "Valuation ratios",
    question: "Saisis ici les ratios lus sur Finviz. La page Valuation les interprète, elle ne les redemande pas.",
    fields: [
      { key: "pe", label: "P/E", unit: "x" },
      { key: "forwardPe", label: "Forward P/E", unit: "x" },
      { key: "peg", label: "PEG", unit: "x" },
      { key: "pb", label: "P/B", unit: "x" },
      { key: "ps", label: "P/S", unit: "x" },
      { key: "evEbitda", label: "EV/EBITDA", unit: "x" },
      { key: "evEbit", label: "EV/EBIT", unit: "x" },
      { key: "evFcf", label: "EV/FCF", unit: "x" },
      { key: "fcfYield", label: "FCF Yield", unit: "%" },
      { key: "dividendYield", label: "Dividend Yield", unit: "%" },
    ],
  },
];

/** Metrics shown side by side in the comparison table (spec §14). Descriptive only. */
export const COMPARISON_METRICS: FieldDef[] = [
  { key: "pe", label: "P/E", unit: "x" },
  { key: "forwardPe", label: "Forward P/E", unit: "x" },
  { key: "peg", label: "PEG", unit: "x" },
  { key: "evEbitda", label: "EV/EBITDA", unit: "x" },
  { key: "roic", label: "ROIC", unit: "%" },
  { key: "roe", label: "ROE", unit: "%" },
  { key: "revenueGrowth", label: "Revenue Growth", unit: "%" },
  { key: "epsGrowth", label: "EPS Growth", unit: "%" },
  { key: "operatingMargin", label: "Operating Margin", unit: "%" },
  { key: "debtToEquity", label: "Debt / Equity", unit: "x" },
];

/** Growth figures displayed next to the multiples on the Valuation page (spec §13). */
export const VALUATION_CONTEXT_METRICS: FieldDef[] = [
  { key: "revenueGrowth", label: "Revenue Growth", unit: "%" },
  { key: "epsGrowth", label: "EPS Growth", unit: "%" },
  { key: "fcfGrowth", label: "FCF Growth", unit: "%" },
  { key: "roic", label: "ROIC", unit: "%" },
  { key: "grossMargin", label: "Gross Margin", unit: "%" },
  { key: "operatingMargin", label: "Operating Margin", unit: "%" },
];

export const VALUATION_DIAGNOSTICS = [
  { value: "attractive", label: "Attractive", flag: "green" },
  { value: "reasonable", label: "Reasonable", flag: "green" },
  { value: "expensive", label: "Expensive", flag: "amber" },
  { value: "very_expensive", label: "Very Expensive", flag: "red" },
] as const;

export const FLAG_OPTIONS = [
  { value: "green", label: "🟢 Solide" },
  { value: "amber", label: "🟡 Mitigé" },
  { value: "red", label: "🔴 Faible" },
] as const;

export const SECTOR_FIELDS = {
  cycle: ["Expansion", "Accélération", "Ralentissement", "Contraction"],
  demand: ["Forte", "Normale", "Faible"],
  pricingPower: ["Fort", "Moyen", "Faible"],
  capex: ["En hausse", "Stable", "En baisse"],
} as const;

export const IDEA_ORIGINS = [
  { value: "screener", label: "Screener" },
  { value: "actualite", label: "Actualité" },
  { value: "conversation", label: "Conversation" },
  { value: "these_macro", label: "Thèse macro" },
  { value: "intuition", label: "Intuition" },
  { value: "autre", label: "Autre" },
] as const;

export const DECISION_OPTIONS = [
  { value: "buy", label: "Buy" },
  { value: "watchlist", label: "Watchlist" },
  { value: "wait", label: "Wait" },
  { value: "avoid", label: "Avoid" },
  { value: "hold", label: "Hold" },
  { value: "sell", label: "Sell" },
] as const;

export const HORIZONS = [
  { value: "swing", label: "Swing" },
  { value: "long_term", label: "Long term" },
] as const;

/** Recurring-error taxonomy (spec §25). */
export const ERROR_TAGS = [
  { value: "timing", label: "Mauvaise gestion du timing" },
  { value: "late_entry", label: "Entrée trop tardive" },
  { value: "macro_read", label: "Mauvaise lecture macro" },
  { value: "valuation", label: "Mauvaise valorisation" },
  { value: "confirmation_bias", label: "Biais de confirmation" },
  { value: "stop_placement", label: "Stop mal placé" },
  { value: "position_size", label: "Position trop importante" },
  { value: "earnings_read", label: "Mauvaise lecture des résultats" },
  { value: "thesis_drift", label: "Thèse qui a dérivé" },
  { value: "ignored_invalidator", label: "Invalidateur ignoré" },
] as const;

/** The 10 challenge axes of spec §16. */
export const OBJECTION_CATEGORIES = [
  { value: "weak_assumption", label: "Hypothèse faible" },
  { value: "missing_data", label: "Donnée manquante" },
  { value: "contradiction", label: "Contradiction" },
  { value: "confirmation_bias", label: "Biais de confirmation" },
  { value: "alternative_explanation", label: "Explication alternative" },
  { value: "bear_case", label: "Bear case" },
  { value: "macro_contradiction", label: "Contradiction macro" },
  { value: "valuation_risk", label: "Risque de valorisation" },
  { value: "sector_risk", label: "Risque sectoriel" },
  { value: "invalidating_event", label: "Événement invalidant" },
] as const;

export const EVENT_TYPES = [
  { value: "earnings", label: "Earnings" },
  { value: "cpi", label: "CPI" },
  { value: "pce", label: "PCE" },
  { value: "ppi", label: "PPI" },
  { value: "nfp", label: "NFP" },
  { value: "fomc", label: "FOMC" },
  { value: "fed_speech", label: "Fed speech" },
  { value: "other", label: "Autre" },
] as const;
