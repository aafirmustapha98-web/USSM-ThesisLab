import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Flag, Notice, Empty, SourceLink } from "@/components/ui";
import { WorkflowBar, LockedPanel } from "@/components/Workflow";
import { Findings } from "@/components/Findings";
import { getDossier, getPeerFilings } from "@/lib/queries";
import { saveValuationReading } from "@/app/actions";
import { COMPANY_BLOCKS, COMPARISON_METRICS, VALUATION_CONTEXT_METRICS, VALUATION_DIAGNOSTICS } from "@/config/company-blocks";
import { FINVIZ } from "@/config/macro-catalog";
import { fmt, fmtAge, diagnosticToFlag } from "@/lib/format";

export const dynamic = "force-dynamic";

const MULTIPLES = COMPANY_BLOCKS.find((b) => b.key === "valuation")!.fields;

export default async function ValuationPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const d = await getDossier(ticker);
  if (!d) notFound();
  const { company, filing, valuation, steps, valuations } = d;

  const peerTickers = valuation?.peers ?? [];
  const peers = peerTickers.length ? await getPeerFilings(peerTickers) : [];
  const median = (key: string) => {
    const vals = peers.map((p) => p.filing?.[key as keyof typeof p.filing] as number | null)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
    if (vals.length === 0) return null;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  };

  return (
    <>
      <PageHead
        title={`Valuation — ${company.ticker}`}
        sub={<>Excellente entreprise ≠ excellente action au prix actuel. Aucune saisie ici — <Link href={`/company/${company.ticker}`}>les chiffres viennent de la page Company</Link>. <SourceLink href={FINVIZ(company.ticker)}>Finviz</SourceLink></>}
        actions={<Link className="btn btn-ghost btn-sm" href={`/research/${company.ticker}`}>← Dossier</Link>}
      />

      <div className="stack">
        <Card title="Workflow"><WorkflowBar steps={steps} /></Card>
        <LockedPanel step={steps.find((s) => s.key === "valuation")!} />
        <Findings findings={d.findings} companyId={company.id} scopes={["valuation"]} />

        {!filing ? (
          <Notice kind="warn">
            Aucune donnée financière. <Link href={`/company/${company.ticker}`}>Saisis d&apos;abord une période →</Link>
          </Notice>
        ) : (
          <div className="grid-2">
            <Card title={`Multiples — ${filing.period}`}>
              <table className="data">
                <tbody>
                  {MULTIPLES.map((f) => (
                    <tr key={f.key}>
                      <td>{f.label}</td>
                      <td className="n">
                        {(() => {
                          const v = filing[f.key as keyof typeof filing] as number | null;
                          return typeof v === "number" ? `${fmt(v)} ${f.unit ?? ""}` : <span className="insufficient">Insufficient data</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Croissance & qualité — à regarder en face" >
              <table className="data">
                <tbody>
                  {VALUATION_CONTEXT_METRICS.map((f) => (
                    <tr key={f.key}>
                      <td>{f.label}</td>
                      <td className="n">
                        {(() => {
                          const v = filing[f.key as keyof typeof filing] as number | null;
                          return typeof v === "number" ? `${fmt(v)} ${f.unit ?? ""}` : <span className="insufficient">Insufficient data</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>FCF Yield (calculé)</td>
                    <td className="n">
                      {d.dmap.fcfYieldCalc.value === null
                        ? <span className="insufficient">Insufficient data</span>
                        : `${fmt(d.dmap.fcfYieldCalc.value)} %`}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="hint" style={{ marginBottom: 0 }}>
                La valorisation est-elle justifiée par la croissance et la qualité ?
              </p>
            </Card>
          </div>
        )}

        <Card title="Comparaison" right={<span className="hint">descriptive — aucune conclusion produite</span>}>
          {peers.length === 0 ? (
            <Empty>
              Aucun pair renseigné. Ajoute-les dans le formulaire de diagnostic ci-dessous (ex. <span className="mono">AMD, AVGO</span>) —
              ils doivent exister comme dossiers avec des données saisies.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th className="n">{company.ticker}</th>
                    {peers.map((p) => <th key={p.ticker} className="n">{p.ticker}</th>)}
                    <th className="n">Médiane pairs</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_METRICS.map((m) => (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      <td className="n">{fmt(filing?.[m.key as keyof typeof filing] as number | null)}</td>
                      {peers.map((p) => (
                        <td key={p.ticker} className="n">
                          {p.filing ? fmt(p.filing[m.key as keyof typeof p.filing] as number | null) : <span className="muted">—</span>}
                        </td>
                      ))}
                      <td className="n muted">{fmt(median(m.key))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Mon diagnostic"
          right={valuation ? <Flag flag={diagnosticToFlag(valuation.diagnostic)}>{valuation.diagnostic} · {fmtAge(valuation.date)}</Flag> : null}
        >
          <form action={saveValuationReading} className="stack-sm">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="filingId" value={filing?.id ?? ""} />
            <div className="grid-3">
              <Field label="La valorisation me paraît">
                <select className="select" name="diagnostic" required defaultValue={valuation?.diagnostic ?? ""}>
                  <option value="" disabled>Choisir…</option>
                  {VALUATION_DIAGNOSTICS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Pairs comparés" hint="tickers séparés par des virgules">
                <input className="input" name="peers" defaultValue={peerTickers.join(", ")} placeholder="AMD, AVGO" />
              </Field>
              <Field label="Confiance (1–10)">
                <input className="input num" type="number" min={1} max={10} name="confidence" defaultValue={valuation?.confidence ?? 5} />
              </Field>
            </div>
            <Field label="Pourquoi ?" hint="obligatoire">
              <textarea className="textarea" name="justification" required />
            </Field>
            <div><button className="btn" type="submit">Enregistrer mon diagnostic</button></div>
          </form>
        </Card>

        {valuations.length > 1 && (
          <Card title="Historique de mes diagnostics">
            <table className="data">
              <tbody>
                {valuations.map((v) => (
                  <tr key={v.id}>
                    <td style={{ width: 150 }}><Flag flag={diagnosticToFlag(v.diagnostic)}>{v.diagnostic}</Flag></td>
                    <td className="mono muted" style={{ width: 110 }}>{v.date}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{v.justification}</td>
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
