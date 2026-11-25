// The game as an app: playing offline, installing it on the home screen, and the daily reminder.
// The service worker itself is public/sw.js.

import { player, persist } from './player.js';
import { t } from './i18n.js';
import { track } from './analytics.js';
import { playerId } from './ui/leaderboard.js';

const REMINDER_HOUR = 18; // local time of the reminder
const supported = 'serviceWorker' in navigator;

// ---------- offline ----------

/** Hands the worker the files this page has loaded, so it keeps copies for offline use. */
async function keepLoadedFiles() {
  const registration = await navigator.serviceWorker.ready;
  const loaded = performance.getEntriesByType('resource').map(entry => entry.name)
    .filter(url => url.startsWith(location.origin) && !url.includes('/api/'));
  registration.active.postMessage({ cache: ['/', ...loaded] });
}

// ---------- installing ----------

let installPrompt = null; // the browser's offer to install, kept until the player asks for it

export const canInstall = () => !!installPrompt;

export async function install() {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  installPrompt = null;
  if (outcome === 'accepted') track('installed');
}

// ---------- daily reminder ----------

export const canRemind = () => supported && 'PushManager' in window && 'Notification' in window;

const api = (method, body) => fetch('/api/push', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/** The worker shows the reminder while the game is closed, so it needs the texts in advance. */
async function saveReminderText() {
  const text = JSON.stringify({ title: t('remind.title'), body: t('remind.body') });
  await (await caches.open('ae-reminder')).put('/reminder-text', new Response(text));
}

function keyBytes(base64url) {
  const raw = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, ch => ch.charCodeAt(0));
}

async function subscribe(registration) {
  if (await Notification.requestPermission() !== 'granted') return false;
  const { key } = await (await fetch('/api/push')).json();
  if (!key) return false;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
  // The server works in UTC: tell it which of its hours is the player's reminder hour.
  const tz = -new Date().getTimezoneOffset(), hour = ((Math.floor((REMINDER_HOUR * 60 - tz) / 60) % 24) + 24) % 24;
  const saved = await api('POST', { endpoint: subscription.endpoint, id: playerId || '', hour, tz });
  await saveReminderText();
  return saved.ok;
}

async function unsubscribe(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await api('DELETE', { endpoint: subscription.endpoint }).catch(() => { /* offline: the server drops it when a push fails */ });
  await subscription.unsubscribe();
}

/** Switches the daily reminder on or off. Resolves to whether it is on afterwards. */
export async function setReminder(on) {
  try {
    const registration = await navigator.serviceWorker.ready;
    if (on) on = await subscribe(registration);
    else await unsubscribe(registration);
  } catch { on = false; } // blocked by the browser or offline
  if (on) track('reminder_on');
  player.remind = on;
  persist();
  return on;
}

export function initPwa() {
  if (!supported) return;
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  navigator.serviceWorker.register('/sw.js').then(keepLoadedFiles).catch(() => { /* private mode: the game works without it */ });
  if (player.remind) saveReminderText().catch(() => { /* storage blocked */ }); // the language may have changed
}
