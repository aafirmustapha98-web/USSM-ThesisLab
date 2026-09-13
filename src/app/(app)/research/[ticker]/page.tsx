import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Empty, Notice, Confidence } from "@/components/ui";
import { WorkflowBar } from "@/components/Workflow";
import { Findings } from "@/components/Findings";
import { getDossier } from "@/lib/queries";
import { updateCompany, saveSectorReading, saveDecision, openPosition } from "@/app/actions";
import { SECTOR_FIELDS, DECISION_OPTIONS, HORIZONS, IDEA_ORIGINS, FLAG_OPTIONS } from "@/config/company-blocks";
import { fmt, fmtAge, today, diagnosticToFlag } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TickerOverview({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const d = await getDossier(ticker);
  if (!d) notFound();

  const { company, sectorReading, macro, market, thesis, valuation, companyReading, setup, steps } = d;
  const counts = macro.core.reduce(
    (acc, c) => {
      const f = diagnosticToFlag(c.reading?.diagnostic);
      acc[f] = (acc[f] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const diagRows: { label: string; flag: string; detail: string }[] = [
    { label: "Quality", flag: companyReading?.qualityFlag ?? "grey", detail: companyReading ? "mon diagnostic" : "non renseigné" },
    { label: "Growth", flag: companyReading?.growthFlag ?? "grey", detail: companyReading ? "mon diagnostic" : "non renseigné" },
    { label: "Fundamentals", flag: companyReading?.strengthFlag ?? "grey", detail: companyReading ? "solidité financière" : "non renseigné" },
    { label: "Valuation", flag: diagnosticToFlag(valuation?.diagnostic), detail: valuation?.diagnostic ?? "non renseigné" },
    { label: "Sector", flag: diagnosticToFlag(sectorReading?.tailwind), detail: sectorReading?.tailwind ?? "non renseigné" },
    { label: "Market", flag: diagnosticToFlag(market?.diagnostic), detail: market?.diagnostic ?? "non renseigné" },
    {
      label: "Timing",
      flag: setup?.trend === "up" ? "green" : setup?.trend === "sideways" ? "amber" : setup?.trend === "down" ? "red" : "grey",
      detail: setup?.trend ?? "non renseigné",
    },
  ];

  const canOpen =
    steps.find((s) => s.key === "challenge")?.done &&
    (thesis?.horizon === "long_term" || steps.find((s) => s.key === "timing")?.done);

  return (
    <>
      <PageHead
        title={`${company.ticker} — ${company.name}`}
        sub={<>{company.sector ?? "secteur à renseigner"} · {company.industry ?? "industrie à renseigner"} · idée : {IDEA_ORIGINS.find((o) => o.value === company.ideaOrigin)?.label}</>}
        actions={
          <div className="row">
            <Link className="btn btn-ghost btn-sm" href={`/company/${company.ticker}`}>Company</Link>
            <Link className="btn btn-ghost btn-sm" href={`/valuation/${company.ticker}`}>Valuation</Link>
            <Link className="btn btn-ghost btn-sm" href={`/thesis/${company.ticker}`}>Thesis</Link>
          </div>
        }
      />

      <div className="stack">
        <Card title="Workflow"><WorkflowBar steps={steps} /></Card>

        <Card
          title="Diagnostic — d'après mes propres lectures"
          right={<span className="hint">aucune de ces couleurs n&apos;est calculée</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {diagRows.map((r) => (
                  <tr key={r.label}>
                    <td style={{ width: 150, fontWeight: 550 }}>{r.label}</td>
                    <td style={{ width: 140 }}><Flag flag={r.flag}>{FLAG_OPTIONS.find((f) => f.value === r.flag)?.label.slice(2) ?? "—"}</Flag></td>
                    <td className="muted">{r.detail}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 550 }}>Macro (noyau)</td>
                  <td colSpan={2}>
                    <span className="row" style={{ gap: 8 }}>
                      <span className="num">{counts.green ?? 0} 🟢</span>
                      <span className="num">{counts.amber ?? 0} 🟡</span>
                      <span className="num">{counts.red ?? 0} 🔴</span>
                      {counts.grey ? <span className="num muted">{counts.grey} non renseignée(s)</span> : null}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Notice kind="info">
            <strong>Good company ≠ good trade.</strong> L&apos;application n&apos;écrit pas de conclusion à partir de ce tableau.
            Elle affiche la tension : c&apos;est à toi d&apos;en tirer une décision, plus bas, avec sa justification.
          </Notice>
        </Card>

        <Findings findings={d.findings} companyId={company.id} />

        <details className="acc" open={!company.sector || !company.industry}>
          <summary>Identité du dossier</summary>
          <div className="acc-body">
            <form action={updateCompany} className="stack-sm">
              <input type="hidden" name="companyId" value={company.id} />
              <div className="grid-4">
                <Field label="Nom"><input className="input" name="name" defaultValue={company.name} /></Field>
                <Field label="Secteur"><input className="input" name="sector" defaultValue={company.sector ?? ""} required /></Field>
                <Field label="Industrie"><input className="input" name="industry" defaultValue={company.industry ?? ""} required /></Field>
                <Field label="Statut">
                  <select className="select" name="status" defaultValue={company.status}>
                    {["idee", "recherche", "watchlist", "position", "cloture", "ecarte", "archive"].map((s) =>
                      <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div><button className="btn btn-sm" type="submit">Enregistrer</button></div>
            </form>
          </div>
        </details>

        <Card
          title={`Sector analysis${company.sector ? ` — ${company.sector}` : ""}`}
          right={sectorReading ? <span className="hint">dernière : {fmtAge(sectorReading.date)}</span> : null}
        >
          {!company.sector ? (
            <Empty>Renseigne d&apos;abord le secteur du dossier ci-dessus.</Empty>
          ) : (
            <>
              {sectorReading && (
                <div className="row" style={{ marginBottom: 14 }}>
                  <Flag flag={diagnosticToFlag(sectorReading.tailwind)}>
                    Vent {sectorReading.tailwind}
                  </Flag>
                  <span className="chip">{sectorReading.cycle}</span>
                  <span className="chip">demande {sectorReading.demand}</span>
                  <span className="chip">pricing power {sectorReading.pricingPower}</span>
                  <Confidence value={sectorReading.confidence} />
                </div>
              )}
              <form action={saveSectorReading} className="stack-sm">
                <input type="hidden" name="sector" value={company.sector} />
                <input type="hidden" name="industry" value={company.industry ?? ""} />
                <input type="hidden" name="date" value={today()} />
                <div className="grid-4">
                  {(["cycle", "demand", "pricingPower", "capex"] as const).map((k) => (
                    <Field key={k} label={k === "pricingPower" ? "Pricing power" : k === "capex" ? "Capex" : k === "cycle" ? "Cycle" : "Demande"}>
                      <select className="select" name={k} defaultValue={(sectorReading?.[k] as string) ?? ""}>
                        <option value="">—</option>
                        {SECTOR_FIELDS[k].map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                  ))}
                </div>
                <div className="grid-2">
                  <Field label="Concurrence"><input className="input" name="competition" defaultValue={sectorReading?.competition ?? ""} /></Field>
                  <Field label="Régulation"><input className="input" name="regulation" defaultValue={sectorReading?.regulation ?? ""} /></Field>
                </div>
                <div className="grid-2">
                  <Field label="Catalyseurs" hint="un par ligne">
                    <textarea className="textarea" name="catalysts" defaultValue={(sectorReading?.catalysts ?? []).join("\n")} />
                  </Field>
                  <Field label="Risques" hint="un par ligne — réutilisables dans la thèse">
                    <textarea className="textarea" name="risks" defaultValue={(sectorReading?.risks ?? []).join("\n")} />
                  </Field>
                </div>
                <div className="grid-2">
                  <Field label="Le secteur est-il un vent favorable ou défavorable ?">
                    <select className="select" name="tailwind" required defaultValue={sectorReading?.tailwind ?? ""}>
                      <option value="" disabled>Choisir…</option>
                      <option value="favorable">Favorable</option>
                      <option value="neutre">Neutre</option>
                      <option value="defavorable">Défavorable</option>
                    </select>
                  </Field>
                  <Field label="Confiance (1–10)">
                    <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={sectorReading?.confidence ?? 5} />
                  </Field>
                </div>
                <Field label="Pourquoi ? À quelle phase du cycle sommes-nous ?">
                  <textarea className="textarea" name="justification" required defaultValue="" />
                </Field>
                <div><button className="btn" type="submit">Enregistrer la fiche secteur</button></div>
              </form>
            </>
          )}
        </Card>

        <Card title="Decision" right={d.decision ? <span className="chip">dernière : {d.decision.decision} · {d.decision.date}</span> : null} >
          <div id="decision" />
          <Notice kind="info">
            L&apos;application n&apos;affiche jamais de BUY/SELL. Tu choisis, et la justification est obligatoire.
            Chaque décision gèle un instantané de tout le dossier — c&apos;est lui que le Journal relira.
          </Notice>
          <form action={saveDecision} className="stack-sm" style={{ marginTop: 14 }}>
            <input type="hidden" name="ticker" value={company.ticker} />
            <div className="grid-2">
              <Field label="Ma décision">
                <select className="select" name="decision" required defaultValue="">
                  <option value="" disabled>Choisir…</option>
                  {DECISION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Horizon choisi consciemment">
                <select className="select" name="horizon" defaultValue={thesis?.horizon ?? "swing"}>
                  {HORIZONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Why ?" hint="obligatoire">
              <textarea className="textarea" name="why" required />
            </Field>
            <div><button className="btn" type="submit">Enregistrer la décision</button></div>
          </form>

          {d.decisions.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="label" style={{ marginBottom: 6 }}>Historique</div>
              <table className="data">
                <tbody>
                  {d.decisions.map((dec) => (
                    <tr key={dec.id}>
                      <td style={{ width: 110 }}><span className="chip">{dec.decision}</span></td>
                      <td className="mono muted" style={{ width: 100 }}>{dec.date}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{dec.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Ouvrir une position">
          {!canOpen ? (
            <div className="notice notice-block">
              🔒 Porte G6 fermée. Il faut une thèse challengée (objections tranchées, confiance post-challenge saisie)
              {thesis?.horizon === "long_term" ? "" : " et un timing complet sans contrôle bloquant"}.
            </div>
          ) : (
            <form action={openPosition} className="stack-sm">
              <input type="hidden" name="ticker" value={company.ticker} />
              <div className="grid-4">
                <Field label="Date"><input className="input" type="date" name="openedAt" defaultValue={today()} /></Field>
                <Field label="Entrée"><input className="input num" name="entry" defaultValue={setup?.entry ?? ""} /></Field>
                <Field label="Stop"><input className="input num" name="stop" defaultValue={setup?.stop ?? ""} /></Field>
                <Field label="Actions"><input className="input num" name="shares" defaultValue={d.tradeMath.shares ?? ""} /></Field>
              </div>
              <div className="hint">
                Taille calculée depuis ta perte maximale acceptable : {d.tradeMath.shares ?? "—"} actions
                {d.tradeMath.maximumLoss !== null && <> · perte max {fmt(d.tradeMath.maximumLoss)}</>}
              </div>
              <div><button className="btn" type="submit">Ouvrir la position (gèle un instantané)</button></div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
