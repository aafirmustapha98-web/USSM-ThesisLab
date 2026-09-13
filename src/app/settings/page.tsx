import { Card, Field, PageHead, Notice, Empty } from "@/components/ui";
import { getSettings, listEvents, listCompanies } from "@/lib/queries";
import { saveSettings, saveEvent, deleteEvent } from "@/app/actions";
import { EVENT_TYPES } from "@/config/company-blocks";
import { today } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const events = await listEvents();
  const companies = await listCompanies();

  return (
    <>
      <PageHead title="Réglages" sub="Portefeuille, calendrier, sauvegarde." />

      <div className="stack">
        <Card title="Portefeuille">
          <Notice kind="info">
            Aucune valeur n&apos;est imposée. Ces champs sont <strong>vides par défaut</strong> : tant que tu ne déclares rien,
            aucun contrôle de portefeuille ne se déclenche. L&apos;application fait seulement respecter les limites que tu as fixées.
          </Notice>
          <form action={saveSettings} className="stack-sm" style={{ marginTop: 14 }}>
            <div className="grid-4">
              <Field label="Capital (USD)"><input className="input num" name="capital" defaultValue={settings?.capital ?? ""} /></Field>
              <Field label="Risque max par trade (%)"><input className="input num" name="maxRiskPerTradePct" defaultValue={settings?.maxRiskPerTradePct ?? ""} /></Field>
              <Field label="Risque ouvert max (%)"><input className="input num" name="maxOpenRiskPct" defaultValue={settings?.maxOpenRiskPct ?? ""} /></Field>
              <Field label="Exposition max par secteur (%)"><input className="input num" name="maxSectorPct" defaultValue={settings?.maxSectorPct ?? ""} /></Field>
            </div>
            <div><button className="btn" type="submit">Enregistrer</button></div>
          </form>
        </Card>

        <div id="events" />
        <Card title="Calendrier des événements" right={<span className="hint">alimente le Dashboard, le Timing et les positions</span>}>
          {events.length === 0 ? <Empty>Aucun événement enregistré.</Empty> : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Type</th><th>Portée</th><th>Cible</th><th>Note</th><th className="n">Date</th><th /></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 550 }}>{e.type.toUpperCase()}</td>
                      <td className="muted">{e.scope}</td>
                      <td className="muted">{e.target ?? "—"}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{e.note ?? ""}</td>
                      <td className="n mono">{e.date}</td>
                      <td style={{ width: 40 }}>
                        <form action={deleteEvent}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <button className="btn btn-ghost btn-sm" type="submit">×</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form action={saveEvent} className="stack-sm" style={{ marginTop: 14 }}>
            <div className="grid-4">
              <Field label="Type">
                <select className="select" name="type" required defaultValue="">
                  <option value="" disabled>Choisir…</option>
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Date"><input className="input" type="date" name="date" required defaultValue={today()} /></Field>
              <Field label="Portée">
                <select className="select" name="scope" defaultValue="market">
                  <option value="market">Marché</option>
                  <option value="sector">Secteur</option>
                  <option value="ticker">Ticker</option>
                </select>
              </Field>
              <Field label="Cible" hint="ticker ou secteur">
                <input className="input" name="target" list="tickers" />
                <datalist id="tickers">
                  {companies.map((c) => <option key={c.id} value={c.ticker} />)}
                </datalist>
              </Field>
            </div>
            <Field label="Note"><input className="input" name="note" /></Field>
            <div><button className="btn btn-sm" type="submit">Ajouter l&apos;événement</button></div>
          </form>
        </Card>

        <Card title="Sauvegarde">
          <p className="hint" style={{ marginTop: 0 }}>
            Toutes les données sont saisies à la main : elles sont irremplaçables.
            La base est un fichier unique — <span className="mono">data/ussm.db</span> — qu&apos;il suffit de copier.
          </p>
          <a className="btn btn-ghost btn-sm" href="/api/export" download="ussm-export.json">
            Exporter tout en JSON
          </a>
        </Card>

        <Card title="Garde-fous IA">
          <table className="data">
            <tbody>
              {[
                ["AI-1", "Le mode Tutor ne reçoit aucun contexte du dossier en cours"],
                ["AI-2", "Le mode Analyst exige une thèse et un bear case écrits (porte G4)"],
                ["AI-3", "Le mode Coach n'intervient qu'après mes champs obligatoires"],
                ["AI-4", "Aucun mode ne voit le P/L courant avant de challenger"],
                ["AI-5", "Aucun mode ne produit de recommandation, de prix cible ou de taille de position"],
                ["AI-6", "Toute sortie est horodatée, conservée, et entre dans l'instantané gelé"],
                ["AI-7", "L'IA n'a aucun accès en écriture aux champs d'interprétation et de diagnostic"],
              ].map(([code, rule]) => (
                <tr key={code}>
                  <td className="mono" style={{ width: 60 }}>{code}</td>
                  <td>{rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Notice kind="info">
            V1 n&apos;effectue aucun appel de modèle. Ces règles sont la spécification du branchement à venir —
            elles seront appliquées côté application, pas laissées à ma discipline.
          </Notice>
        </Card>
      </div>
    </>
  );
}
