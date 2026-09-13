"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import * as S from "@/db/schema";
import { getCompany, getDossier } from "@/lib/queries";
import { numOrNull, parseList, strOrNull, today } from "@/lib/format";
import { COMPANY_BLOCKS } from "@/config/company-blocks";
import { MARKET_CATEGORY_CODE, findCategory, MARKET_GROUPS } from "@/config/macro-catalog";

const g = (f: FormData, k: string) => (f.get(k) as string | null) ?? null;
const req = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ------------------------------- companies ------------------------------ */
export async function createCompany(form: FormData) {
  const ticker = req(form, "ticker").toUpperCase();
  if (!ticker) return;
  const existing = await getCompany(ticker);
  if (existing) redirect(`/research/${ticker}`);
  await db.insert(S.companies).values({
    ticker,
    name: req(form, "name") || ticker,
    sector: strOrNull(g(form, "sector")),
    industry: strOrNull(g(form, "industry")),
    ideaOrigin: req(form, "ideaOrigin") || "autre",
    ideaNote: strOrNull(g(form, "ideaNote")),
    status: "recherche",
  });
  revalidatePath("/research");
  redirect(`/research/${ticker}`);
}

export async function updateCompany(form: FormData) {
  const id = req(form, "companyId");
  await db.update(S.companies).set({
    name: req(form, "name"),
    sector: strOrNull(g(form, "sector")),
    industry: strOrNull(g(form, "industry")),
    status: req(form, "status") || "recherche",
  }).where(eq(S.companies.id, id));
  revalidatePath("/", "layout");
}

/* --------------------------------- macro -------------------------------- */
export async function saveMacroObservations(form: FormData) {
  const categoryCode = req(form, "categoryCode");
  const refDate = req(form, "refDate") || today();
  const obsDate = strOrNull(g(form, "obsDate"));
  const sourceUrl = strOrNull(g(form, "sourceUrl"));
  const codes = (g(form, "indicatorCodes") ?? "").split(",").filter(Boolean);

  for (const code of codes) {
    const raw = g(form, `v_${code}`);
    const text = g(form, `t_${code}`);
    const hasValue = typeof raw === "string" && raw.trim() !== "";
    const hasText = typeof text === "string" && text.trim() !== "";
    if (!hasValue && !hasText) continue;
    await db.insert(S.macroObservations).values({
      categoryCode,
      indicatorCode: code,
      value: numOrNull(raw),
      previous: numOrNull(g(form, `p_${code}`)),
      unit: strOrNull(g(form, `u_${code}`)),
      refDate,
      obsDate,
      trend: strOrNull(g(form, `tr_${code}`)),
      source: "trading_economics",
      sourceUrl,
      note: strOrNull(text),
    });
  }
  revalidatePath(`/macro/${categoryCode}`);
  revalidatePath("/macro");
  revalidatePath("/");
}

export async function saveMacroReading(form: FormData) {
  const categoryCode = req(form, "categoryCode");
  await db.insert(S.macroReadings).values({
    categoryCode,
    date: req(form, "date") || today(),
    whatHappens: req(form, "whatHappens"),
    why: req(form, "why"),
    impacts: form.getAll("impacts").map(String),
    uncertainties: parseList(g(form, "uncertainties")),
    diagnostic: req(form, "diagnostic"),
    confidence: Number(g(form, "confidence")) || null,
  });
  revalidatePath("/macro");
  revalidatePath(`/macro/${categoryCode}`);
  revalidatePath("/", "layout");
}

export async function saveMarketData(form: FormData) {
  const refDate = req(form, "refDate") || today();
  for (const grp of MARKET_GROUPS) {
    for (const ind of grp.indicators) {
      const raw = g(form, `v_${ind.code}`);
      const text = g(form, `t_${ind.code}`);
      if ((!raw || !raw.trim()) && (!text || !text.trim())) continue;
      await db.insert(S.macroObservations).values({
        categoryCode: MARKET_CATEGORY_CODE,
        indicatorCode: ind.code,
        value: numOrNull(raw),
        previous: numOrNull(g(form, `p_${ind.code}`)),
        unit: ind.unit ?? null,
        refDate,
        trend: strOrNull(g(form, `tr_${ind.code}`)),
        source: "trading_economics",
        sourceUrl: strOrNull(g(form, "sourceUrl")),
        note: strOrNull(text),
      });
    }
  }
  revalidatePath("/macro/market");
}

export async function saveMarketReading(form: FormData) {
  await db.insert(S.marketReadings).values({
    date: req(form, "date") || today(),
    diagnostic: req(form, "diagnostic"),
    justification: req(form, "justification"),
    breadthNote: strOrNull(g(form, "breadthNote")),
    confidence: Number(g(form, "confidence")) || null,
  });
  const marketId = (await db.select().from(S.marketReadings).orderBy(desc(S.marketReadings.createdAt)).limit(1))[0];
  const label = strOrNull(g(form, "invalidatorLabel"));
  if (marketId && label) {
    await db.insert(S.invalidators).values({
      scope: "market", refId: marketId.id, label,
      metric: strOrNull(g(form, "invalidatorMetric")),
      operator: strOrNull(g(form, "invalidatorOperator")),
      threshold: numOrNull(g(form, "invalidatorThreshold")),
      unit: strOrNull(g(form, "invalidatorUnit")),
      persistence: strOrNull(g(form, "invalidatorPersistence")),
      source: "observation",
    });
  }
  revalidatePath("/macro/market");
  revalidatePath("/", "layout");
}

export async function saveGeoEvent(form: FormData) {
  await db.insert(S.geoEvents).values({
    title: req(form, "title"),
    date: req(form, "date") || today(),
    countries: strOrNull(g(form, "countries")),
    description: strOrNull(g(form, "description")),
    estimatedDuration: strOrNull(g(form, "estimatedDuration")),
    probability: Number(g(form, "probability")) || null,
    potentialImpact: strOrNull(g(form, "potentialImpact")),
    channels: form.getAll("channels").map(String),
  });
  revalidatePath("/macro/M13");
}

/* -------------------------------- sector -------------------------------- */
export async function saveSectorReading(form: FormData) {
  await db.insert(S.sectorReadings).values({
    sector: req(form, "sector"),
    industry: strOrNull(g(form, "industry")),
    date: req(form, "date") || today(),
    cycle: strOrNull(g(form, "cycle")),
    demand: strOrNull(g(form, "demand")),
    pricingPower: strOrNull(g(form, "pricingPower")),
    capex: strOrNull(g(form, "capex")),
    competition: strOrNull(g(form, "competition")),
    regulation: strOrNull(g(form, "regulation")),
    catalysts: parseList(g(form, "catalysts")),
    risks: parseList(g(form, "risks")),
    tailwind: req(form, "tailwind"),
    justification: req(form, "justification"),
    confidence: Number(g(form, "confidence")) || null,
  });
  revalidatePath("/", "layout");
}

/* -------------------------------- company ------------------------------- */
export async function saveFiling(form: FormData) {
  const companyId = req(form, "companyId");
  const values: Record<string, unknown> = {
    companyId,
    period: req(form, "period"),
    publishedAt: strOrNull(g(form, "publishedAt")),
    sourceUrl: strOrNull(g(form, "sourceUrl")),
    source: "finviz",
  };
  for (const block of COMPANY_BLOCKS) {
    for (const f of block.fields) values[f.key] = numOrNull(g(form, f.key));
  }
  const existing = await db.select().from(S.companyFilings)
    .where(and(eq(S.companyFilings.companyId, companyId), eq(S.companyFilings.period, values.period as string)))
    .limit(1);
  if (existing[0]) {
    await db.update(S.companyFilings).set(values).where(eq(S.companyFilings.id, existing[0].id));
  } else {
    await db.insert(S.companyFilings).values(values as typeof S.companyFilings.$inferInsert);
  }
  revalidatePath("/", "layout");
}

export async function saveCompanyReading(form: FormData) {
  await db.insert(S.companyReadings).values({
    companyId: req(form, "companyId"),
    filingId: strOrNull(g(form, "filingId")),
    date: today(),
    growthInterpretation: req(form, "growthInterpretation"),
    profitabilityInterpretation: req(form, "profitabilityInterpretation"),
    strengthInterpretation: req(form, "strengthInterpretation"),
    qualityFlag: req(form, "qualityFlag"),
    growthFlag: req(form, "growthFlag"),
    strengthFlag: req(form, "strengthFlag"),
    confidence: Number(g(form, "confidence")) || null,
  });
  revalidatePath("/", "layout");
}

export async function saveValuationReading(form: FormData) {
  await db.insert(S.valuationReadings).values({
    companyId: req(form, "companyId"),
    filingId: strOrNull(g(form, "filingId")),
    date: today(),
    diagnostic: req(form, "diagnostic"),
    justification: req(form, "justification"),
    peers: (g(form, "peers") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    confidence: Number(g(form, "confidence")) || null,
  });
  revalidatePath("/", "layout");
}

/* ---------------------------- control findings -------------------------- */
export async function answerFinding(form: FormData) {
  const companyId = req(form, "companyId");
  const ruleCode = req(form, "ruleCode");
  const response = req(form, "response");
  if (!response) return;
  const existing = await db.select().from(S.ruleFindings)
    .where(and(eq(S.ruleFindings.targetId, companyId), eq(S.ruleFindings.ruleCode, ruleCode))).limit(1);
  if (existing[0]) {
    await db.update(S.ruleFindings)
      .set({ status: "answered", userResponse: response, answeredAt: new Date().toISOString() })
      .where(eq(S.ruleFindings.id, existing[0].id));
  } else {
    await db.insert(S.ruleFindings).values({
      ruleCode, scope: req(form, "scope"), targetId: companyId,
      status: "answered", userResponse: response, answeredAt: new Date().toISOString(),
    });
  }
  revalidatePath("/", "layout");
}

/* --------------------------------- thesis ------------------------------- */
export async function saveThesis(form: FormData) {
  const companyId = req(form, "companyId");
  const parentId = strOrNull(g(form, "parentId"));
  const rows = await db.select().from(S.theses).where(eq(S.theses.companyId, companyId)).orderBy(desc(S.theses.version));
  const version = (rows[0]?.version ?? 0) + 1;

  if (rows[0]) {
    await db.update(S.theses).set({ status: "revised" }).where(eq(S.theses.id, rows[0].id));
  }

  const inserted = {
    companyId, version, parentId: parentId ?? rows[0]?.id ?? null,
    revisionReason: version > 1 ? req(form, "revisionReason") : null,
    triggeringObjectionId: strOrNull(g(form, "triggeringObjectionId")),
    horizon: req(form, "horizon"),
    direction: req(form, "direction"),
    why: req(form, "why"),
    bullCase: req(form, "bullCase"),
    bearCase: req(form, "bearCase"),
    catalysts: parseList(g(form, "catalysts")),
    risks: parseList(g(form, "risks")),
    uncertainties: parseList(g(form, "uncertainties")),
    confidence: Number(g(form, "confidence")) || 5,
    status: "active",
  };
  await db.insert(S.theses).values(inserted);

  /* carry the previous invalidators over to the new version */
  if (rows[0]) {
    const created = (await db.select().from(S.theses)
      .where(eq(S.theses.companyId, companyId)).orderBy(desc(S.theses.version)).limit(1))[0];
    const old = await db.select().from(S.invalidators)
      .where(and(eq(S.invalidators.scope, "thesis"), eq(S.invalidators.refId, rows[0].id)));
    for (const inv of old) {
      await db.insert(S.invalidators).values({
        scope: "thesis", refId: created.id, label: inv.label, metric: inv.metric,
        operator: inv.operator, threshold: inv.threshold, unit: inv.unit,
        persistence: inv.persistence, horizonDate: inv.horizonDate, source: inv.source,
        status: inv.status,
      });
    }
  }
  revalidatePath("/", "layout");
}

export async function setPostChallengeConfidence(form: FormData) {
  await db.update(S.theses)
    .set({ confidencePostChallenge: Number(g(form, "confidencePostChallenge")) || null })
    .where(eq(S.theses.id, req(form, "thesisId")));
  revalidatePath("/", "layout");
}

export async function addInvalidator(form: FormData) {
  await db.insert(S.invalidators).values({
    scope: "thesis",
    refId: req(form, "thesisId"),
    label: req(form, "label"),
    metric: strOrNull(g(form, "metric")),
    operator: strOrNull(g(form, "operator")),
    threshold: numOrNull(g(form, "threshold")),
    unit: strOrNull(g(form, "unit")),
    persistence: strOrNull(g(form, "persistence")),
    horizonDate: strOrNull(g(form, "horizonDate")),
    source: strOrNull(g(form, "source")),
  });
  revalidatePath("/", "layout");
}

export async function deleteInvalidator(form: FormData) {
  await db.delete(S.invalidators).where(eq(S.invalidators.id, req(form, "invalidatorId")));
  revalidatePath("/", "layout");
}

/* ------------------------------- challenge ------------------------------ */
export async function startChallengeRun(form: FormData) {
  await db.insert(S.challengeRuns).values({
    thesisId: req(form, "thesisId"),
    date: today(),
    mode: req(form, "mode") || "manual",
  });
  revalidatePath("/", "layout");
}

export async function addObjection(form: FormData) {
  let runId = strOrNull(g(form, "challengeRunId"));
  const thesisId = req(form, "thesisId");
  if (!runId) {
    await db.insert(S.challengeRuns).values({ thesisId, date: today(), mode: "manual" });
    runId = (await db.select().from(S.challengeRuns).where(eq(S.challengeRuns.thesisId, thesisId))
      .orderBy(desc(S.challengeRuns.createdAt)).limit(1))[0].id;
  }
  await db.insert(S.objections).values({
    challengeRunId: runId,
    category: req(form, "category"),
    text: req(form, "text"),
    severity: req(form, "severity") || "major",
    origin: "manual",
  });
  revalidatePath("/", "layout");
}

export async function resolveObjection(form: FormData) {
  const status = req(form, "status");
  const response = req(form, "userResponse");
  if (status === "refuted" && !response) return; // a refutation must be written
  await db.update(S.objections).set({
    status,
    userResponse: response || null,
    handledAt: new Date().toISOString(),
  }).where(eq(S.objections.id, req(form, "objectionId")));
  revalidatePath("/", "layout");
}

/* --------------------------------- timing ------------------------------- */
export async function saveSetup(form: FormData) {
  const companyId = req(form, "companyId");
  await db.insert(S.technicalSetups).values({
    companyId,
    date: today(),
    trend: strOrNull(g(form, "trend")),
    support: numOrNull(g(form, "support")),
    resistance: numOrNull(g(form, "resistance")),
    entry: numOrNull(g(form, "entry")),
    stop: numOrNull(g(form, "stop")),
    target: numOrNull(g(form, "target")),
    horizonDays: Number(g(form, "horizonDays")) || null,
    maxLoss: numOrNull(g(form, "maxLoss")),
    eventRiskReviewed: g(form, "eventRiskReviewed") === "on",
    eventRiskNote: strOrNull(g(form, "eventRiskNote")),
    notes: strOrNull(g(form, "notes")),
  });
  revalidatePath("/", "layout");
}

export async function savePrice(form: FormData) {
  await db.insert(S.priceObservations).values({
    companyId: req(form, "companyId"),
    price: numOrNull(g(form, "price")) ?? 0,
    at: new Date().toISOString(),
    source: "manual",
  });
  revalidatePath("/", "layout");
}

export async function saveEvent(form: FormData) {
  await db.insert(S.events).values({
    date: req(form, "date"),
    type: req(form, "type"),
    scope: req(form, "scope") || "market",
    target: strOrNull(g(form, "target")),
    note: strOrNull(g(form, "note")),
  });
  revalidatePath("/", "layout");
}

export async function deleteEvent(form: FormData) {
  await db.delete(S.events).where(eq(S.events.id, req(form, "eventId")));
  revalidatePath("/", "layout");
}

/* ------------------------- snapshot, decision, position ------------------ */
async function freezeSnapshot(ticker: string, trigger: string) {
  const d = await getDossier(ticker);
  if (!d) return null;
  const payload = {
    frozenAt: new Date().toISOString(),
    company: d.company,
    macro: d.macro.perCategory.filter((p) => p.category.core).map((p) => ({
      code: p.category.code, label: p.category.label, reading: p.reading, ageDays: p.age,
    })),
    market: d.market,
    sector: d.sectorReading,
    filing: d.filing,
    derived: d.derived,
    companyReading: d.companyReading,
    valuation: d.valuation,
    thesis: d.thesis,
    invalidators: d.invalidators,
    objections: d.objections,
    setup: d.setup,
    tradeMath: d.tradeMath,
    settings: d.settings,
    openFindings: d.findings,
  };
  await db.insert(S.snapshots).values({
    companyId: d.company.id, date: today(), trigger, payload,
  });
  const row = (await db.select().from(S.snapshots)
    .where(eq(S.snapshots.companyId, d.company.id)).orderBy(desc(S.snapshots.date)).limit(1))[0];
  return row.id;
}

export async function saveDecision(form: FormData) {
  const ticker = req(form, "ticker");
  const d = await getDossier(ticker);
  if (!d) return;
  const snapshotId = await freezeSnapshot(ticker, "decision");
  const decision = req(form, "decision");
  await db.insert(S.decisions).values({
    companyId: d.company.id,
    date: today(),
    decision,
    horizon: strOrNull(g(form, "horizon")),
    why: req(form, "why"),
    thesisId: d.thesis?.id ?? null,
    snapshotId,
  });
  const statusMap: Record<string, string> = {
    buy: "position", watchlist: "watchlist", wait: "recherche",
    avoid: "ecarte", hold: "position", sell: "recherche",
  };
  await db.update(S.companies).set({ status: statusMap[decision] ?? "recherche" })
    .where(eq(S.companies.id, d.company.id));
  revalidatePath("/", "layout");
}

export async function openPosition(form: FormData) {
  const ticker = req(form, "ticker");
  const d = await getDossier(ticker);
  if (!d || !d.thesis) return;

  const timingStep = d.steps.find((s) => s.key === "timing");
  const challengeStep = d.steps.find((s) => s.key === "challenge");
  const isLongTerm = d.thesis.horizon === "long_term";
  const gateOk = challengeStep?.done && (isLongTerm || timingStep?.done);
  if (!gateOk) return; // gate G6 — never bypassed

  const snapshotId = await freezeSnapshot(ticker, "open_position");
  await db.insert(S.positions).values({
    companyId: d.company.id,
    thesisId: d.thesis.id,
    snapshotId,
    setupId: d.setup?.id ?? null,
    horizon: d.thesis.horizon,
    openedAt: req(form, "openedAt") || today(),
    entry: numOrNull(g(form, "entry")) ?? d.setup?.entry ?? 0,
    shares: numOrNull(g(form, "shares")) ?? d.tradeMath.shares ?? 0,
    stopInitial: numOrNull(g(form, "stop")) ?? d.setup?.stop ?? 0,
    targetInitial: numOrNull(g(form, "target")) ?? d.setup?.target ?? null,
    stopCurrent: numOrNull(g(form, "stop")) ?? d.setup?.stop ?? null,
    status: "open",
  });
  await db.update(S.companies).set({ status: "position" }).where(eq(S.companies.id, d.company.id));
  revalidatePath("/", "layout");
  redirect("/positions");
}

export async function addPositionReview(form: FormData) {
  const positionId = req(form, "positionId");
  await db.insert(S.positionReviews).values({
    positionId,
    date: today(),
    thesisStatus: req(form, "thesisStatus"),
    confidence: Number(g(form, "confidence")) || null,
    note: strOrNull(g(form, "note")),
    stopChangedTo: numOrNull(g(form, "stopChangedTo")),
    stopChangeReason: strOrNull(g(form, "stopChangeReason")),
  });
  const review = (await db.select().from(S.positionReviews)
    .where(eq(S.positionReviews.positionId, positionId)).orderBy(desc(S.positionReviews.createdAt)).limit(1))[0];

  const ids = (g(form, "invalidatorIds") ?? "").split(",").filter(Boolean);
  for (const invId of ids) {
    const answer = g(form, `inv_${invId}`);
    if (!answer) continue;
    await db.insert(S.invalidatorChecks).values({
      invalidatorId: invId, reviewId: review?.id ?? null, date: today(),
      answer, note: strOrNull(g(form, `note_${invId}`)),
    });
    const map: Record<string, string> = { yes: "occurred", no: "not_occurred", dont_know: "unknown" };
    await db.update(S.invalidators)
      .set({ status: map[answer] ?? "not_occurred", statusAt: today() })
      .where(eq(S.invalidators.id, invId));
  }

  const newStop = numOrNull(g(form, "stopChangedTo"));
  if (newStop !== null) {
    await db.update(S.positions).set({ stopCurrent: newStop }).where(eq(S.positions.id, positionId));
  }
  revalidatePath("/", "layout");
}

export async function changeHorizon(form: FormData) {
  const positionId = req(form, "positionId");
  const reason = req(form, "reason");
  if (!reason) return; // never silent (spec §3)
  const pos = (await db.select().from(S.positions).where(eq(S.positions.id, positionId)).limit(1))[0];
  if (!pos) return;
  const to = req(form, "toHorizon");
  if (to === pos.horizon) return;
  await db.insert(S.horizonChanges).values({
    positionId, fromHorizon: pos.horizon, toHorizon: to,
    plPctAtChange: numOrNull(g(form, "plPct")), reason, date: today(),
  });
  await db.update(S.positions).set({ horizon: to }).where(eq(S.positions.id, positionId));
  revalidatePath("/", "layout");
}

export async function closePosition(form: FormData) {
  const positionId = req(form, "positionId");
  await db.update(S.positions).set({
    status: "closed",
    closedAt: req(form, "closedAt") || today(),
    exitPrice: numOrNull(g(form, "exitPrice")),
    fees: numOrNull(g(form, "fees")),
    exitReason: req(form, "exitReason"),
  }).where(eq(S.positions.id, positionId));
  const pos = (await db.select().from(S.positions).where(eq(S.positions.id, positionId)).limit(1))[0];
  if (pos) {
    await db.update(S.companies).set({ status: "cloture" }).where(eq(S.companies.id, pos.companyId));
  }
  revalidatePath("/", "layout");
  redirect(`/journal/new?position=${positionId}`);
}

/* -------------------------------- journal ------------------------------- */
export async function saveJournalEntry(form: FormData) {
  const positionId = strOrNull(g(form, "positionId"));
  const pos = positionId
    ? (await db.select().from(S.positions).where(eq(S.positions.id, positionId)).limit(1))[0]
    : null;

  let resultPct: number | null = null;
  let resultR: number | null = null;
  if (pos && pos.exitPrice !== null && pos.entry !== 0) {
    resultPct = ((pos.exitPrice - pos.entry) / pos.entry) * 100;
    const risk = pos.entry - pos.stopInitial;
    resultR = risk !== 0 ? (pos.exitPrice - pos.entry) / risk : null;
  }

  await db.insert(S.journalEntries).values({
    companyId: req(form, "companyId"),
    positionId,
    snapshotId: pos?.snapshotId ?? strOrNull(g(form, "snapshotId")),
    date: today(),
    horizon: pos?.horizon ?? strOrNull(g(form, "horizon")),
    resultPct, resultR,
    expected: strOrNull(g(form, "expected")),
    happened: strOrNull(g(form, "happened")),
    verdict: req(form, "verdict"),
    mainError: strOrNull(g(form, "mainError")),
    errorTags: form.getAll("errorTags").map(String),
    lesson: req(form, "lesson"),
  });
  revalidatePath("/", "layout");
  redirect("/journal");
}

/* -------------------------------- settings ------------------------------ */
export async function saveSettings(form: FormData) {
  const existing = await db.select().from(S.settings).limit(1);
  const values = {
    capital: numOrNull(g(form, "capital")),
    maxRiskPerTradePct: numOrNull(g(form, "maxRiskPerTradePct")),
    maxOpenRiskPct: numOrNull(g(form, "maxOpenRiskPct")),
    maxSectorPct: numOrNull(g(form, "maxSectorPct")),
    updatedAt: new Date().toISOString(),
  };
  if (existing[0]) {
    await db.update(S.settings).set(values).where(eq(S.settings.id, existing[0].id));
  } else {
    await db.insert(S.settings).values({ id: "singleton", ...values });
  }
  revalidatePath("/", "layout");
}
