import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionToken, safeEqual, isProtected } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const password = process.env.APP_PASSWORD;
  if (!password) redirect("/");

  const given = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const expected = await sessionToken(password);
  const candidate = await sessionToken(given);
  if (!safeEqual(candidate, expected)) redirect(`/login?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);

  (await cookies()).set(SESSION_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(next.startsWith("/") ? next : "/");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (!isProtected()) redirect("/");

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 20 }}>
      <div className="card card-pad" style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ fontWeight: 650, marginBottom: 2 }}>US Equity OS</div>
        <div className="hint" style={{ marginBottom: 18 }}>Don&apos;t automate my thinking</div>

        <form action={signIn} className="stack-sm">
          <input type="hidden" name="next" value={next ?? "/"} />
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input className="input" id="password" name="password" type="password" autoFocus required
              autoComplete="current-password" />
          </div>
          {error && <div className="notice notice-block">Mot de passe incorrect.</div>}
          <button className="btn" type="submit" style={{ justifyContent: "center" }}>Entrer</button>
        </form>
      </div>
    </div>
  );
}
