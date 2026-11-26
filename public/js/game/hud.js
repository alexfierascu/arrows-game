// Everything around the board: title, hearts, clock, boss bar, superpower buttons, toasts
// and floating score pop-ups.

import { $ } from '../dom.js';
import { ATTACKS, POWERS, START_HEARTS } from '../content.js';
import { player } from '../player.js';
import { clock, num } from '../format.js';
import { heart, ico, portrait } from '../icons.js';
import { avatarHtml } from '../avatars.js';
import { t } from '../i18n.js';
import { game, comboActive } from './state.js';

const LOW_TIME = .2;  // the clock turns red below this share

/** The parts that only change when a board loads. */
export function renderBoardHeader() {
  const { cfg, boss } = game;
  document.documentElement.style.setProperty('--acc', cfg.col);
  $('#stage').classList.toggle('night', cfg.dark);
  $('#gTitle').textContent = cfg.title;
  $('#gSub').textContent = cfg.subtitle;
  $('#bossBar').hidden = !boss;
  $('#raceBar').hidden = !game.race;
  $('#timer').hidden = game.relaxed;
  if (boss) {
    $('#bossPic').innerHTML = portrait(boss, '');
    $('#bossName').textContent = boss.name;
  }
}

function heartsHtml() {
  if (game.relaxed) return `<b style="font-size:16px">${t('relax.short')}</b>`;
  if (game.cfg.kind === 'rush') return `<b style="font-size:18px">${t('hud.board', { n: game.rushBoards + 1 })}</b>`;
  const slots = Math.max(START_HEARTS, game.hearts);
  return Array.from({ length: slots }, (_, i) => heart(i < game.hearts ? '' : 'lost')).join('');
}

function renderBoss() {
  const { boss, frozen } = game, seconds = Math.ceil(game.bossNext), label = $('#bossAtk');
  const attack = ATTACKS[boss.atk[game.attackIndex % boss.atk.length]];
  $('#bossHp').style.width = (100 * game.bossHP / game.bossMax) + '%';
  label.textContent = frozen > 0 ? t('hud.frozen') : t('hud.attack', { name: attack.name, n: seconds });
  label.classList.toggle('warn', seconds <= 3 && !frozen);
}

/** The other player of a live race: who they are and how far along. */
function renderRace() {
  const { name, avatar, left } = game.race, done = left < 0 ? 0 : game.total - left;
  $('#racePic').innerHTML = avatarHtml(avatar);
  $('#raceName').textContent = name || t('challenge.friend');
  $('#raceLeft').innerHTML = left < 0 ? '' : t('hud.left', { n: `<b>${left}</b>` });
  $('#raceHp').style.width = (100 * done / Math.max(1, game.total)) + '%';
}

function renderTimer() {
  const timer = $('#timer'), { frozen } = game;
  game.timeMax = Math.max(game.timeMax, game.timeLeft);
  $('#tFill').style.width = (100 * game.timeLeft / game.timeMax) + '%';
  $('#tTxt').textContent = frozen > 0 ? Math.ceil(frozen) + 's' : clock(game.timeLeft);
  timer.classList.toggle('low', game.timeLeft < game.timeMax * LOW_TIME && !frozen);
  timer.classList.toggle('frz', frozen > 0);
}

export function renderHud() {
  $('#hearts').innerHTML = heartsHtml();
  $('#shieldI').hidden = !game.shield;
  $('#gScore').textContent = num(game.score);
  $('#gLeft').innerHTML = t('hud.left', { n: `<b>${game.left}</b>` });
  $('#gCombo').textContent = game.combo > 1 && comboActive(performance.now()) ? t('hud.combo', { n: game.combo }) : '';
  if (game.boss) renderBoss();
  if (game.race) renderRace();
  renderTimer();
}

export function renderPowers() {
  $('#powers').innerHTML = POWERS.map(p => {
    const owned = player.pw[p.id], armed = p.id === 'smash' && game.smash;
    return `<button class="pw ${armed ? 'on' : ''}" data-p="${p.id}" aria-label="${t('hud.power.aria', { name: p.name, n: owned })}">${ico(p.d)}${p.name}<span class="n ${owned ? '' : 'zero'}">${owned || '+'}</span></button>`;
  }).join('');
}

/** Replays the boss portrait's shake animation. */
export function shakeBoss() {
  const pic = $('#bossPic');
  pic.classList.remove('hit');
  void pic.offsetWidth; // restart the CSS animation
  pic.classList.add('hit');
}

let toastTimer = 0;
export function toast(message, ms = 1700) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/** A short text that floats up from a point of the stage. */
export function pop(text, [px, py], colour) {
  const el = document.createElement('div');
  el.className = 'pop';
  el.textContent = text;
  el.style.left = px + 'px';
  el.style.top = py + 'px';
  if (colour) el.style.color = colour;
  $('#pops').appendChild(el);
  setTimeout(() => el.remove(), 950);
}
