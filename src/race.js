// Live races: two players clear the same board at the same time and see each other's progress.
// There is no open connection: each player's game asks for the state every second or two.
//   POST /api/race                 { id, token, name, avatar } open a race (players only); answers { code, key, seed }
//   POST /api/race/<code>/join     { name, avatar }            join it; answers { key, seed, ...state }
//   POST /api/race/<code>          { key, left, state }        report progress; answers the state
//   GET  /api/race/<code>?key=                                 the state
// `key` is a secret the server hands each of the two players; only its hash is stored.
// State: { startsIn (ms, null while waiting), you: { left, state }, other: { name, avatar, left, state } | null }

import { json, error, readJson, sha256, randomCode, cleanText, knownPlayer } from "./http.js";
import { isProfane } from "./profanity.js";

const CODE_LENGTH = 6, KEY_LENGTH = 24;
const START_DELAY_MS = 5000;        // countdown once the second player has joined
const KEEP_MS = 60 * 60 * 1000;
const MAX_ARROWS = 2000;
const STATES = new Set(["play", "won", "lost", "left"]);
const CODE_RE = /^[A-Z0-9]{6}$/;

const cleanName = (name) => { const text = cleanText(name, 16); return isProfane(text) ? "" : text; };
const cleanAvatar = (n) => (Number.isInteger(n) && n >= 0 && n <= 63 ? n : 0);

function stateOf(row, role, now) {
  const me = role, them = role === "host" ? "guest" : "host";
  return {
    startsIn: row.start_at ? row.start_at - now : null,
    you: { left: row[me + "_left"], state: row[me + "_state"] },
    other: row[them] ? { name: row[them + "_name"], avatar: row[them + "_av"], left: row[them + "_left"], state: row[them + "_state"] } : null,
  };
}

/** The race and which of its two players holds `key`, or null. */
async function find(db, code, key) {
  if (!CODE_RE.test(code) || typeof key !== "string" || key.length !== KEY_LENGTH) return null;
  const row = await db.prepare("SELECT * FROM races WHERE code = ?").bind(code).first();
  if (!row) return null;
  const hash = await sha256(key), role = hash === row.host ? "host" : hash === row.guest ? "guest" : null;
  return role ? { row, role } : null;
}

export async function createRace(request, env) {
  const body = (await readJson(request)) || {}, now = Date.now();
  if (!(await knownPlayer(env.DB, body.id, body.token))) return error("forbidden", 403);
  const code = randomCode(CODE_LENGTH), key = randomCode(KEY_LENGTH), seed = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 1000;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM races WHERE created_at < ?").bind(now - KEEP_MS),
    env.DB.prepare("INSERT INTO races (code, seed, created_at, host, host_name, host_av) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(code, seed, now, await sha256(key), cleanName(body.name), cleanAvatar(body.avatar)),
  ]);
  return json({ code, key, seed });
}

export async function joinRace(request, env, code) {
  const body = (await readJson(request)) || {}, now = Date.now(), key = randomCode(KEY_LENGTH);
  code = String(code).toUpperCase();
  if (!CODE_RE.test(code)) return error("no such race", 404);
  // Only the first to arrive gets the free seat.
  const { meta } = await env.DB.prepare("UPDATE races SET guest = ?, guest_name = ?, guest_av = ?, start_at = ? WHERE code = ? AND guest = '' AND host_state = 'play' AND created_at > ?")
    .bind(await sha256(key), cleanName(body.name), cleanAvatar(body.avatar), now + START_DELAY_MS, code, now - KEEP_MS).run();
  if (!meta.changes) return error("race not open", 409);
  const row = await env.DB.prepare("SELECT * FROM races WHERE code = ?").bind(code).first();
  return json({ key, seed: row.seed, ...stateOf(row, "guest", now) });
}

export async function getRace(request, env, code) {
  const found = await find(env.DB, String(code).toUpperCase(), new URL(request.url).searchParams.get("key"));
  return found ? json(stateOf(found.row, found.role, Date.now())) : error("no such race", 404);
}

export async function postRace(request, env, code) {
  const body = (await readJson(request)) || {}, found = await find(env.DB, String(code).toUpperCase(), body.key);
  if (!found) return error("no such race", 404);
  const { row, role } = found, other = role === "host" ? "guest" : "host";
  const left = Number.isInteger(body.left) && body.left >= 0 && body.left <= MAX_ARROWS ? body.left : row[role + "_left"];
  let state = STATES.has(body.state) ? body.state : row[role + "_state"];
  if (row[role + "_state"] !== "play") state = row[role + "_state"];   // a finished player stays finished
  // The first to clear the board wins; the same UPDATE decides when both claim it at once.
  await env.DB.prepare(`UPDATE races SET ${role}_left = ?1, ${role}_state = CASE WHEN ?2 = 'won' AND ${other}_state = 'won' THEN 'lost' ELSE ?2 END WHERE code = ?3`)
    .bind(left, state, row.code).run();
  const fresh = await env.DB.prepare("SELECT * FROM races WHERE code = ?").bind(row.code).first();
  return json(stateOf(fresh, role, Date.now()));
}
