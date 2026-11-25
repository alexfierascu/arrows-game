// Background music, synthesised like the sound effects: no audio files. A slow arpeggio over
// four chords with a soft bass, scheduled a little ahead of time so it never stutters.

import { player } from './player.js';
import { audioContext } from './feedback.js';

const STEP_SECONDS = .34;                 // one eighth note
const LOOK_AHEAD = .6, TICK_MS = 200;     // schedule this far ahead, checking this often
const VOLUME = .045;
// A minor, F major, C major, G major: the notes of each bar, low to high (Hz).
const CHORDS = [[220, 261.63, 329.63, 440], [174.61, 220, 261.63, 349.23], [196, 261.63, 329.63, 392], [196, 246.94, 293.66, 392]];
const ARPEGGIO = [0, 1, 2, 3, 2, 1, 2, 1]; // which chord note each step of the bar plays

let timer = 0, step = 0, nextTime = 0, output = null;

function note(audio, frequency, time, seconds, level, type) {
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + .03);
  gain.gain.exponentialRampToValueAtTime(.0001, time + seconds);
  osc.connect(gain).connect(output);
  osc.start(time);
  osc.stop(time + seconds);
}

function schedule() {
  const audio = audioContext();
  while (nextTime < audio.currentTime + LOOK_AHEAD) {
    const beat = step % ARPEGGIO.length, chord = CHORDS[Math.floor(step / ARPEGGIO.length) % CHORDS.length];
    note(audio, chord[ARPEGGIO[beat]] * 2, nextTime, STEP_SECONDS * 2.4, 1, 'sine');
    if (beat === 0) note(audio, chord[0] / 2, nextTime, STEP_SECONDS * 7.5, .9, 'triangle');
    step++;
    nextTime += STEP_SECONDS;
  }
}

function start() {
  if (timer || !player.mus || document.hidden) return;
  try {
    const audio = audioContext();
    if (!output) {
      output = audio.createGain();
      output.gain.value = VOLUME;
      output.connect(audio.destination);
    }
    nextTime = audio.currentTime + .1;
    timer = setInterval(schedule, TICK_MS);
    schedule();
  } catch { /* audio unavailable */ }
}

function stop() {
  clearInterval(timer);
  timer = 0;
}

/** Starts or stops the music to match the Settings switch. Call whenever it changes. */
export function applyMusicSetting() {
  if (player.mus) start(); else stop();
}

export function initMusic() {
  // Browsers only let sound start after the player has touched the page.
  addEventListener('pointerdown', start, { once: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
