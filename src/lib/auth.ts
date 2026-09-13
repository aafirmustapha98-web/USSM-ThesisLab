/**
 * Protection par mot de passe unique.
 * Web Crypto uniquement : le même code tourne dans le middleware (Edge)
 * et dans les Server Actions (Node).
 */
export const SESSION_COOKIE = "ussm_session";

export function isProtected() {
  return !!process.env.APP_PASSWORD;
}

/** Le cookie ne contient jamais le mot de passe, seulement son empreinte. */
export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`ussm:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparaison à temps constant : pas de fuite par la durée de la réponse. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
