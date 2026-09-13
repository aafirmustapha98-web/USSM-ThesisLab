export const today = () => new Date().toISOString().slice(0, 10);

export function daysSince(date?: string | null): number | null {
  if (!date) return null;
  const d = new Date(date.length <= 10 ? `${date}T00:00:00Z` : date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

export function fmtSigned(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + fmt(v, digits);
}

export function fmtAge(date?: string | null): string {
  const d = daysSince(date);
  if (d === null) return "—";
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "1 j";
  return `${d} j`;
}

/** Is a new reading of this indicator due, given its publication frequency? */
export function isDue(frequency: string, refDate?: string | null): boolean {
  const d = daysSince(refDate);
  if (d === null) return true;
  switch (frequency) {
    case "daily": return d >= 1;
    case "weekly": return d >= 7;
    case "monthly": return d >= 31;
    case "quarterly": return d >= 92;
    case "event": return false;
    default: return d >= 31;
  }
}

export const FLAG_CLASS: Record<string, string> = {
  green: "flag flag-green",
  amber: "flag flag-amber",
  red: "flag flag-red",
  grey: "flag flag-grey",
};

export function diagnosticToFlag(d?: string | null): "green" | "amber" | "red" | "grey" {
  switch (d) {
    case "favorable": case "bullish": case "green": case "attractive": case "reasonable":
      return "green";
    case "neutre": case "neutral": case "transition": case "amber": case "expensive":
      return "amber";
    case "defavorable": case "bearish": case "red": case "very_expensive":
      return "red";
    default:
      return "grey";
  }
}

export function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function numOrNull(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const v = Number(raw.replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

export function strOrNull(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t === "" ? null : t;
}
