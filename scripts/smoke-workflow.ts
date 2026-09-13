/** Walks the whole workflow on a throwaway DB and prints gate state at each step. */
import { db } from "@/db";
import * as S from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDossier } from "@/lib/queries";
import { MACRO_CATEGORIES } from "@/config/macro-catalog";
import { positionMath } from "@/lib/derive";
import { evaluateRules } from "@/config/rules";
import { daysSince } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const show = async (label: string) => {
  const d = await getDossier("NVDA");
  if (!d) return console.log("no dossier");
  const line = d.steps.map((s) => `${s.done ? "✓" : s.locked ? "🔒" : "·"}${s.label}`).join(" ");
  console.log(`\n— ${label}\n  ${line}`);
  const blocked = d.steps.find((s) => !s.done && s.locked);
  if (blocked) console.log(`  bloqué: ${blocked.label} → ${blocked.reason.join(" | ")}`);
  if (d.findings.length) console.log(`  contrôles: ${d.findings.map((f) => `${f.code}(${f.severity})`).join(", ")}`);
  return d;
};

async function main() {
  await db.insert(S.companies).values({
    ticker: "NVDA", name: "NVIDIA", sector: "Technology", industry: "Semiconductors",
    ideaOrigin: "screener", status: "recherche",
  });
  await show("1. dossier ouvert");

  for (const c of MACRO_CATEGORIES.filter((x) => x.core)) {
    await db.insert(S.macroReadings).values({
      categoryCode: c.code, date: today,
      whatHappens: `Lecture ${c.label}`, why: "Mécanisme décrit",
      impacts: ["fed"], uncertainties: ["incertitude A", "incertitude B"],
      diagnostic: "neutre", confidence: 6,
    });
  }
  await db.insert(S.marketReadings).values({
    date: today, diagnostic: "bullish", justification: "Tendance haussière, breadth correcte", confidence: 6,
  });
  await show("2. macro noyau + marché");

  await db.insert(S.sectorReadings).values({
    sector: "Technology", industry: "Semiconductors", date: today,
    cycle: "Expansion", demand: "Forte", pricingPower: "Fort", capex: "En hausse",
    catalysts: ["capex hyperscalers"], risks: ["cyclicité", "contrôles export"],
    tailwind: "favorable", justification: "Cycle porteur", confidence: 7,
  });
  await show("3. secteur");

  const co = (await db.select().from(S.companies))[0];
  await db.insert(S.companyFilings).values({
    companyId: co.id, period: "2026-Q1", marketCap: 3000000, revenue: 26000, eps: 5.1,
    ebitda: 17000, netIncome: 12000, fcf: 11000, cfo: 13000, cash: 30000, totalDebt: 9000,
    grossMargin: 74, operatingMargin: 62, netMargin: 46, roic: 30,
  });
  await db.insert(S.companyFilings).values({
    companyId: co.id, period: "2026-Q2", marketCap: 3200000, price: 120, shares: 24500,
    revenue: 33000, revenueGrowth: 26, eps: 6.2, epsGrowth: 3, ebitda: 21000, ebit: 20000,
    netIncome: 15000, fcf: 14000, cfo: 16000, cash: 34000, totalDebt: 9500, equity: 60000,
    grossMargin: 75, operatingMargin: 63, netMargin: 45, ebitdaMargin: 64,
    roa: 40, roe: 55, roic: 32, debtToEquity: 0.16, interestCoverage: 40,
    currentRatio: 3.5, quickRatio: 3.1,
    pe: 48, forwardPe: 36, peg: 1.2, pb: 30, ps: 28, evEbitda: 38, evEbit: 40, evFcf: 55,
    fcfYield: 0.44, dividendYield: 0.02,
  });
  await db.insert(S.companyReadings).values({
    companyId: co.id, date: today,
    growthInterpretation: "Croissance tirée par les data centers",
    profitabilityInterpretation: "Marges historiquement hautes",
    strengthInterpretation: "Bilan net cash",
    qualityFlag: "green", growthFlag: "green", strengthFlag: "green", confidence: 7,
  });
  const d3 = await show("4. fondamentaux (C-01 attendu : CA +26 %, BPA +3 %)");

  // answer the blocking/warning controls
  for (const f of d3!.findings) {
    await db.insert(S.ruleFindings).values({
      ruleCode: f.code, scope: f.scope, targetId: co.id,
      status: "answered", userResponse: "Réponse écrite", answeredAt: new Date().toISOString(),
    });
  }
  await db.insert(S.valuationReadings).values({
    companyId: co.id, date: today, diagnostic: "expensive",
    justification: "Multiples élevés mais croissance en face", peers: [], confidence: 6,
  });
  await show("5. valorisation");

  await db.insert(S.theses).values({
    companyId: co.id, version: 1, horizon: "swing", direction: "long",
    why: "Position dominante sur l'accélération IA",
    bullCase: "Le capex hyperscalers tient, les marges se maintiennent",
    bearCase: "Le capex des hyperscalers ralentit brutalement au second semestre, la concurrence ASIC grignote des parts, les marges brutes redescendent sous 70 % et le multiple se comprime de 48x à 30x. Le titre perd alors 35 % sans qu'aucun chiffre trimestriel n'ait été « mauvais » dans l'absolu.",
    catalysts: ["résultats T3"], risks: ["cyclicité"], uncertainties: ["durée du cycle"],
    confidence: 7, status: "active",
  });
  const th = (await db.select().from(S.theses))[0];
  const d5 = await show("6. thèse sans invalidateur mesurable (C-42 attendu)");

  await db.insert(S.invalidators).values({
    scope: "thesis", refId: th.id, label: "Érosion des marges", metric: "grossMargin",
    operator: "<", threshold: 70, unit: "%", persistence: "2 trimestres consécutifs", source: "finviz",
  });
  await show("7. invalidateur mesurable ajouté");

  await db.insert(S.challengeRuns).values({ thesisId: th.id, date: today, mode: "manual" });
  const run = (await db.select().from(S.challengeRuns))[0];
  await db.insert(S.objections).values({
    challengeRunId: run.id, category: "weak_assumption", severity: "critical",
    text: "Tu supposes que les marges tiennent. Sur quoi ?", origin: "manual",
  });
  await show("8. objection critique ouverte → Timing doit être verrouillé");

  await db.update(S.objections).set({ status: "refuted", userResponse: "Pricing power documenté" });
  await db.update(S.theses).set({ confidencePostChallenge: 6 });
  await show("9. objection tranchée + confiance post-challenge");

  await db.insert(S.technicalSetups).values({
    companyId: co.id, date: today, trend: "up", support: 110, resistance: 135,
    entry: 120, stop: 112, target: 145, horizonDays: 45, maxLoss: 800, eventRiskReviewed: true,
  });
  const d9 = await show("10. setup (R/R = 3.1 → C-50 ne doit PAS se déclencher)");
  console.log(`  R/R = ${d9!.tradeMath.riskReward?.toFixed(2)}, taille = ${d9!.tradeMath.shares} actions`);
  console.log(`  dérivé netDebt = ${d9!.dmap.netDebt.value}, Δmarge op = ${d9!.dmap.operatingMarginChange.value}`);
  console.log(`  dérivé manquant test : ${d9!.dmap.cfoToNetIncome.value !== null ? "cfo/ni OK" : "Insufficient"}`);

  await db.insert(S.decisions).values({
    companyId: co.id, date: today, decision: "buy", horizon: "swing", why: "Setup aligné avec la thèse",
  });
  await show("11. décision enregistrée");

  /* ---- position lifecycle ---- */
  const dFinal = (await getDossier("NVDA"))!;
  await db.insert(S.positions).values({
    companyId: co.id, thesisId: th.id, snapshotId: null, setupId: dFinal.setup!.id,
    horizon: "swing", openedAt: today, entry: 120, shares: 100,
    stopInitial: 112, targetInitial: 145, stopCurrent: 112, status: "open",
  });
  const pos = (await db.select().from(S.positions))[0];
  await db.insert(S.priceObservations).values({
    companyId: co.id, price: 108, at: new Date().toISOString(), source: "manual",
  });
  const m = positionMath({ entry: 120, shares: 100, stopInitial: 112, currentPrice: 108 });
  console.log(`
— 12. position ouverte, prix 108`);
  console.log(`  P/L = ${m.plPct?.toFixed(1)} % · R = ${m.rNow?.toFixed(2)} · risque initial = ${m.initialRisk}`);

  const inv = (await db.select().from(S.invalidators))[0];
  await db.update(S.invalidators).set({ status: "occurred", statusAt: "2026-08-01" });
  const posFindings = evaluateRules({
    position: {
      plPct: m.plPct, dontKnowCount: 0, daysSinceReview: null, stopWidened: false, thesisRevisions: 0,
      occurredInvalidators: [{ label: inv.label, days: daysSince("2026-08-01") ?? 0 }],
    },
  }, ["position"]);
  console.log(`
— 13. invalidateur survenu depuis longtemps, position toujours ouverte`);
  console.log(`  contrôles: ${posFindings.map((f) => `${f.code}(${f.severity})`).join(", ")}`);
  for (const f of posFindings) console.log(`    ${f.code}: ${f.message}`);

  await db.insert(S.horizonChanges).values({
    positionId: pos.id, fromHorizon: "swing", toHorizon: "long_term",
    plPctAtChange: m.plPct, reason: "Test de traçabilité", date: today,
  });
  await db.update(S.positions).set({
    horizon: "long_term", status: "closed", closedAt: today, exitPrice: 111, exitReason: "stop",
  }).where(eq(S.positions.id, pos.id));
  await db.insert(S.journalEntries).values({
    companyId: co.id, positionId: pos.id, date: today, horizon: "long_term",
    resultPct: ((111 - 120) / 120) * 100, resultR: (111 - 120) / (120 - 112),
    expected: "Poursuite du cycle", happened: "Stop touché",
    verdict: "incorrect", mainError: "Entrée trop tardive",
    errorTags: ["late_entry", "timing"], lesson: "Attendre le repli sur support",
  });
  const je = (await db.select().from(S.journalEntries))[0];
  console.log(`
— 14. clôture + journal`);
  console.log(`  résultat ${je.resultPct?.toFixed(1)} % (${je.resultR?.toFixed(2)} R) · verdict ${je.verdict}`);
  console.log(`  changement d'horizon tracé : ${(await db.select().from(S.horizonChanges)).length}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
