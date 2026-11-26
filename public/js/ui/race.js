// Live race: two players clear the same board at the same time. One opens a race and sends
// the link; the other joins; after a countdown both play, each seeing how many arrows the
// other has left. The first to clear the board wins. The server side is src/race.js.

import { $, esc } from '../dom.js';
import { player, persist } from '../player.js';
import { addCoins } from '../economy.js';
import { awardNewBadges } from '../badges.js';
import { raceCfg } from '../levels.js';
import { COIN } from '../icons.js';
import { sfx } from '../feedback.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { show } from '../router.js';
import { game } from '../game/state.js';
import { startGame } from '../game/session.js';
import { renderHud, toast } from '../game/hud.js';
import { modal, closeModal } from './modal.js';
import { myAvatar } from './leaderboard.js';

const LOBBY_POLL_MS = 1500, GAME_POLL_MS = 1500;
const LOBBY_TIMEOUT_MS = 10 * 60 * 1000;
const WIN_COINS = 40;
const JSON_HEADERS = { 'content-type': 'application/json' };

// The race in progress: { code, key, seed, state: play | won | lost, sent: last progress posted,
// toldOut: the other player's exit has been announced }.
let race = null;
let timer = 0;

const raceLink = code => {
  const query = new URLSearchParams({ race: code });
  if (player.nick) query.set('friend', player.nick);
  return location.origin + '/?' + query;
};

/** Talks to the server. Resolves to the JSON answer, or null when it fails. */
async function call(method, path, body) {
  try {
    const res = await fetch('/api/race' + path, { method, headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

function stop() {
  clearInterval(timer);
  timer = 0;
}

const message = (title, text) => modal(`<h2>${title}</h2><p>${text}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);

// ---------- before the game ----------

export function openRaceLobby() {
  modal(`<span class="kick" style="--c:#e5484d">${t('race')}</span><h2>${t('race.title')}</h2><p>${t('race.text')}</p>
  <div class="acts"><button class="btn" data-act="close">${t('close')}</button><button class="btn main" data-act="create">${t('race.create')}</button></div>`,
  { create });
}

async function create() {
  const made = await call('POST', '', { name: player.nick || '', avatar: myAvatar() });
  if (!made) { message(t('race'), t('race.failed')); return; }
  race = { ...made, state: 'play', sent: '' };
  const link = raceLink(race.code), since = Date.now();
  modal(`<h2>${t('race.wait.title')}</h2><p>${t('race.wait.text')}</p>
  <button class="btn share" id="raceShare" type="button"><span>${t('race.invite')}</span></button><p class="note" id="raceNote" role="status"></p>
  <div class="acts"><button class="btn" data-act="cancel">${t('cancel')}</button></div>`, { cancel: leaveRace });
  $('#raceShare').onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Arrows Escape', text: t('race.share.text'), url: link });
      else { await navigator.clipboard.writeText(link); $('#raceNote').textContent = t('share.copied'); }
    } catch { /* the player closed the share sheet */ }
  };
  stop();
  timer = setInterval(async () => {
    if (!race) { stop(); return; }
    if (Date.now() - since > LOBBY_TIMEOUT_MS) { leaveRace(); message(t('race'), t('race.gone')); return; }
    const state = await call('GET', `/${race.code}?key=${race.key}`);
    if (state && state.startsIn !== null && race && race.state === 'play' && timer) { stop(); countdown(state); }
  }, LOBBY_POLL_MS);
}

async function join(code) {
  const joined = await call('POST', `/${code}/join`, { name: player.nick || '', avatar: myAvatar() });
  if (!joined) { message(t('race'), t('race.gone')); return; }
  race = { code, key: joined.key, seed: joined.seed, state: 'play', sent: '' };
  countdown(joined);
}

/** Both players are in: counts the seconds down to the start the server set. */
function countdown(state) {
  const startAt = performance.now() + Math.max(0, state.startsIn), other = state.other || {};
  modal(`<span class="kick" style="--c:#e5484d">${t('race')}</span><h2>${esc(t('race.versus', { name: other.name || t('challenge.friend') }))}</h2>
  <div class="lockclock" id="raceCount" role="timer"></div><p>${t('race.ready')}</p>`);
  stop();
  const tick = () => {
    const left = startAt - performance.now(), label = $('#raceCount');
    if (left > 0 && label) { label.textContent = Math.ceil(left / 1000); return; }
    stop();
    closeModal();
    start(other);
  };
  tick();
  timer = setInterval(tick, 100);
}

// ---------- during the game ----------

function start(other) {
  track('race_start');
  startGame({ ...raceCfg(race.seed), race: { name: other.name || '', avatar: other.avatar || 0, left: -1 } });
  timer = setInterval(report, GAME_POLL_MS);
  report();
}

/** Tells the server how far this player is (only when that changed) and reads the other's progress. */
async function report() {
  if (!race) return;
  const mine = game.left + ':' + race.state, changed = mine !== race.sent;
  const state = changed
    ? await call('POST', '/' + race.code, { key: race.key, left: game.left, state: race.state })
    : await call('GET', `/${race.code}?key=${race.key}`);
  if (!state || !race) return state;
  if (changed) race.sent = mine;
  const other = state.other;
  if (other && game.race) {
    game.race.left = other.left;
    renderHud();
    if (other.state === 'won' && race.state === 'play') { game.over = true; race.state = 'lost'; report(); showResult('race.lost'); }
    else if ((other.state === 'lost' || other.state === 'left') && race.state === 'play' && !race.toldOut) {
      race.toldOut = true;
      toast(t('race.other.out', { name: other.name || t('challenge.friend') }), 3500);
    }
  }
  return state;
}

/** The game ended on this side: the board is clear (`cleared`) or the hearts or the clock ran out. */
export async function finishRace(cleared) {
  if (!race || race.state !== 'play') return;
  race.state = cleared ? 'won' : 'lost';
  const state = await report();
  // Both cleared the board in the same moment: the server says who was first.
  const won = cleared && (!state || state.you.state === 'won');
  showResult(won ? 'race.won' : cleared ? 'race.lost' : 'race.out', won);
}

function showResult(title, won = false) {
  stop();
  const other = game.race?.name || t('challenge.friend');
  if (won) {
    player.st.races++;
    awardNewBadges();
    addCoins(WIN_COINS); // saves
    track('race_win');
  }
  sfx(won ? 'win' : 'lose');
  race = null;
  modal(`<span class="kick" style="--c:#e5484d">${t('race')}</span><h2>${t(title)}</h2><p>${esc(t(title + '.text', { name: other }))}</p>
  ${won ? `<div class="gain"><span>${COIN}+${WIN_COINS}</span></div>` : ''}
  <div class="acts"><button class="btn" data-act="back">${t('back')}</button><button class="btn main" data-act="again">${t('race.again')}</button></div>`,
  { back: () => show('home'), again: () => { show('home'); openRaceLobby(); } });
  persist();
}

/** The player walked away: from the waiting dialog, or from the game through the pause menu. */
export function leaveRace() {
  stop();
  if (!race) return;
  const { code, key, state } = race;
  race = null;
  if (state === 'play') call('POST', '/' + code, { key, state: 'left' });
}

/** Call once at startup. Returns true when the page was opened from a race link. */
export function openRaceLink() {
  const query = new URLSearchParams(location.search), code = (query.get('race') || '').toUpperCase();
  if (!code) return false;
  const name = (query.get('friend') || '').slice(0, 16) || t('challenge.friend');
  history.replaceState(null, '', location.pathname);
  modal(`<span class="kick" style="--c:#e5484d">${t('race')}</span><h2>${t('race.title')}</h2><p>${esc(t('race.invited', { name }))}</p>
  <div class="acts"><button class="btn" data-act="close">${t('not.now')}</button><button class="btn main" data-act="join">${t('race.join')}</button></div>`,
  { join: () => join(code) });
  return true;
}
