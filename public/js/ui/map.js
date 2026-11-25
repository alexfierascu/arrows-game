// World map: a chip per world, the world's banner and its grid of levels.

import { $, onDataClick } from '../dom.js';
import { WORLDS, BOSSES, LEVELS_PER_WORLD } from '../content.js';
import { player, isLevelUnlocked, isWorldOpen, nextLevel } from '../player.js';
import { levelCfg } from '../levels.js';
import { ico, LOCK, portrait, stars } from '../icons.js';
import { registerScreen } from '../router.js';
import { previewLevel } from './preview.js';

const WORLD_STARS = LEVELS_PER_WORLD * 3;
let world = 1; // the world being looked at, 1-based

const levelsOf = w => Array.from({ length: LEVELS_PER_WORLD }, (_, i) => (w - 1) * LEVELS_PER_WORLD + i + 1);

function renderChips() {
  $('#chips').innerHTML = WORLDS.map((w, i) =>
    `<button class="chip ${i + 1 === world ? 'on' : ''}" style="--c:${w.col}" data-w="${i + 1}">${isWorldOpen(i + 1) ? '' : ico(LOCK)}${i + 1}. ${w.name}</button>`).join('');
  $('#chips .on')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}

function renderBand(open) {
  const w = WORLDS[world - 1], boss = BOSSES[world - 1], band = $('#band');
  const earned = levelsOf(world).reduce((total, g) => total + (player.lv[g]?.s || 0), 0);
  const text = open
    ? w.desc + ' Boss: ' + boss.name + '.'
    : 'Beat ' + BOSSES[world - 2].name + ' in level ' + (world - 1) + '-' + LEVELS_PER_WORLD + ' to unlock this world.';
  band.style.setProperty('--c', w.col);
  band.innerHTML = `${portrait(boss, 'art')}<h3>${w.name}</h3><p>${text}</p><div style="display:flex;align-items:center;gap:10px"><div class="meter" style="flex:1"><i style="width:${earned / WORLD_STARS * 100}%"></i></div><b>${earned}/${WORLD_STARS}★</b></div>`;
}

function levelButton(g, open, next) {
  const w = WORLDS[world - 1], boss = BOSSES[world - 1], result = player.lv[g];
  const isBoss = g % LEVELS_PER_WORLD === 0, state = `${result ? 'done' : ''} ${g === next ? 'next' : ''}`;
  if (!(open && isLevelUnlocked(g))) return isBoss
    ? `<button class="lv lock bossT" disabled aria-label="Boss, locked">${portrait(boss, 'pt')}Boss</button>`
    : `<button class="lv lock" disabled aria-label="Locked">${ico(LOCK)}</button>`;
  if (isBoss) return `<button class="lv bossT ${state}" data-g="${g}">${portrait(boss, 'pt')}${result ? 'Defeated' : 'Boss'}</button>`;
  return `<button class="lv ${state}" data-g="${g}"><span>${(g - 1) % LEVELS_PER_WORLD + 1}</span><span class="st">${stars(result?.s, g === next ? '#fff' : w.col)}</span></button>`;
}

function renderMap(params) {
  if (params?.world) world = params.world;
  const open = isWorldOpen(world), next = nextLevel(), levels = $('#levels');
  renderChips();
  renderBand(open);
  levels.style.setProperty('--c', WORLDS[world - 1].col);
  levels.innerHTML = levelsOf(world).map(g => levelButton(g, open, next)).join('');
}

export function initMap() {
  registerScreen('map', renderMap);
  onDataClick('#chips', 'w', w => renderMap({ world: +w }));
  onDataClick('#levels', 'g', g => previewLevel(levelCfg(+g)));
}
