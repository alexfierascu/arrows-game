// Weekly event screen: a Time Attack run with score tiers, or a ladder of stages.

import { $, onDataClick } from '../dom.js';
import { STAGE_REWARDS, RUSH_TIERS, EVENT_STAGES } from '../content.js';
import { eventState } from '../player.js';
import { weekInfo } from '../week.js';
import { stageCfg, rewardLabel } from '../levels.js';
import { t } from '../i18n.js';
import { duration, num } from '../format.js';
import { ico, LOCK, CHECK, stars } from '../icons.js';
import { registerScreen, currentScreen } from '../router.js';
import { startRush } from '../game/session.js';
import { previewLevel } from './preview.js';

const REFRESH_MS = 30000;
const countdown = wk => t('ends.in', { time: duration(wk.end - Date.now()) });

function rushHtml(ev, es) {
  const best = es.best || 0;
  const tiers = RUSH_TIERS.map((tier, i) => {
    const reached = best >= tier.score;
    return `<div class="stg ${reached ? '' : 'lock'}" style="--c:${ev.col}"><span class="no">${i + 1}</span><span class="tx"><b>${t('tier.score', { n: num(tier.score) })}</b><small>${reached ? t('tier.done') : t('reward', { reward: t('coins', { n: tier.coins }) })}</small></span>${reached ? ico(CHECK) : ''}</div>`;
  }).join('');
  return `<div class="card" style="text-align:center"><small style="color:var(--mute)">${t('rush.best')}</small><div style="font:800 44px/1 'Baloo 2'">${num(best)}</div><small style="color:var(--mute)">${t('rush.boards', { n: es.boards || 0 })}</small></div>
  <div class="tiers">${tiers}</div>
  <button class="btn main play" id="rushGo" style="--c:${ev.col}" data-run>${t('rush.start')}</button>`;
}

function stageHtml(wk, es, n) {
  const cfg = stageCfg(wk, n), result = es.stages[n], open = n === 1 || es.stages[n - 1];
  const status = result ? t('stage.cleared', { n: num(result.b) }) : t('reward', { reward: rewardLabel(STAGE_REWARDS[n - 1]) });
  const action = open
    ? `<button class="btn ${result ? '' : 'main'}" data-stage="${n}" style="min-height:42px">${result ? t('replay') : t('play')}</button>`
    : ico(LOCK);
  return `<div class="stg ${open ? '' : 'lock'}" style="--c:${wk.ev.col}"><span class="no">${n}</span><span class="tx"><b>${t('stage.n', { n })}</b><small>${t('fact.board', { w: cfg.W, h: cfg.H })} · ${status}</small></span>
  ${result ? `<span class="st">${stars(result.s)}</span>` : ''}${action}</div>`;
}

function ladderHtml(wk, es) {
  const stages = Array.from({ length: EVENT_STAGES }, (_, i) => stageHtml(wk, es, i + 1));
  return `<div class="stages">${stages.join('')}</div>`;
}

function renderEvent() {
  const wk = weekInfo(), ev = wk.ev, es = eventState(wk.key), band = $('#evBand');
  band.style.setProperty('--c', ev.col);
  band.innerHTML = `<svg class="art" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ev.d}</svg><h3>${ev.name}</h3><p>${ev.desc}</p><b id="evCd">${countdown(wk)}</b>`;
  $('#evBody').innerHTML = ev.kind === 'rush' ? rushHtml(ev, es) : ladderHtml(wk, es);
  $('#evNext').textContent = t('event.next', { name: wk.next.name });
}

export function initEvent() {
  registerScreen('event', renderEvent);
  onDataClick('#evBody', 'stage', n => previewLevel(stageCfg(weekInfo(), +n)));
  onDataClick('#evBody', 'run', () => startRush());
  setInterval(() => {
    if (currentScreen() === 'event' && $('#evCd')) $('#evCd').textContent = countdown(weekInfo());
  }, REFRESH_MS);
}
