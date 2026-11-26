// Small helpers shared by the API modules.

export const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const UNSAFE_TEXT_CHARS = /[\u0000-\u001f\u007f<>]/g;

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
export const error = (message, status) => json({ error: message }, status);

/** The request body as JSON, or null when it is not JSON. */
export async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A random code of `length` characters that are easy to read aloud (no 0/O, 1/I/L). */
export function randomCode(length) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

/** Cuts a text to `max` characters (not UTF-16 units) after removing control characters. */
export const cleanText = (text, max) => [...String(text || "").replace(UNSAFE_TEXT_CHARS, "").trim()].slice(0, max).join("").trim();

/** Whether `id` and `token` belong to an existing player. Resolves to the token's hash, or null. */
export async function knownPlayer(db, id, token) {
  if (!ID_RE.test(id || "") || typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const hash = await sha256(token);
  return (await db.prepare("SELECT 1 FROM scores WHERE id = ? AND token_hash = ?").bind(id, hash).first()) ? hash : null;
}
