import Link from "next/link";
import { Card, PageHead, Empty, NumCell } from "@/components/ui";
import { db } from "@/db";
import * as S from "@/db/schema";
import { desc } from "drizzle-orm";
import { listCompanies, getLatestPrice, getSettings } from "@/lib/queries";
import { positionMath } from "@/lib/derive";
import { fmt, fmtAge } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PositionsPage() {
  const all = await db.select().from(S.positions).orderBy(desc(S.positions.openedAt));
  const companies = await listCompanies();
  const byId = new Map(companies.map((c) => [c.id, c]));
  const settings = await getSettings();

  const rows = await Promise.all(all.map(async (p) => {
    const price = await getLatestPrice(p.companyId);
    const m = positionMath({
      entry: p.entry, shares: p.shares, stopInitial: p.stopInitial,
      currentPrice: p.status === "closed" ? p.exitPrice : price?.price ?? null,
    });
    return { p, company: byId.get(p.companyId), m, price };
  }));

  const open = rows.filter((r) => r.p.status === "open");
  const closed = rows.filter((r) => r.p.status === "closed");
  const capital = settings?.capital ?? null;
  const openRisk = open.reduce((a, r) => a + r.m.initialRisk, 0);

  return (
    <>
      <PageHead
        title="Positions"
        sub={capital
          ? <>Capital {fmt(capital, 0)} · risque ouvert {fmt((openRisk / capital) * 100, 2)} %{settings?.maxOpenRiskPct ? ` / ${settings.maxOpenRiskPct} % déclaré` : ""}</>
          : <>Aucun capital déclaré — aucun contrôle de portefeuille ne s&apos;applique. <Link href="/settings">Réglages →</Link></>}
      />

      <div className="stack">
        <Card title={`Ouvertes (${open.length})`}>
          {open.length === 0 ? <Empty>Aucune position ouverte.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Ticker</th><th>Horizon</th><th className="n">Entrée</th><th className="n">Courant</th>
                    <th className="n">Stop</th><th className="n">Target</th><th className="n">P/L</th>
                    <th className="n">R</th><th className="n">Risque init.</th><th>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map(({ p, company, m, price }) => (
                    <tr key={p.id}>
                      <td><Link href={`/positions/${p.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{company?.ticker}</Link></td>
                      <td><span className="chip">{p.horizon === "swing" ? "Swing" : "Long"}</span></td>
                      <td className="n">{fmt(p.entry)}</td>
                      <td className="n">{price ? fmt(price.price) : <span className="muted">—</span>}</td>
                      <td className="n">{fmt(p.stopCurrent ?? p.stopInitial)}</td>
                      <td className="n">{fmt(p.targetInitial)}</td>
                      <td className="n" style={{ color: (m.plPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                        <NumCell value={m.plPct} digits={1} unit="%" />
                      </td>
                      <td className="n"><NumCell value={m.rNow} digits={2} /></td>
                      <td className="n">{fmt(m.initialRisk)}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{price ? fmtAge(price.at) : "à saisir"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={`Clôturées (${closed.length})`}>
          {closed.length === 0 ? <Empty>Aucune position clôturée.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Ticker</th><th>Horizon</th><th className="n">Entrée</th><th className="n">Sortie</th><th className="n">Résultat</th><th className="n">R</th><th>Motif</th></tr></thead>
                <tbody>
                  {closed.map(({ p, company, m }) => (
                    <tr key={p.id}>
                      <td><Link href={`/positions/${p.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{company?.ticker}</Link></td>
                      <td><span className="chip">{p.horizon === "swing" ? "Swing" : "Long"}</span></td>
                      <td className="n">{fmt(p.entry)}</td>
                      <td className="n">{fmt(p.exitPrice)}</td>
                      <td className="n" style={{ color: (m.plPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                        <NumCell value={m.plPct} digits={1} unit="%" />
                      </td>
                      <td className="n"><NumCell value={m.rNow} digits={2} /></td>
                      <td className="muted">{p.exitReason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
