// Home screen: the play button and the tiles that open every other screen.

import { $ } from '../dom.js';
import { BOSSES, MAX_STARS, EVENT_STAGES } from '../content.js';
import { player, nextLevel, eventState, totalStars, bossesBeaten, powersOwned, currentStreak } from '../player.js';
import { weekInfo } from '../week.js';
import { levelCfg, dailyCfg, worldOf } from '../levels.js';
import { today, duration, num } from '../format.js';
import { ico } from '../icons.js';
import { registerScreen, show, currentScreen } from '../router.js';
import { t } from '../i18n.js';
import { modal } from './modal.js';
import { previewLevel } from './preview.js';
import { startEndless } from '../game/session.js';
import { openSettings } from './settings.js';
import { openToday, giftReady } from './today.js';
import { missionsDone, missionsToClaim } from '../missions.js';

const REFRESH_MS = 30000; // keeps the event countdown current

function renderEventTile(wk) {
  const ev = wk.ev, es = eventState(wk.key), tile = $('#tEvent');
  const progress = ev.kind === 'rush'
    ? t('home.best.run', { n: num(es.best || 0) })
    : t('home.stages', { n: Object.keys(es.stages).length, total: EVENT_STAGES });
  tile.style.setProperty('--c', ev.col);
  tile.innerHTML = `<span class="evi">${ico(ev.d)}</span><span class="tx"><small>${t('home.event.kicker')}</small><b>${ev.name}</b><small>${progress}</small></span><span class="cd">${t('ends.in', { time: duration(wk.end - Date.now()) })}</span>`;
}

function renderHome() {
  const g = nextLevel(), wk = weekInfo(), streak = currentStreak();
  $('#playLbl').textContent = g ? levelCfg(g).title : t('daily.short');
  $('#wkBanner').hidden = !wk.weekend;
  renderEventTile(wk);
  const daily = player.daily.d === today() ? t('home.daily.best', { n: num(player.daily.score) }) : t('home.daily.new');
  $('#dailySub').textContent = daily + (streak ? ' · ' + t('streak.short', { n: streak }) : '');
  $('#endlessSub').textContent = player.endless.best ? t('home.best.run', { n: num(player.endless.best) }) : t('home.endless.new');
  $('#worldsSub').textContent = t('home.worlds', { stars: totalStars(), max: MAX_STARS, bosses: bossesBeaten(), total: BOSSES.length });
  $('#shopSub').textContent = t('home.bag', { n: powersOwned() });
  // The red dot says there is something to collect: the gift or a finished mission.
  $('#todaySub').textContent = giftReady() ? t('gift.ready') : t('home.missions', { n: missionsDone(), total: 3 });
  $('#tToday .dotb')?.remove();
  if (giftReady() || missionsToClaim()) $('#tToday').insertAdjacentHTML('beforeend', '<i class="dotb"></i>');
}

function openEndless() {
  const { best, boards } = player.endless;
  modal(`<span class="kick" style="--c:#0f9d76">${t('endless')}</span><h2>${t('endless.title')}</h2><p>${t('endless.text')}</p>
  ${best ? `<p style="margin:0;color:var(--mute)">${t('endless.best', { score: `<b style="color:var(--ink)">${num(best)}</b>`, n: boards })}</p>` : ''}
  <div class="acts"><button class="btn" data-act="close">${t('close')}</button><button class="btn main" data-act="play">${t('play')}</button></div>`,
  { play: startEndless });
}

function playNext() {
  const g = nextLevel();
  previewLevel(g ? levelCfg(g) : dailyCfg());
}

export function initHome() {
  registerScreen('home', renderHome);
  $('#playBtn').onclick = playNext;
  $('#tDaily').onclick = () => previewLevel(dailyCfg());
  $('#tEvent').onclick = () => show('event');
  $('#tEndless').onclick = openEndless;
  $('#tWorlds').onclick = () => show('map', { world: worldOf(nextLevel() || 1) });
  $('#tBoard').onclick = () => show('board');
  $('#tShop').onclick = () => show('shop');
  $('#badgeBtn').onclick = () => show('badges');
  $('#tToday').onclick = openToday;
  $('#gear').onclick = openSettings;
  setInterval(() => { if (currentScreen() === 'home') renderHome(); }, REFRESH_MS);
}
