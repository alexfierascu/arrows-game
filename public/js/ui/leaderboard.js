// Leaderboard: posts the player's scores to the Worker API (src/worker.js) and shows the top lists.
// Players have no accounts: each browser keeps a random id and a secret token that owns its row.

import { $, $$, esc, onDataClick } from '../dom.js';
import { player, persist, totalScore, totalStars, clearedCount, bossesBeaten, eventScore } from '../player.js';
import { weekInfo } from '../week.js';
import { today, clock, num } from '../format.js';
import { registerScreen, currentScreen } from '../router.js';

const POLL_MS = 20000;
export const NICK_MAX_LENGTH = 16;
const LIST_SIZE = 100;

// ---------- identity ----------

function stored(key, make) {
  try {
    let value = localStorage.getItem(key);
    if (!value) { value = make(); localStorage.setItem(key, value); }
    return value;
  } catch { return null; }
}
const uuid = () => crypto.randomUUID
  ? crypto.randomUUID()
  : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

const playerId = stored('ae-player-id', uuid);
const token = stored('ae-player-token', () => uuid() + uuid());

// ---------- state ----------

let canWrite = true;      // false once the server says this id belongs to another token
let rows = [];            // last rows fetched
let loadState = 'off';    // off | loading | ok | stale | err
let tab = 'daily';
let syncing = false, syncAgain = false, pollTimer = 0;

// ---------- tabs ----------

const byValue = (a, b) => b.value - a.value;

// How each tab picks, ranks and labels rows. `wk` is the current week.
const TABS = {
  daily: {
    includes: r => r.dDate === today() && r.dScore > 0, value: r => r.dScore,
    sub: r => clock(r.dTime || 0), order: (a, b) => byValue(a, b) || a.dTime - b.dTime,
    empty: 'No one has finished today’s daily challenge yet. Be the first.',
  },
  event: {
    includes: (r, wk) => r.eKey === wk.key && r.eScore > 0, value: r => r.eScore,
    empty: 'No event scores yet this week.',
  },
  total: {
    includes: r => r.total > 0, value: r => r.total,
    sub: r => (r.bosses || 0) + ((r.bosses || 0) === 1 ? ' boss' : ' bosses'),
  },
  stars: { includes: r => r.stars > 0, value: r => r.stars, format: v => esc(v) + '★' },
};
const NO_SCORES = 'No scores yet. Clear a level to get on the board.';

// ---------- network ----------

/** Posts the player's current scores. Calls made while one is in flight collapse into one more. */
export async function sync() {
  if (!playerId || !token || !canWrite) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  const wk = weekInfo();
  const body = {
    id: playerId, token, nick: player.nick || '',
    total: totalScore(), stars: totalStars(), cleared: clearedCount(), bosses: bossesBeaten(),
    dDate: player.daily.d || '', dScore: player.daily.score || 0, dTime: player.daily.time || 0,
    eKey: wk.key, eScore: eventScore(wk.key),
  };
  try {
    const res = await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 403) canWrite = false;
  } catch { /* offline: the next win retries */ }
  syncing = false;
  if (syncAgain) { syncAgain = false; sync(); }
  else if (currentScreen() === 'board') fetchBoard();
}

async function fetchBoard() {
  try {
    const res = await fetch('/api/scores?d=' + encodeURIComponent(today()) + '&e=' + encodeURIComponent(weekInfo().key), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    rows = Array.isArray(data.rows) ? data.rows : [];
    loadState = 'ok';
  } catch {
    loadState = rows.length ? 'stale' : 'err';
  }
  renderBoard();
}

// ---------- rendering ----------

function rowHtml(r, rank, format = num) {
  const mine = r.id === playerId, name = r.nick || 'Player ' + String(r.id).slice(0, 4).toUpperCase();
  return `<div class="row ${mine ? 'me' : ''} ${rank <= 3 ? 'g' + rank : ''}"><span class="rk">${rank}</span><span class="nm">${esc(name)}${mine ? ' (you)' : ''}</span><small style="color:var(--mute)">${esc(r.sub)}</small><span class="vl">${format(r.value)}</span></div>`;
}

function emptyText(view) {
  if (loadState === 'loading') return 'Loading scores…';
  if (loadState === 'err') return 'Can’t reach the leaderboard right now.';
  return view.empty || NO_SCORES;
}

function noteText() {
  if (loadState === 'stale') return 'Couldn’t refresh; showing the last scores loaded.';
  if (!canWrite) return 'Your scores can’t be posted from this browser.';
  return 'Scores sync automatically after each win.';
}

function renderBoard() {
  if (currentScreen() !== 'board') return;
  const view = TABS[tab], wk = weekInfo();
  const list = rows.filter(r => view.includes(r, wk))
    .map(r => ({ ...r, value: view.value(r), sub: view.sub ? view.sub(r) : '' }))
    .sort(view.order || byValue)
    .slice(0, LIST_SIZE);
  $('#rows').innerHTML = list.length
    ? list.map((r, i) => rowHtml(r, i + 1, view.format)).join('')
    : `<div class="card note" style="margin:0">${emptyText(view)}</div>`;
  $('#bnote').textContent = noteText();
}

function openBoard() {
  $('#nick').value = player.nick || '';
  $('#evTab').textContent = weekInfo().ev.name;
  if (loadState === 'off') loadState = 'loading';
  fetchBoard();
  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (currentScreen() !== 'board') clearInterval(pollTimer);
    else if (!document.hidden) fetchBoard();
  }, POLL_MS);
  renderBoard();
}

export const cleanNick = name => String(name).trim().slice(0, NICK_MAX_LENGTH);

/** Stores the player's leaderboard name and posts it. */
export function setNick(name) {
  player.nick = cleanNick(name);
  persist();
  sync();
}

function saveNick() {
  setNick($('#nick').value);
  $('#bnote').textContent = 'Saved';
}

export function initLeaderboard() {
  registerScreen('board', openBoard);
  onDataClick('#btabs', 't', (name, button) => {
    tab = name;
    $$('#btabs .tab').forEach(b => b.classList.toggle('on', b === button));
    renderBoard();
  });
  $('#nickSave').onclick = saveNick;
  // Returning players: make sure the server has their latest scores.
  if (totalScore() > 0 || player.daily.d || eventScore(weekInfo().key)) sync();
}
