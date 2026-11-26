// Limits on how fast one visitor may call the API, so a script cannot fill the database or
// guess the admin key. The counters are Cloudflare rate-limit bindings (wrangler.jsonc):
//   LIMIT_API     every API call
//   LIMIT_WRITE   calls that change something, and calls to the admin routes
//   LIMIT_CREATE  calls that add a new thing: a player, a club, a race, a feedback message...
// A visitor is an IP address; it is only used as the counter's key and never stored.

import { json } from "./http.js";

const MAX_BODY_BYTES = 16 * 1024;
const RETRY_SECONDS = 60;

export const visitor = (request) => request.headers.get("cf-connecting-ip") || "unknown";

/** Whether `key` is still under the limit. A missing or failing limiter allows the call. */
export async function allowed(limiter, key) {
  if (!limiter) return true;
  try { return (await limiter.limit({ key })).success; } catch (err) { console.error(err); return true; }
}

export function slowDown() {
  const response = json({ error: "slow down", wait: RETRY_SECONDS * 1000 }, 429);
  response.headers.set("retry-after", String(RETRY_SECONDS));
  return response;
}

/** No request of the game is anywhere near this size. */
export const tooLarge = (request) => Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES;
