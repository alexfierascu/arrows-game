// Sends a Web Push message without a payload: it only wakes the game's service worker, which
// shows the reminder (public/sw.js). No payload means nothing to encrypt; the push service
// just needs proof of who is sending, a token signed with the server's VAPID key.

const base64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encode = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)));

const TOKEN_SECONDS = 12 * 60 * 60;

/** Resolves to the push service's response. 404 and 410 mean the subscription is gone. */
export async function sendPush(endpoint, env) {
  const key = await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE_KEY), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + TOKEN_SECONDS, sub: env.VAPID_SUBJECT };
  const unsigned = `${encode({ typ: "JWT", alg: "ES256" })}.${encode(claims)}`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return fetch(endpoint, {
    method: "POST",
    headers: { authorization: `vapid t=${unsigned}.${base64url(signature)}, k=${env.VAPID_PUBLIC_KEY}`, ttl: String(TOKEN_SECONDS) },
  });
}
