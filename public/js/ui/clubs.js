// Clubs: the "Clubs" tab of the leaderboard. A player founds a club or joins one by code or
// link; a club's score is the sum of its members' season points. Server side: src/clubs.js.

import { $, esc } from '../dom.js';
import { player, persist } from '../player.js';
import { awardNewBadges } from '../badges.js';
import { seasonId } from '../season.js';
import { avatarOf, avatarHtml } from '../avatars.js';
import { num } from '../format.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { currentScreen } from '../router.js';
import { modal, confirmDialog } from './modal.js';
import { playerId, credentials, sync } from './leaderboard.js';

const JSON_HEADERS = { 'content-type': 'application/json' };
// Why the server said no: its error text -> the text that tells the player.
const ERRORS = {
  'name taken': 'club.taken', 'name not allowed': 'nick.bad', 'name too short': 'club.short',
  'no such club': 'club.missing', 'club full': 'club.full', forbidden: 'club.first',
};

let data = null; // last answer of /api/clubs: { clubs, club, members }
let asked = 0;   // counts the requests, so a slow old answer never replaces a newer one

async function post(path, body) {
  await sync(); // a brand-new player has no row on the server until their first sync
  try {
    const res = await fetch('/api/club' + path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ ...credentials(), ...body }) });
    const answer = await res.json();
    return res.ok ? answer : { failed: ERRORS[answer.error] || 'board.error' };
  } catch { return { failed: 'board.error' }; }
}

function joined(club) {
  player.club = club;
  awardNewBadges();
  persist();
  track('club_joined');
  loadClubs();
}

const say = key => { $('#bnote').textContent = t(key); };

async function create() {
  const answer = await post('', { name: $('#clubName').value });
  if (answer.failed) say(answer.failed); else joined(answer.club);
}

async function join(code) {
  const answer = await post('/join', { code });
  if (answer.failed) say(answer.failed); else joined(answer.club);
  return !answer.failed;
}

async function leave() {
  const answer = await post('/leave', {});
  if (answer.failed) { say(answer.failed); return; }
  player.club = null;
  persist();
  loadClubs();
}

async function invite() {
  const url = location.origin + '/?' + new URLSearchParams({ club: player.club.code });
  try {
    if (navigator.share) await navigator.share({ title: 'Arrows Escape', text: t('club.share.text', { name: player.club.name }), url });
    else { await navigator.clipboard.writeText(url); say('share.copied'); }
  } catch { /* the player closed the share sheet */ }
}

function myClubHtml() {
  const club = player.club, members = data?.members || [];
  const rows = members.map((m, i) => {
    const name = m.nick || t('board.player', { id: String(m.id).slice(0, 4).toUpperCase() });
    return `<div class="row ${m.id === playerId ? 'me' : ''}"><span class="rk">${i + 1}</span>${avatarHtml(avatarOf(m.avatar, m.id))}<span class="nm">${esc(name)}</span><span class="vl">${num(m.score)}</span></div>`;
  }).join('');
  return `<div class="card club"><div class="chead"><b>${esc(club.name)}</b><small>${t('club.code', { code: club.code })}</small></div>
  <div class="rows">${rows}</div>
  <div class="acts"><button class="btn" id="clubLeave" type="button">${t('club.leave')}</button><button class="btn main" id="clubInvite" type="button">${t('club.invite')}</button></div></div>`;
}

const formsHtml = () => `
  <div class="nick"><input id="clubName" maxlength="20" placeholder="${t('club.name')}" aria-label="${t('club.name')}"><button class="btn" id="clubCreate" type="button">${t('club.create')}</button></div>
  <div class="nick"><input id="clubCode" maxlength="6" placeholder="${t('club.code.placeholder')}" aria-label="${t('club.code.placeholder')}" autocapitalize="characters"><button class="btn" id="clubJoin" type="button">${t('club.join')}</button></div>`;

function clubRow(club, rank) {
  const mine = player.club && club.code === player.club.code;
  return `<div class="row ${mine ? 'me' : ''} ${rank <= 3 ? 'g' + rank : ''}"><span class="rk">${rank}</span><span class="nm">${esc(club.name)}</span><small style="color:var(--mute)">${t('club.members', { n: club.members })}</small><span class="vl">${num(club.score)}</span></div>`;
}

/** Draws the Clubs tab from the last answer of the server. */
export function renderClubs() {
  if (currentScreen() !== 'board') return;
  $('#clubBox').innerHTML = player.club ? myClubHtml() : formsHtml();
  const clubs = data?.clubs || [];
  $('#rows').innerHTML = clubs.length ? clubs.map((club, i) => clubRow(club, i + 1)).join('')
    : `<div class="card note" style="margin:0">${t(data ? 'club.none' : 'board.loading')}</div>`;
  if (player.club) {
    $('#clubLeave').onclick = () => confirmDialog(esc(t('club.leave.ask', { name: player.club.name })), t('club.leave'), leave);
    $('#clubInvite').onclick = invite;
  } else {
    $('#clubCreate').onclick = create;
    $('#clubJoin').onclick = () => join($('#clubCode').value);
  }
}

/** Fetches the ranking and the player's own club, then draws the tab. */
export async function loadClubs() {
  renderClubs();
  try {
    const request = ++asked;
    const res = await fetch('/api/clubs?' + new URLSearchParams({ s: seasonId(), id: playerId || '' }), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const answer = await res.json();
    if (request !== asked) return;
    data = answer;
    // The server knows which club the player is in: it may have been deleted, or joined on another visit.
    if (JSON.stringify(player.club) !== JSON.stringify(data.club)) { player.club = data.club; persist(); }
  } catch { data = data || { clubs: [], club: null, members: [] }; say('board.error'); }
  renderClubs();
}

/** Call once at startup. Returns true when the page was opened from a club invitation. */
export function openClubLink() {
  const code = (new URLSearchParams(location.search).get('club') || '').toUpperCase();
  if (!code) return false;
  history.replaceState(null, '', location.pathname);
  modal(`<h2>${t('club.invited.title')}</h2><p>${t('club.invited.text')}</p>
  <div class="acts"><button class="btn" data-act="close">${t('not.now')}</button><button class="btn main" data-act="join">${t('club.join')}</button></div>`,
  {
    join: async () => {
      const ok = await join(code);
      modal(`<h2>${t('tab.clubs')}</h2><p>${ok ? esc(t('club.joined', { name: player.club.name })) : t('club.missing')}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);
    },
  });
  return true;
}
