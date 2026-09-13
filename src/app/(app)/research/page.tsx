import Link from "next/link";
import { Card, Field, PageHead, Empty } from "@/components/ui";
import { listCompanies, getDossier, getMacroState, getLatestMarketReading } from "@/lib/queries";
import { createCompany } from "@/app/actions";
import { IDEA_ORIGINS } from "@/config/company-blocks";
import { workflowRank } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export default async function ResearchBoard() {
  const companies = await listCompanies();
  const dossiers = (await Promise.all(companies.map((c) => getDossier(c.ticker)))).filter(Boolean);
  const macro = await getMacroState();
  const market = await getLatestMarketReading();

  return (
    <>
      <PageHead
        title="Research"
        sub="Le fil guidé : Macro → Market → Sector → Company → Fundamentals → Valuation → Thesis → Challenge → Timing → Decision."
      />

      <div className="stack">
        {(macro.coreRead < macro.coreTotal || !market) && (
          <div className="notice notice-warn">
            Contexte global incomplet : {macro.coreTotal - macro.coreRead} catégorie(s) du noyau sans interprétation
            {!market && ", et aucun diagnostic de marché"}. Ces états sont partagés par tous les dossiers —{" "}
            <Link href="/macro">les compléter une fois</Link> suffit.
          </div>
        )}

        <Card title="Dossiers">
          {dossiers.length === 0 ? <Empty>Aucun dossier. Ouvre-en un ci-dessous.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Ticker</th><th>Secteur</th><th>Origine</th><th>Statut</th>
                    <th>Avancement</th><th>Prochaine étape / blocage</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d) => {
                    if (!d) return null;
                    const rank = workflowRank(d.steps);
                    const next = d.steps.find((s) => !s.done && !s.locked);
                    const blocked = d.steps.find((s) => !s.done && s.locked);
                    return (
                      <tr key={d.company.id}>
                        <td>
                          <Link href={`/research/${d.company.ticker}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                            {d.company.ticker}
                          </Link>
                          <div className="hint">{d.company.name}</div>
                        </td>
                        <td className="muted">{d.company.sector ?? <span style={{ color: "var(--amber)" }}>à renseigner</span>}</td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {IDEA_ORIGINS.find((o) => o.value === d.company.ideaOrigin)?.label ?? d.company.ideaOrigin}
                        </td>
                        <td><span className="chip">{d.company.status}</span></td>
                        <td className="num">{rank.done} / {rank.total}</td>
                        <td style={{ fontSize: 12.5 }}>
                          {next ? <Link href={next.href}>{next.label} →</Link>
                            : blocked ? <span className="muted">🔒 {blocked.label} — {blocked.reason[0] ?? blocked.missing[0]}</span>
                            : <span style={{ color: "var(--green)" }}>Workflow complet</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <details className="acc">
          <summary>Ouvrir un nouveau dossier</summary>
          <div className="acc-body">
            <form action={createCompany} className="stack-sm">
              <div className="grid-4">
                <Field label="Ticker"><input className="input" name="ticker" required placeholder="NVDA" /></Field>
                <Field label="Nom"><input className="input" name="name" placeholder="NVIDIA Corporation" /></Field>
                <Field label="Secteur"><input className="input" name="sector" placeholder="Technology" /></Field>
                <Field label="Industrie"><input className="input" name="industry" placeholder="Semiconductors" /></Field>
              </div>
              <div className="grid-2">
                <Field label="Origine de l'idée" hint="exploité plus tard dans le Journal : quelle source d'idées me réussit">
                  <select className="select" name="ideaOrigin" required defaultValue="screener">
                    {IDEA_ORIGINS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Note sur l'origine"><input className="input" name="ideaNote" /></Field>
              </div>
              <div><button className="btn" type="submit">Ouvrir le dossier</button></div>
            </form>
          </div>
        </details>
      </div>
    </>
  );
}
