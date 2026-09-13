import { answerFinding } from "@/app/actions";
import type { Finding } from "@/config/rules";

/**
 * Deterministic controls. A control never judges — it asks a question
 * I must answer in writing. A blocking one keeps its gate shut.
 */
export function Findings({
  findings, companyId, scopes,
}: { findings: Finding[]; companyId: string; scopes?: string[] }) {
  const list = scopes ? findings.filter((f) => scopes.includes(f.scope)) : findings;
  if (list.length === 0) return null;
  return (
    <div className="stack-sm">
      {list.map((f) => (
        <div key={f.code} className={`notice ${f.severity === "blocking" ? "notice-block" : "notice-warn"}`}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <strong style={{ fontSize: 12.5 }}>
              <span className="mono">{f.code}</span> · {f.severity === "blocking" ? "bloquant" : "avertissement"}
            </strong>
          </div>
          <div style={{ marginBottom: 8 }}>{f.message}</div>
          <form action={answerFinding} className="row" style={{ gap: 8 }}>
            <input type="hidden" name="companyId" value={companyId} />
            <input type="hidden" name="ruleCode" value={f.code} />
            <input type="hidden" name="scope" value={f.scope} />
            <input className="input" name="response" required placeholder="Ma réponse — obligatoire" style={{ flex: 1, minWidth: 220 }} />
            <button className="btn btn-sm" type="submit">Répondre</button>
          </form>
        </div>
      ))}
    </div>
  );
}
