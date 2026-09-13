import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Notice, Empty, Confidence } from "@/components/ui";
import { WorkflowBar, LockedPanel } from "@/components/Workflow";
import { Findings } from "@/components/Findings";
import { getDossier, listEvents } from "@/lib/queries";
import {
  saveThesis, addInvalidator, deleteInvalidator, addObjection,
  resolveObjection, setPostChallengeConfidence, saveSetup,
} from "@/app/actions";
import { HORIZONS, OBJECTION_CATEGORIES } from "@/config/company-blocks";
import { fmt, fmtAge, today } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ThesisPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const d = await getDossier(ticker);
  if (!d) notFound();
  const { company, thesis, theses, invalidators, objections, runs, steps, setup, tradeMath, sectorReading } = d;
  const events = await listEvents();

  const thesisStep = steps.find((s) => s.key === "thesis")!;
  const challengeStep = steps.find((s) => s.key === "challenge")!;
  const timingStep = steps.find((s) => s.key === "timing")!;
  const openObjections = objections.filter((o) => o.status === "open");
  const latestRun = runs[0] ?? null;
  const isLongTerm = thesis?.horizon === "long_term";

  return (
    <>
      <PageHead
        title={`Thesis — ${company.ticker}`}
        sub={thesis ? <>version {thesis.version} · {thesis.status} · horizon {thesis.horizon === "swing" ? "Swing" : "Long term"}</> : "Aucune thèse encore rédigée"}
        actions={<Link className="btn btn-ghost btn-sm" href={`/research/${company.ticker}`}>← Dossier</Link>}
      />

      <div className="stack">
        <Card title="Workflow"><WorkflowBar steps={steps} /></Card>
        <LockedPanel step={thesisStep} />
        <Findings findings={d.findings} companyId={company.id} scopes={["thesis"]} />

        {thesis && (
          <Card
            title={`Thèse v${thesis.version}`}
            right={<div className="row"><Confidence value={thesis.confidence} />
              {typeof thesis.confidencePostChallenge === "number" &&
                <span className="chip">post-challenge {thesis.confidencePostChallenge}/10</span>}</div>}
          >
            <div className="stack-sm">
              <div><span className="label">Why</span><div>{thesis.why}</div></div>
              <div><span className="label">Bull case</span><div>{thesis.bullCase}</div></div>
              <div><span className="label">Bear case (pre-mortem, écrit avant le challenge)</span><div>{thesis.bearCase}</div></div>
              <div className="grid-3">
                <div><span className="label">Catalyseurs</span>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>{(thesis.catalysts ?? []).map((c) => <li key={c}>{c}</li>)}</ul></div>
                <div><span className="label">Risques</span>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>{(thesis.risks ?? []).map((c) => <li key={c}>{c}</li>)}</ul></div>
                <div><span className="label">Ce que je ne sais pas</span>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>{(thesis.uncertainties ?? []).map((c) => <li key={c}>{c}</li>)}</ul></div>
              </div>
              {thesis.revisionReason && (
                <Notice kind="info"><strong>Motif de révision :</strong> {thesis.revisionReason}</Notice>
              )}
            </div>
          </Card>
        )}

        <Card title="Invalidation — structurée et falsifiable" right={<span className="hint">porte G4 : au moins un invalidateur mesurable</span>}>
          {!thesis ? <Empty>Rédige d&apos;abord une thèse.</Empty> : (
            <>
              {invalidators.length === 0 ? (
                <Notice kind="warn">
                  Aucun invalidateur. « Si la croissance ralentit » n&apos;est ni observable ni datable —
                  écris une condition mesurable.
                </Notice>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead><tr><th>Libellé</th><th>Condition</th><th>Persistance</th><th>Horizon</th><th>État</th><th /></tr></thead>
                    <tbody>
                      {invalidators.map((i) => (
                        <tr key={i.id}>
                          <td style={{ fontWeight: 550 }}>{i.label}</td>
                          <td className="mono muted">
                            {i.metric ? `${i.metric} ${i.operator ?? ""} ${i.threshold ?? ""} ${i.unit ?? ""}`
                              : <span style={{ color: "var(--amber)" }}>non mesurable</span>}
                          </td>
                          <td className="muted">{i.persistence ?? "—"}</td>
                          <td className="muted mono">{i.horizonDate ?? "—"}</td>
                          <td>
                            <Flag flag={i.status === "occurred" ? "red" : i.status === "unknown" ? "amber" : "green"}>
                              {i.status === "occurred" ? "survenu" : i.status === "unknown" ? "je ne sais pas" : "non survenu"}
                            </Flag>
                          </td>
                          <td style={{ width: 40 }}>
                            <form action={deleteInvalidator}>
                              <input type="hidden" name="invalidatorId" value={i.id} />
                              <button className="btn btn-ghost btn-sm" type="submit" title="Supprimer">×</button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <form action={addInvalidator} className="stack-sm" style={{ marginTop: 14 }}>
                <input type="hidden" name="thesisId" value={thesis.id} />
                <div className="grid-4">
                  <Field label="Libellé"><input className="input" name="label" required placeholder="Érosion des marges" /></Field>
                  <Field label="Métrique"><input className="input" name="metric" placeholder="grossMargin" /></Field>
                  <Field label="Opérateur">
                    <select className="select" name="operator" defaultValue="<">
                      <option value="<">{"<"}</option><option value=">">{">"}</option>
                      <option value="<=">{"≤"}</option><option value=">=">{"≥"}</option>
                    </select>
                  </Field>
                  <Field label="Seuil"><input className="input num" name="threshold" inputMode="decimal" placeholder="70" /></Field>
                </div>
                <div className="grid-4">
                  <Field label="Unité"><input className="input" name="unit" placeholder="%" /></Field>
                  <Field label="Persistance"><input className="input" name="persistence" placeholder="2 trimestres consécutifs" /></Field>
                  <Field label="Horizon"><input className="input" type="date" name="horizonDate" /></Field>
                  <Field label="Source">
                    <select className="select" name="source" defaultValue="finviz">
                      <option value="finviz">Finviz</option>
                      <option value="trading_economics">Trading Economics</option>
                      <option value="prix">Prix</option>
                      <option value="observation">Observation</option>
                    </select>
                  </Field>
                </div>
                <div><button className="btn btn-sm" type="submit">Ajouter l&apos;invalidateur</button></div>
              </form>
            </>
          )}
        </Card>

        <Card
          title={thesis ? `Rédiger la version ${thesis.version + 1}` : "Rédiger la thèse"}
          right={<span className="hint">la thèse est immuable — toute modification crée une version</span>}
        >
          <Notice kind="info">
            Le bear case s&apos;écrit <strong>avant</strong> le challenge, et par toi : 200 caractères minimum.
            « Nous sommes dans 6 mois, le titre a perdu 30 %. Que s&apos;est-il passé ? »
          </Notice>
          <form action={saveThesis} className="stack-sm" style={{ marginTop: 14 }}>
            <input type="hidden" name="companyId" value={company.id} />
            <div className="grid-3">
              <Field label="Direction">
                <select className="select" name="direction" required defaultValue={thesis?.direction ?? "long"}>
                  <option value="long">Long</option>
                  <option value="no_interest">Pas d&apos;intérêt</option>
                  <option value="avoid">À éviter</option>
                </select>
              </Field>
              <Field label="Horizon" hint="choisi consciemment, jamais par défaut">
                <select className="select" name="horizon" required defaultValue={thesis?.horizon ?? "swing"}>
                  {HORIZONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </Field>
              <Field label="Confiance (1–10)">
                <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={thesis?.confidence ?? 5} required />
              </Field>
            </div>
            <Field label="Why — pourquoi est-ce que j'envisage cette action ?">
              <textarea className="textarea" name="why" required defaultValue={thesis?.why ?? ""} />
            </Field>
            <Field label="Bull case — que faut-il pour que mon scénario se réalise ?">
              <textarea className="textarea" name="bullCase" required defaultValue={thesis?.bullCase ?? ""} />
            </Field>
            <Field label="Bear case — le pre-mortem, écrit par moi" hint="200 caractères minimum (porte G4)">
              <textarea className="textarea" name="bearCase" required minLength={200} style={{ minHeight: 110 }} defaultValue={thesis?.bearCase ?? ""} />
            </Field>
            <div className="grid-3">
              <Field label="Catalyseurs" hint="un par ligne">
                <textarea className="textarea" name="catalysts" defaultValue={(thesis?.catalysts ?? []).join("\n")} />
              </Field>
              <Field label="Risques" hint={sectorReading && (sectorReading.risks ?? []).length ? `secteur : ${(sectorReading.risks ?? []).join(" · ")}` : "un par ligne"}>
                <textarea className="textarea" name="risks" defaultValue={(thesis?.risks ?? (sectorReading?.risks ?? [])).join("\n")} />
              </Field>
              <Field label="Ce que je ne sais pas" hint="une incertitude par ligne">
                <textarea className="textarea" name="uncertainties" defaultValue={(thesis?.uncertainties ?? []).join("\n")} />
              </Field>
            </div>
            {thesis && (
              <Field label="Motif de la révision" hint="obligatoire — c'est ce qui rend visible une thèse qui mute">
                <input className="input" name="revisionReason" required />
              </Field>
            )}
            <div><button className="btn" type="submit">{thesis ? `Créer la version ${thesis.version + 1}` : "Créer la thèse"}</button></div>
          </form>
        </Card>

        {/* ------------------------------ challenge ------------------------------ */}
        <Card
          title="🥊 Challenge my thesis"
          right={<span className="hint">{runs.length} session(s) · {openObjections.length} objection(s) ouverte(s)</span>}
        >
          <LockedPanel step={challengeStep} />
          <Notice kind="info" >
            <strong>V1 : le modèle n&apos;est pas encore branché.</strong> La mécanique complète est en place —
            saisis les objections toi-même (avocat du diable) ou plus tard depuis le modèle : la boucle de résolution est
            identique et le schéma ne changera pas. Une objection <em>critique</em> laissée ouverte verrouille le Timing.
          </Notice>

          {!thesis ? <Empty>Rédige d&apos;abord une thèse.</Empty> : (
            <>
              {objections.length > 0 && (
                <div className="stack-sm" style={{ marginTop: 14 }}>
                  {objections.map((o) => (
                    <div key={o.id} className={`notice ${o.status === "open" ? (o.severity === "critical" ? "notice-block" : "notice-warn") : "notice-ok"}`}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                        <strong style={{ fontSize: 12.5 }}>
                          {OBJECTION_CATEGORIES.find((c) => c.value === o.category)?.label ?? o.category}
                          {" · "}<span className="mono">{o.severity}</span>
                        </strong>
                        <span className="chip">{o.status === "open" ? "à trancher" : o.status === "accepted" ? "acceptée" : "réfutée"}</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>{o.text}</div>
                      {o.userResponse && <div className="hint" style={{ marginBottom: 8 }}>Ma réponse : {o.userResponse}</div>}
                      {o.status === "open" && (
                        <form action={resolveObjection} className="stack-sm">
                          <input type="hidden" name="objectionId" value={o.id} />
                          <div className="row">
                            <input className="input" name="userResponse" placeholder="Ma réponse — obligatoire pour réfuter" style={{ flex: 1, minWidth: 240 }} />
                            <select className="select" name="status" defaultValue="refuted" style={{ maxWidth: 160 }}>
                              <option value="refuted">Je réfute</option>
                              <option value="accepted">J&apos;accepte</option>
                            </select>
                            <button className="btn btn-sm" type="submit">Trancher</button>
                          </div>
                          <span className="hint">
                            En acceptant, crée ensuite une nouvelle version de thèse — c&apos;est la boucle de résolution.
                          </span>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <details className="acc" style={{ marginTop: 14 }} open={objections.length === 0}>
                <summary>Ajouter une objection</summary>
                <div className="acc-body">
                  <form action={addObjection} className="stack-sm">
                    <input type="hidden" name="thesisId" value={thesis.id} />
                    <input type="hidden" name="challengeRunId" value={latestRun?.id ?? ""} />
                    <div className="grid-2">
                      <Field label="Axe de challenge">
                        <select className="select" name="category" required defaultValue="">
                          <option value="" disabled>Choisir…</option>
                          {OBJECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Sévérité">
                        <select className="select" name="severity" defaultValue="major">
                          <option value="critical">Critique — verrouille le Timing</option>
                          <option value="major">Majeure</option>
                          <option value="minor">Mineure</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="L'objection"><textarea className="textarea" name="text" required /></Field>
                    <div><button className="btn btn-sm" type="submit">Ajouter</button></div>
                  </form>
                </div>
              </details>

              {objections.length > 0 && openObjections.length === 0 && (
                <form action={setPostChallengeConfidence} className="row" style={{ marginTop: 14 }}>
                  <input type="hidden" name="thesisId" value={thesis.id} />
                  <Field label="Confiance après le challenge (1–10)">
                    <input className="input num" type="number" min={1} max={10} name="confidencePostChallenge"
                      defaultValue={thesis.confidencePostChallenge ?? thesis.confidence} style={{ maxWidth: 120 }} />
                  </Field>
                  <button className="btn btn-sm" type="submit" style={{ marginTop: 18 }}>Enregistrer</button>
                  <span className="hint" style={{ marginTop: 18 }}>
                    Si elle ne bouge jamais après un challenge, c&apos;est un biais mesurable — suivi dans le Journal.
                  </span>
                </form>
              )}
            </>
          )}
        </Card>

        {/* -------------------------------- timing -------------------------------- */}
        <div id="timing" />
        <Card
          title="⏱️ Timing & position sizing"
          right={isLongTerm ? <span className="chip">optionnel en long terme</span> : null}
        >
          <LockedPanel step={timingStep} />
          <Findings findings={d.findings} companyId={company.id} scopes={["timing", "portfolio"]} />

          {challengeStep.done || isLongTerm ? (
            <>
              <form action={saveSetup} className="stack-sm" style={{ marginTop: 14 }}>
                <input type="hidden" name="companyId" value={company.id} />
                <div className="grid-4">
                  <Field label="Trend">
                    <select className="select" name="trend" defaultValue={setup?.trend ?? ""}>
                      <option value="">—</option><option value="up">Up</option>
                      <option value="sideways">Sideways</option><option value="down">Down</option>
                    </select>
                  </Field>
                  <Field label="Support"><input className="input num" name="support" defaultValue={setup?.support ?? ""} /></Field>
                  <Field label="Resistance"><input className="input num" name="resistance" defaultValue={setup?.resistance ?? ""} /></Field>
                  <Field label="Horizon (jours)"><input className="input num" name="horizonDays" defaultValue={setup?.horizonDays ?? ""} /></Field>
                </div>
                <div className="grid-4">
                  <Field label="Entry"><input className="input num" name="entry" defaultValue={setup?.entry ?? ""} /></Field>
                  <Field label="Stop"><input className="input num" name="stop" defaultValue={setup?.stop ?? ""} /></Field>
                  <Field label="Target"><input className="input num" name="target" defaultValue={setup?.target ?? ""} /></Field>
                  <Field label="Maximum acceptable loss" hint="mon niveau de risque, jamais imposé">
                    <input className="input num" name="maxLoss" defaultValue={setup?.maxLoss ?? ""} />
                  </Field>
                </div>
                <Field label="Event risk">
                  <label className="row" style={{ gap: 6, fontSize: 13 }}>
                    <input type="checkbox" name="eventRiskReviewed" defaultChecked={!!setup?.eventRiskReviewed} />
                    J&apos;ai revu les événements tombant pendant mon horizon
                  </label>
                </Field>
                {d.eventsInHorizon.length > 0 && (
                  <Notice kind="warn">
                    ⚠️ Major event during planned holding period —{" "}
                    {d.eventsInHorizon.map((e) => `${e.label} (${e.date})`).join(", ")}
                  </Notice>
                )}
                <Field label="Note event risk"><input className="input" name="eventRiskNote" defaultValue={setup?.eventRiskNote ?? ""} /></Field>
                <Field label="Notes"><textarea className="textarea" name="notes" style={{ minHeight: 60 }} defaultValue={setup?.notes ?? ""} /></Field>
                <div><button className="btn" type="submit">Enregistrer le setup</button></div>
              </form>

              <div style={{ marginTop: 18 }}>
                <div className="label" style={{ marginBottom: 6 }}>Calculs</div>
                <div className="table-wrap">
                  <table className="data">
                    <tbody>
                      <tr><td>Risk per share</td><td className="n">{fmt(tradeMath.riskPerShare)}</td><td className="muted mono" style={{ fontSize: 11.5 }}>Entry − Stop</td></tr>
                      <tr><td>Reward per share</td><td className="n">{fmt(tradeMath.rewardPerShare)}</td><td className="muted mono" style={{ fontSize: 11.5 }}>Target − Entry</td></tr>
                      <tr><td>Risk / Reward</td><td className="n"><strong>{fmt(tradeMath.riskReward)}</strong></td><td className="muted mono" style={{ fontSize: 11.5 }}>Reward ÷ Risk</td></tr>
                      <tr><td>Position size</td><td className="n">{tradeMath.shares ?? "—"} actions</td><td className="muted mono" style={{ fontSize: 11.5 }}>Maximum Loss ÷ Risk per Share</td></tr>
                      <tr><td>Position value</td><td className="n">{fmt(tradeMath.positionValue)}</td><td /></tr>
                      <tr><td>Maximum loss</td><td className="n">{fmt(tradeMath.maximumLoss)}</td><td /></tr>
                      <tr><td>Potential gain</td><td className="n">{fmt(tradeMath.potentialGain)}</td><td /></tr>
                      <tr><td>Stop distance</td><td className="n">{fmt(tradeMath.stopPct)} %</td><td /></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <Empty>Le Timing s&apos;ouvre après le challenge. C&apos;est volontaire : le setup ne doit pas influencer la thèse.</Empty>
          )}
        </Card>

        {theses.length > 1 && (
          <Card title="Versions de la thèse">
            <table className="data">
              <thead><tr><th>v</th><th>Date</th><th>Horizon</th><th className="n">Confiance</th><th>Motif de révision</th><th>Statut</th></tr></thead>
              <tbody>
                {theses.map((t) => (
                  <tr key={t.id}>
                    <td className="num" style={{ width: 40 }}>v{t.version}</td>
                    <td className="mono muted" style={{ width: 110 }}>{t.createdAt?.slice(0, 10)}</td>
                    <td className="muted">{t.horizon}</td>
                    <td className="n">{t.confidence}/10{t.confidencePostChallenge ? ` → ${t.confidencePostChallenge}` : ""}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{t.revisionReason ?? "—"}</td>
                    <td><span className="chip">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {events.length > 0 && (
          <Card title="Calendrier enregistré" right={<Link className="src-link" href="/settings#events">Gérer</Link>}>
            <table className="data">
              <tbody>
                {events.slice(0, 10).map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 550, width: 120 }}>{e.type.toUpperCase()}</td>
                    <td className="muted">{e.scope === "ticker" ? e.target : e.note ?? e.scope}</td>
                    <td className="n mono" style={{ width: 110 }}>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
