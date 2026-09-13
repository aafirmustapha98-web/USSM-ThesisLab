import Link from "next/link";
import { Card, Flag, PageHead } from "@/components/ui";
import { getMacroState, getLatestMarketReading } from "@/lib/queries";
import { fmtAge, diagnosticToFlag } from "@/lib/format";
import { MARKET_DIAGNOSTICS, TE_HUB } from "@/config/macro-catalog";

export const dynamic = "force-dynamic";

export default async function MacroIndex() {
  const macro = await getMacroState();
  const market = await getLatestMarketReading();
  const core = macro.perCategory.filter((p) => p.category.core);
  const optional = macro.perCategory.filter((p) => !p.category.core);

  const Row = ({ p }: { p: typeof macro.perCategory[number] }) => (
    <tr>
      <td style={{ width: 60 }} className="muted mono">{p.category.code}</td>
      <td style={{ fontWeight: 550 }}>
        <Link href={`/macro/${p.category.code}`} style={{ textDecoration: "none" }}>{p.category.label}</Link>
        {p.category.template === "qualitative" && <span className="chip" style={{ marginLeft: 8 }}>qualitatif</span>}
      </td>
      <td style={{ width: 170 }}>
        <Flag flag={p.reading ? diagnosticToFlag(p.reading.diagnostic) : "grey"}>
          {p.reading
            ? p.reading.diagnostic === "favorable" ? "Favorable"
              : p.reading.diagnostic === "defavorable" ? "Défavorable" : "Neutre"
            : "Non renseigné"}
        </Flag>
      </td>
      <td className="n muted" style={{ width: 110 }}>
        {p.stale ? <span style={{ color: "var(--amber)" }}>{fmtAge(p.reading?.date)} ⚠</span> : fmtAge(p.reading?.date)}
      </td>
      <td className="n muted" style={{ width: 90, fontSize: 12 }}>{p.category.indicators.length || "—"} ind.</td>
    </tr>
  );

  return (
    <>
      <PageHead
        title="Macro & Market"
        sub={<>Les 5 catégories du noyau sont requises pour ouvrir une thèse. Les autres sont à la demande. <a className="src-link" href={TE_HUB} target="_blank" rel="noreferrer">Trading Economics</a></>}
      />

      <div className="stack">
        <Card title={`Noyau — ${macro.coreRead}/${macro.coreTotal} interprétées`}>
          <table className="data"><tbody>{core.map((p) => <Row key={p.category.code} p={p} />)}</tbody></table>
        </Card>

        <Card
          title="Market"
          right={<Link className="src-link" href="/macro/market">Ouvrir →</Link>}
        >
          <table className="data"><tbody>
            <tr>
              <td style={{ width: 60 }} className="muted mono">MKT</td>
              <td style={{ fontWeight: 550 }}>
                <Link href="/macro/market" style={{ textDecoration: "none" }}>Indices · Breadth · Volatilité</Link>
              </td>
              <td style={{ width: 170 }}>
                <Flag flag={market ? diagnosticToFlag(market.diagnostic) : "grey"}>
                  {market ? MARKET_DIAGNOSTICS.find((d) => d.value === market.diagnostic)?.label : "Non renseigné"}
                </Flag>
              </td>
              <td className="n muted" style={{ width: 110 }}>{fmtAge(market?.date)}</td>
              <td className="n muted" style={{ width: 90, fontSize: 12 }}>14 ind.</td>
            </tr>
          </tbody></table>
        </Card>

        <Card title="Catégories optionnelles">
          <table className="data"><tbody>{optional.map((p) => <Row key={p.category.code} p={p} />)}</tbody></table>
        </Card>
      </div>
    </>
  );
}
