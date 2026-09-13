import Link from "next/link";
import { Card, Empty, PageHead } from "./ui";
import { listCompanies } from "@/lib/queries";

export default async function TickerIndex({
  base, title, sub,
}: { base: string; title: string; sub: string }) {
  const companies = await listCompanies();
  return (
    <>
      <PageHead title={title} sub={sub} />
      <Card title="Choisir un dossier">
        {companies.length === 0 ? (
          <Empty>Aucun dossier. <Link href="/research">En ouvrir un →</Link></Empty>
        ) : (
          <table className="data">
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td style={{ width: 110 }}>
                    <Link href={`${base}/${c.ticker}`} style={{ fontWeight: 600, textDecoration: "none" }}>{c.ticker}</Link>
                  </td>
                  <td>{c.name}</td>
                  <td className="muted">{c.sector ?? "—"}</td>
                  <td style={{ width: 110 }}><span className="chip">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
