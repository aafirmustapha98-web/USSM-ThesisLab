import TickerIndex from "@/components/TickerIndex";
export const dynamic = "force-dynamic";
export default function Page() {
  return <TickerIndex base="/company" title="Company Analysis"
    sub="Seule page de saisie des données financières. Les ratios saisis ici alimentent la page Valuation, qui ne les redemande pas." />;
}
