import TickerIndex from "@/components/TickerIndex";
export const dynamic = "force-dynamic";
export default function Page() {
  return <TickerIndex base="/thesis" title="Thesis & AI Challenge"
    sub="La thèse est versionnée et immuable. Le bear case s'écrit avant le challenge — jamais l'inverse." />;
}
