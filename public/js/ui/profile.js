// A player's public profile: name, avatar, club, numbers and badges. Opened from the
// leaderboard, from the badges screen (your own) and from a shared link (?p=<player id>).

import { esc } from '../dom.js';
import { BADGES, badgesFromBits, badgeName } from '../badges.js';
import { avatarOf, avatarHtml } from '../avatars.js';
import { isFriend } from '../friends.js';
import { seasonId } from '../season.js';
import { num } from '../format.js';
import { t } from '../i18n.js';
import { track } from '../analytics.js';
import { modal, confirmDialog } from './modal.js';
import { playerId, toggleFriend, reportPlayer } from './leaderboard.js';

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const profileLink = id => location.origin + '/?' + new URLSearchParams({ p: id });

async function shareProfile(id) {
  const url = profileLink(id);
  try {
    if (navigator.share) await navigator.share({ title: 'Arrows Escape', text: t('profile.share.text'), url });
    else await navigator.clipboard.writeText(url);
  } catch { /* the player closed the share sheet */ }
}

const message = text => modal(`<h2>${t('profile')}</h2><p>${text}</p><div class="acts"><button class="btn main" data-act="close">${t('ok')}</button></div>`);

export async function openProfile(id) {
  if (!ID_RE.test(id || '')) return;
  let p = null, missing = false;
  try {
    const res = await fetch('/api/player/' + id, { cache: 'no-store' });
    if (res.ok) p = await res.json();
    else missing = res.status === 404;
  } catch { /* offline */ }
  const mine = id === playerId;
  if (!p) { message(t(missing ? (mine ? 'profile.none.mine' : 'profile.none') : 'board.error')); return; }
  track('profile_view');
  const name = p.nick || t('board.player', { id: String(p.id).slice(0, 4).toUpperCase() }), friend = p.nick && isFriend(p.nick);
  const earned = badgesFromBits(p.badges || 0);
  const stats = [
    [p.stars, t('stat.stars')], [p.cleared, t('stat.levels')], [p.bosses, t('stat.bosses')],
    [num(p.total), t('stat.score')], [num(p.endless), t('endless')], [num(p.sKey === seasonId() ? p.sScore : 0), t('tab.season')],
  ];
  const buttons = [
    mine && `<button class="btn" data-act="share">${t('profile.share')}</button>`,
    !mine && p.nick && `<button class="btn" data-act="friend">${t(friend ? 'friend.remove' : 'friend.add')}</button>`,
    !mine && p.nick && `<button class="btn" data-act="report">${t('report')}</button>`,
    `<button class="btn main" data-act="close">${t('close')}</button>`,
  ].filter(Boolean);
  modal(`<div class="pcard">${avatarHtml(avatarOf(p.avatar, p.id))}<h2>${esc(name)}</h2>${p.club ? `<small class="note" style="margin:0">${esc(t('profile.club', { name: p.club }))}</small>` : ''}</div>
  <div class="stats">${stats.map(([value, label]) => `<div class="stat"><b>${value}</b><small>${label}</small></div>`).join('')}</div>
  <h3 class="sect" style="text-align:left">${t('profile.badges', { n: earned.length, total: BADGES.length })}</h3>
  <div class="facts" style="justify-content:flex-start">${earned.length ? earned.map(b => `<span>${badgeName(b)}</span>`).join('') : `<span>${t('profile.badges.none')}</span>`}</div>
  <div style="display:grid;gap:10px;margin-top:6px">${buttons.join('')}</div>`,
  {
    share: () => shareProfile(id),
    friend: () => toggleFriend(p.nick),
    report: () => confirmDialog(esc(t('report.ask', { name })), t('report'), () => reportPlayer(id)),
  });
}

/** Call once at startup. Returns true when the page was opened from a profile link. */
export function openProfileLink() {
  const id = new URLSearchParams(location.search).get('p');
  if (!id) return false;
  history.replaceState(null, '', location.pathname);
  openProfile(id);
  return true;
}
