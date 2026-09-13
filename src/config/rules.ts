/**
 * Deterministic control catalogue — CONFIGURATION.
 * A control never judges: it asks a question I must answer in writing.
 * `blocking` keeps the associated gate shut until answered; `warning` does not.
 */
import type { Derived } from "@/lib/derive";

export type Severity = "blocking" | "warning";
export type RuleScope =
  | "company" | "valuation" | "macro" | "market"
  | "thesis" | "timing" | "portfolio" | "position";

export interface RuleContext {
  filing?: Record<string, number | null> | null;
  prevFiling?: Record<string, number | null> | null;
  derived?: Record<string, Derived>;
  companyReading?: { qualityFlag?: string; growthFlag?: string; strengthFlag?: string } | null;
  valuation?: { diagnostic?: string; peers?: string[] | null; justification?: string } | null;
  peerMedian?: Record<string, number | null> | null;
  thesis?: {
    direction?: string; horizon?: string; bearCase?: string; bullCase?: string;
    confidence?: number | null; confidencePostChallenge?: number | null;
    risks?: string[] | null; uncertainties?: string[] | null;
  } | null;
  invalidators?: { metric?: string | null }[];
  objections?: { status: string; severity: string }[];
  coreMacroDiagnostics?: string[];
  sectorTailwind?: string | null;
  sectorRiskCount?: number;
  setup?: {
    entry?: number | null; stop?: number | null; target?: number | null;
    trend?: string | null; support?: number | null; horizonDays?: number | null;
    riskReward?: number | null; stopPct?: number | null;
  } | null;
  eventsInHorizon?: { label: string; date: string }[];
  limits?: { maxRiskPerTradePct?: number | null; maxOpenRiskPct?: number | null; maxSectorPct?: number | null } | null;
  exposure?: { tradeRiskPct?: number | null; openRiskPct?: number | null; sectorPct?: number | null; sector?: string | null; sectorPositions?: number } | null;
  position?: {
    plPct?: number | null;
    occurredInvalidators?: { label: string; days: number }[];
    dontKnowCount?: number;
    daysSinceReview?: number | null;
    stopWidened?: boolean;
    thesisRevisions?: number;
  } | null;
}

export interface RuleDef {
  code: string;
  scope: RuleScope;
  severity: Severity;
  test: (c: RuleContext) => boolean;
  message: (c: RuleContext) => string;
}

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const dv = (c: RuleContext, k: string) => c.derived?.[k]?.value ?? null;

export const RULES: RuleDef[] = [
  /* ----------------------------- company ---------------------------- */
  {
    code: "C-01", scope: "company", severity: "warning",
    test: (c) => num(c.filing?.revenueGrowth) && num(c.filing?.epsGrowth) &&
      c.filing!.revenueGrowth! > 15 && c.filing!.epsGrowth! < 5,
    message: () =>
      "Le chiffre d'affaires progresse fortement mais le BPA beaucoup moins. Dilution, marges, charges financières ou exceptionnels ?",
  },
  {
    code: "C-02", scope: "company", severity: "warning",
    test: (c) => num(c.filing?.netIncome) && num(c.filing?.fcf) &&
      c.filing!.netIncome! > 0 && c.filing!.fcf! < 0,
    message: () => "L'entreprise est bénéficiaire mais brûle du cash. Qu'est-ce qui explique l'écart ?",
  },
  {
    code: "C-03", scope: "company", severity: "warning",
    test: (c) => { const v = dv(c, "cfoToNetIncome"); return num(v) && v < 0.6; },
    message: () => "Le cash-flow d'exploitation couvre mal le résultat net. Quelle est la qualité des bénéfices ?",
  },
  {
    code: "C-04", scope: "company", severity: "warning",
    test: (c) => { const d = dv(c, "operatingMarginChange");
      return num(d) && d <= -2 && num(c.filing?.revenueGrowth) && c.filing!.revenueGrowth! > 10; },
    message: () => "Les marges opérationnelles se contractent alors que le chiffre d'affaires accélère. Pourquoi ?",
  },
  {
    code: "C-05", scope: "company", severity: "warning",
    test: (c) => { const nd = dv(c, "netDebtToEbitda");
      return num(nd) && nd > 3 && num(c.filing?.interestCoverage) && c.filing!.interestCoverage! < 3; },
    message: () => "Levier élevé et couverture des intérêts faible. Qu'est-ce qui te rassure ?",
  },
  {
    code: "C-06", scope: "company", severity: "warning",
    test: (c) => (num(c.filing?.currentRatio) && c.filing!.currentRatio! < 1) ||
      (num(c.filing?.quickRatio) && c.filing!.quickRatio! < 0.7),
    message: () => "Liquidité court terme tendue. Est-ce structurel dans ce secteur ?",
  },
  {
    code: "C-07", scope: "company", severity: "blocking",
    test: (c) => num(c.filing?.roic) && c.filing!.roic! < 8 && c.companyReading?.qualityFlag === "green",
    message: () => "Tu juges la qualité élevée avec un ROIC inférieur à 8 %. Sur quoi te fondes-tu ?",
  },
  {
    code: "C-12", scope: "company", severity: "warning",
    test: (c) => { const calc = dv(c, "fcfYieldCalc"); const saisi = c.filing?.fcfYield;
      return num(calc) && num(saisi) && saisi !== 0 && Math.abs(calc - saisi) / Math.abs(saisi) > 0.1; },
    message: () => "Le FCF Yield saisi diverge de plus de 10 % du calcul. Erreur de saisie ou périmètre différent ?",
  },

  /* ---------------------------- valuation --------------------------- */
  {
    code: "C-20", scope: "valuation", severity: "warning",
    test: (c) => num(c.filing?.pe) && num(c.filing?.forwardPe) && c.filing!.pe! < c.filing!.forwardPe!,
    message: () => "Le P/E forward est supérieur au P/E actuel : le marché attend une baisse des bénéfices. Ta thèse en tient-elle compte ?",
  },
  {
    code: "C-21", scope: "valuation", severity: "blocking",
    test: (c) => num(c.filing?.peg) && c.filing!.peg! > 2 && c.valuation?.diagnostic === "attractive",
    message: () => "Tu juges la valorisation attractive avec un PEG supérieur à 2. Qu'est-ce qui le justifie ?",
  },
  {
    code: "C-22", scope: "valuation", severity: "blocking",
    test: (c) => { const me = c.filing?.evEbitda; const peer = c.peerMedian?.evEbitda;
      return num(me) && num(peer) && peer > 0 && me > peer * 1.5 &&
        (c.valuation?.diagnostic === "attractive" || c.valuation?.diagnostic === "reasonable"); },
    message: () => "Le titre se paie plus de 1,5× la médiane de ses pairs en EV/EBITDA. Quelle prime justifies-tu ?",
  },
  {
    code: "C-23", scope: "valuation", severity: "warning",
    test: (c) => !!c.valuation && (c.valuation.peers ?? []).length === 0,
    message: () => "Tu juges une valorisation sans aucune comparaison. Ajoute au moins un pair, ou justifie l'absence.",
  },

  /* ------------------------------ thesis ---------------------------- */
  {
    code: "C-40", scope: "thesis", severity: "blocking",
    test: (c) => { const d = c.coreMacroDiagnostics ?? [];
      const bad = d.filter((x) => x === "defavorable").length;
      return c.thesis?.direction === "long" && d.length > 0 && bad > d.length / 2; },
    message: () => "Ta thèse est acheteuse alors que ta propre lecture macro est majoritairement défavorable. Justifie le décalage.",
  },
  {
    code: "C-41", scope: "thesis", severity: "blocking",
    test: (c) => c.thesis?.direction === "long" && c.sectorTailwind === "defavorable",
    message: () => "Le vent sectoriel que tu as toi-même diagnostiqué est contraire. Pourquoi passer outre ?",
  },
  {
    code: "C-42", scope: "thesis", severity: "blocking",
    test: (c) => !!c.thesis && (c.invalidators ?? []).filter((i) => !!i.metric).length === 0,
    message: () => "Aucun de tes invalidateurs n'est mesurable. Rends-en au moins un observable (métrique, seuil, horizon).",
  },
  {
    code: "C-43", scope: "thesis", severity: "blocking",
    test: (c) => !!c.thesis && (c.thesis.bearCase ?? "").trim().length < 200,
    message: () => "Ton bear case fait moins de 200 caractères : ce n'est pas un vrai pre-mortem.",
  },
  {
    code: "C-44", scope: "thesis", severity: "warning",
    test: (c) => num(c.thesis?.confidence) && num(c.thesis?.confidencePostChallenge) &&
      c.thesis!.confidence === c.thesis!.confidencePostChallenge &&
      (c.objections ?? []).some((o) => o.status === "accepted"),
    message: () => "Tu as accepté au moins une objection sans que ta confiance bouge d'un point. Est-ce cohérent ?",
  },
  {
    code: "C-45", scope: "thesis", severity: "warning",
    test: (c) => num(c.thesis?.confidence) && c.thesis!.confidence! >= 9 &&
      (c.thesis?.uncertainties ?? []).length < 2,
    message: () => "Confiance très élevée. Liste au moins deux incertitudes assumées.",
  },
  {
    code: "C-46", scope: "thesis", severity: "warning",
    test: (c) => !!c.thesis && (c.sectorRiskCount ?? 0) > 0 && (c.thesis.risks ?? []).length === 0,
    message: () => "Tu n'as retenu aucun risque alors que la fiche secteur en identifie. Volontaire ?",
  },

  /* ------------------------------ timing ---------------------------- */
  {
    code: "C-50", scope: "timing", severity: "blocking",
    test: (c) => num(c.setup?.riskReward) && c.setup!.riskReward! < 2,
    message: (c) => `Le rapport gain/risque est de ${c.setup?.riskReward?.toFixed(2)} (< 2). Qu'est-ce qui justifie ce trade ?`,
  },
  {
    code: "C-51", scope: "timing", severity: "warning",
    test: (c) => num(c.setup?.stopPct) && c.setup!.stopPct! > 15 &&
      num(c.setup?.horizonDays) && c.setup!.horizonDays! <= 30,
    message: () => "Stop très large pour un horizon swing court. Cohérent ?",
  },
  {
    code: "C-52", scope: "timing", severity: "warning",
    test: (c) => num(c.setup?.stop) && num(c.setup?.support) && c.setup!.stop! < c.setup!.support! * 0.97,
    message: () => "Ton stop est sensiblement plus bas que le support que tu as identifié. Volontaire ?",
  },
  {
    code: "C-53", scope: "timing", severity: "blocking",
    test: (c) => (c.eventsInHorizon ?? []).length > 0,
    message: (c) => {
      const e = c.eventsInHorizon ?? [];
      return `⚠️ Major event during planned holding period — ${e.map((x) => `${x.label} (${x.date})`).join(", ")}. Ton trade peut-il être fortement impacté ?`;
    },
  },
  {
    code: "C-54", scope: "timing", severity: "blocking",
    test: (c) => c.setup?.trend === "down" && c.thesis?.direction === "long",
    message: () => "Tu achètes contre la tendance que tu as toi-même diagnostiquée. Pourquoi maintenant ?",
  },

  /* ---------------------------- portfolio --------------------------- */
  /* These only fire against limits the user has declared himself.      */
  {
    code: "C-60", scope: "portfolio", severity: "blocking",
    test: (c) => num(c.limits?.maxRiskPerTradePct) && num(c.exposure?.tradeRiskPct) &&
      c.exposure!.tradeRiskPct! > c.limits!.maxRiskPerTradePct!,
    message: (c) => `Le risque de cette position (${c.exposure?.tradeRiskPct?.toFixed(2)} % du capital) dépasse ta limite déclarée de ${c.limits?.maxRiskPerTradePct} %.`,
  },
  {
    code: "C-61", scope: "portfolio", severity: "blocking",
    test: (c) => num(c.limits?.maxOpenRiskPct) && num(c.exposure?.openRiskPct) &&
      c.exposure!.openRiskPct! > c.limits!.maxOpenRiskPct!,
    message: (c) => `Le risque ouvert total atteindrait ${c.exposure?.openRiskPct?.toFixed(2)} %, au-delà de ta limite de ${c.limits?.maxOpenRiskPct} %.`,
  },
  {
    code: "C-62", scope: "portfolio", severity: "warning",
    test: (c) => num(c.limits?.maxSectorPct) && num(c.exposure?.sectorPct) &&
      c.exposure!.sectorPct! > c.limits!.maxSectorPct!,
    message: (c) => `Concentration : ${c.exposure?.sector} atteindrait ${c.exposure?.sectorPct?.toFixed(1)} % du capital. Plusieurs lignes d'un même secteur sont un seul pari. Justifie par écrit.`,
  },
  {
    code: "C-63", scope: "portfolio", severity: "warning",
    test: (c) => (c.exposure?.sectorPositions ?? 0) >= 3,
    message: (c) => `Tu aurais ${c.exposure?.sectorPositions} positions ouvertes sur ${c.exposure?.sector}. Ce sont plusieurs lignes mais un seul pari.`,
  },

  /* ---------------------------- position ---------------------------- */
  {
    code: "C-70", scope: "position", severity: "blocking",
    test: (c) => (c.position?.occurredInvalidators ?? []).some((i) => i.days > 5),
    message: (c) => {
      const i = (c.position?.occurredInvalidators ?? []).find((x) => x.days > 5)!;
      return `« ${i.label} » est survenu il y a ${i.days} jours et tu es toujours en position. Quelle est ta décision ?`;
    },
  },
  {
    code: "C-71", scope: "position", severity: "warning",
    test: (c) => (c.position?.dontKnowCount ?? 0) >= 2,
    message: () => "Tu ne sais pas répondre à au moins deux de tes propres invalidateurs. Quelle donnée te manque ?",
  },
  {
    code: "C-72", scope: "position", severity: "warning",
    test: (c) => (c.position?.thesisRevisions ?? 0) > 0 && num(c.position?.plPct) && c.position!.plPct! < -5,
    message: () => "Tu as révisé ta thèse pendant que la position perd. Est-ce une information nouvelle ou une justification ?",
  },
  {
    code: "C-73", scope: "position", severity: "blocking",
    test: (c) => c.position?.stopWidened === true,
    message: () => "Tu as élargi ton stop par rapport au stop initial. Écris le motif.",
  },
  {
    code: "C-74", scope: "position", severity: "warning",
    test: (c) => num(c.position?.daysSinceReview) && c.position!.daysSinceReview! > 30,
    message: (c) => `Position non revue depuis ${c.position?.daysSinceReview} jours.`,
  },
];

export interface Finding {
  code: string;
  scope: RuleScope;
  severity: Severity;
  message: string;
}

export function evaluateRules(ctx: RuleContext, scopes?: RuleScope[]): Finding[] {
  return RULES.filter((r) => !scopes || scopes.includes(r.scope))
    .filter((r) => {
      try { return r.test(ctx); } catch { return false; }
    })
    .map((r) => ({ code: r.code, scope: r.scope, severity: r.severity, message: r.message(ctx) }));
}
