// The bot check (Cloudflare Turnstile). The server asks for it, with HTTP 428, the first time
// a browser posts a score once the owner has switched the check on. Most people never see
// anything: the check runs by itself and only shows a box when it is unsure.

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 60000;

let loading = null;

function loadScript() {
  loading ||= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { loading = null; reject(new Error('blocked')); };
    document.head.appendChild(script);
  });
  return loading;
}

/** Runs the check and hands its answer to the server. Resolves to whether the player passed. */
export async function passBotCheck(sitekey, token) {
  try {
    await loadScript();
    const box = document.createElement('div');
    box.className = 'botcheck';
    document.body.appendChild(box);
    const response = await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
      window.turnstile.render(box, { sitekey, action: 'score', appearance: 'interaction-only', callback: resolve, 'error-callback': () => reject(new Error('failed')) });
    }).finally(() => setTimeout(() => box.remove(), 500));
    const res = await fetch('/api/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, response }) });
    return res.ok;
  } catch { return false; }
}
