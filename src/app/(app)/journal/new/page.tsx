import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, PageHead, Notice } from "@/components/ui";
import { db } from "@/db";
import * as S from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSnapshot } from "@/lib/queries";
import { saveJournalEntry } from "@/app/actions";
import { ERROR_TAGS } from "@/config/company-blocks";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewJournalEntry({
  searchParams,
}: { searchParams: Promise<{ position?: string }> }) {
  const { position: positionId } = await searchParams;
  if (!positionId) notFound();
  const position = (await db.select().from(S.positions).where(eq(S.positions.id, positionId)).limit(1))[0];
  if (!position) notFound();
  const company = (await db.select().from(S.companies).where(eq(S.companies.id, position.companyId)).limit(1))[0];
  const snapshot = position.snapshotId ? await getSnapshot(position.snapshotId) : null;
  const frozen = snapshot?.payload as {
    thesis?: { why?: string; bullCase?: string; bearCase?: string; confidence?: number };
  } | undefined;

  const resultPct = position.exitPrice !== null && position.entry !== 0
    ? ((position.exitPrice - position.entry) / position.entry) * 100 : null;
  const risk = position.entry - position.stopInitial;
  const resultR = position.exitPrice !== null && risk !== 0
    ? (position.exitPrice - position.entry) / risk : null;

  return (
    <>
      <PageHead
        title={`Journal — ${company?.ticker}`}
        sub={<>Position clôturée le {position.closedAt} · résultat {fmt(resultPct, 1)} % ({fmt(resultR, 2)} R)</>}
        actions={<Link className="btn btn-ghost btn-sm" href="/journal">← Journal</Link>}
      />

      <div className="stack">
        {frozen?.thesis && (
          <Card title="Thèse initiale — telle qu'elle était au moment de l'entrée">
            <Notice kind="info">
              Ce texte vient de l&apos;instantané gelé. Il n&apos;a pas pu être réécrit depuis.
            </Notice>
            <div className="stack-sm" style={{ marginTop: 12 }}>
              <div><span className="label">Why</span><div style={{ fontSize: 13 }}>{frozen.thesis.why}</div></div>
              <div><span className="label">Bull case</span><div style={{ fontSize: 13 }}>{frozen.thesis.bullCase}</div></div>
              <div><span className="label">Bear case</span><div style={{ fontSize: 13 }}>{frozen.thesis.bearCase}</div></div>
              <div className="hint">Confiance à l&apos;entrée : {frozen.thesis.confidence}/10</div>
            </div>
          </Card>
        )}

        <Card title="Ce que j'en retire">
          <form action={saveJournalEntry} className="stack-sm">
            <input type="hidden" name="positionId" value={position.id} />
            <input type="hidden" name="companyId" value={position.companyId} />
            <Field label="Ce que j'attendais"><textarea className="textarea" name="expected" required /></Field>
            <Field label="Ce qui s'est réellement produit"><textarea className="textarea" name="happened" required /></Field>
            <Field label="Ma thèse était">
              <select className="select" name="verdict" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                <option value="correct">Correcte</option>
                <option value="partially_correct">Partiellement correcte</option>
                <option value="incorrect">Incorrecte</option>
              </select>
            </Field>
            <Field label="Mon erreur principale"><textarea className="textarea" name="mainError" style={{ minHeight: 60 }} /></Field>
            <Field label="Type d'erreur" hint="alimente la section Erreurs récurrentes">
              <div className="row">
                {ERROR_TAGS.map((t) => (
                  <label key={t.value} className="row" style={{ gap: 5, fontSize: 12.5 }}>
                    <input type="checkbox" name="errorTags" value={t.value} /> {t.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Ce que j'ai appris" hint="obligatoire — porte G7"><textarea className="textarea" name="lesson" required /></Field>
            <div><button className="btn" type="submit">Enregistrer au journal</button></div>
          </form>
        </Card>
      </div>
    </>
  );
}
