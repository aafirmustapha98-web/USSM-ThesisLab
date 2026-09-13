import Link from "next/link";
import { Card, PageHead, Empty, NumCell, Flag } from "@/components/ui";
import { db } from "@/db";
import * as S from "@/db/schema";
import { desc } from "drizzle-orm";
import { listCompanies, getSnapshot } from "@/lib/queries";
import { ERROR_TAGS, IDEA_ORIGINS } from "@/config/company-blocks";
import { fmt, fmtSigned } from "@/lib/format";

export const dynamic = "force-dynamic";

type Bucket = { label: string; min: number; max: number; wins: number; total: number };

export default async function JournalPage() {
  const entries = await db.select().from(S.journalEntries).orderBy(desc(S.journalEntries.date));
  const companies = await listCompanies();
  const byId = new Map(companies.map((c) => [c.id, c]));
  const positions = await db.select().from(S.positions);
  const posById = new Map(positions.map((p) => [p.id, p]));
  const allTheses = await db.select().from(S.theses);
  const horizonChanges = await db.select().from(S.horizonChanges);

  /* pull the frozen thesis confidence out of each snapshot */
  const enriched = await Promise.all(entries.map(async (e) => {
    const snap = e.snapshotId ? await getSnapshot(e.snapshotId) : null;
    const frozen = snap?.payload as { thesis?: { confidence?: number; confidencePostChallenge?: number | null } } | undefined;
    return {
      entry: e,
      company: byId.get(e.companyId) ?? null,
      position: e.positionId ? posById.get(e.positionId) ?? null : null,
      confidence: frozen?.thesis?.confidence ?? null,
      confidencePost: frozen?.thesis?.confidencePostChallenge ?? null,
    };
  }));

  /* ---------------------------- calibration ---------------------------- */
  const buckets: Bucket[] = [
    { label: "1–3", min: 1, max: 3, wins: 0, total: 0 },
    { label: "4–6", min: 4, max: 6, wins: 0, total: 0 },
    { label: "7–8", min: 7, max: 8, wins: 0, total: 0 },
    { label: "9–10", min: 9, max: 10, wins: 0, total: 0 },
  ];
  for (const e of enriched) {
    const c = e.confidencePost ?? e.confidence;
    if (typeof c !== "number" || e.entry.resultPct === null) continue;
    const b = buckets.find((x) => c >= x.min && c <= x.max);
    if (!b) continue;
    b.total += 1;
    if ((e.entry.resultPct ?? 0) > 0) b.wins += 1;
  }

  const deltas = allTheses
    .filter((t) => typeof t.confidencePostChallenge === "number")
    .map((t) => (t.confidencePostChallenge as number) - t.confidence);
  const avgDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;

  const byOrigin = new Map<string, { n: number; sumR: number }>();
  for (const e of enriched) {
    const o = e.company?.ideaOrigin ?? "autre";
    const cur = byOrigin.get(o) ?? { n: 0, sumR: 0 };
    if (e.entry.resultR !== null) { cur.n += 1; cur.sumR += e.entry.resultR; }
    byOrigin.set(o, cur);
  }

  const exitReasons = new Map<string, number>();
  for (const e of enriched) {
    const r = e.position?.exitReason ?? "—";
    exitReasons.set(r, (exitReasons.get(r) ?? 0) + 1);
  }

  const tagCount = new Map<string, number>();
  for (const e of enriched) for (const t of e.entry.errorTags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHead
        title="Journal & Learning"
        sub="Le journal ne lit que les instantanés gelés — jamais les fiches vivantes. C'est ce qui empêche de relire une décision à la lumière de données qu'on n'avait pas."
      />

      <div className="stack">
        <Card title="Entrées">
          {enriched.length === 0 ? <Empty>Aucune entrée. Elles se créent à la clôture d&apos;une position.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th><th>Ticker</th><th>Horizon</th><th className="n">Résultat</th>
                    <th className="n">R</th><th className="n">Confiance</th><th>Verdict</th><th>Leçon</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(({ entry, company, confidence, confidencePost }) => (
                    <tr key={entry.id}>
                      <td className="mono muted" style={{ width: 100 }}>{entry.date}</td>
                      <td style={{ fontWeight: 600 }}>{company?.ticker ?? "—"}</td>
                      <td><span className="chip">{entry.horizon === "swing" ? "Swing" : "Long"}</span></td>
                      <td className="n" style={{ color: (entry.resultPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                        <NumCell value={entry.resultPct} digits={1} unit="%" />
                      </td>
                      <td className="n"><NumCell value={entry.resultR} digits={2} /></td>
                      <td className="n muted">{confidencePost ?? confidence ?? "—"}</td>
                      <td>
                        <Flag flag={entry.verdict === "correct" ? "green" : entry.verdict === "partially_correct" ? "amber" : "red"}>
                          {entry.verdict === "correct" ? "Correcte" : entry.verdict === "partially_correct" ? "Partielle" : "Incorrecte"}
                        </Flag>
                      </td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{entry.lesson.slice(0, 90)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid-2">
          <Card title="Calibration" right={<span className="hint">ma confiance prédit-elle quoi que ce soit ?</span>}>
            <table className="data">
              <thead><tr><th>Confiance</th><th className="n">Trades</th><th className="n">Gagnants</th><th className="n">Taux</th></tr></thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.label}>
                    <td>{b.label}</td>
                    <td className="n">{b.total}</td>
                    <td className="n">{b.wins}</td>
                    <td className="n">{b.total ? `${fmt((b.wins / b.total) * 100, 0)} %` : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint" style={{ marginBottom: 0 }}>
              C&apos;est cette table qui remplace la barre de progression : elle mesure la qualité du jugement,
              pas le taux de remplissage.
            </p>
          </Card>

          <Card title="Perméabilité au challenge">
            <table className="data">
              <tbody>
                <tr>
                  <td>Écart moyen de confiance avant / après challenge</td>
                  <td className="n">{avgDelta === null ? <span className="muted">—</span> : fmtSigned(avgDelta, 2)}</td>
                </tr>
                <tr><td>Thèses challengées</td><td className="n">{deltas.length}</td></tr>
                <tr><td>Changements d&apos;horizon tracés</td><td className="n">{horizonChanges.length}</td></tr>
              </tbody>
            </table>
            {avgDelta !== null && Math.abs(avgDelta) < 0.25 && deltas.length >= 3 && (
              <div className="notice notice-warn" style={{ marginTop: 10 }}>
                Ta confiance ne bouge quasiment jamais après un challenge. C&apos;est un biais de confirmation mesuré.
              </div>
            )}
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Résultat par origine de l'idée">
            {[...byOrigin.entries()].filter(([, v]) => v.n > 0).length === 0 ? <Empty>Pas encore de données.</Empty> : (
              <table className="data">
                <thead><tr><th>Origine</th><th className="n">Trades</th><th className="n">R moyen</th></tr></thead>
                <tbody>
                  {[...byOrigin.entries()].filter(([, v]) => v.n > 0).map(([o, v]) => (
                    <tr key={o}>
                      <td>{IDEA_ORIGINS.find((x) => x.value === o)?.label ?? o}</td>
                      <td className="n">{v.n}</td>
                      <td className="n">{fmtSigned(v.sumR / v.n, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Erreurs récurrentes">
            {topTags.length === 0 ? <Empty>Pas encore d&apos;erreur enregistrée.</Empty> : (
              <table className="data">
                <tbody>
                  {topTags.map(([t, n]) => (
                    <tr key={t}>
                      <td>{ERROR_TAGS.find((x) => x.value === t)?.label ?? t}</td>
                      <td className="n">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card title="Motif de sortie" right={<span className="hint">la part de discrétionnaire est la part d&apos;indiscipline</span>}>
          {exitReasons.size === 0 ? <Empty>Pas encore de position clôturée.</Empty> : (
            <table className="data">
              <tbody>
                {[...exitReasons.entries()].map(([r, n]) => (
                  <tr key={r}><td>{r}</td><td className="n">{n}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
