// Sound effects (synthesised, no audio files) and vibration. Both respect the player's settings.

import { player } from './player.js';

// One oscillator sweeping from `from` to `to` Hz over `sweep` seconds, fading out over `fade`.
const TONES = {
  out:   { type: 'triangle', from: 520,  to: 1100, sweep: .12, gain: .11, fade: .16 },
  gold:  { type: 'sine',     from: 1200, to: 2400, sweep: .15, gain: .12, fade: .22 },
  bump:  { type: 'square',   from: 150,  to: 70,   sweep: .18, gain: .12, fade: .22 },
  boss:  { type: 'sawtooth', from: 220,  to: 55,   sweep: .5,  gain: .13, fade: .55 },
  crack: { type: 'sawtooth', from: 1800, to: 400,  sweep: .08, gain: .08, fade: .1 },
  power: { type: 'sine',     from: 400,  to: 1600, sweep: .25, gain: .12, fade: .3 },
  win:   { type: 'sine',     notes: [523, 659, 784, 1046],     gain: .14, fade: .55 },
};

// The combo sound climbs in pitch with the combo count.
function comboTone(combo) {
  const from = 520 * Math.pow(1.12, combo);
  return { type: 'triangle', from, to: from * 2, sweep: .1, gain: .12, fade: .16 };
}

let audio = null;

/** Plays a sound: out, combo (pass the combo count), gold, bump, boss, crack, power or win. */
export function sfx(kind, combo = 1) {
  if (!player.snd) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const tone = kind === 'combo' ? comboTone(combo) : TONES[kind] || TONES.win;
    const t = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = tone.type;
    if (tone.notes) tone.notes.forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * .1));
    else {
      osc.frequency.setValueAtTime(tone.from, t);
      osc.frequency.exponentialRampToValueAtTime(tone.to, t + tone.sweep);
    }
    gain.gain.setValueAtTime(tone.gain, t);
    gain.gain.exponentialRampToValueAtTime(.001, t + tone.fade);
    osc.start(t);
    osc.stop(t + .6);
  } catch { /* audio unavailable */ }
}

export function vibrate(pattern) {
  try { if (player.hap && navigator.vibrate) navigator.vibrate(pattern); } catch { /* unsupported */ }
}
