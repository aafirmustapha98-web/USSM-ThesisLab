import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Empty, Notice } from "@/components/ui";
import { findCategory, IMPACT_OPTIONS, DIAGNOSTIC_OPTIONS, TE_HUB, GEO_CHANNELS } from "@/config/macro-catalog";
import { db } from "@/db";
import * as S from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getLatestObservations } from "@/lib/queries";
import { saveMacroObservations, saveMacroReading, saveGeoEvent } from "@/app/actions";
import { fmt, fmtAge, today, isDue, diagnosticToFlag } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MacroCategory({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const category = findCategory(code);
  if (!category) notFound();

  const observations = await getLatestObservations(code);
  const readings = await db.select().from(S.macroReadings)
    .where(eq(S.macroReadings.categoryCode, code))
    .orderBy(desc(S.macroReadings.date)).limit(6);
  const latest = readings[0] ?? null;
  const geo = code === "M13"
    ? await db.select().from(S.geoEvents).orderBy(desc(S.geoEvents.date))
    : [];

  const dueCount = category.indicators.filter((i) => isDue(i.frequency, observations.get(i.code)?.refDate)).length;

  return (
    <>
      <PageHead
        title={`${category.code} — ${category.label}`}
        sub={
          <>
            {category.core ? <span className="chip">noyau</span> : <span className="chip">optionnel</span>}{" "}
            {category.indicators.length > 0 && <>· {dueCount} indicateur(s) à rafraîchir sur {category.indicators.length}</>}
            {" · "}<a className="src-link" href={TE_HUB} target="_blank" rel="noreferrer">Trading Economics</a>
          </>
        }
        actions={<Link className="btn btn-ghost btn-sm" href="/macro">← Toutes les catégories</Link>}
      />

      <div className="stack">
        {category.warning && <Notice kind="warn">{category.warning}</Notice>}

        <Card title="Questions à trancher">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {category.questions.map((q) => <li key={q} style={{ marginBottom: 4 }}>{q}</li>)}
          </ul>
        </Card>

        {category.indicators.length > 0 && (
          <form action={saveMacroObservations}>
            <input type="hidden" name="categoryCode" value={code} />
            <input type="hidden" name="indicatorCodes" value={category.indicators.map((i) => i.code).join(",")} />
            <Card
              title="Data"
              right={<span className="hint">Saisie manuelle — l&apos;application ne récupère rien automatiquement</span>}
              footer={
                <div className="card-pad" style={{ borderTop: "1px solid var(--line-2)" }}>
                  <div className="grid-3" style={{ marginBottom: 12 }}>
                    <Field label="Date de référence" hint="la période décrite par la donnée">
                      <input className="input" type="date" name="refDate" defaultValue={today()} required />
                    </Field>
                    <Field label="Date d'observation" hint="publication par la source">
                      <input className="input" type="date" name="obsDate" />
                    </Field>
                    <Field label="URL source">
                      <input className="input" name="sourceUrl" placeholder="https://tradingeconomics.com/..." />
                    </Field>
                  </div>
                  <button className="btn" type="submit">Enregistrer les données</button>
                </div>
              }
            >
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Indicateur</th>
                      <th className="n" style={{ width: 120 }}>Valeur</th>
                      <th className="n" style={{ width: 120 }}>Previous</th>
                      <th style={{ width: 90 }}>Trend</th>
                      <th className="n" style={{ width: 130 }}>Dernière saisie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.indicators.map((ind) => {
                      const o = observations.get(ind.code);
                      const due = isDue(ind.frequency, o?.refDate);
                      return (
                        <tr key={ind.code}>
                          <td>
                            <div style={{ fontWeight: 550 }}>{ind.label}</div>
                            <div className="hint">
                              {ind.unit ?? "texte"} · {ind.frequency}
                              {due && <span style={{ color: "var(--amber)" }}> · à rafraîchir</span>}
                            </div>
                          </td>
                          {ind.kind === "text" ? (
                            <td colSpan={3}>
                              <input className="input" name={`t_${ind.code}`} placeholder={o?.note ?? "Note qualitative…"} />
                            </td>
                          ) : (
                            <>
                              <td className="n">
                                <input className="input num" name={`v_${ind.code}`} inputMode="decimal"
                                  placeholder={o?.value !== null && o?.value !== undefined ? fmt(o.value) : "—"} />
                                <input type="hidden" name={`u_${ind.code}`} value={ind.unit ?? ""} />
                              </td>
                              <td className="n">
                                <input className="input num" name={`p_${ind.code}`} inputMode="decimal"
                                  placeholder={o?.previous !== null && o?.previous !== undefined ? fmt(o.previous) : "—"} />
                              </td>
                              <td>
                                <select className="select" name={`tr_${ind.code}`} defaultValue={o?.trend ?? ""}>
                                  <option value="">—</option>
                                  <option value="up">↑</option>
                                  <option value="flat">→</option>
                                  <option value="down">↓</option>
                                </select>
                              </td>
                            </>
                          )}
                          <td className="n muted" style={{ fontSize: 12 }}>
                            {o ? <>{o.refDate}<br /><span className="hint">saisi {fmtAge(o.enteredAt)}</span></> : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </form>
        )}

        {code === "M13" && (
          <>
            <Card title="Événements géopolitiques enregistrés">
              {geo.length === 0 ? <Empty>Aucun événement enregistré.</Empty> : (
                <div className="table-wrap">
                  <table className="data">
                    <thead><tr><th>Événement</th><th>Pays</th><th>Durée</th><th className="n">Prob.</th><th>Canaux</th><th className="n">Date</th></tr></thead>
                    <tbody>
                      {geo.map((e) => (
                        <tr key={e.id}>
                          <td><strong>{e.title}</strong><div className="hint">{e.description}</div></td>
                          <td className="muted">{e.countries}</td>
                          <td className="muted">{e.estimatedDuration}</td>
                          <td className="n">{e.probability ? `${e.probability}%` : "—"}</td>
                          <td className="muted" style={{ fontSize: 12 }}>
                            {(e.channels ?? []).map((c) => GEO_CHANNELS.find((x) => x.value === c)?.label ?? c).join(", ")}
                          </td>
                          <td className="n">{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <details className="acc">
              <summary>Enregistrer un événement géopolitique</summary>
              <div className="acc-body">
                <form action={saveGeoEvent} className="stack-sm">
                  <div className="grid-3">
                    <Field label="Événement"><input className="input" name="title" required /></Field>
                    <Field label="Date"><input className="input" type="date" name="date" defaultValue={today()} /></Field>
                    <Field label="Pays concernés"><input className="input" name="countries" /></Field>
                  </div>
                  <Field label="Description"><textarea className="textarea" name="description" /></Field>
                  <div className="grid-3">
                    <Field label="Durée estimée"><input className="input" name="estimatedDuration" placeholder="3 à 6 mois" /></Field>
                    <Field label="Probabilité (%)"><input className="input num" name="probability" inputMode="numeric" /></Field>
                    <Field label="Impact potentiel"><input className="input" name="potentialImpact" /></Field>
                  </div>
                  <Field label="Canaux de transmission">
                    <div className="row">
                      {GEO_CHANNELS.map((c) => (
                        <label key={c.value} className="row" style={{ gap: 5, fontSize: 13 }}>
                          <input type="checkbox" name="channels" value={c.value} /> {c.label}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div><button className="btn" type="submit">Enregistrer l&apos;événement</button></div>
                </form>
              </div>
            </details>
          </>
        )}

        <Card
          title="My interpretation"
          right={latest ? <span className="hint">dernière : {latest.date} · {fmtAge(latest.date)}</span> : <span className="hint">obligatoire</span>}
        >
          <Notice kind="info">
            L&apos;interprétation est à moi. L&apos;application ne la pré-remplit jamais et n&apos;en déduit aucun diagnostic.
          </Notice>
          <form action={saveMacroReading} className="stack-sm" style={{ marginTop: 14 }}>
            <input type="hidden" name="categoryCode" value={code} />
            <input type="hidden" name="date" value={today()} />
            <Field label="Que se passe-t-il ?">
              <textarea className="textarea" name="whatHappens" required defaultValue="" placeholder="Décris le mouvement observé dans les données que tu viens de saisir." />
            </Field>
            <Field label="Pourquoi ?">
              <textarea className="textarea" name="why" required placeholder="Quel mécanisme l'explique ? Quelle est la cause, pas seulement l'effet." />
            </Field>
            <Field label="Impact potentiel sur">
              <div className="row">
                {IMPACT_OPTIONS.map((i) => (
                  <label key={i.value} className="row" style={{ gap: 5, fontSize: 13 }}>
                    <input type="checkbox" name="impacts" value={i.value} /> {i.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Ce que je ne sais pas" hint="une incertitude par ligne">
              <textarea className="textarea" name="uncertainties" style={{ minHeight: 60 }} />
            </Field>
            <div className="grid-2">
              <Field label="Mon diagnostic (pour les actions)">
                <select className="select" name="diagnostic" required defaultValue="">
                  <option value="" disabled>Choisir…</option>
                  {DIAGNOSTIC_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
              <Field label="Confiance (1–10)">
                <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={5} />
              </Field>
            </div>
            <div><button className="btn" type="submit">Enregistrer mon interprétation</button></div>
          </form>
        </Card>

        {readings.length > 0 && (
          <Card title="Historique de mes interprétations">
            <div className="stack-sm">
              {readings.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid var(--line-2)", paddingBottom: 10 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <Flag flag={diagnosticToFlag(r.diagnostic)}>{r.diagnostic}</Flag>
                    <span className="muted mono" style={{ fontSize: 12 }}>{r.date}</span>
                    <span className="muted" style={{ fontSize: 12 }}>confiance {r.confidence ?? "—"}/10</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{r.whatHappens}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{r.why}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
