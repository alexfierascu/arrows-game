// The admin page (public/admin.html): who plays, what was reported or refused, and how the
// game is used. Everything comes from the admin routes of src/worker.js, which need the key
// set with `npx wrangler secret put ADMIN_KEY`. The key is kept only until the tab closes.

const $ = selector => document.querySelector(selector);
const esc = text => String(text).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const KEY = 'ae-admin-key';

let key = sessionStorage.getItem(KEY) || '';

/** Calls an admin route. Resolves to the JSON answer; throws with the HTTP status otherwise. */
async function api(method, path, body) {
  const res = await fetch(path, {
    method, headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(res.status === 403 ? 'Wrong key, or no ADMIN_KEY is set on the server.' : 'The server answered ' + res.status + '.');
  return res.json();
}

const when = ms => new Date(ms).toLocaleString();
const table = (head, rows) => (rows.length
  ? `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` + rows.map(cells => `<tr>${cells.join('')}</tr>`).join('')
  : '<tr><td class="mute">Nothing here.</td></tr>');
const td = (value, cls = '') => `<td${cls && ` class="${cls}"`}>${value}</td>`;
const button = (action, id, label, cls = '') => `<button class="${cls}" data-do="${action}" data-id="${esc(id)}">${label}</button>`;

function playerRow(p) {
  const problems = [p.reports ? `${p.reports} report${p.reports > 1 ? 's' : ''}` : '', p.flagged].filter(Boolean).join(', ');
  return [
    td(p.nick ? esc(p.nick) : '<span class="mute">(no name)</span>'), td(esc(problems), 'warn'),
    td(p.total, 'num'), td(p.stars, 'num'), td(p.cleared, 'num'), td(p.s_score, 'num'), td(p.endless, 'num'), td(when(p.updated_at)),
    td(`${button('rename', p.id, 'Rename')} ${button('clear', p.id, 'Remove name')} ${problems ? button('dismiss', p.id, 'Dismiss') : ''} ${button('delete', p.id, 'Delete', 'bad')}`),
    td(`<span class="mute">${esc(p.id.slice(0, 8))}</span>`),
  ];
}
const PLAYER_HEAD = ['Name', 'Problem', 'Score', 'Stars', 'Levels', 'Season', 'Endless', 'Last active', '', 'Id'];

function render({ players, refused, events, reminders, feedback = [], clubs = [] }) {
  const sum = name => events.filter(e => e.name === name).reduce((total, e) => total + e.count, 0);
  const totals = [['Players', players.length], ['Visits', sum('visit')], ['New players', sum('new_player')], ['Games started', sum('game_start')],
    ['Wins', sum('win') + sum('first_win') + sum('daily_win') + sum('event_win')], ['Shares', sum('share')], ['Reminders on', reminders],
    ['Races started', sum('race_start')], ['Missions claimed', sum('mission_claimed')], ['Clubs', clubs.length]];
  $('#totals').innerHTML = totals.map(([label, n]) => `<div><b>${n}</b>${label}</div>`).join('');
  $('#flagged').innerHTML = table(PLAYER_HEAD, players.filter(p => p.reports || p.flagged).map(playerRow));
  $('#players').innerHTML = table(PLAYER_HEAD, players.map(playerRow));
  $('#feedback').innerHTML = table(['When', 'Message', 'Language', 'Country', 'Player id', ''],
    feedback.map(f => [td(when(f.at)), td(esc(f.text), 'text'), td(esc(f.lang)), td(esc(f.country)), td(`<span class="mute">${esc(f.player.slice(0, 8))}</span>`), td(button('unfeedback', f.id, 'Delete'))]));
  $('#clubs').innerHTML = table(['Name', 'Code', 'Members', 'Created', ''],
    clubs.map(c => [td(esc(c.name)), td(esc(c.code)), td(c.members, 'num'), td(when(c.created_at)), td(button('unclub', c.code, 'Delete', 'bad'))]));
  $('#refused').innerHTML = table(['When', 'Name tried', 'Country', 'Player id'],
    refused.map(r => [td(when(r.at)), td(esc(r.name)), td(esc(r.country)), td(`<span class="mute">${esc(r.player.slice(0, 8))}</span>`)]));
  const names = [...new Set(events.map(e => e.name))].sort(), days = [...new Set(events.map(e => e.day))];
  const count = (day, name) => events.find(e => e.day === day && e.name === name)?.count || '';
  $('#usage').innerHTML = table(['Day', ...names], days.map(day => [td(day), ...names.map(name => td(count(day, name), 'num'))]));
}

async function load() {
  $('#status').textContent = 'Loading…';
  render(await api('GET', '/api/admin'));
  $('#status').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

// What each button in a player row does. Each resolves once the server has done it.
const ACTIONS = {
  rename(id) {
    const nick = prompt('New name for this player (16 characters at most):');
    return nick ? api('POST', '/api/admin/rename', { id, nick }) : null;
  },
  clear: id => (confirm('Remove this player’s name? Their scores stay.') ? api('POST', '/api/admin/rename', { id, nick: '' }) : null),
  dismiss: id => api('DELETE', '/api/admin/reports/' + encodeURIComponent(id)),
  unfeedback: id => api('DELETE', '/api/admin/feedback/' + encodeURIComponent(id)),
  unclub: code => (confirm('Delete this club? Its members stay, without a club.') ? api('DELETE', '/api/admin/clubs/' + encodeURIComponent(code)) : null),
  delete: id => (confirm('Delete this player and all their scores? This cannot be undone.') ? api('DELETE', '/api/score/' + encodeURIComponent(id)) : null),
};

async function open() {
  try {
    await load();
    sessionStorage.setItem(KEY, key);
    $('#login').hidden = true;
    $('#main').hidden = false;
  } catch (err) {
    sessionStorage.removeItem(KEY);
    $('#loginNote').textContent = err.message;
  }
}

$('#login').onsubmit = e => { e.preventDefault(); key = $('#key').value; open(); };
$('#reload').onclick = load;
$('#logout').onclick = () => { sessionStorage.removeItem(KEY); location.reload(); };
$('#main').addEventListener('click', async e => {
  const target = e.target.closest('[data-do]');
  if (!target) return;
  try {
    if (await ACTIONS[target.dataset.do](target.dataset.id)) await load();
  } catch (err) { $('#status').textContent = err.message; }
});
if (key) open();
