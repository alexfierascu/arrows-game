// The dialog shown before a board starts: what it is, its goals and the player's best so far.

import { ATTACKS, BOSS_REWARD, EVENT_STAGES, STAGE_REWARDS } from '../content.js';
import { build } from '../levels.js';
import { bestFor } from '../progress.js';
import { clock, num } from '../format.js';
import { COIN, portrait, star } from '../icons.js';
import { startGame } from '../game/session.js';
import { modal } from './modal.js';

const kicker = (cfg, text) => `<span class="kick" style="--c:${cfg.col}">${text}</span>`;

function bossHeader(cfg) {
  const boss = cfg.boss;
  return `${portrait(boss)}${kicker(cfg, 'World ' + cfg.w + ' boss')}<h2>${boss.name}</h2><p>${boss.line}</p>
  <div class="atks">${boss.atk.map(a => `<div><b>${ATTACKS[a].name}</b>${ATTACKS[a].desc}</div>`).join('')}<div><b>Weak spots</b>Gold arrows deal triple damage. Clearing every arrow defeats the boss.</div></div>
  <p style="margin:10px 0 0">First win: <b class="price">${COIN}${BOSS_REWARD}</b></p>`;
}

const HEADERS = {
  level: cfg => cfg.boss ? bossHeader(cfg) : `${kicker(cfg, 'World ' + cfg.w + ' · ' + cfg.world.name)}<h2>Level ${cfg.title}</h2>`,
  daily: cfg => `${kicker(cfg, cfg.date)}<h2>Daily challenge</h2><p>One new board every day. Your best score today goes on the leaderboard.</p>`,
  event: cfg => `${kicker(cfg, cfg.ev.name + ' event')}<h2>Stage ${cfg.stage} of ${EVENT_STAGES}</h2><p>Reward for first clear: ${STAGE_REWARDS[cfg.stage - 1].label}</p>`,
};

function facts(cfg, board) {
  const items = [
    `${cfg.W}×${cfg.H} board`, `${board.arrows.length} arrows`, `Clock ${clock(cfg.limit)}`,
    board.iceCount && `${board.iceCount} ice`, board.goldCount && `${board.goldCount} gold`, cfg.dark && 'Dark board',
  ];
  return `<div class="facts">${items.filter(Boolean).map(t => `<span>${t}</span>`).join('')}</div>`;
}

function goals(cfg) {
  const items = [cfg.boss ? 'Defeat the boss' : 'Clear the board', 'Lose no hearts', 'Finish within ' + clock(cfg.par)];
  return `<div class="goals">${items.map(t => `<div>${star(true)}${t}</div>`).join('')}</div>`;
}

export function previewLevel(cfg) {
  const board = build(cfg), best = bestFor(cfg);
  modal(`${HEADERS[cfg.kind](cfg)}${facts(cfg, board)}${goals(cfg)}
  ${best ? `<p style="margin:12px 0 0;color:var(--mute)">Best: <b style="color:var(--ink)">${num(best.b || 0)}</b> points in ${clock(best.t || 0)}</p>` : ''}
  <div class="acts"><button class="btn" data-act="close">Close</button><button class="btn main" data-act="play">${cfg.boss ? 'Fight' : 'Play'}</button></div>`,
  { play: () => startGame(cfg) });
}
