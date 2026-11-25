// The dialog shown before a board starts: what it is, its goals and the player's best so far.

import { ATTACKS, BOSS_REWARD, STAGE_REWARDS } from '../content.js';
import { build, rewardLabel } from '../levels.js';
import { bestFor } from '../progress.js';
import { clock, num } from '../format.js';
import { COIN, portrait, star } from '../icons.js';
import { startGame } from '../game/session.js';
import { t } from '../i18n.js';
import { modal } from './modal.js';

const kicker = (cfg, text) => `<span class="kick" style="--c:${cfg.col}">${text}</span>`;

function bossHeader(cfg) {
  const boss = cfg.boss;
  return `${portrait(boss)}${kicker(cfg, t('world.boss', { n: cfg.w }))}<h2>${boss.name}</h2><p>${boss.line}</p>
  <div class="atks">${boss.atk.map(a => `<div><b>${ATTACKS[a].name}</b>${ATTACKS[a].desc}</div>`).join('')}<div><b>${t('weak.title')}</b>${t('weak.text')}</div></div>
  <p style="margin:10px 0 0">${t('first.win')} <b class="price">${COIN}${BOSS_REWARD}</b></p>`;
}

const HEADERS = {
  level: cfg => cfg.boss ? bossHeader(cfg) : `${kicker(cfg, t('preview.world', { n: cfg.w, name: cfg.world.name }))}<h2>${t('level.title', { id: cfg.title })}</h2>`,
  daily: cfg => `${kicker(cfg, cfg.date)}<h2>${t('tile.daily')}</h2><p>${t('preview.daily.text')}</p>`,
  event: cfg => `${kicker(cfg, t('preview.event', { event: cfg.ev.name }))}<h2>${cfg.subtitle}</h2><p>${t('preview.reward', { reward: rewardLabel(STAGE_REWARDS[cfg.stage - 1]) })}</p>`,
};

function facts(cfg, board) {
  const items = [
    t('fact.board', { w: cfg.W, h: cfg.H }), t('fact.arrows', { n: board.arrows.length }), t('fact.clock', { time: clock(cfg.limit) }),
    board.iceCount && t('fact.ice', { n: board.iceCount }), board.goldCount && t('fact.gold', { n: board.goldCount }), cfg.dark && t('fact.dark'),
  ];
  return `<div class="facts">${items.filter(Boolean).map(text => `<span>${text}</span>`).join('')}</div>`;
}

function goals(cfg) {
  const items = [cfg.boss ? t('goal.boss') : t('goal.clear'), t('goal.hearts'), t('goal.time', { time: clock(cfg.par) })];
  return `<div class="goals">${items.map(text => `<div>${star(true)}${text}</div>`).join('')}</div>`;
}

export function previewLevel(cfg) {
  const board = build(cfg), best = bestFor(cfg);
  modal(`${HEADERS[cfg.kind](cfg)}${facts(cfg, board)}${goals(cfg)}
  ${best ? `<p style="margin:12px 0 0;color:var(--mute)">${t('preview.best', { score: `<b style="color:var(--ink)">${num(best.b || 0)}</b>`, time: clock(best.t || 0) })}</p>` : ''}
  <div class="acts"><button class="btn" data-act="close">${t('close')}</button><button class="btn main" data-act="play">${cfg.boss ? t('fight') : t('play')}</button></div>`,
  { play: () => startGame(cfg) });
}
