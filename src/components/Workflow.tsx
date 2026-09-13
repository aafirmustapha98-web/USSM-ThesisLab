import Link from "next/link";
import type { Step } from "@/lib/workflow";
import { workflowRank } from "@/lib/workflow";

export function WorkflowBar({ steps }: { steps: Step[] }) {
  const rank = workflowRank(steps);
  const current = steps.find((s) => !s.done && !s.locked);
  return (
    <div className="stack-sm">
      <div className="steps">
        {steps.map((s) => {
          const state = s.done ? "done" : s.locked ? "locked" : s === current ? "current" : "todo";
          const mark = s.done ? "✓" : s.locked ? "🔒" : "·";
          return (
            <Link key={s.key} href={s.href} className="step" data-state={state}
              title={s.reason.join(" · ") || "Étape franchie"}>
              <span aria-hidden>{mark}</span>{s.label}
              {s.optional && <span className="chip" style={{ fontSize: 10 }}>optionnel</span>}
            </Link>
          );
        })}
      </div>
      <div className="hint">
        Étape {rank.done} sur {rank.total} — un rang, pas un score. La complétion n&apos;est jamais un signal d&apos;achat.
      </div>
    </div>
  );
}

export function LockedPanel({ step }: { step: Step }) {
  if (step.done) return null;
  return (
    <div className={`notice ${step.locked ? "notice-block" : "notice-warn"}`}>
      <strong>{step.locked ? "🔒" : "⚠"} {step.label} {step.locked ? "verrouillé" : "incomplet"}</strong>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {(step.reason.length ? step.reason : step.missing).map((m) => <li key={m}>{m}</li>)}
      </ul>
    </div>
  );
}
