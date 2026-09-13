import { db } from "@/db";
import * as S from "@/db/schema";

export const dynamic = "force-dynamic";

/** Full local export. The data is hand-entered and irreplaceable. */
export async function GET() {
  const tables = {
    settings: S.settings, companies: S.companies,
    macroObservations: S.macroObservations, macroReadings: S.macroReadings,
    marketReadings: S.marketReadings, geoEvents: S.geoEvents,
    sectorReadings: S.sectorReadings, companyFilings: S.companyFilings,
    companyReadings: S.companyReadings, valuationReadings: S.valuationReadings,
    theses: S.theses, invalidators: S.invalidators, invalidatorChecks: S.invalidatorChecks,
    challengeRuns: S.challengeRuns, objections: S.objections, ruleFindings: S.ruleFindings,
    technicalSetups: S.technicalSetups, priceObservations: S.priceObservations,
    events: S.events, snapshots: S.snapshots, decisions: S.decisions,
    positions: S.positions, positionReviews: S.positionReviews,
    horizonChanges: S.horizonChanges, journalEntries: S.journalEntries,
  };

  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
  for (const [name, table] of Object.entries(tables)) {
    out[name] = await db.select().from(table);
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="ussm-export.json"',
    },
  });
}
