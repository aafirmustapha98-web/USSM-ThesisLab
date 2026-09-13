import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Notice, SourceLink, Empty } from "@/components/ui";
import { WorkflowBar, LockedPanel } from "@/components/Workflow";
import { Findings } from "@/components/Findings";
import { getDossier } from "@/lib/queries";
import { saveFiling, saveCompanyReading, savePrice } from "@/app/actions";
import { COMPANY_BLOCKS, FLAG_OPTIONS } from "@/config/company-blocks";
import { FINVIZ } from "@/config/macro-catalog";
import { fmt, fmtAge, today } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const d = await getDossier(ticker);
  if (!d) notFound();
  const { company, filing, prevFiling, derived, companyReading, steps, filings } = d;

  return (
    <>
      <PageHead
        title={`Company — ${company.ticker}`}
        sub={<>{company.name} · {company.sector ?? "secteur à renseigner"} · <SourceLink href={FINVIZ(company.ticker)}>Finviz</SourceLink></>}
        actions={<Link className="btn btn-ghost btn-sm" href={`/research/${company.ticker}`}>← Dossier</Link>}
      />

      <div className="stack">
        <Card title="Workflow"><WorkflowBar steps={steps} /></Card>
        <LockedPanel step={steps.find((s) => s.key === "fundamentals")!} />
        <Findings findings={d.findings} companyId={company.id} scopes={["company"]} />

        <form action={saveFiling}>
          <input type="hidden" name="companyId" value={company.id} />
          <Card
            title="Données financières"
            right={
              <span className="hint">
                Saisie manuelle depuis Finviz · {filings.length} période(s) enregistrée(s)
              </span>
            }
            footer={
              <div className="card-pad" style={{ borderTop: "1px solid var(--line-2)" }}>
                <button className="btn" type="submit">Enregistrer la période</button>
              </div>
            }
          >
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <Field label="Période fiscale" hint="jamais une simple date de saisie">
                <input className="input" name="period" required defaultValue={filing?.period ?? ""} placeholder="2026-Q2" />
              </Field>
              <Field label="Date de publication">
                <input className="input" type="date" name="publishedAt" defaultValue={filing?.publishedAt ?? ""} />
              </Field>
              <Field label="URL source">
                <input className="input" name="sourceUrl" defaultValue={filing?.sourceUrl ?? FINVIZ(company.ticker)} />
              </Field>
            </div>

            <div className="stack">
              {COMPANY_BLOCKS.map((block) => (
                <details className="acc" key={block.key} open={block.key === "basic" || block.key === "growth"}>
                  <summary>{block.label}</summary>
                  <div className="acc-body">
                    {block.question && <p className="hint" style={{ marginTop: 0 }}>{block.question}</p>}
                    <div className="grid-4">
                      {block.fields.map((f) => (
                        <Field key={f.key} label={<>{f.label} {f.unit && <span className="muted">({f.unit})</span>}</>}>
                          <input
                            className="input num" name={f.key} inputMode="decimal"
                            defaultValue={(filing?.[f.key as keyof typeof filing] as number | null) ?? ""}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </Card>
        </form>

        <Card
          title="Calculs automatiques"
          right={<span className="hint">formule et données utilisées affichées — aucune valeur inventée</span>}
        >
          {!filing ? <Empty>Saisis une période pour voir les calculs.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr><th>Métrique</th><th className="n">Valeur</th><th>Formule</th><th>Données utilisées</th></tr>
                </thead>
                <tbody>
                  {derived.map((m) => (
                    <tr key={m.key}>
                      <td style={{ fontWeight: 550 }}>{m.label}</td>
                      <td className="n">
                        {m.value === null
                          ? <span className="insufficient">Insufficient data</span>
                          : <>{fmt(m.value)} {m.unit && <span className="muted">{m.unit}</span>}</>}
                      </td>
                      <td className="muted mono" style={{ fontSize: 11.5 }}>{m.formula}</td>
                      <td className="muted" style={{ fontSize: 11.5 }}>
                        {m.missing.length > 0
                          ? <span style={{ color: "var(--amber)" }}>manque : {m.missing.join(", ")}</span>
                          : m.inputs.map((i) => `${i.label} = ${fmt(i.value)}`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!prevFiling && filing && (
            <Notice kind="warn">
              Une seule période enregistrée : les croissances et variations de marge restent en <em>Insufficient data</em>.
              Saisis la période précédente pour les débloquer.
            </Notice>
          )}
        </Card>

        <Card
          title="My interpretation"
          right={companyReading ? <span className="hint">dernière : {fmtAge(companyReading.date)}</span> : <span className="hint">obligatoire — porte G2</span>}
        >
          <form action={saveCompanyReading} className="stack-sm">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="filingId" value={filing?.id ?? ""} />
            <Field label="Croissance — est-ce que l'entreprise croît réellement ? D'où vient cette croissance ?">
              <textarea className="textarea" name="growthInterpretation" required />
            </Field>
            <Field label="Rentabilité — les marges progressent-elles ? Le capital est-il bien employé ?">
              <textarea className="textarea" name="profitabilityInterpretation" required />
            </Field>
            <Field label="Solidité & liquidité — l'entreprise peut-elle supporter une période difficile ?">
              <textarea className="textarea" name="strengthInterpretation" required />
            </Field>
            <div className="grid-4">
              {([["qualityFlag", "Qualité"], ["growthFlag", "Croissance"], ["strengthFlag", "Solidité"]] as const).map(([k, label]) => (
                <Field key={k} label={label}>
                  <select className="select" name={k} required defaultValue={(companyReading?.[k] as string) ?? ""}>
                    <option value="" disabled>Choisir…</option>
                    {FLAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              ))}
              <Field label="Confiance (1–10)">
                <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={companyReading?.confidence ?? 5} />
              </Field>
            </div>
            <div><button className="btn" type="submit">Enregistrer mon interprétation</button></div>
          </form>
          {companyReading && (
            <div className="row" style={{ marginTop: 14 }}>
              <Flag flag={companyReading.qualityFlag}>Qualité</Flag>
              <Flag flag={companyReading.growthFlag}>Croissance</Flag>
              <Flag flag={companyReading.strengthFlag}>Solidité</Flag>
            </div>
          )}
        </Card>

        <Card title="Prix courant" right={d.price ? <span className="hint">{fmt(d.price.price)} · {fmtAge(d.price.at)}</span> : null}>
          <form action={savePrice} className="row">
            <input type="hidden" name="companyId" value={company.id} />
            <input className="input num" name="price" inputMode="decimal" placeholder="Prix" style={{ maxWidth: 160 }} required />
            <button className="btn btn-sm" type="submit">Enregistrer</button>
            <span className="hint">Saisi à la main et horodaté. Tout P/L affiche l&apos;âge du prix utilisé.</span>
          </form>
        </Card>

        {filings.length > 1 && (
          <Card title="Périodes enregistrées">
            <table className="data">
              <thead><tr><th>Période</th><th className="n">Revenue</th><th className="n">EPS</th><th className="n">FCF</th><th className="n">Saisie</th></tr></thead>
              <tbody>
                {filings.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 550 }}>{f.period}</td>
                    <td className="n">{fmt(f.revenue)}</td>
                    <td className="n">{fmt(f.eps)}</td>
                    <td className="n">{fmt(f.fcf)}</td>
                    <td className="n muted">{fmtAge(f.enteredAt)}</td>
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
