/**
 * Macro catalogue — CONFIGURATION, not code.
 * Adding, removing or moving an indicator must never require touching a component.
 *
 * 18 spec categories -> 14 macro categories + 1 Market block:
 *   - spec 09 (Equity Market) and 10 (VIX) live in the Market block of the same page
 *   - spec 05 + 06 merged into M05 Rates & Curve   (both questions kept)
 *   - spec 07 + 08 merged into M06 Liquidity & Credit (both questions kept)
 */

export type IndicatorKind = "numeric" | "text";
export type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "event";

export interface IndicatorDef {
  code: string;
  label: string;
  unit?: string;
  kind?: IndicatorKind;
  frequency: Frequency;
}

export interface MacroCategoryDef {
  code: string;
  label: string;
  template: "quantitative" | "qualitative";
  core: boolean;
  stalenessDays: number;
  questions: string[];
  warning?: string;
  indicators: IndicatorDef[];
}

export const IMPACT_OPTIONS = [
  { value: "fed", label: "Fed" },
  { value: "rates", label: "Taux" },
  { value: "dollar", label: "Dollar" },
  { value: "equities", label: "Actions" },
  { value: "credit", label: "Crédit" },
  { value: "growth", label: "Croissance" },
  { value: "inflation", label: "Inflation" },
  { value: "sector", label: "Secteurs" },
] as const;

export const DIAGNOSTIC_OPTIONS = [
  { value: "favorable", label: "Favorable aux actions", flag: "green" },
  { value: "neutre", label: "Neutre / incertain", flag: "amber" },
  { value: "defavorable", label: "Défavorable aux actions", flag: "red" },
] as const;

export const TE_HUB = "https://tradingeconomics.com/united-states/indicators";
export const TE_CALENDAR = "https://tradingeconomics.com/united-states/calendar";
export const FINVIZ = (ticker: string) =>
  `https://finviz.com/quote.ashx?t=${encodeURIComponent(ticker)}`;

export const MACRO_CATEGORIES: MacroCategoryDef[] = [
  {
    code: "M01",
    label: "Économie américaine",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: ["Économie américaine : accélération ou ralentissement ?"],
    indicators: [
      { code: "GDP_GROWTH", label: "GDP Growth", unit: "%", frequency: "quarterly" },
      { code: "REAL_GDP", label: "Real GDP", unit: "%", frequency: "quarterly" },
      { code: "PERSONAL_CONSUMPTION", label: "Personal Consumption", unit: "%", frequency: "quarterly" },
      { code: "BUSINESS_INVESTMENT", label: "Business Investment", unit: "%", frequency: "quarterly" },
      { code: "GDPNOW", label: "GDPNow / Nowcast", unit: "%", frequency: "weekly" },
    ],
  },
  {
    code: "M02",
    label: "Marché du travail",
    template: "quantitative",
    core: true,
    stalenessDays: 30,
    questions: [
      "Le marché du travail se renforce-t-il ou se détériore-t-il ?",
      "Est-il inflationniste ou désinflationniste ?",
    ],
    indicators: [
      { code: "NFP", label: "Nonfarm Payrolls", unit: "k", frequency: "monthly" },
      { code: "UNEMPLOYMENT", label: "Unemployment Rate", unit: "%", frequency: "monthly" },
      { code: "INITIAL_CLAIMS", label: "Initial Jobless Claims", unit: "k", frequency: "weekly" },
      { code: "CONTINUING_CLAIMS", label: "Continuing Claims", unit: "k", frequency: "weekly" },
      { code: "AHE", label: "Average Hourly Earnings", unit: "% a/a", frequency: "monthly" },
      { code: "ECI", label: "Employment Cost Index", unit: "%", frequency: "quarterly" },
      { code: "JOLTS", label: "JOLTS — postes ouverts", unit: "M", frequency: "monthly" },
      { code: "ADP", label: "ADP Employment", unit: "k", frequency: "monthly" },
    ],
  },
  {
    code: "M03",
    label: "Inflation",
    template: "quantitative",
    core: true,
    stalenessDays: 30,
    questions: [
      "L'inflation converge-t-elle vers 2 % ?",
      "Qu'est-ce qui explique son évolution ?",
    ],
    indicators: [
      { code: "CPI", label: "CPI", unit: "% a/a", frequency: "monthly" },
      { code: "CORE_CPI", label: "Core CPI", unit: "% a/a", frequency: "monthly" },
      { code: "PCE", label: "PCE", unit: "% a/a", frequency: "monthly" },
      { code: "CORE_PCE", label: "Core PCE", unit: "% a/a", frequency: "monthly" },
      { code: "PPI", label: "PPI", unit: "% a/a", frequency: "monthly" },
      { code: "CORE_PPI", label: "Core PPI", unit: "% a/a", frequency: "monthly" },
      { code: "INFL_EXPECT", label: "Inflation Expectations", unit: "%", frequency: "monthly" },
      { code: "MICH_INFL", label: "Michigan Inflation Expectations", unit: "%", frequency: "monthly" },
    ],
  },
  {
    code: "M04",
    label: "Fed",
    template: "quantitative",
    core: true,
    stalenessDays: 30,
    questions: [
      "La Fed est-elle restrictive, neutre ou accommodante ?",
      "Sa direction devient-elle plus hawkish ou dovish ?",
    ],
    indicators: [
      { code: "FED_FUNDS", label: "Fed Funds Rate", unit: "%", frequency: "monthly" },
      { code: "FOMC_DECISION", label: "FOMC Decision", kind: "text", frequency: "event" },
      { code: "DOT_PLOT", label: "Dot Plot", kind: "text", frequency: "quarterly" },
      { code: "FOMC_MINUTES", label: "FOMC Minutes", kind: "text", frequency: "event" },
      { code: "FED_BALANCE_SHEET", label: "Fed Balance Sheet", unit: "Md USD", frequency: "weekly" },
      { code: "QT_QE", label: "QT / QE", kind: "text", frequency: "monthly" },
      { code: "MARKET_RATE_EXPECT", label: "Market Rate Expectations", unit: "%", frequency: "weekly" },
      { code: "FED_SPEECHES", label: "Fed speeches / communication", kind: "text", frequency: "event" },
    ],
  },
  {
    code: "M05",
    label: "Obligations & courbe des taux",
    template: "quantitative",
    core: true,
    stalenessDays: 30,
    questions: [
      "Que nous dit le marché obligataire sur la croissance, l'inflation et les taux ?",
      "Pourquoi la courbe évolue-t-elle ainsi ? (inversion / normalisation / steepening / flattening)",
    ],
    indicators: [
      { code: "US2Y", label: "US 2Y", unit: "%", frequency: "daily" },
      { code: "US5Y", label: "US 5Y", unit: "%", frequency: "daily" },
      { code: "US10Y", label: "US 10Y", unit: "%", frequency: "daily" },
      { code: "US30Y", label: "US 30Y", unit: "%", frequency: "daily" },
      { code: "US10Y_REAL", label: "10Y Real Yield", unit: "%", frequency: "daily" },
      { code: "TIPS", label: "TIPS / Breakeven", unit: "%", frequency: "daily" },
      { code: "CURVE_2S10S", label: "Courbe 2Y-10Y", unit: "pdb", frequency: "daily" },
      { code: "CURVE_3M10Y", label: "Courbe 3M-10Y", unit: "pdb", frequency: "daily" },
      { code: "CURVE_5S30S", label: "Courbe 5Y-30Y", unit: "pdb", frequency: "daily" },
    ],
  },
  {
    code: "M06",
    label: "Liquidité & crédit",
    template: "quantitative",
    core: true,
    stalenessDays: 30,
    questions: [
      "Les conditions de crédit se détendent-elles ou se resserrent-elles ?",
      "Les conditions de liquidité deviennent-elles plus favorables ou moins favorables ?",
    ],
    warning:
      "Ne jamais appliquer la règle « Fed Balance Sheet ↑ = bullish ». Décris le mécanisme de transmission que tu retiens.",
    indicators: [
      { code: "IG_SPREAD", label: "Investment Grade Spread", unit: "pdb", frequency: "weekly" },
      { code: "HY_SPREAD", label: "High Yield Spread", unit: "pdb", frequency: "weekly" },
      { code: "CORP_YIELD", label: "Corporate Bond Yields", unit: "%", frequency: "weekly" },
      { code: "HY_DEFAULT", label: "HY Default Rate", unit: "%", frequency: "monthly" },
      { code: "FIN_CONDITIONS", label: "Financial Conditions", unit: "idx", frequency: "weekly" },
      { code: "LENDING_STANDARDS", label: "Bank Lending Standards", kind: "text", frequency: "quarterly" },
      { code: "FED_BS_LIQ", label: "Fed Balance Sheet", unit: "Md USD", frequency: "weekly" },
      { code: "M2", label: "M2", unit: "Md USD", frequency: "monthly" },
      { code: "BANK_RESERVES", label: "Bank Reserves", unit: "Md USD", frequency: "weekly" },
      { code: "RRP", label: "Reverse Repo", unit: "Md USD", frequency: "weekly" },
      { code: "TGA", label: "Treasury General Account", unit: "Md USD", frequency: "weekly" },
    ],
  },
  {
    code: "M07",
    label: "Dollar",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: ["Quelle est la tendance du dollar et pourquoi ?"],
    indicators: [
      { code: "DXY", label: "DXY", unit: "idx", frequency: "daily" },
      { code: "EURUSD", label: "EUR/USD", frequency: "daily" },
      { code: "USDJPY", label: "USD/JPY", frequency: "daily" },
    ],
  },
  {
    code: "M08",
    label: "Pétrole & matières premières",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: [
      "Quel est l'impact potentiel sur l'inflation ?",
      "Quels secteurs bénéficient ou souffrent de cette évolution ?",
    ],
    indicators: [
      { code: "WTI", label: "WTI", unit: "USD", frequency: "daily" },
      { code: "BRENT", label: "Brent", unit: "USD", frequency: "daily" },
      { code: "GOLD", label: "Gold", unit: "USD", frequency: "daily" },
      { code: "COPPER", label: "Copper", unit: "USD", frequency: "daily" },
      { code: "NATGAS", label: "Natural Gas", unit: "USD", frequency: "daily" },
      { code: "COMMODITY_INDEX", label: "Commodity Index", unit: "idx", frequency: "daily" },
    ],
  },
  {
    code: "M09",
    label: "Immobilier américain",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: ["Le marché immobilier accélère-t-il ou ralentit-il ?"],
    indicators: [
      { code: "MORTGAGE_30Y", label: "Mortgage Rates 30Y", unit: "%", frequency: "weekly" },
      { code: "HOUSING_STARTS", label: "Housing Starts", unit: "k", frequency: "monthly" },
      { code: "BUILDING_PERMITS", label: "Building Permits", unit: "k", frequency: "monthly" },
      { code: "NEW_HOME_SALES", label: "New Home Sales", unit: "k", frequency: "monthly" },
      { code: "EXISTING_HOME_SALES", label: "Existing Home Sales", unit: "M", frequency: "monthly" },
      { code: "PENDING_HOME_SALES", label: "Pending Home Sales", unit: "%", frequency: "monthly" },
      { code: "CASE_SHILLER", label: "Case-Shiller", unit: "% a/a", frequency: "monthly" },
      { code: "AFFORDABILITY", label: "Housing Affordability", unit: "idx", frequency: "monthly" },
    ],
  },
  {
    code: "M10",
    label: "Consommateur américain",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: ["Le consommateur américain reste-t-il solide ?"],
    indicators: [
      { code: "RETAIL_SALES", label: "Retail Sales", unit: "% a/a", frequency: "monthly" },
      { code: "PERSONAL_CONSUMPTION_C", label: "Personal Consumption", unit: "%", frequency: "monthly" },
      { code: "PERSONAL_INCOME", label: "Personal Income", unit: "%", frequency: "monthly" },
      { code: "CONSUMER_CONFIDENCE", label: "Consumer Confidence", unit: "idx", frequency: "monthly" },
      { code: "MICH_SENTIMENT", label: "Michigan Consumer Sentiment", unit: "idx", frequency: "monthly" },
      { code: "CONSUMER_CREDIT", label: "Consumer Credit", unit: "Md USD", frequency: "monthly" },
      { code: "SAVINGS_RATE", label: "Savings Rate", unit: "%", frequency: "monthly" },
    ],
  },
  {
    code: "M11",
    label: "Industrie",
    template: "quantitative",
    core: false,
    stalenessDays: 60,
    questions: ["L'activité industrielle et les services accélèrent-ils ou ralentissent-ils ?"],
    indicators: [
      { code: "ISM_MFG", label: "ISM Manufacturing", unit: "idx", frequency: "monthly" },
      { code: "ISM_SERVICES", label: "ISM Services", unit: "idx", frequency: "monthly" },
      { code: "PMI_MFG", label: "Manufacturing PMI", unit: "idx", frequency: "monthly" },
      { code: "PMI_SERVICES", label: "Services PMI", unit: "idx", frequency: "monthly" },
      { code: "IND_PRODUCTION", label: "Industrial Production", unit: "% a/a", frequency: "monthly" },
      { code: "CAPACITY_UTIL", label: "Capacity Utilization", unit: "%", frequency: "monthly" },
      { code: "DURABLE_GOODS", label: "Durable Goods Orders", unit: "%", frequency: "monthly" },
      { code: "FACTORY_ORDERS", label: "Factory Orders", unit: "%", frequency: "monthly" },
    ],
  },
  {
    code: "M12",
    label: "Gouvernement américain",
    template: "quantitative",
    core: false,
    stalenessDays: 90,
    questions: ["La politique budgétaire stimule-t-elle ou freine-t-elle l'économie ?"],
    indicators: [
      { code: "BUDGET_BALANCE", label: "Federal Budget Balance", unit: "Md USD", frequency: "monthly" },
      { code: "DEBT_GDP", label: "Government Debt / GDP", unit: "%", frequency: "quarterly" },
      { code: "DEFICIT_GDP", label: "Fiscal Deficit / GDP", unit: "%", frequency: "quarterly" },
      { code: "TREASURY_ISSUANCE", label: "Treasury Issuance", unit: "Md USD", frequency: "quarterly" },
      { code: "INTEREST_EXPENSE", label: "Interest Expense", unit: "Md USD", frequency: "quarterly" },
      { code: "GOV_SPENDING", label: "Government Spending", unit: "Md USD", frequency: "quarterly" },
      { code: "TAX_POLICY", label: "Tax Policy", kind: "text", frequency: "event" },
      { code: "TARIFFS", label: "Tariffs", kind: "text", frequency: "event" },
    ],
  },
  {
    code: "M13",
    label: "Géopolitique",
    template: "qualitative",
    core: false,
    stalenessDays: 90,
    questions: [
      "Quels canaux de transmission sont activés ?",
      "Quelle est la durée estimée et la probabilité de l'événement ?",
    ],
    warning:
      "Ne pas chercher à automatiser la géopolitique. Enregistre les événements, puis analyse leurs canaux de transmission.",
    indicators: [],
  },
  {
    code: "M14",
    label: "Technologie / IA",
    template: "quantitative",
    core: false,
    stalenessDays: 90,
    questions: ["CapEx → Revenue → FCF → ROI : où en est la chaîne ?"],
    indicators: [
      { code: "AI_CAPEX", label: "AI CapEx", unit: "Md USD", frequency: "quarterly" },
      { code: "HYPERSCALER_CAPEX", label: "Hyperscaler CapEx", unit: "Md USD", frequency: "quarterly" },
      { code: "SEMI_CYCLE", label: "Semiconductor Cycle", kind: "text", frequency: "quarterly" },
      { code: "SEMI_SALES", label: "Semiconductor Sales", unit: "% a/a", frequency: "monthly" },
      { code: "DC_INVESTMENT", label: "Data Center Investment", unit: "Md USD", frequency: "quarterly" },
      { code: "GPU_DEMAND", label: "GPU Demand", kind: "text", frequency: "quarterly" },
      { code: "CLOUD_GROWTH", label: "Cloud Growth", unit: "% a/a", frequency: "quarterly" },
      { code: "AI_REVENUE", label: "AI Revenue", unit: "Md USD", frequency: "quarterly" },
      { code: "AI_MARGIN", label: "AI Margin", unit: "%", frequency: "quarterly" },
      { code: "AI_MONETIZATION", label: "AI Monetization", kind: "text", frequency: "quarterly" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Market block — spec categories 09 and 10, same page                 */
/* ------------------------------------------------------------------ */
export const MARKET_GROUPS: { label: string; indicators: IndicatorDef[] }[] = [
  {
    label: "Indices",
    indicators: [
      { code: "SPX", label: "S&P 500", unit: "pts", frequency: "daily" },
      { code: "NASDAQ_COMP", label: "Nasdaq Composite", unit: "pts", frequency: "daily" },
      { code: "NDX", label: "Nasdaq 100", unit: "pts", frequency: "daily" },
      { code: "RUT", label: "Russell 2000", unit: "pts", frequency: "daily" },
      { code: "DJI", label: "Dow Jones", unit: "pts", frequency: "daily" },
      { code: "SPX_EW", label: "S&P 500 Equal Weight", unit: "pts", frequency: "daily" },
    ],
  },
  {
    label: "Breadth",
    indicators: [
      { code: "ADV_DEC", label: "Advance / Decline", unit: "ratio", frequency: "daily" },
      { code: "NH_NL", label: "New Highs / New Lows", unit: "ratio", frequency: "daily" },
      { code: "ABOVE_50DMA", label: "% stocks above 50 DMA", unit: "%", frequency: "daily" },
      { code: "ABOVE_200DMA", label: "% stocks above 200 DMA", unit: "%", frequency: "daily" },
    ],
  },
  {
    label: "Volatilité",
    indicators: [
      { code: "VIX", label: "VIX", unit: "pts", frequency: "daily" },
      { code: "VIX_TERM", label: "VIX Term Structure", kind: "text", frequency: "daily" },
      { code: "VIX_FUTURES", label: "VIX Futures", unit: "pts", frequency: "daily" },
      { code: "VVIX", label: "VVIX", unit: "pts", frequency: "daily" },
    ],
  },
];

export const MARKET_CATEGORY_CODE = "MKT";

export const MARKET_DIAGNOSTICS = [
  { value: "bullish", label: "Bullish", flag: "green" },
  { value: "neutral", label: "Neutral", flag: "amber" },
  { value: "transition", label: "Transition", flag: "amber" },
  { value: "bearish", label: "Bearish", flag: "red" },
] as const;

export const GEO_CHANNELS = [
  { value: "oil", label: "Pétrole" },
  { value: "inflation", label: "Inflation" },
  { value: "supply_chain", label: "Supply chain" },
  { value: "trade", label: "Commerce" },
  { value: "dollar", label: "Dollar" },
  { value: "rates", label: "Taux" },
  { value: "growth", label: "Croissance" },
  { value: "sectors", label: "Secteurs" },
] as const;

export const CORE_CATEGORIES = MACRO_CATEGORIES.filter((c) => c.core);

export function findCategory(code: string) {
  return MACRO_CATEGORIES.find((c) => c.code === code);
}

export function findIndicator(categoryCode: string, indicatorCode: string) {
  if (categoryCode === MARKET_CATEGORY_CODE) {
    return MARKET_GROUPS.flatMap((g) => g.indicators).find((i) => i.code === indicatorCode);
  }
  return findCategory(categoryCode)?.indicators.find((i) => i.code === indicatorCode);
}
