import Link from "next/link";
import { Card, PageHead, Empty, Notice } from "@/components/ui";
import { listPositionsForReview } from "@/lib/queries";
import { positionMath } from "@/lib/derive";
import { addPositionReview, savePrice } from "@/app/actions";
import { fmt, fmtAge, daysSince } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Écran pensé pour le pouce. C'est ce qu'on fait mal quand on n'a pas
 * l'outil sous la main : répondre à ses propres invalidateurs.
 */
export default async function ReviewPage() {
  const rows = await listPositionsForReview();

  return (
    <>
      <PageHead
        title="Revue rapide"
        sub="Mettre à jour un prix, répondre à mes invalidateurs, statuer sur la thèse. Depuis le téléphone."
      />

      {rows.length === 0 ? (
        <Card title="Rien à revoir">
          <Empty>Aucune position ouverte. <Link href="/positions">Voir les positions →</Link></Empty>
        </Card>
      ) : (
        <div className="stack">
          {rows.map(({ position, company, price, invalidators, lastReview }) => {
            const m = positionMath({
              entry: position.entry, shares: position.shares,
              stopInitial: position.stopInitial, currentPrice: price?.price ?? null,
            });
            const staleDays = daysSince(lastReview?.date);
            const occurred = invalidators.filter((i) => i.status === "occurred");

            return (
              <Card
                key={position.id}
                title={
                  <span className="row" style={{ gap: 8 }}>
                    <Link href={`/positions/${position.id}`} style={{ fontSize: 16, fontWeight: 650, textDecoration: "none" }}>
                      {company.ticker}
                    </Link>
                    <span className="chip">{position.horizon === "swing" ? "Swing" : "Long"}</span>
                  </span>
                }
                right={
                  <span className="num" style={{ fontSize: 17, fontWeight: 600, color: (m.plPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                    {m.plPct !== null ? `${fmt(m.plPct, 1)} %` : "prix à saisir"}
                    {m.rNow !== null && <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}> · {fmt(m.rNow, 2)} R</span>}
                  </span>
                }
              >
                <div className="stack-sm">
                  {occurred.length > 0 && (
                    <Notice kind="block">
                      {occurred.length} invalidateur(s) marqué(s) comme survenu(s). Pourquoi suis-je encore dans cette position ?
                    </Notice>
                  )}
                  {staleDays !== null && staleDays > 30 && (
                    <Notice kind="warn">Non revue depuis {staleDays} jours.</Notice>
                  )}

                  <form action={savePrice} className="row touch-row">
                    <input type="hidden" name="companyId" value={position.companyId} />
                    <input className="input num touch" name="price" inputMode="decimal" required
                      placeholder={price ? `${fmt(price.price)} — ${fmtAge(price.at)}` : "Prix courant"} />
                    <button className="btn touch" type="submit">Prix</button>
                  </form>

                  <form action={addPositionReview} className="stack-sm">
                    <input type="hidden" name="positionId" value={position.id} />
                    <input type="hidden" name="invalidatorIds" value={invalidators.map((i) => i.id).join(",")} />

                    {invalidators.length === 0 ? (
                      <Notice kind="warn">Cette thèse n&apos;a aucun invalidateur enregistré.</Notice>
                    ) : (
                      invalidators.map((i) => (
                        <div key={i.id} className="inv-block">
                          <div style={{ fontWeight: 550, marginBottom: 2 }}>{i.label}</div>
                          <div className="hint mono" style={{ marginBottom: 8 }}>
                            {i.metric ? `${i.metric} ${i.operator ?? ""} ${i.threshold ?? ""} ${i.unit ?? ""} ${i.persistence ?? ""}` : "non mesurable"}
                          </div>
                          <div className="choices">
                            {[["no", "Non"], ["yes", "Oui, survenu"], ["dont_know", "Je ne sais pas"]].map(([v, l]) => (
                              <label key={v} className="choice">
                                <input type="radio" name={`inv_${i.id}`} value={v} required />
                                <span>{l}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    <div className="field">
                      <label>Statut de la thèse</label>
                      <div className="choices">
                        {[["intact", "Intacte"], ["strengthened", "Renforcée"], ["weakened", "Affaiblie"], ["invalidated", "Invalidée"]].map(([v, l]) => (
                          <label key={v} className="choice">
                            <input type="radio" name="thesisStatus" value={v} required />
                            <span>{l}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="row touch-row">
                      <input className="input touch" name="note" placeholder="Note (optionnel)" style={{ flex: 1 }} />
                      <input className="input num touch" type="number" min={1} max={10} name="confidence"
                        defaultValue={5} style={{ maxWidth: 78 }} aria-label="Confiance" />
                    </div>
                    <button className="btn touch" type="submit" style={{ justifyContent: "center" }}>
                      Enregistrer la revue
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
