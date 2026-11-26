// Link previews: when a challenge, profile, race or club link is pasted into a chat, the chat
// app fetches the page and shows its title, text and picture. This fills them in for the link.

import { isProfane } from "./profanity.js";
import { cleanText, ID_RE } from "./http.js";

const LEVELS_PER_WORLD = 12, TOTAL_LEVELS = 60;
const MAX_SCORE = 5_000_000;
const TAGLINE = "Arrows Escape: slide every arrow off the board. Free, no account needed.";

const number = (n) => Number(n).toLocaleString("en-US");

/** What a challenge code (see public/js/challenge.js) is called, or null when it is not one. */
function boardName(code) {
  const rest = code.slice(1);
  if (code[0] === "l") {
    const g = Number(rest);
    if (!Number.isInteger(g) || g < 1 || g > TOTAL_LEVELS) return null;
    const world = Math.ceil(g / LEVELS_PER_WORLD);
    return `level ${world}-${g - (world - 1) * LEVELS_PER_WORLD}`;
  }
  if (code[0] === "d") return /^\d{4}-\d{2}-\d{2}$/.test(rest) ? "the daily challenge" : null;
  if (code[0] === "e") return /^\d+-\d$/.test(rest) ? "this week’s event" : null;
  if (code[0] === "r") return /^\d+$/.test(rest) ? "Time Attack" : null;
  return code === "x" ? "Endless" : null;
}

const safeName = (name) => { const text = cleanText(name, 16); return text && !isProfane(text) ? text : ""; };

/** The preview { title, text } for the page's query, or null for a plain visit. */
async function previewFor(params, env) {
  const code = params.get("c"), score = Number(params.get("s"));
  if (code) {
    const board = boardName(code), name = safeName(params.get("friend")) || "A friend";
    if (!board || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) return null;
    return { title: `${name} scored ${number(score)} on ${board}. Can you beat it?`, text: TAGLINE };
  }
  if (params.has("race")) {
    const name = safeName(params.get("friend"));
    return { title: `${name || "A friend"} wants to race you in Arrows Escape`, text: "Same board, same time. The first to clear it wins." };
  }
  if (params.has("club")) return { title: "Join my club in Arrows Escape", text: "Play together and climb the club ranking." };
  const player = params.get("p");
  if (player && ID_RE.test(player)) {
    const row = await env.DB.prepare("SELECT nick, stars, cleared, total FROM scores WHERE id = ?").bind(player).first();
    if (!row) return null;
    return { title: `${row.nick || "A player"} on Arrows Escape`, text: `${row.stars} stars, ${row.cleared} levels cleared, ${number(row.total)} points. Can you do better?` };
  }
  return null;
}

/** The game's page, with the preview texts of this link written into its head. */
export async function pageWithPreview(request, env) {
  const page = await env.ASSETS.fetch(request);
  if (request.method !== "GET" || !page.ok) return page;
  let preview = null;
  try { preview = await previewFor(new URL(request.url).searchParams, env); } catch (err) { console.error(err); }
  if (!preview) return page;
  const set = (value) => ({ element(el) { el.setAttribute("content", value); } });
  const rewritten = new HTMLRewriter()
    .on('meta[property="og:title"]', set(preview.title))
    .on('meta[name="twitter:title"]', set(preview.title))
    .on('meta[property="og:description"]', set(preview.text))
    .on('meta[name="description"]', set(preview.text))
    .transform(page);
  const headers = new Headers(rewritten.headers);
  headers.set("cache-control", "no-store");
  return new Response(rewritten.body, { status: rewritten.status, headers });
}
