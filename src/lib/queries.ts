import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { CORE_CATEGORIES, MACRO_CATEGORIES } from "@/config/macro-catalog";
import { deriveAll, derivedMap, tradeMath, positionMath } from "./derive";
import { evaluateRules, type RuleContext, type Finding } from "@/config/rules";
import { computeWorkflow, type DossierState } from "./workflow";
import { daysSince } from "./format";

export async function getSettings() {
  const rows = await db.select().from(S.settings).limit(1);
  return rows[0] ?? null;
}

export async function listCompanies() {
  return db.select().from(S.companies).orderBy(S.companies.ticker);
}

export async function getCompany(ticker: string) {
  const rows = await db.select().from(S.companies).where(eq(S.companies.ticker, ticker.toUpperCase())).limit(1);
  return rows[0] ?? null;
}

/** Latest reading per core macro category + staleness. */
export async function getMacroState() {
  const readings = await db.select().from(S.macroReadings).orderBy(desc(S.macroReadings.date));
  const latest = new Map<string, typeof readings[number]>();
  for (const r of readings) if (!latest.has(r.categoryCode)) latest.set(r.categoryCode, r);

  const perCategory = MACRO_CATEGORIES.map((c) => {
    const r = latest.get(c.code) ?? null;
    const age = daysSince(r?.date);
    return { category: c, reading: r, age, stale: age !== null && age > c.stalenessDays };
  });

  const core = perCategory.filter((p) => p.category.core);
  return {
    perCategory,
    core,
    coreRead: core.filter((p) => p.reading).length,
    coreTotal: core.length,
    staleCore: core.filter((p) => p.stale).map((p) => p.category.label),
  };
}

export async function getLatestMarketReading() {
  const rows = await db.select().from(S.marketReadings).orderBy(desc(S.marketReadings.date)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestObservations(categoryCode: string) {
  const rows = await db
    .select()
    .from(S.macroObservations)
    .where(eq(S.macroObservations.categoryCode, categoryCode))
    .orderBy(desc(S.macroObservations.refDate), desc(S.macroObservations.enteredAt));
  const latest = new Map<string, typeof rows[number]>();
  for (const r of rows) if (!latest.has(r.indicatorCode)) latest.set(r.indicatorCode, r);
  return latest;
}

export async function getSectorReading(sector?: string | null) {
  if (!sector) return null;
  const rows = await db
    .select().from(S.sectorReadings)
    .where(eq(S.sectorReadings.sector, sector))
    .orderBy(desc(S.sectorReadings.date)).limit(1);
  return rows[0] ?? null;
}

export async function getOpenFindings(targetId: string): Promise<(typeof S.ruleFindings.$inferSelect)[]> {
  return db.select().from(S.ruleFindings)
    .where(and(eq(S.ruleFindings.targetId, targetId), eq(S.ruleFindings.status, "open")));
}

export async function getLatestPrice(companyId: string) {
  const rows = await db.select().from(S.priceObservations)
    .where(eq(S.priceObservations.companyId, companyId))
    .orderBy(desc(S.priceObservations.at)).limit(1);
  return rows[0] ?? null;
}

export async function listEvents() {
  return db.select().from(S.events).orderBy(S.events.date);
}

export type Dossier = Awaited<ReturnType<typeof getDossier>>;

export async function getDossier(ticker: string) {
  const company = await getCompany(ticker);
  if (!company) return null;

  const [filings, companyReadings, valuations, thesisRows, setups, decisions, positions] = await Promise.all([
    db.select().from(S.companyFilings).where(eq(S.companyFilings.companyId, company.id)).orderBy(desc(S.companyFilings.period)),
    db.select().from(S.companyReadings).where(eq(S.companyReadings.companyId, company.id)).orderBy(desc(S.companyReadings.date)),
    db.select().from(S.valuationReadings).where(eq(S.valuationReadings.companyId, company.id)).orderBy(desc(S.valuationReadings.date)),
    db.select().from(S.theses).where(eq(S.theses.companyId, company.id)).orderBy(desc(S.theses.version)),
    db.select().from(S.technicalSetups).where(eq(S.technicalSetups.companyId, company.id)).orderBy(desc(S.technicalSetups.date)),
    db.select().from(S.decisions).where(eq(S.decisions.companyId, company.id)).orderBy(desc(S.decisions.date)),
    db.select().from(S.positions).where(eq(S.positions.companyId, company.id)).orderBy(desc(S.positions.openedAt)),
  ]);

  const filing = filings[0] ?? null;
  const prevFiling = filings[1] ?? null;
  const companyReading = companyReadings[0] ?? null;
  const valuation = valuations[0] ?? null;
  const thesis = thesisRows.find((t) => t.status === "active") ?? thesisRows[0] ?? null;
  const setup = setups[0] ?? null;
  const decision = decisions[0] ?? null;
  const openPosition = positions.find((p) => p.status === "open") ?? null;

  const derived = deriveAll(filing, prevFiling);
  const dmap = derivedMap(derived);

  const invalidatorRows = thesis
    ? await db.select().from(S.invalidators)
        .where(and(eq(S.invalidators.scope, "thesis"), eq(S.invalidators.refId, thesis.id)))
    : [];

  const runs = thesis
    ? await db.select().from(S.challengeRuns).where(eq(S.challengeRuns.thesisId, thesis.id)).orderBy(desc(S.challengeRuns.date))
    : [];
  const objectionRows = runs.length
    ? await db.select().from(S.objections).where(inArray(S.objections.challengeRunId, runs.map((r) => r.id)))
    : [];

  const sectorReading = await getSectorReading(company.sector);
  const macro = await getMacroState();
  const market = await getLatestMarketReading();
  const price = await getLatestPrice(company.id);
  const findings = await getOpenFindings(company.id);
  const settings = await getSettings();
  const allEvents = await listEvents();

  const tm = tradeMath({
    entry: setup?.entry, stop: setup?.stop, target: setup?.target, maxLoss: setup?.maxLoss,
  });

  /* events falling inside the planned holding period (spec §20) */
  const eventsInHorizon = setup?.horizonDays
    ? allEvents.filter((e) => {
        const d = daysSince(e.date);
        if (d === null) return false;
        const ahead = -d; // days from now, positive = future
        return ahead >= 0 && ahead <= (setup.horizonDays as number) &&
          (e.scope === "market" || (e.scope === "ticker" && e.target === company.ticker) ||
            (e.scope === "sector" && e.target === company.sector));
      }).map((e) => ({ label: e.type.toUpperCase() + (e.note ? ` — ${e.note}` : ""), date: e.date }))
    : [];

  /* portfolio exposure, only meaningful once the user declared a capital */
  const openPositions = await db.select().from(S.positions).where(eq(S.positions.status, "open"));
  const capital = settings?.capital ?? null;
  const openRisk = openPositions.reduce((acc, p) => acc + (p.entry - p.stopInitial) * p.shares, 0);
  const tradeRisk = tm.maximumLoss ?? null;

  const allCompanies = await listCompanies();
  const sectorOf = new Map(allCompanies.map((c) => [c.id, c.sector]));
  const sameSector = openPositions.filter(
    (p) => company.sector && sectorOf.get(p.companyId) === company.sector,
  );
  const sameSectorValue = sameSector.reduce((acc, p) => acc + p.entry * p.shares, 0);
  const prospectiveValue = tm.positionValue ?? 0;
  const sectorPct = capital ? ((sameSectorValue + prospectiveValue) / capital) * 100 : null;
  const sectorPositions = sameSector.length + (prospectiveValue > 0 ? 1 : 0);

  /* peer medians, for the descriptive comparison controls */
  let peerMedian: Record<string, number | null> | null = null;
  if ((valuation?.peers ?? []).length > 0) {
    const peers = await getPeerFilings(valuation!.peers!);
    const med = (key: string) => {
      const vals = peers
        .map((p) => p.filing?.[key as keyof NonNullable<typeof p.filing>] as number | null)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
        .sort((a, b) => a - b);
      if (!vals.length) return null;
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    };
    peerMedian = { evEbitda: med("evEbitda"), pe: med("pe"), peg: med("peg"), roic: med("roic") };
  }

  const ruleCtx: RuleContext = {
    filing: filing as unknown as Record<string, number | null> | null,
    prevFiling: prevFiling as unknown as Record<string, number | null> | null,
    derived: dmap,
    companyReading,
    valuation: valuation
      ? { diagnostic: valuation.diagnostic, peers: valuation.peers, justification: valuation.justification }
      : null,
    thesis,
    invalidators: invalidatorRows,
    objections: objectionRows,
    peerMedian,
    coreMacroDiagnostics: macro.core.map((c) => c.reading?.diagnostic).filter(Boolean) as string[],
    sectorTailwind: sectorReading?.tailwind ?? null,
    sectorRiskCount: (sectorReading?.risks ?? []).length,
    setup: setup ? { ...setup, riskReward: tm.riskReward, stopPct: tm.stopPct } : null,
    eventsInHorizon,
    limits: settings
      ? {
          maxRiskPerTradePct: settings.maxRiskPerTradePct,
          maxOpenRiskPct: settings.maxOpenRiskPct,
          maxSectorPct: settings.maxSectorPct,
        }
      : null,
    exposure: capital
      ? {
          tradeRiskPct: tradeRisk !== null ? (tradeRisk / capital) * 100 : null,
          openRiskPct: ((openRisk + (tradeRisk ?? 0)) / capital) * 100,
          sectorPct,
          sector: company.sector,
          sectorPositions,
        }
      : null,
  };

  const liveFindings = evaluateRules(ruleCtx);
  const answeredCodes = new Set(
    (await db.select().from(S.ruleFindings)
      .where(and(eq(S.ruleFindings.targetId, company.id), eq(S.ruleFindings.status, "answered"))))
      .map((f) => f.ruleCode),
  );
  const activeFindings: Finding[] = liveFindings.filter((f) => !answeredCodes.has(f.code));

  const blockingFindings: Record<string, number> = {};
  for (const f of activeFindings) {
    if (f.severity === "blocking") blockingFindings[f.scope] = (blockingFindings[f.scope] ?? 0) + 1;
  }

  const openObjections = objectionRows.filter((o) => o.status === "open");
  const thesisComplete = !!thesis &&
    thesis.why.trim().length > 0 &&
    thesis.bullCase.trim().length > 0 &&
    thesis.bearCase.trim().length >= 200 &&
    typeof thesis.confidence === "number";

  const state: DossierState = {
    ticker: company.ticker,
    coreMacroTotal: macro.coreTotal,
    coreMacroRead: macro.coreRead,
    staleCoreMacro: macro.staleCore,
    hasMarketReading: !!market,
    hasSector: !!company.sector,
    hasIndustry: !!company.industry,
    hasSectorReading: !!sectorReading,
    hasFiling: !!filing,
    companyReadingComplete: !!companyReading,
    hasValuation: !!valuation,
    hasThesis: !!thesis,
    thesisHorizon: thesis?.horizon ?? null,
    thesisComplete,
    measurableInvalidators: invalidatorRows.filter((i) => !!i.metric).length,
    hasChallengeRun: runs.length > 0,
    openObjections: openObjections.length,
    openCriticalObjections: openObjections.filter((o) => o.severity === "critical").length,
    hasPostChallengeConfidence: typeof thesis?.confidencePostChallenge === "number",
    setupComplete: !!setup && setup.entry !== null && setup.stop !== null && setup.target !== null && !!setup.trend,
    eventRiskReviewed: !!setup?.eventRiskReviewed,
    hasDecision: !!decision,
    blockingFindings,
  };

  const steps = computeWorkflow(state);

  return {
    company, filings, filing, prevFiling, derived, dmap,
    companyReading, valuation, valuations, theses: thesisRows, thesis,
    invalidators: invalidatorRows, runs, objections: objectionRows,
    sectorReading, macro, market, price, setup, tradeMath: tm,
    decision, decisions, positions, openPosition, settings,
    eventsInHorizon, findings: activeFindings, storedFindings: findings,
    state, steps, ruleCtx,
  };
}

export { positionMath };

/** Latest observation for every (category, indicator) pair. */
export async function getAllLatestObservations() {
  const rows = await db.select().from(S.macroObservations)
    .orderBy(desc(S.macroObservations.refDate), desc(S.macroObservations.enteredAt));
  const latest = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const k = `${r.categoryCode}:${r.indicatorCode}`;
    if (!latest.has(k)) latest.set(k, r);
  }
  return latest;
}

export async function listOpenPositionsWithCompany() {
  const rows = await db.select().from(S.positions).where(eq(S.positions.status, "open"));
  const companies = await listCompanies();
  const byId = new Map(companies.map((c) => [c.id, c]));
  return rows.map((p) => ({ position: p, company: byId.get(p.companyId)! }));
}

export async function listJournal() {
  const rows = await db.select().from(S.journalEntries).orderBy(desc(S.journalEntries.date));
  const companies = await listCompanies();
  const byId = new Map(companies.map((c) => [c.id, c]));
  return rows.map((j) => ({ entry: j, company: byId.get(j.companyId) ?? null }));
}

export async function getPositionDetail(positionId: string) {
  const pos = (await db.select().from(S.positions).where(eq(S.positions.id, positionId)).limit(1))[0];
  if (!pos) return null;
  const company = (await db.select().from(S.companies).where(eq(S.companies.id, pos.companyId)).limit(1))[0];
  const thesis = (await db.select().from(S.theses).where(eq(S.theses.id, pos.thesisId)).limit(1))[0] ?? null;
  const invalidatorRows = thesis
    ? await db.select().from(S.invalidators)
        .where(and(eq(S.invalidators.scope, "thesis"), eq(S.invalidators.refId, thesis.id)))
    : [];
  const reviews = await db.select().from(S.positionReviews)
    .where(eq(S.positionReviews.positionId, positionId)).orderBy(desc(S.positionReviews.date));
  const horizonLog = await db.select().from(S.horizonChanges)
    .where(eq(S.horizonChanges.positionId, positionId)).orderBy(desc(S.horizonChanges.date));
  const price = await getLatestPrice(pos.companyId);
  const theses = await db.select().from(S.theses).where(eq(S.theses.companyId, pos.companyId));
  return { position: pos, company, thesis, invalidators: invalidatorRows, reviews, horizonLog, price, thesisCount: theses.length };
}

export async function getSnapshot(id: string) {
  const rows = await db.select().from(S.snapshots).where(eq(S.snapshots.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Latest filing for each peer ticker, for the descriptive comparison table. */
export async function getPeerFilings(tickers: string[]) {
  const out: { ticker: string; filing: typeof S.companyFilings.$inferSelect | null }[] = [];
  for (const t of tickers) {
    const c = await getCompany(t);
    if (!c) { out.push({ ticker: t, filing: null }); continue; }
    const rows = await db.select().from(S.companyFilings)
      .where(eq(S.companyFilings.companyId, c.id)).orderBy(desc(S.companyFilings.period)).limit(1);
    out.push({ ticker: t, filing: rows[0] ?? null });
  }
  return out;
}
