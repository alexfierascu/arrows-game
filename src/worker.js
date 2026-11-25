// Arrows Escape — Cloudflare Worker: serves the game (static assets) and the leaderboard API (D1).
//   GET    /api/scores?d=YYYY-MM-DD&e=<eventKey>   top players for each leaderboard tab
//   POST   /api/score                              create/update your own row (id + secret token);
//                                                  409 when the name belongs to another player,
//                                                  422 when the name is offensive, 429 { wait } once
//                                                  that has happened too often: locked out for `wait` ms
//   DELETE /api/score/<id>                         admin only: header "Authorization: Bearer <ADMIN_KEY>"
//   POST   /api/event                              count one anonymous usage event: { name }
//   GET    /api/stats?days=30                      admin only: the usage counts per day

import { isProfane } from "./profanity.js";

const LEADERBOARD_SIZE = 100;
const NICK_MAX_LENGTH = 16;
// A name is released for others once its owner has not posted a score for this long.
const NICK_HOLD_MS = 90 * 24 * 60 * 60 * 1000;

// Offensive names: this many attempts within the window lock the player out for a while.
const MAX_STRIKES = 3;
const STRIKE_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;

// Score fields a player can post: the name used in JSON -> the column in the `scores` table.
const FIELDS = {
  nick: "nick", total: "total", stars: "stars", cleared: "cleared", bosses: "bosses",
  dDate: "d_date", dScore: "d_score", dTime: "d_time", eKey: "e_key", eScore: "e_score", avatar: "avatar",
};
// Upper bounds a real game can reach; anything above is rejected.
const LIMITS = { total: 2_000_000, stars: 180, cleared: 60, bosses: 5, dScore: 100_000, dTime: 3_600, eScore: 500_000, avatar: 63 };
// Fields that older copies of the game do not send yet.
const OPTIONAL = { avatar: 0 };

const MAX_FRIENDS = 50;
// Usage events the game may report (see public/js/analytics.js). Anything else is ignored.
const EVENT_NAMES = new Set([
  "visit", "new_player", "game_start", "first_move", "first_win", "win", "lose", "daily_win", "event_win",
  "rush_end", "power_used", "share", "friend_added", "skin_bought", "name_set",
]);
const MAX_STATS_DAYS = 365;

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_RE = /^[a-z]{2,12}-\d{1,6}$/;
const UNSAFE_NICK_CHARS = /[\u0000-\u001f\u007f<>]/g;

const COLUMNS = Object.values(FIELDS);
const SELECT_ROWS = `SELECT id, ${COLUMNS.join(", ")} FROM scores`;
// Insert a new player, or update only if the secret token matches the one that created the row.
const UPSERT = `
  INSERT INTO scores (id, token_hash, ${COLUMNS.join(", ")}, updated_at)
  VALUES (?, ?, ${COLUMNS.map(() => "?").join(", ")}, ?)
  ON CONFLICT(id) DO UPDATE SET ${COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ")}, updated_at = excluded.updated_at
  WHERE scores.token_hash = excluded.token_hash`;

const RELEASE_STALE_NICK = "UPDATE scores SET nick = '' WHERE nick = ? COLLATE NOCASE AND id <> ? AND updated_at < ?";

// Counts one offensive-name attempt. Parameters: who, now, start of the window, MAX_STRIKES and
// the end of a new lockout. The right-hand sides all read the row as it was before the update.
const ADD_STRIKE = `
  INSERT INTO strikes (who, count, first_at, blocked_until) VALUES (?1, 1, ?2, 0)
  ON CONFLICT(who) DO UPDATE SET
    count = CASE WHEN blocked_until > ?2 THEN count WHEN first_at < ?3 THEN 1 WHEN count + 1 >= ?4 THEN 0 ELSE count + 1 END,
    first_at = CASE WHEN first_at < ?3 THEN ?2 ELSE first_at END,
    blocked_until = CASE WHEN blocked_until <= ?2 AND first_at >= ?3 AND count + 1 >= ?4 THEN ?5 ELSE blocked_until END
  RETURNING blocked_until`;
const DROP_OLD_STRIKES = "DELETE FROM strikes WHERE first_at < ? AND blocked_until < ?";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const error = (message, status) => json({ error: message }, status);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A database row as the JSON the game expects. */
function toClient(row) {
  const out = { id: row.id };
  for (const [key, column] of Object.entries(FIELDS)) out[key] = row[column];
  return out;
}

/**
 * Checks a posted score. Returns { error } for a bad request, otherwise { id, token, values }
 * where `values` holds one clean value per entry of FIELDS.
 */
function parseScore(body) {
  if (!body || !ID_RE.test(body.id || "") || typeof body.token !== "string" || body.token.length < 20 || body.token.length > 100)
    return { error: "bad id or token" };
  const values = {
    // Cut by characters, not UTF-16 units, so an emoji at the limit is never split.
    nick: [...String(body.nick || "").replace(UNSAFE_NICK_CHARS, "").trim()].slice(0, NICK_MAX_LENGTH).join("").trim(),
    dDate: DATE_RE.test(body.dDate || "") ? body.dDate : "",
    eKey: EVENT_RE.test(body.eKey || "") ? body.eKey : "",
  };
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = body[key] ?? OPTIONAL[key];
    if (!Number.isInteger(value) || value < 0 || value > max) return { error: "value out of range" };
    values[key] = value;
  }
  return { id: body.id, token: body.token, values };
}

/** The best rows by one score column, optionally limited to one day or event. */
async function top(db, column, filter = "", ...args) {
  const where = [`${column} > 0`, filter].filter(Boolean).join(" AND ");
  const { results } = await db.prepare(`${SELECT_ROWS} WHERE ${where} ORDER BY ${column} DESC LIMIT ${LEADERBOARD_SIZE}`).bind(...args).all();
  return results;
}

/** The rows of the named players (the caller's friends), whatever their rank. */
async function byName(db, names) {
  if (!names.length) return [];
  const marks = names.map(() => "?").join(", ");
  const { results } = await db.prepare(`${SELECT_ROWS} WHERE nick COLLATE NOCASE IN (${marks})`).bind(...names).all();
  return results;
}

/** One list per leaderboard tab plus friends (`f=name`, repeatable), merged: nobody appears twice. */
async function getScores(request, env) {
  const params = new URL(request.url).searchParams, day = params.get("d") || "", event = params.get("e") || "";
  const friends = params.getAll("f").map((name) => name.trim()).filter(Boolean).slice(0, MAX_FRIENDS);
  const lists = await Promise.all([
    byName(env.DB, friends),
    top(env.DB, "total"),
    top(env.DB, "stars"),
    DATE_RE.test(day) ? top(env.DB, "d_score", "d_date = ?", day) : [],
    EVENT_RE.test(event) ? top(env.DB, "e_score", "e_key = ?", event) : [],
  ]);
  const rows = new Map();
  for (const row of lists.flat()) rows.set(row.id, toClient(row));
  return json({ rows: [...rows.values()] });
}

/** Refuses an offensive name and counts the attempt. Too many in a row lock the player out. */
async function rejectName(db, who, now) {
  const windowStart = now - STRIKE_WINDOW_MS;
  const [strike] = await db.batch([
    db.prepare(ADD_STRIKE).bind(who, now, windowStart, MAX_STRIKES, now + LOCKOUT_MS),
    db.prepare(DROP_OLD_STRIKES).bind(windowStart, now),
  ]);
  const wait = strike.results[0].blocked_until - now;
  return wait > 0 ? json({ error: "locked out", wait }, 429) : error("name not allowed", 422);
}

async function postScore(request, env) {
  let body;
  try { body = await request.json(); } catch { return error("bad json", 400); }
  const score = parseScore(body);
  if (score.error) return error(score.error, 400);
  const values = Object.keys(FIELDS).map((key) => score.values[key]), now = Date.now(), { nick } = score.values;
  const tokenHash = await sha256(score.token);
  if (isProfane(nick)) {
    // Shows up in the Worker's logs, so repeat offenders can be spotted. No IP address.
    console.log({ message: "name refused", player: score.id, name: nick, country: request.cf?.country || "" });
    return rejectName(env.DB, tokenHash, now);
  }
  const statements = [env.DB.prepare(UPSERT).bind(score.id, tokenHash, ...values, now)];
  if (nick) statements.unshift(env.DB.prepare(RELEASE_STALE_NICK).bind(nick, score.id, now - NICK_HOLD_MS));
  let results;
  try {
    results = await env.DB.batch(statements);
  } catch (err) {
    // The only unique index besides the primary key is the one on names (migrations/0002).
    if (/UNIQUE constraint failed/i.test(String(err && err.message))) return error("name taken", 409);
    throw err;
  }
  if (!results.at(-1).meta.changes) return error("this player id belongs to someone else", 403);
  return json({ ok: true });
}

const isAdmin = (request, env) => !!env.ADMIN_KEY && request.headers.get("authorization") === `Bearer ${env.ADMIN_KEY}`;
const utcDay = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

/** Adds one to today's count for an event. Unknown names are accepted and dropped. */
async function postEvent(request, env) {
  let body;
  try { body = await request.json(); } catch { return error("bad json", 400); }
  if (body && EVENT_NAMES.has(body.name))
    await env.DB.prepare("INSERT INTO events (day, name, count) VALUES (?, ?, 1) ON CONFLICT(day, name) DO UPDATE SET count = count + 1").bind(utcDay(), body.name).run();
  return json({ ok: true });
}

async function getStats(request, env) {
  if (!isAdmin(request, env)) return error("forbidden", 403);
  const days = Math.min(MAX_STATS_DAYS, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
  const since = utcDay(Date.now() - (days - 1) * 86_400_000);
  const { results } = await env.DB.prepare("SELECT day, name, count FROM events WHERE day >= ? ORDER BY day DESC, name").bind(since).all();
  return json({ since, events: results });
}

async function deleteScore(request, env, id) {
  if (!isAdmin(request, env)) return error("forbidden", 403);
  await env.DB.prepare("DELETE FROM scores WHERE id = ?").bind(decodeURIComponent(id)).run();
  return json({ ok: true });
}

// A capture group in `path` is passed to the handler as its third argument.
const ROUTES = [
  { method: "GET", path: /^\/api\/scores$/, handler: getScores },
  { method: "POST", path: /^\/api\/score$/, handler: postScore },
  { method: "DELETE", path: /^\/api\/score\/([^/]+)$/, handler: deleteScore },
  { method: "POST", path: /^\/api\/event$/, handler: postEvent },
  { method: "GET", path: /^\/api\/stats$/, handler: getStats },
];

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      for (const { method, path, handler } of ROUTES) {
        const match = request.method === method && pathname.match(path);
        if (match) return await handler(request, env, match[1]);
      }
      return error("not found", 404);
    } catch (err) {
      console.error(err);
      return error("server error", 500);
    }
  },
};
