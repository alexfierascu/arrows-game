// Clubs: small groups of players, ranked by the season points of their members.
//   POST /api/club          { id, token, name }   found a club and join it
//   POST /api/club/join     { id, token, code }   join by code
//   POST /api/club/leave    { id, token }         leave; a club without members is deleted
//   GET  /api/clubs?s=YYYY-MM&id=<player id>      the ranking, plus that player's club and its members

import { isProfane } from "./profanity.js";
import { json, error, readJson, randomCode, cleanText, knownPlayer, ID_RE } from "./http.js";

const MAX_MEMBERS = 20;
const NAME_MIN = 3, NAME_MAX = 20;
const CODE_LENGTH = 6;
const LIST_SIZE = 50;
const CODE_RE = /^[A-Z0-9]{6}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const DROP_EMPTY = "DELETE FROM clubs WHERE id = ? AND NOT EXISTS (SELECT 1 FROM scores WHERE club = clubs.id)";

/** Moves a player to a club ('' for none) and tidies up the one they left. */
async function setClub(db, player, club) {
  const old = await db.prepare("SELECT club FROM scores WHERE id = ?").bind(player).first("club");
  await db.prepare("UPDATE scores SET club = ? WHERE id = ?").bind(club, player).run();
  if (old && old !== club) await db.prepare(DROP_EMPTY).bind(old).run();
}

export async function createClub(request, env) {
  const body = await readJson(request);
  if (!body || !(await knownPlayer(env.DB, body.id, body.token))) return error("forbidden", 403);
  const name = cleanText(body.name, NAME_MAX);
  if ([...name].length < NAME_MIN) return error("name too short", 400);
  if (isProfane(name)) return error("name not allowed", 422);
  const code = randomCode(CODE_LENGTH);
  try {
    await env.DB.prepare("INSERT INTO clubs (id, name, owner, created_at) VALUES (?, ?, ?, ?)").bind(code, name, body.id, Date.now()).run();
  } catch (err) {
    if (/UNIQUE constraint failed/i.test(String(err && err.message))) return error("name taken", 409);
    throw err;
  }
  await setClub(env.DB, body.id, code);
  return json({ club: { code, name } });
}

export async function joinClub(request, env) {
  const body = await readJson(request);
  if (!body || !(await knownPlayer(env.DB, body.id, body.token))) return error("forbidden", 403);
  const code = String(body.code || "").trim().toUpperCase();
  if (!CODE_RE.test(code)) return error("no such club", 404);
  const club = await env.DB.prepare("SELECT id, name, (SELECT COUNT(*) FROM scores WHERE club = clubs.id AND id <> ?2) AS members FROM clubs WHERE id = ?1")
    .bind(code, body.id).first();
  if (!club) return error("no such club", 404);
  if (club.members >= MAX_MEMBERS) return error("club full", 409);
  await setClub(env.DB, body.id, code);
  return json({ club: { code, name: club.name } });
}

export async function leaveClub(request, env) {
  const body = await readJson(request);
  if (!body || !(await knownPlayer(env.DB, body.id, body.token))) return error("forbidden", 403);
  await setClub(env.DB, body.id, "");
  return json({ ok: true });
}

/** The best clubs of the month and, for player `id`, their club and its members. */
export async function getClubs(request, env) {
  const params = new URL(request.url).searchParams, month = params.get("s") || "", id = params.get("id") || "";
  if (!MONTH_RE.test(month)) return error("bad month", 400);
  const mine = ID_RE.test(id) ? (await env.DB.prepare("SELECT club FROM scores WHERE id = ?").bind(id).first("club")) || "" : "";
  const statements = [env.DB.prepare(`
    SELECT c.id AS code, c.name, COUNT(s.id) AS members, COALESCE(SUM(CASE WHEN s.s_key = ?1 THEN s.s_score ELSE 0 END), 0) AS score
    FROM clubs c JOIN scores s ON s.club = c.id GROUP BY c.id ORDER BY score DESC, c.created_at LIMIT ${LIST_SIZE}`).bind(month)];
  if (CODE_RE.test(mine)) statements.push(
    env.DB.prepare("SELECT id AS code, name FROM clubs WHERE id = ?").bind(mine),
    env.DB.prepare(`SELECT id, nick, avatar, CASE WHEN s_key = ?1 THEN s_score ELSE 0 END AS score FROM scores WHERE club = ?2 ORDER BY score DESC LIMIT ${MAX_MEMBERS}`).bind(month, mine));
  const [clubs, club, members] = await env.DB.batch(statements);
  return json({ clubs: clubs.results, club: club?.results[0] || null, members: members?.results || [] });
}

// ---------- admin ----------

export async function adminClubs(db) {
  const { results } = await db.prepare("SELECT c.id AS code, c.name, c.created_at, (SELECT COUNT(*) FROM scores WHERE club = c.id) AS members FROM clubs c ORDER BY c.created_at DESC LIMIT 200").all();
  return results;
}

export async function deleteClub(db, code) {
  await db.batch([
    db.prepare("UPDATE scores SET club = '' WHERE club = ?").bind(code),
    db.prepare("DELETE FROM clubs WHERE id = ?").bind(code),
  ]);
}
