import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Notice, Empty, Confidence } from "@/components/ui";
import { Findings } from "@/components/Findings";
import { getPositionDetail, getSnapshot } from "@/lib/queries";
import { positionMath } from "@/lib/derive";
import { addPositionReview, changeHorizon, closePosition, savePrice } from "@/app/actions";
import { evaluateRules } from "@/config/rules";
import { HORIZONS } from "@/config/company-blocks";
import { fmt, fmtAge, today, daysSince } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PositionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPositionDetail(id);
  if (!data) notFound();
  const { position, company, thesis, invalidators, reviews, horizonLog, price, thesisCount } = data;

  const current = position.status === "closed" ? position.exitPrice : price?.price ?? null;
  const m = positionMath({
    entry: position.entry, shares: position.shares, stopInitial: position.stopInitial, currentPrice: current,
  });

  const lastReview = reviews[0] ?? null;
  const occurred = invalidators
    .filter((i) => i.status === "occurred")
    .map((i) => ({ label: i.label, days: daysSince(i.statusAt) ?? 0 }));
  const dontKnow = reviews.length
    ? invalidators.filter((i) => i.status === "unknown").length
    : 0;

  const findings = evaluateRules({
    position: {
      plPct: m.plPct,
      occurredInvalidators: occurred,
      dontKnowCount: dontKnow,
      daysSinceReview: daysSince(lastReview?.date),
      stopWidened: (position.stopCurrent ?? position.stopInitial) < position.stopInitial,
      thesisRevisions: thesisCount - 1,
    },
  }, ["position"]);

  const snapshot = position.snapshotId ? await getSnapshot(position.snapshotId) : null;

  return (
    <>
      <PageHead
        title={`${company?.ticker} — position`}
        sub={<>Ouverte le {position.openedAt} · horizon {position.horizon === "swing" ? "Swing" : "Long term"} · {position.status === "open" ? "ouverte" : "clôturée"}</>}
        actions={<Link className="btn btn-ghost btn-sm" href="/positions">← Positions</Link>}
      />

      <div className="stack">
        <Findings findings={findings} companyId={company!.id} />

        <div className="grid-2">
          <Card title="Position">
            <table className="data">
              <tbody>
                <tr><td>Entry</td><td className="n">{fmt(position.entry)}</td></tr>
                <tr><td>Current</td><td className="n">{current !== null ? fmt(current) : <span className="muted">prix non saisi</span>}
                  {price && position.status === "open" && <span className="hint"> · {fmtAge(price.at)}</span>}</td></tr>
                <tr><td>Stop</td><td className="n">{fmt(position.stopCurrent ?? position.stopInitial)}
                  {position.stopCurrent !== null && position.stopCurrent !== position.stopInitial &&
                    <span className="hint"> (initial {fmt(position.stopInitial)})</span>}</td></tr>
                <tr><td>Target</td><td className="n">{fmt(position.targetInitial)}</td></tr>
                <tr><td>Shares</td><td className="n">{fmt(position.shares, 0)}</td></tr>
                <tr><td>Position value</td><td className="n">{fmt(m.value)}</td></tr>
                <tr><td>Risque initial</td><td className="n">{fmt(m.initialRisk)}</td></tr>
                <tr><td>Current P/L</td><td className="n" style={{ color: (m.plAbs ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                  {m.plAbs !== null ? `${fmt(m.plAbs)} (${fmt(m.plPct, 1)} %)` : "—"}</td></tr>
                <tr><td>R courant</td><td className="n">{m.rNow !== null ? fmt(m.rNow) : "—"}</td></tr>
                <tr><td>R/R initial</td><td className="n">
                  {position.targetInitial ? fmt((position.targetInitial - position.entry) / (position.entry - position.stopInitial)) : "—"}</td></tr>
              </tbody>
            </table>
            {position.status === "open" && (
              <form action={savePrice} className="row" style={{ marginTop: 12 }}>
                <input type="hidden" name="companyId" value={position.companyId} />
                <input className="input num" name="price" placeholder="Prix courant" style={{ maxWidth: 150 }} required />
                <button className="btn btn-sm" type="submit">Mettre à jour</button>
              </form>
            )}
          </Card>

          <Card title="Thèse au moment de l'entrée" right={thesis ? <span className="chip">v{thesis.version}</span> : null}>
            {!thesis ? <Empty>Thèse introuvable.</Empty> : (
              <div className="stack-sm">
                <div><span className="label">Why</span><div style={{ fontSize: 13 }}>{thesis.why}</div></div>
                <div><span className="label">Bear case</span><div style={{ fontSize: 12.5 }} className="muted">{thesis.bearCase.slice(0, 260)}…</div></div>
                <div className="row">
                  <Confidence value={thesis.confidence} />
                  {thesis.confidencePostChallenge && <span className="chip">post-challenge {thesis.confidencePostChallenge}/10</span>}
                </div>
                {snapshot && <div className="hint">Instantané gelé le {snapshot.date} — c&apos;est lui que le Journal relira, pas les fiches vivantes.</div>}
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Pourquoi suis-je encore dans cette position ?"
          right={lastReview ? <span className="hint">dernière revue : {fmtAge(lastReview.date)}</span> : <span className="hint">jamais revue</span>}
        >
          <Notice kind="info">
            Réponds <strong>d&apos;abord</strong> invalidateur par invalidateur. Le statut de la thèse se remplit après —
            c&apos;est là qu&apos;on se ment le mieux à soi-même.
          </Notice>

          {position.status === "open" && (
            <form action={addPositionReview} className="stack-sm" style={{ marginTop: 14 }}>
              <input type="hidden" name="positionId" value={position.id} />
              <input type="hidden" name="invalidatorIds" value={invalidators.map((i) => i.id).join(",")} />

              {invalidators.length === 0 ? (
                <Notice kind="warn">Cette thèse n&apos;a aucun invalidateur enregistré.</Notice>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead><tr><th>Invalidateur</th><th>Condition</th><th style={{ width: 320 }}>S&apos;est-il produit ?</th></tr></thead>
                    <tbody>
                      {invalidators.map((i) => (
                        <tr key={i.id}>
                          <td style={{ fontWeight: 550 }}>{i.label}</td>
                          <td className="mono muted" style={{ fontSize: 11.5 }}>
                            {i.metric ? `${i.metric} ${i.operator ?? ""} ${i.threshold ?? ""} ${i.unit ?? ""} ${i.persistence ?? ""}` : "non mesurable"}
                          </td>
                          <td>
                            <div className="row" style={{ gap: 12 }}>
                              {[["no", "Non"], ["yes", "Oui, survenu"], ["dont_know", "Je ne sais pas"]].map(([v, l]) => (
                                <label key={v} className="row" style={{ gap: 4, fontSize: 12.5 }}>
                                  <input type="radio" name={`inv_${i.id}`} value={v} required /> {l}
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid-3">
                <Field label="Statut de la thèse">
                  <select className="select" name="thesisStatus" required defaultValue="">
                    <option value="" disabled>Choisir…</option>
                    <option value="intact">Intact</option>
                    <option value="strengthened">Strengthened</option>
                    <option value="weakened">Weakened</option>
                    <option value="invalidated">Invalidated</option>
                  </select>
                </Field>
                <Field label="Confiance actuelle (1–10)">
                  <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={5} />
                </Field>
                <Field label="Nouveau stop (optionnel)">
                  <input className="input num" name="stopChangedTo" />
                </Field>
              </div>
              <Field label="Motif du changement de stop" hint="obligatoire si tu élargis ton stop">
                <input className="input" name="stopChangeReason" />
              </Field>
              <Field label="Note"><textarea className="textarea" name="note" style={{ minHeight: 60 }} /></Field>
              <div><button className="btn" type="submit">Enregistrer la revue</button></div>
            </form>
          )}

          {reviews.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="label" style={{ marginBottom: 6 }}>Historique des revues</div>
              <table className="data">
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td className="mono muted" style={{ width: 100 }}>{r.date}</td>
                      <td style={{ width: 140 }}>
                        <Flag flag={r.thesisStatus === "invalidated" ? "red" : r.thesisStatus === "weakened" ? "amber" : "green"}>
                          {r.thesisStatus}
                        </Flag>
                      </td>
                      <td className="n" style={{ width: 70 }}>{r.confidence ?? "—"}/10</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{r.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {position.status === "open" && (
          <div className="grid-2">
            <Card title="Changer d'horizon">
              <Notice kind="warn">
                Une position swing perdante ne devient jamais un investissement long terme parce que le prix a baissé.
                Le changement est tracé, motivé, et inscrit au Journal.
              </Notice>
              <form action={changeHorizon} className="stack-sm" style={{ marginTop: 12 }}>
                <input type="hidden" name="positionId" value={position.id} />
                <input type="hidden" name="plPct" value={m.plPct ?? ""} />
                <Field label="Nouvel horizon">
                  <select className="select" name="toHorizon" defaultValue={position.horizon === "swing" ? "long_term" : "swing"}>
                    {HORIZONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </Field>
                <Field label="Motif" hint="obligatoire">
                  <textarea className="textarea" name="reason" required style={{ minHeight: 60 }} />
                </Field>
                <div><button className="btn btn-sm btn-ghost" type="submit">Changer consciemment d&apos;horizon</button></div>
              </form>
              {horizonLog.length > 0 && (
                <table className="data" style={{ marginTop: 12 }}>
                  <tbody>
                    {horizonLog.map((h) => (
                      <tr key={h.id}>
                        <td className="mono muted" style={{ width: 100 }}>{h.date}</td>
                        <td>{h.fromHorizon} → <strong>{h.toHorizon}</strong></td>
                        <td className="n">{h.plPctAtChange !== null ? `${fmt(h.plPctAtChange, 1)} %` : "—"}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{h.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Clôturer">
              <form action={closePosition} className="stack-sm">
                <input type="hidden" name="positionId" value={position.id} />
                <div className="grid-2">
                  <Field label="Date de sortie"><input className="input" type="date" name="closedAt" defaultValue={today()} /></Field>
                  <Field label="Prix de sortie"><input className="input num" name="exitPrice" required /></Field>
                </div>
                <div className="grid-2">
                  <Field label="Frais"><input className="input num" name="fees" /></Field>
                  <Field label="Motif de sortie">
                    <select className="select" name="exitReason" required defaultValue="">
                      <option value="" disabled>Choisir…</option>
                      <option value="invalidator">Invalidateur déclenché</option>
                      <option value="stop">Stop</option>
                      <option value="target">Cible atteinte</option>
                      <option value="event">Événement</option>
                      <option value="discretionary">Discrétionnaire</option>
                    </select>
                  </Field>
                </div>
                <div><button className="btn" type="submit">Clôturer et écrire au journal</button></div>
                <span className="hint">La clôture enchaîne directement sur l&apos;entrée de journal — elle est obligatoire.</span>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
