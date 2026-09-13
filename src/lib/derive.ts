import type { CompanyFiling } from "@/db/schema";

/**
 * Derived metrics (spec §12).
 * Rules: never invent a missing value, never substitute zero.
 * Every result carries its formula and the exact inputs used.
 */
export interface Derived {
  key: string;
  label: string;
  formula: string;
  unit?: string;
  value: number | null;
  inputs: { label: string; value: number | null }[];
  missing: string[];
}

type F = CompanyFiling | null | undefined;

function n(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function build(
  key: string,
  label: string,
  formula: string,
  inputs: { label: string; value: number | null }[],
  compute: (vals: number[]) => number | null,
  unit?: string,
): Derived {
  const missing = inputs.filter((i) => i.value === null).map((i) => i.label);
  const value =
    missing.length > 0 ? null : compute(inputs.map((i) => i.value as number));
  return { key, label, formula, unit, value, inputs, missing };
}

function growth(
  key: string,
  label: string,
  field: keyof CompanyFiling,
  fieldLabel: string,
  current: F,
  previous: F,
): Derived {
  const cur = n(current?.[field] as number | null);
  const prev = n(previous?.[field] as number | null);
  return build(
    key,
    label,
    `(${fieldLabel} courant − ${fieldLabel} précédent) ÷ |${fieldLabel} précédent|`,
    [
      { label: `${fieldLabel} courant`, value: cur },
      { label: `${fieldLabel} précédent`, value: prev },
    ],
    ([c, p]) => (p === 0 ? null : ((c - p) / Math.abs(p)) * 100),
    "%",
  );
}

function marginChange(
  key: string,
  label: string,
  field: keyof CompanyFiling,
  fieldLabel: string,
  current: F,
  previous: F,
): Derived {
  return build(
    key,
    label,
    `${fieldLabel} courante − ${fieldLabel} précédente`,
    [
      { label: `${fieldLabel} courante`, value: n(current?.[field] as number | null) },
      { label: `${fieldLabel} précédente`, value: n(previous?.[field] as number | null) },
    ],
    ([c, p]) => c - p,
    "pts",
  );
}

export function deriveAll(current: F, previous: F): Derived[] {
  const netDebt = build(
    "netDebt",
    "Net Debt",
    "Total Debt − Cash",
    [
      { label: "Total Debt", value: n(current?.totalDebt) },
      { label: "Cash", value: n(current?.cash) },
    ],
    ([d, c]) => d - c,
    "M USD",
  );

  const out: Derived[] = [
    netDebt,
    build(
      "netDebtToEbitda",
      "Net Debt / EBITDA",
      "(Total Debt − Cash) ÷ EBITDA",
      [
        { label: "Net Debt", value: netDebt.value },
        { label: "EBITDA", value: n(current?.ebitda) },
      ],
      ([nd, e]) => (e === 0 ? null : nd / e),
      "x",
    ),
    build(
      "ev",
      "Enterprise Value",
      "Market Cap + Net Debt",
      [
        { label: "Market Cap", value: n(current?.marketCap) },
        { label: "Net Debt", value: netDebt.value },
      ],
      ([mc, nd]) => mc + nd,
      "M USD",
    ),
    build(
      "fcfYieldCalc",
      "FCF Yield (calculé)",
      "FCF ÷ Market Cap",
      [
        { label: "FCF", value: n(current?.fcf) },
        { label: "Market Cap", value: n(current?.marketCap) },
      ],
      ([f, mc]) => (mc === 0 ? null : (f / mc) * 100),
      "%",
    ),
    build(
      "cfoToNetIncome",
      "CFO / Net Income",
      "CFO ÷ Net Income",
      [
        { label: "CFO", value: n(current?.cfo) },
        { label: "Net Income", value: n(current?.netIncome) },
      ],
      ([c, ni]) => (ni === 0 ? null : c / ni),
      "x",
    ),
    growth("revenueGrowthCalc", "Revenue Growth (calculé)", "revenue", "Revenue", current, previous),
    growth("epsGrowthCalc", "EPS Growth (calculé)", "eps", "EPS", current, previous),
    growth("fcfGrowthCalc", "FCF Growth (calculé)", "fcf", "FCF", current, previous),
    marginChange("grossMarginChange", "Δ Gross Margin", "grossMargin", "Gross Margin", current, previous),
    marginChange("operatingMarginChange", "Δ Operating Margin", "operatingMargin", "Operating Margin", current, previous),
    marginChange("netMarginChange", "Δ Net Margin", "netMargin", "Net Margin", current, previous),
  ];

  return out;
}

export function derivedMap(list: Derived[]): Record<string, Derived> {
  return Object.fromEntries(list.map((d) => [d.key, d]));
}

/* --------------------------- trade maths --------------------------- */

export interface TradeMath {
  riskPerShare: number | null;
  rewardPerShare: number | null;
  riskReward: number | null;
  shares: number | null;
  positionValue: number | null;
  maximumLoss: number | null;
  potentialGain: number | null;
  stopPct: number | null;
}

export function tradeMath(input: {
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  maxLoss?: number | null;
}): TradeMath {
  const entry = n(input.entry);
  const stop = n(input.stop);
  const target = n(input.target);
  const maxLoss = n(input.maxLoss);

  const riskPerShare = entry !== null && stop !== null ? entry - stop : null;
  const rewardPerShare = entry !== null && target !== null ? target - entry : null;
  const riskReward =
    riskPerShare !== null && rewardPerShare !== null && riskPerShare !== 0
      ? rewardPerShare / riskPerShare
      : null;
  const shares =
    maxLoss !== null && riskPerShare !== null && riskPerShare > 0
      ? Math.floor(maxLoss / riskPerShare)
      : null;
  const positionValue = shares !== null && entry !== null ? shares * entry : null;
  const maximumLoss = shares !== null && riskPerShare !== null ? shares * riskPerShare : null;
  const potentialGain = shares !== null && rewardPerShare !== null ? shares * rewardPerShare : null;
  const stopPct = entry !== null && stop !== null && entry !== 0 ? ((entry - stop) / entry) * 100 : null;

  return {
    riskPerShare,
    rewardPerShare,
    riskReward,
    shares,
    positionValue,
    maximumLoss,
    potentialGain,
    stopPct,
  };
}

export function positionMath(p: {
  entry: number;
  shares: number;
  stopInitial: number;
  currentPrice: number | null;
}) {
  const initialRisk = (p.entry - p.stopInitial) * p.shares;
  const riskPerShare = p.entry - p.stopInitial;
  const plAbs = p.currentPrice !== null ? (p.currentPrice - p.entry) * p.shares : null;
  const plPct =
    p.currentPrice !== null && p.entry !== 0 ? ((p.currentPrice - p.entry) / p.entry) * 100 : null;
  const rNow =
    p.currentPrice !== null && riskPerShare !== 0 ? (p.currentPrice - p.entry) / riskPerShare : null;
  return { initialRisk, riskPerShare, plAbs, plPct, rNow, value: p.shares * p.entry };
}
