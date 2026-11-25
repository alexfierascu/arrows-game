// Leaderboard: posts the player's scores to the Worker API (src/worker.js) and shows the top lists.
// Players have no accounts: each browser keeps a random id and a secret token that owns its row.

import { $, $$, esc, onDataClick } from '../dom.js';
import { player, persist, totalScore, totalStars, clearedCount, bossesBeaten, eventScore } from '../player.js';
import { weekInfo } from '../week.js';
import { today, clock, num, duration } from '../format.js';
import { registerScreen, currentScreen } from '../router.js';
import { t } from '../i18n.js';
import { ico } from '../icons.js';
import { avatarOf, avatarHtml } from '../avatars.js';
import { friends, isFriend, addFriend, removeFriend } from '../friends.js';
import { track } from '../analytics.js';
import { modal } from './modal.js';
import { openAvatarPicker } from './avatar-picker.js';
import { lockOut } from './lockout.js';

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
let friendsOnly = false;  // show only the player and their friends
let syncing = false, syncAgain = false, pollTimer = 0;

// ---------- tabs ----------

const byValue = (a, b) => b.value - a.value;

// How each tab picks, ranks and labels rows. `wk` is the current week; `empty` is a text key
// and `about` explains to the player what the tab ranks.
const TABS = {
  daily: {
    includes: r => r.dDate === today() && r.dScore > 0, value: r => r.dScore,
    sub: r => clock(r.dTime || 0), order: (a, b) => byValue(a, b) || a.dTime - b.dTime,
    empty: 'board.empty.daily', about: () => t('board.about.daily'),
  },
  event: {
    includes: (r, wk) => r.eKey === wk.key && r.eScore > 0, value: r => r.eScore,
    empty: 'board.empty.event',
    about: wk => t('board.about.event') + ' ' + t('ends.in', { time: duration(wk.end - Date.now()) }),
  },
  total: {
    includes: r => r.total > 0, value: r => r.total,
    sub: r => t('board.bosses', { n: r.bosses || 0 }), about: () => t('board.about.total'),
  },
  stars: { includes: r => r.stars > 0, value: r => r.stars, format: v => esc(v) + '★', about: () => t('board.about.stars') },
};

// ---------- network ----------

const HTTP_FORBIDDEN = 403, HTTP_NAME_TAKEN = 409, HTTP_BAD_NAME = 422, HTTP_LOCKED_OUT = 429;
// Why the server refused a name: HTTP status -> the text that tells the player.
const NAME_REFUSED = { [HTTP_NAME_TAKEN]: 'nick.taken', [HTTP_BAD_NAME]: 'nick.bad', [HTTP_LOCKED_OUT]: 'nick.bad' };

/** Sends the player's scores under the given name. Returns the HTTP status, or 0 when offline. */
async function postScores(nick) {
  const wk = weekInfo();
  const body = {
    id: playerId, token, nick, avatar: player.av,
    total: totalScore(), stars: totalStars(), cleared: clearedCount(), bosses: bossesBeaten(),
    dDate: player.daily.d || '', dScore: player.daily.score || 0, dTime: player.daily.time || 0,
    eKey: wk.key, eScore: eventScore(wk.key),
  };
  try {
    const res = await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === HTTP_LOCKED_OUT) lockOut((await res.json()).wait); // too many offensive names
    return res.status;
  } catch { return 0; }
}

/** Posts the player's current scores. Calls made while one is in flight collapse into one more. */
export async function sync() {
  if (!playerId || !token || !canWrite) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  const status = await postScores(player.nick || '');
  if (status === HTTP_FORBIDDEN) canWrite = false;
  // A name saved while offline turned out to be someone else's, or the name is no longer
  // allowed: drop it, post the scores without it, and let the next win ask for a new one.
  if (NAME_REFUSED[status]) { player.nick = ''; persist(); syncAgain = true; }
  syncing = false;
  if (syncAgain) { syncAgain = false; sync(); }
  else if (currentScreen() === 'board') fetchBoard();
}

async function fetchBoard() {
  try {
    // Friends are asked for by name, so they are listed even when they are outside the top lists.
    const query = new URLSearchParams({ d: today(), e: weekInfo().key });
    for (const name of friends()) query.append('f', name);
    const res = await fetch('/api/scores?' + query, { cache: 'no-store' });
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

const STAR_ICON = '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2l-5.6 3.1 1.2-6.3L3 9.6l6.3-.8z"/>';

/** The star that adds or removes a named player as a friend. Not shown on the player's own row. */
function friendButton(r, mine) {
  if (mine || !r.nick) return '';
  const on = isFriend(r.nick);
  return `<button class="fr ${on ? 'on' : ''}" data-friend="${esc(r.nick)}" aria-pressed="${on}" aria-label="${t(on ? 'friend.remove' : 'friend.add')}">${ico(STAR_ICON)}</button>`;
}

function rowHtml(r, rank, format = num) {
  const mine = r.id === playerId, name = r.nick || t('board.player', { id: String(r.id).slice(0, 4).toUpperCase() });
  return `<div class="row ${mine ? 'me' : ''} ${rank <= 3 ? 'g' + rank : ''}"><span class="rk">${rank}</span>${avatarHtml(avatarOf(r.avatar, r.id))}<span class="nm">${esc(name)}${mine ? ' ' + t('you') : ''}</span><small style="color:var(--mute)">${esc(r.sub)}</small><span class="vl">${format(r.value)}</span>${friendButton(r, mine)}</div>`;
}

function emptyText(view) {
  if (loadState === 'loading') return t('board.loading');
  if (loadState === 'err') return t('board.error');
  return t(friendsOnly && !friends().length ? 'friends.empty' : view.empty || 'board.empty');
}

function noteText() {
  if (loadState === 'stale') return t('board.stale');
  if (!canWrite) return t('board.readonly');
  return t('board.auto');
}

function renderBoard() {
  if (currentScreen() !== 'board') return;
  const view = TABS[tab], wk = weekInfo();
  const shown = r => !friendsOnly || r.id === playerId || isFriend(r.nick);
  const list = rows.filter(r => view.includes(r, wk) && shown(r))
    .map(r => ({ ...r, value: view.value(r), sub: view.sub ? view.sub(r) : '' }))
    .sort(view.order || byValue)
    .slice(0, LIST_SIZE);
  $('#rows').innerHTML = list.length
    ? list.map((r, i) => rowHtml(r, i + 1, view.format)).join('')
    : `<div class="card note" style="margin:0">${emptyText(view)}</div>`;
  $('#babout').textContent = view.about(wk);
  $('#friendsOnly').classList.toggle('on', friendsOnly);
  $('#friendsOnly').setAttribute('aria-pressed', friendsOnly);
  $('#friendAdd').hidden = !friendsOnly;
  $('#avBtn').innerHTML = avatarHtml(myAvatar());
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

// ---------- avatar and friends ----------

/** The player's avatar: their choice, or the one derived from their id until they choose. */
export const myAvatar = () => avatarOf(player.av, playerId);

function pickAvatar() {
  openAvatarPicker(myAvatar(), code => {
    player.av = code;
    persist();
    sync();
    renderBoard();
  });
}

/** Looks a player up by name on the server. Resolves to their row, or null. */
async function findPlayer(name) {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return null;
  try {
    const res = await fetch('/api/scores?' + new URLSearchParams({ f: name.trim() }), { cache: 'no-store' });
    const data = await res.json();
    return data.rows.find(r => r.nick && r.nick.toLowerCase() === wanted) || null;
  } catch { return null; }
}

/** Adds a friend by name if such a player exists. Resolves to the name as they spell it, or null. */
async function befriend(name) {
  const found = await findPlayer(name);
  if (!found || found.id === playerId || !addFriend(found.nick)) return null;
  track('friend_added');
  return found.nick;
}

async function addFriendFromForm() {
  const input = $('#friendName'), name = await befriend(input.value);
  $('#bnote').textContent = name ? t('friend.added', { name }) : t('friend.missing');
  if (!name) return;
  input.value = '';
  fetchBoard();
}

function toggleFriend(name) {
  if (isFriend(name)) removeFriend(name);
  else if (addFriend(name)) track('friend_added');
  renderBoard();
}

/** A link shared by another player (?friend=Name) makes them a friend when the game opens. */
async function acceptInvite() {
  const name = new URLSearchParams(location.search).get('friend');
  if (!name) return;
  history.replaceState(null, '', location.pathname);
  const added = await befriend(name);
  if (added) modal(`<h2>${t('friends')}</h2><p>${esc(t('friend.added', { name: added }))}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);
}

// Counted in characters, not UTF-16 units, so an emoji at the limit is never cut in half.
export const cleanNick = name => [...String(name).trim()].slice(0, NICK_MAX_LENGTH).join('').trim();

/**
 * Asks the server for a name and keeps it if the server accepts it. Resolves to null, or to
 * the key of the text saying why not: another player has it, or it is offensive. Offline, the
 * name is kept for now and checked by the next sync.
 */
export async function claimNick(name) {
  const nick = cleanNick(name);
  const refused = playerId && token && canWrite && NAME_REFUSED[await postScores(nick)];
  if (refused) return refused;
  if (nick && !player.nick) track('name_set');
  player.nick = nick;
  persist();
  if (currentScreen() === 'board') fetchBoard();
  return null;
}

async function saveNick() {
  $('#bnote').textContent = t(await claimNick($('#nick').value) || 'saved');
}

export function initLeaderboard() {
  registerScreen('board', openBoard);
  onDataClick('#btabs', 't', (name, button) => {
    tab = name;
    $$('#btabs .tab').forEach(b => b.classList.toggle('on', b === button));
    renderBoard();
  });
  $('#nickSave').onclick = saveNick;
  $('#avBtn').onclick = pickAvatar;
  $('#friendsOnly').onclick = () => { friendsOnly = !friendsOnly; renderBoard(); };
  $('#friendAddBtn').onclick = addFriendFromForm;
  onDataClick('#rows', 'friend', toggleFriend);
  acceptInvite();
  // Returning players: make sure the server has their latest scores.
  if (totalScore() > 0 || player.daily.d || eventScore(weekInfo().key)) sync();
}
