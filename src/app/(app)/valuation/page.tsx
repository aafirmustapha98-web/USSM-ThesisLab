import TickerIndex from "@/components/TickerIndex";
export const dynamic = "force-dynamic";
export default function Page() {
  return <TickerIndex base="/valuation" title="Valuation"
    sub="Aucune saisie de données ici — uniquement l'interprétation et la comparaison. Excellente entreprise ≠ excellente action au prix actuel." />;
}
