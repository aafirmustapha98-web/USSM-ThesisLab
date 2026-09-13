import Link from "next/link";
import { Card, Flag, PageHead, Empty, NumCell } from "@/components/ui";
import {
  getMacroState, getLatestMarketReading, getAllLatestObservations,
  listCompanies, listEvents, listOpenPositionsWithCompany, getSettings, getDossier,
} from "@/lib/queries";
import { positionMath } from "@/lib/derive";
import { getLatestPrice } from "@/lib/queries";
import { fmt, fmtAge, diagnosticToFlag, daysSince } from "@/lib/format";
import { MARKET_DIAGNOSTICS } from "@/config/macro-catalog";
import { workflowRank } from "@/lib/workflow";

export const dynamic = "force-dynamic";

/** Numeric reference points — values I entered, shown without any verdict. */
const REFERENCES: { key: string; label: string; unit?: string }[] = [
  { key: "MKT:VIX", label: "VIX", unit: "pts" },
  { key: "M07:DXY", label: "Dollar (DXY)", unit: "idx" },
  { key: "M06:HY_SPREAD", label: "High Yield Spread", unit: "pdb" },
  { key: "M05:US10Y", label: "US 10Y", unit: "%" },
  { key: "M05:CURVE_2S10S", label: "Courbe 2Y-10Y", unit: "pdb" },
  { key: "M03:CORE_CPI", label: "Core CPI", unit: "%" },
];

export default async function Dashboard() {
  const [macro, market, obs, companies, events, openPositions, settings] = await Promise.all([
    getMacroState(), getLatestMarketReading(), getAllLatestObservations(),
    listCompanies(), listEvents(), listOpenPositionsWithCompany(), getSettings(),
  ]);

  const active = companies.filter((c) => ["recherche", "watchlist", "position"].includes(c.status));
  const dossiers = await Promise.all(active.slice(0, 12).map((c) => getDossier(c.ticker)));

  const upcoming = events
    .filter((e) => { const d = daysSince(e.date); return d !== null && d <= 0; })
    .slice(0, 8);

  const capital = settings?.capital ?? null;
  let openRisk = 0;
  const posRows = await Promise.all(openPositions.map(async ({ position, company }) => {
    const price = await getLatestPrice(position.companyId);
    const m = positionMath({
      entry: position.entry, shares: position.shares,
      stopInitial: position.stopInitial, currentPrice: price?.price ?? null,
    });
    openRisk += m.initialRisk;
    return { position, company, m, price };
  }));

  return (
    <>
      <PageHead
        title="Dashboard"
        sub="Synthèse de mes propres lectures. Aucun état affiché ici n'est calculé par l'application."
      />

      <div className="stack">
        <Card
          title="Market regime — mes diagnostics"
          right={<span className="hint">état · dernière interprétation · âge</span>}
        >
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {macro.core.map(({ category, reading, age, stale }) => (
                  <tr key={category.code}>
                    <td style={{ width: 210, fontWeight: 550 }}>{category.label}</td>
                    <td style={{ width: 190 }}>
                      <Flag flag={reading ? diagnosticToFlag(reading.diagnostic) : "grey"}>
                        {reading
                          ? reading.diagnostic === "favorable" ? "Favorable"
                            : reading.diagnostic === "defavorable" ? "Défavorable" : "Neutre"
                          : "Non renseigné"}
                      </Flag>
                    </td>
                    <td className="muted" style={{ fontSize: 12.5 }}>
                      {reading ? reading.whatHappens.slice(0, 120) : <Link href={`/macro/${category.code}`}>Interpréter →</Link>}
                    </td>
                    <td className="n" style={{ width: 90, color: stale ? "var(--amber)" : "var(--ink-3)" }}>
                      {fmtAge(reading?.date)}{stale ? " ⚠" : ""}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 550 }}>Marché actions</td>
                  <td>
                    <Flag flag={market ? diagnosticToFlag(market.diagnostic) : "grey"}>
                      {market
                        ? MARKET_DIAGNOSTICS.find((d) => d.value === market.diagnostic)?.label ?? market.diagnostic
                        : "Non renseigné"}
                    </Flag>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {market ? market.justification.slice(0, 120) : <Link href="/macro/market">Diagnostiquer →</Link>}
                  </td>
                  <td className="n muted" style={{ width: 90 }}>{fmtAge(market?.date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid-2">
          <Card title="Repères chiffrés" right={<span className="hint">données saisies, sans verdict</span>}>
            <table className="data">
              <tbody>
                {REFERENCES.map((r) => {
                  const o = obs.get(r.key);
                  return (
                    <tr key={r.key}>
                      <td>{r.label}</td>
                      <td className="n">
                        {o?.value !== null && o?.value !== undefined ? `${fmt(o.value)} ${r.unit ?? ""}` : <span className="muted">—</span>}
                      </td>
                      <td className="n muted" style={{ width: 70 }}>
                        {o?.trend === "up" ? "↑" : o?.trend === "down" ? "↓" : o ? "→" : ""}
                      </td>
                      <td className="n muted" style={{ width: 70 }}>{fmtAge(o?.refDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card title="Upcoming events" right={<Link className="src-link" href="/settings#events">Gérer</Link>}>
            {upcoming.length === 0 ? (
              <Empty>Aucun événement enregistré. Ajoute-les depuis les Réglages.</Empty>
            ) : (
              <table className="data">
                <tbody>
                  {upcoming.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 550 }}>{e.type.toUpperCase()}</td>
                      <td className="muted">{e.scope === "ticker" ? e.target : e.note ?? ""}</td>
                      <td className="n">{e.date}</td>
                      <td className="n muted" style={{ width: 80 }}>
                        {(() => { const d = daysSince(e.date); return d === null ? "" : `J${d > 0 ? "+" : ""}${-d}`; })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card
          title="Active research"
          right={<span className="hint">étapes franchies — ce n'est pas une probabilité de hausse</span>}
        >
          {dossiers.filter(Boolean).length === 0 ? (
            <Empty>Aucune analyse en cours. <Link href="/research">Ouvrir un dossier →</Link></Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Ticker</th><th>Secteur</th><th>Statut</th>
                    <th>Avancement</th><th>Prochaine étape</th>
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
                        <td><Link href={`/research/${d.company.ticker}`} style={{ fontWeight: 600 }}>{d.company.ticker}</Link></td>
                        <td className="muted">{d.company.sector ?? "—"}</td>
                        <td><span className="chip">{d.company.status}</span></td>
                        <td className="num">étape {rank.done} / {rank.total}</td>
                        <td className="muted" style={{ fontSize: 12.5 }}>
                          {next ? <Link href={next.href}>{next.label} →</Link>
                            : blocked ? <span>🔒 {blocked.label} — {blocked.reason[0] ?? blocked.missing[0]}</span>
                            : "Workflow complet"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid-2">
          <Card title="Positions ouvertes">
            {posRows.length === 0 ? <Empty>Aucune position ouverte.</Empty> : (
              <table className="data">
                <thead><tr><th>Ticker</th><th className="n">Entrée</th><th className="n">P/L</th><th className="n">R</th></tr></thead>
                <tbody>
                  {posRows.map(({ position, company, m }) => (
                    <tr key={position.id}>
                      <td><Link href={`/positions/${position.id}`} style={{ fontWeight: 600 }}>{company?.ticker}</Link>{" "}
                        <span className="chip">{position.horizon === "swing" ? "Swing" : "Long"}</span></td>
                      <td className="n">{fmt(position.entry)}</td>
                      <td className="n" style={{ color: (m.plPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                        <NumCell value={m.plPct} digits={1} unit="%" />
                      </td>
                      <td className="n"><NumCell value={m.rNow} digits={2} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Portefeuille">
            {capital === null ? (
              <Empty>
                Aucun capital déclaré — aucun contrôle de portefeuille ne s&apos;applique.{" "}
                <Link href="/settings">Déclarer mes limites →</Link>
              </Empty>
            ) : (
              <table className="data">
                <tbody>
                  <tr><td>Capital</td><td className="n">{fmt(capital, 0)}</td></tr>
                  <tr>
                    <td>Risque ouvert</td>
                    <td className="n">
                      {fmt((openRisk / capital) * 100, 2)} %
                      {settings?.maxOpenRiskPct ? <span className="muted"> / {settings.maxOpenRiskPct} % max</span> : null}
                    </td>
                  </tr>
                  <tr><td>Positions ouvertes</td><td className="n">{posRows.length}</td></tr>
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
