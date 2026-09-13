/**
 * The workflow replaces the completion percentage (decision 2).
 * A step is done, current, or locked. A locked step names what is missing —
 * it never shows a score that could be mistaken for a buy signal.
 */
export type StepKey =
  | "macro" | "market" | "sector" | "company" | "fundamentals"
  | "valuation" | "thesis" | "challenge" | "timing" | "decision";

export interface Step {
  key: StepKey;
  label: string;
  done: boolean;
  locked: boolean;
  optional: boolean;
  /** What must be filled in on this step itself. */
  missing: string[];
  /** Why the step is closed: the prerequisite when locked, else its own gaps. */
  reason: string[];
  href: string;
}

export interface DossierState {
  ticker: string;
  coreMacroTotal: number;
  coreMacroRead: number;
  staleCoreMacro: string[];
  hasMarketReading: boolean;
  hasSector: boolean;
  hasSectorReading: boolean;
  hasIndustry: boolean;
  hasFiling: boolean;
  companyReadingComplete: boolean;
  hasValuation: boolean;
  hasThesis: boolean;
  thesisHorizon: string | null;
  thesisComplete: boolean;
  measurableInvalidators: number;
  hasChallengeRun: boolean;
  openObjections: number;
  openCriticalObjections: number;
  hasPostChallengeConfidence: boolean;
  setupComplete: boolean;
  eventRiskReviewed: boolean;
  hasDecision: boolean;
  blockingFindings: Record<string, number>; // scope -> count of open blocking findings
}

export function computeWorkflow(s: DossierState): Step[] {
  const t = encodeURIComponent(s.ticker);
  const block = (scope: string) => (s.blockingFindings[scope] ?? 0) > 0;

  const macroDone = s.coreMacroTotal > 0 && s.coreMacroRead >= s.coreMacroTotal;
  const marketDone = s.hasMarketReading;
  const companyDone = s.hasSector && s.hasIndustry;
  const sectorDone = s.hasSectorReading;
  const fundamentalsDone = s.hasFiling && s.companyReadingComplete && !block("company");
  const valuationDone = s.hasValuation && !block("valuation");
  const thesisDone =
    s.hasThesis && s.thesisComplete && s.measurableInvalidators > 0 && !block("thesis");
  const challengeDone =
    s.hasChallengeRun && s.openObjections === 0 && s.hasPostChallengeConfidence;
  const timingDone = s.setupComplete && s.eventRiskReviewed && !block("timing") && !block("portfolio");
  const isLongTerm = s.thesisHorizon === "long_term";

  const steps: Step[] = [
    {
      key: "macro", label: "Macro", done: macroDone, locked: false, optional: false,
      missing: macroDone ? [] : [`${s.coreMacroTotal - s.coreMacroRead} catégorie(s) du noyau sans interprétation`],
      reason: [],
      href: "/macro",
    },
    {
      key: "market", label: "Market", done: marketDone, locked: false, optional: false,
      missing: marketDone ? [] : ["Aucun diagnostic de marché enregistré"],
      reason: [],
      href: "/macro/market",
    },
    {
      key: "company", label: "Company", done: companyDone, locked: false, optional: false,
      missing: companyDone ? [] : ["Secteur et industrie à renseigner"],
      reason: [],
      href: `/company/${t}`,
    },
    {
      key: "sector", label: "Sector", done: sectorDone, locked: !companyDone, optional: false,
      missing: sectorDone ? [] : ["Fiche secteur à remplir (cycle, vent, justification)"],
      reason: [],
      href: `/research/${t}`,
    },
    {
      key: "fundamentals", label: "Fundamentals", done: fundamentalsDone, locked: !companyDone, optional: false,
      missing: [
        ...(s.hasFiling ? [] : ["Aucun jeu de données financières saisi"]),
        ...(s.companyReadingComplete ? [] : ["Les 3 interprétations et les 3 diagnostics sont obligatoires"]),
        ...(block("company") ? [`${s.blockingFindings.company} contrôle(s) bloquant(s) sans réponse`] : []),
      ],
      reason: [],
      href: `/company/${t}`,
    },
    {
      key: "valuation", label: "Valuation", done: valuationDone, locked: !fundamentalsDone, optional: false,
      missing: [
        ...(s.hasValuation ? [] : ["Diagnostic de valorisation et justification à saisir"]),
        ...(block("valuation") ? [`${s.blockingFindings.valuation} contrôle(s) bloquant(s) sans réponse`] : []),
      ],
      reason: [],
      href: `/valuation/${t}`,
    },
    {
      key: "thesis", label: "Thesis",
      done: thesisDone,
      locked: !(macroDone && marketDone && sectorDone && valuationDone),
      optional: false,
      missing: [
        ...(s.hasThesis ? [] : ["Aucune thèse rédigée"]),
        ...(s.hasThesis && !s.thesisComplete ? ["Why, bull case, bear case (200 car. min) et confiance sont obligatoires"] : []),
        ...(s.hasThesis && s.measurableInvalidators === 0 ? ["Aucun invalidateur mesurable"] : []),
        ...(block("thesis") ? [`${s.blockingFindings.thesis} contrôle(s) bloquant(s) sans réponse`] : []),
      ],
      reason: [],
      href: `/thesis/${t}`,
    },
    {
      key: "challenge", label: "Challenge", done: challengeDone, locked: !thesisDone, optional: false,
      missing: [
        ...(s.hasChallengeRun ? [] : ["Aucune session de challenge"]),
        ...(s.openCriticalObjections > 0 ? [`${s.openCriticalObjections} objection(s) critique(s) non tranchée(s)`] : []),
        ...(s.openObjections - s.openCriticalObjections > 0
          ? [`${s.openObjections - s.openCriticalObjections} objection(s) non tranchée(s)`] : []),
        ...(s.hasPostChallengeConfidence ? [] : ["Confiance post-challenge non saisie"]),
      ],
      reason: [],
      href: `/thesis/${t}`,
    },
    {
      key: "timing", label: "Timing",
      done: timingDone,
      locked: !challengeDone,
      optional: isLongTerm,
      missing: [
        ...(s.setupComplete ? [] : ["Setup incomplet (trend, entry, stop, target)"]),
        ...(s.eventRiskReviewed ? [] : ["Event risk non revu"]),
        ...(block("timing") ? [`${s.blockingFindings.timing} contrôle(s) bloquant(s) sans réponse`] : []),
        ...(block("portfolio") ? [`${s.blockingFindings.portfolio} contrôle(s) portefeuille bloquant(s)`] : []),
      ],
      reason: [],
      href: `/thesis/${t}#timing`,
    },
    {
      key: "decision", label: "Decision",
      done: s.hasDecision,
      locked: isLongTerm ? !challengeDone : !timingDone,
      optional: false,
      missing: s.hasDecision ? [] : ["Aucune décision enregistrée (et sa justification)"],
      reason: [],
      href: `/research/${t}#decision`,
    },
  ];

  /* A locked step must name the prerequisite that locks it, not its own gaps —
     otherwise the panel tells me to fill in a form I cannot even open. */
  const byKey = new Map(steps.map((s2) => [s2.key, s2] as const));
  const prereqs: Record<StepKey, StepKey[]> = {
    macro: [], market: [], company: [], sector: ["company"],
    fundamentals: ["company"], valuation: ["fundamentals"],
    thesis: ["macro", "market", "sector", "valuation"],
    challenge: ["thesis"], timing: ["challenge"],
    decision: isLongTerm ? ["challenge"] : ["timing"],
  };

  for (const step of steps) {
    if (!step.locked) { step.reason = step.missing; continue; }
    const blocking = prereqs[step.key]
      .map((k) => byKey.get(k)!)
      .filter((p) => !p.done);
    step.reason = blocking.length
      ? blocking.map((p) => `Étape « ${p.label} » à terminer d'abord : ${p.missing[0] ?? "incomplète"}`)
      : step.missing;
  }

  return steps;
}

export function workflowRank(steps: Step[]): { done: number; total: number } {
  const relevant = steps.filter((s) => !s.optional);
  return { done: relevant.filter((s) => s.done).length, total: relevant.length };
}

export function nextStep(steps: Step[]): Step | undefined {
  return steps.find((s) => !s.done && !s.locked && !s.optional) ?? steps.find((s) => !s.done && !s.locked);
}
