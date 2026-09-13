import Link from "next/link";
import type { ReactNode } from "react";
import { FLAG_CLASS, fmt } from "@/lib/format";

export function Card({
  title, right, children, pad = true, footer,
}: { title?: ReactNode; right?: ReactNode; children: ReactNode; pad?: boolean; footer?: ReactNode }) {
  return (
    <section className="card">
      {(title || right) && (
        <header className="card-head">
          <div className="card-title">{title}</div>
          {right}
        </header>
      )}
      <div className={pad ? "card-pad" : ""}>{children}</div>
      {footer}
    </section>
  );
}

export function Flag({ flag, children }: { flag: string; children?: ReactNode }) {
  return <span className={FLAG_CLASS[flag] ?? FLAG_CLASS.grey}>{children}</span>;
}

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="spread" style={{ marginBottom: 18, alignItems: "flex-start" }}>
      <div>
        <h1 className="page">{title}</h1>
        {sub && <div className="page-sub" style={{ marginBottom: 0 }}>{sub}</div>}
      </div>
      {actions}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted" style={{ fontSize: 13, margin: 0 }}>{children}</p>;
}

export function Field({
  label, hint, children,
}: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function NumCell({ value, digits = 2, unit }: { value: number | null | undefined; digits?: number; unit?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return <span className="insufficient">Insufficient data</span>;
  return <span className="num">{fmt(value, digits)}{unit ? ` ${unit}` : ""}</span>;
}

export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="src-link" href={href} target="_blank" rel="noreferrer noopener">
      {children} ↗
    </a>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "warn" | "block" | "ok"; children: ReactNode }) {
  return <div className={`notice notice-${kind}`}>{children}</div>;
}

export function TickerLink({ ticker, children }: { ticker: string; children?: ReactNode }) {
  return <Link href={`/research/${ticker}`} style={{ fontWeight: 600, textDecoration: "none" }}>{children ?? ticker}</Link>;
}

export function Confidence({ value }: { value: number | null | undefined }) {
  if (typeof value !== "number") return <span className="muted">—</span>;
  return <span className="num" title="Confiance 1–10">{value}/10</span>;
}
