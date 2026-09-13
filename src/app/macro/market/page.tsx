import Link from "next/link";
import { Card, Field, PageHead, Flag, Notice } from "@/components/ui";
import { MARKET_GROUPS, MARKET_CATEGORY_CODE, MARKET_DIAGNOSTICS, TE_HUB } from "@/config/macro-catalog";
import { getLatestObservations, getLatestMarketReading } from "@/lib/queries";
import { db } from "@/db";
import * as S from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { saveMarketData, saveMarketReading } from "@/app/actions";
import { fmt, fmtAge, today, diagnosticToFlag } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const obs = await getLatestObservations(MARKET_CATEGORY_CODE);
  const latest = await getLatestMarketReading();
  const history = await db.select().from(S.marketReadings).orderBy(desc(S.marketReadings.date)).limit(6);
  const inv = latest
    ? await db.select().from(S.invalidators)
        .where(and(eq(S.invalidators.scope, "market"), eq(S.invalidators.refId, latest.id)))
    : [];

  return (
    <>
      <PageHead
        title="Market"
        sub={<>Indices, breadth et volatilité — source unique (les catégories 09 et 10 de la spec vivent ici). <a className="src-link" href={TE_HUB} target="_blank" rel="noreferrer">Trading Economics</a></>}
        actions={<Link className="btn btn-ghost btn-sm" href="/macro">← Macro</Link>}
      />

      <div className="stack">
        <form action={saveMarketData}>
          <Card
            title="Data"
            footer={
              <div className="card-pad" style={{ borderTop: "1px solid var(--line-2)" }}>
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  <Field label="Date de référence"><input className="input" type="date" name="refDate" defaultValue={today()} required /></Field>
                  <Field label="URL source"><input className="input" name="sourceUrl" placeholder="https://tradingeconomics.com/..." /></Field>
                </div>
                <button className="btn" type="submit">Enregistrer les données</button>
              </div>
            }
          >
            <div className="stack">
              {MARKET_GROUPS.map((grp) => (
                <div key={grp.label}>
                  <div className="label" style={{ marginBottom: 6 }}>{grp.label}</div>
                  <div className="table-wrap">
                    <table className="data">
                      <tbody>
                        {grp.indicators.map((ind) => {
                          const o = obs.get(ind.code);
                          return (
                            <tr key={ind.code}>
                              <td style={{ fontWeight: 550 }}>{ind.label}<div className="hint">{ind.unit ?? "texte"}</div></td>
                              {ind.kind === "text" ? (
                                <td colSpan={3}><input className="input" name={`t_${ind.code}`} placeholder={o?.note ?? "Contango / backwardation…"} /></td>
                              ) : (
                                <>
                                  <td className="n" style={{ width: 130 }}>
                                    <input className="input num" name={`v_${ind.code}`} inputMode="decimal"
                                      placeholder={o?.value != null ? fmt(o.value) : "—"} />
                                  </td>
                                  <td className="n" style={{ width: 130 }}>
                                    <input className="input num" name={`p_${ind.code}`} inputMode="decimal"
                                      placeholder={o?.previous != null ? fmt(o.previous) : "previous"} />
                                  </td>
                                  <td style={{ width: 90 }}>
                                    <select className="select" name={`tr_${ind.code}`} defaultValue={o?.trend ?? ""}>
                                      <option value="">—</option><option value="up">↑</option>
                                      <option value="flat">→</option><option value="down">↓</option>
                                    </select>
                                  </td>
                                </>
                              )}
                              <td className="n muted" style={{ width: 110, fontSize: 12 }}>{o ? o.refDate : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </form>

        <Card
          title="Mon diagnostic de marché"
          right={latest ? <Flag flag={diagnosticToFlag(latest.diagnostic)}>{latest.diagnostic} · {fmtAge(latest.date)}</Flag> : null}
        >
          <Notice kind="info">
            Quelle est la tendance du marché et quelle est la qualité de sa breadth ? Le marché est-il stressé, normal ou complaisant ?
          </Notice>
          <form action={saveMarketReading} className="stack-sm" style={{ marginTop: 14 }}>
            <input type="hidden" name="date" value={today()} />
            <div className="grid-2">
              <Field label="Diagnostic">
                <select className="select" name="diagnostic" required defaultValue="">
                  <option value="" disabled>Choisir…</option>
                  {MARKET_DIAGNOSTICS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
              <Field label="Confiance (1–10)">
                <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={5} />
              </Field>
            </div>
            <Field label="Pourquoi ?"><textarea className="textarea" name="justification" required /></Field>
            <Field label="Qualité de la breadth"><textarea className="textarea" name="breadthNote" style={{ minHeight: 60 }} /></Field>

            <div className="label" style={{ marginTop: 6 }}>Qu&apos;est-ce qui invaliderait ce diagnostic ?</div>
            <p className="hint" style={{ margin: 0 }}>
              Un diagnostic de marché doit être falsifiable, exactement comme une thèse. Rends-le mesurable.
            </p>
            <div className="grid-4">
              <Field label="Libellé"><input className="input" name="invalidatorLabel" placeholder="Dégradation de la breadth" /></Field>
              <Field label="Métrique"><input className="input" name="invalidatorMetric" placeholder="ABOVE_200DMA" /></Field>
              <Field label="Opérateur">
                <select className="select" name="invalidatorOperator" defaultValue="<">
                  <option value="<">{"<"}</option><option value=">">{">"}</option>
                  <option value="<=">{"≤"}</option><option value=">=">{"≥"}</option>
                </select>
              </Field>
              <Field label="Seuil"><input className="input num" name="invalidatorThreshold" inputMode="decimal" placeholder="45" /></Field>
            </div>
            <div className="grid-2">
              <Field label="Unité"><input className="input" name="invalidatorUnit" placeholder="%" /></Field>
              <Field label="Persistance"><input className="input" name="invalidatorPersistence" placeholder="2 semaines consécutives" /></Field>
            </div>
            <div><button className="btn" type="submit">Enregistrer mon diagnostic</button></div>
          </form>
        </Card>

        {inv.length > 0 && (
          <Card title="Invalidateurs du diagnostic courant">
            <table className="data">
              <tbody>
                {inv.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 550 }}>{i.label}</td>
                    <td className="mono muted">{i.metric} {i.operator} {i.threshold} {i.unit}</td>
                    <td className="muted">{i.persistence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {history.length > 0 && (
          <Card title="Historique">
            <div className="stack-sm">
              {history.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid var(--line-2)", paddingBottom: 10 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <Flag flag={diagnosticToFlag(r.diagnostic)}>{r.diagnostic}</Flag>
                    <span className="muted mono" style={{ fontSize: 12 }}>{r.date}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{r.justification}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
