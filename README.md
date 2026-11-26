# Arrows Escape

A tap-to-escape arrow puzzle game: 5 worlds, 60 levels, bosses, weekly events, superpowers, and a shared leaderboard.

Everything runs on Cloudflare: one Worker serves the game (`public/`) and the leaderboard API
(`src/worker.js`), and a D1 database stores the scores (`migrations/`). GitHub only holds the code;
Cloudflare builds and deploys it on every push.

The game is plain HTML, CSS and JavaScript modules. There is no build step and no framework: the
browser loads `public/js/main.js` and follows the imports.

```
public/index.html          markup for every screen
public/styles.css          all styling
public/js/                 the game, as ES modules (see "Code map" below)
src/worker.js              API: scores, usage counts and admin routes (listed at the top of the file)
src/profanity.js          the list of offensive words a player name may not contain
src/ldnoobw.js            generated: the LDNOOBW word lists in 28 languages, used by profanity.js
scripts/update-ldnoobw.mjs  downloads those lists again and rewrites src/ldnoobw.js
migrations/                D1 schema, one numbered file per change
wrangler.jsonc             Worker + D1 configuration
```

## One-time setup

You need a Cloudflare account, a GitHub account and Node.js 20 or later.

### 1. Create the database (from your computer)
```bash
npm install
npx wrangler login
npx wrangler d1 create arrows-game
```
Paste the printed `database_id` into `wrangler.jsonc` (replace `REPLACE_WITH_YOUR_DATABASE_ID`), then:
```bash
npm run db:remote          # creates the scores table in the live database
```
The database id is not a secret; it is fine to commit it.

### 2. Push to GitHub
Create an empty repository on github.com (private is fine), then:
```bash
git init
git add .
git commit -m "Arrows Escape"
git branch -M main
git remote add origin https://github.com/<you>/arrows-game.git
git push -u origin main
```

### 3. Connect the repo to Cloudflare
Dashboard → Workers & Pages → Create → Import a repository → pick `arrows-game`.
- Project name: `arrows-game` (must match `name` in `wrangler.jsonc`)
- Build command: leave empty
- Deploy command: `npx wrangler deploy`

Save and deploy. You get `https://arrows-game.<your-subdomain>.workers.dev`.
The live game is at https://arrows-game.univocal.workers.dev.
From now on every push to `main` redeploys automatically. Builds for other branches get their own
preview URLs, but they use the same database, so test scores from previews land on the real leaderboard.

### 4. Your own domain (optional)
Worker → Settings → Domains & Routes → Add → Custom domain → e.g. `arrows.yourdomain.com`.

## Day to day
- Change the game: edit the files in `public/`, commit, push. Cloudflare deploys in about a minute.
- Change the database: add a new file in `migrations/` (e.g. `0002_add_column.sql`) and run
  `npm run db:remote` before you push. The default Cloudflare build token cannot modify D1.
  If you want builds to apply migrations themselves, create an API token with Workers Scripts Edit and
  D1 Edit, select it in the Worker's build settings, and change the deploy command to
  `npm run deploy:with-migrations`.
- Run locally: `npm run db:local` then `npm run dev` → http://localhost:8787

## Code map
Each file in `public/js/` has one job, and there are no circular imports.

| Files | What they do |
| --- | --- |
| `content.js` | Game data: worlds, bosses, superpowers, events, rewards and tuning numbers. Start here to rebalance or add content. |
| `i18n.js`, `lang/*.js` | Languages: one file of texts per language, and the `t()` lookup the rest of the code uses. |
| `rng.js`, `grid.js`, `generator.js` | Seeded board generator. Every generated board is solvable. |
| `levels.js` | Turns a level number, the date or an event stage into a board config. |
| `player.js`, `progress.js`, `badges.js`, `economy.js` | Save data (localStorage), recording results (including the daily streak), badges and coins. |
| `weekly.js`, `season.js`, `skins.js`, `avatars.js`, `friends.js` | This week's numbers for the recap, the monthly season, arrow skins, avatars and the friends list. |
| `challenge.js` | Challenge links: the code that names a board, and reading one from the page's address. |
| `pwa.js`, `music.js`, `../sw.js` | Installing the game, offline play and the daily reminder; the synthesised background music; the service worker. |
| `admin.js`, `../admin.html` | The admin page (see "Moderating the leaderboard"). |
| `analytics.js` | Anonymous usage counts (see "Usage statistics"). |
| `week.js`, `format.js`, `icons.js`, `dom.js`, `feedback.js`, `motion.js` | Weekly calendar, formatting, SVG snippets, DOM helpers, sound and vibration, reduced motion and colour-blind mode. |
| `router.js`, `ui/*.js` | Screen switching and one file per screen or dialog (home, map, event, shop, badges, settings, leaderboard, level preview, how to play, language menu, avatar picker, weekly recap, sharing, modal). |
| `game/*.js` | The game screen: shared state (`state.js`), tap rules, bosses, superpowers, hint and undo (`assist.js`), clock, animations, canvas rendering, pointer and keyboard input, and win/lose handling (`outcome.js`). |
| `main.js` | Entry point: starts every module. |

Common changes:
- New superpower: add it to `POWERS` in `content.js`, its effect to `EFFECTS` in `game/powers.js`, a
  starting count to `DEFAULTS.pw` in `player.js`, and its name and description to the language files.
- New boss attack: add it to `ATTACKS` in `content.js` and to `EFFECTS` in `game/bosses.js`.
- New weekly event: add it to `EVENTS` in `content.js`. Its `mod` values feed `stageCfg` in `levels.js`.
- New skin: add an entry to `SKINS` in `skins.js` and its name (`skin.<id>`) to the language files.
- New badge: add an entry to `BADGES` in `badges.js` and `badge.<id>.name` / `badge.<id>.desc` to the
  language files.

## Game modes and help
- **Endless** (`endlessCfg` in `levels.js`): boards that grow harder one after another. Hearts carry
  over and one comes back per cleared board; the seconds left on each board become points. It has
  its own leaderboard tab.
- **Season**: the points of every finished game add up per calendar month (`season.js`) and feed a
  leaderboard tab that starts again on the 1st.
- **Hint and undo** (`game/assist.js`): three free hints and one free undo per board. Undo gives back
  the heart of the last mistake, also when that mistake ended the game.
- **Challenges**: the Share button on a result sends a picture card and a link such as `/?c=l12&s=4800`.
  Whoever opens it plays the same board and sees who won. A board the opener has not unlocked is
  played as practice: no coins, no progress. The codes are explained in `challenge.js`.
- **Today** (`ui/today.js`, `missions.js`): the home tile that holds the daily gift and three daily
  missions. The missions are the same for everyone, picked from the date, and each pays coins once.
- **Earlier days** (`ui/past.js`): the daily boards of the last 14 days, playable as practice from
  the daily challenge dialog. No leaderboard and no streak; the first clear of a day pays a few coins.
- **Season prizes** (`ui/season-prize.js`): when a month is over, the next visit pays coins for the
  player's final place. The server keeps the finished month's points in the `season_results` table.
- **Relaxed mode** (a switch in Settings): world levels without hearts or clock. A relaxed win gives
  one star and no time or heart bonus, so the leaderboards stay fair. Daily, event, Endless and race
  boards always play by the normal rules.
- **Show me a solution** (`game/solution.js`): after a lost level, daily or event board, the board
  is played back from the start. Nothing is scored.
- **Live race** (`ui/race.js`, `src/race.js`): "Race a friend" on the leaderboard screen opens a
  race and gives a link. When the friend opens it, both play the same board after a countdown and
  see each other's progress; the first to clear it wins. There is no open connection: each game
  asks the server every 1.5 seconds. Races are deleted after an hour.
- **Clubs** (`ui/clubs.js`, `src/clubs.js`): the Clubs tab of the leaderboard. A player founds a club
  or joins one by code or link (20 members at most). A club's score is the sum of its members'
  season points.
- **Public profile** (`ui/profile.js`): tap a name on the leaderboard, or "My public profile" on the
  badges screen. The link `/?p=<player id>` shows name, avatar, club, numbers and badges.
- **Feedback**: "Feedback" in Settings sends a message that appears on the admin page (5 a day per
  player, 1,000 characters).

## Link previews
Chat apps show a title, a text and a picture for a pasted link. `src/preview.js` writes them into
the page for challenge, race, club and profile links, for example "Ana scored 12,340 on level 2-3.
Can you beat it?". The texts are English and the picture (`public/og.png`) is the same for every
link. For this, requests for `/` run through the Worker (`run_worker_first` in `wrangler.jsonc`).
If you move to your own domain, change the two `og.png` addresses in `public/index.html`.

## Bot check (optional)
The server can ask each browser to pass Cloudflare Turnstile once before it accepts scores. It is
off until you create a Turnstile widget in the Cloudflare dashboard (Turnstile, Add widget, your
domain, mode "Managed") and store its two keys:
```
npx wrangler secret put TURNSTILE_SECRET     # the widget's secret key
```
and add `"TURNSTILE_SITEKEY": "<the widget's site key>"` to `vars` in `wrangler.jsonc`, then deploy.
A pass lasts 30 days per browser (`VERIFIED_MS` in `src/worker.js`). To switch it off again, delete
the secret: `npx wrangler secret delete TURNSTILE_SECRET`.

## Installing, offline play and reminders
The game is a PWA: `public/manifest.webmanifest` plus the service worker `public/sw.js`. Files are
always fetched from the network when it answers, and the worker's copies are used only offline, so
a deploy is never held back by a cache.

The daily reminder is a Web Push message sent by the Worker's hourly cron trigger (`sendReminders`
in `src/worker.js`) to players who switched it on and have not played today's daily challenge by
18:00 their time. It needs a key pair: the public half is `VAPID_PUBLIC_KEY` in `wrangler.jsonc`,
the private half is the secret `VAPID_PRIVATE_KEY` (a JWK). To replace them, generate a P-256 key
pair, put the public key (uncompressed point, base64url) in `wrangler.jsonc` and run
`npx wrangler secret put VAPID_PRIVATE_KEY`; existing reminders then stop until players switch
them on again. On iPhones, reminders only work after the game is added to the home screen. One
cron run sends at most 40 reminders (`MAX_REMINDERS_PER_RUN`), a limit of the free Workers plan.

## Friends, sharing and avatars
- Friends are a list of player names kept in the player's browser. Names are unique, so a name is
  enough; friendship is one-sided, like following. The leaderboard has a Friends filter, a star on
  each row and an add-by-name field. Friends are fetched by name, so they show even outside the top 100.
- The Share button on a result uses the phone's share sheet, or copies the text where there is none.
  The shared link is `https://<your-url>/?friend=<name>`: opening it adds that player as a friend.
- An avatar is an icon on a coloured disc, stored as one number in the `avatar` column. Players who
  never picked one get a stable avatar derived from their id.

## Usage statistics
The game counts how often a few things happen (visits, games started, first move, wins, losses,
shares and so on). Each count is one row per day and event name in the `events` table: no player id,
no cookie, no name. Players can switch it off in Settings, and nothing is sent when the browser asks
not to be tracked. The event names are listed in `EVENT_NAMES` in `src/worker.js`.

```bash
# the last 30 days, straight from the database
npx wrangler d1 execute arrows-game --remote --command "SELECT day, name, count FROM events ORDER BY day DESC, name LIMIT 300"
# or through the API, with the admin key
curl "https://<your-url>/api/stats?days=30" -H "Authorization: Bearer <ADMIN_KEY>"
```
Useful ratios: `first_move / new_player` (did new players understand what to do), `first_win /
new_player` (did they finish level 1), `daily_win / visit` (is the daily challenge found).

## Accessibility
- Keyboard: every menu is reachable with Tab. On the board, the arrow keys move a highlight between
  arrows, Enter or Space taps the highlighted one, H gives a hint, U takes back a mistake and
  Escape pauses (`game/keyboard.js`).
- Dialogs take the keyboard focus when they open and give it back when they close.
- Settings has a "Reduce motion" switch; the system-wide reduced-motion preference is also respected
  (`motion.js`).
- Phones held sideways get their own layout: the board fills the height, with the clock and
  superpowers beside it.
- In-game messages are announced to screen readers. The board is drawn on a canvas, so the game
  describes it in words instead (`game/a11y.js`): the highlighted arrow's direction, length,
  position and whether it is free, then how many arrows and hearts are left after each move.

## Languages
The game speaks English, Spanish, French, Italian, German, Romanian, Greek and Polish. It starts in
the browser's language when that is one of these, otherwise in English. The player can switch with
the flag button on the home screen or in Settings; the choice is remembered in that browser.

- Every text the player sees lives in `public/js/lang/<code>.js`. `en.js` is the reference: the other
  files have the same keys and the same `{placeholders}`. Anything missing falls back to English.
- Code never contains display text. It calls `t('key', { n: 3 })`; markup in `index.html` uses
  `data-i18n="key"`.
- Names and descriptions of worlds, bosses, attacks, superpowers and events are in the same files, so
  a new piece of content needs its texts added to each language (or at least to `en.js`).
- A text can be a set of plural forms, for example `{ "one": "{n} boss", "other": "{n} bosses" }`,
  picked by `{n}` using the language's own plural rules.
- To add a language: copy `lang/en.js`, translate the values, add its code and name to `LANGUAGES`
  in `i18n.js`, and draw its flag in `flags.js`.
- To fix a translation: edit the value in that language's file. Nothing else needs to change.

Two things must stay stable, because players' browsers and the leaderboard depend on them:
- The board generator's output. Levels, the daily board and event boards are generated from seeds,
  so everyone gets the same board only as long as `generator.js` draws random numbers in the same
  order. Changing it changes every level.
- The save format: the localStorage keys and the property names documented at the top of `player.js`.

## Moderating the leaderboard
Offensive player names are refused by the server. The words, in the game's eight languages, are
listed in `src/profanity.js`; the top of that file explains how to add one. On top of
that comes the whole [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
list in 28 languages (CC BY 4.0), kept in `src/ldnoobw.js`; refresh it with
`node scripts/update-ldnoobw.mjs`. That list also contains ordinary words and names. The
common ones (Peter, Regina, Anita, Mama) are exempted in `ALLOWED` in `src/profanity.js`; add a name
there when a player's ordinary name is refused. Spelling tricks such
as `p.u.l.a`, `puuula` or `sh1t` are caught without listing them.

Three refused names within ten minutes lock that player out of the game for five minutes: a
screen with a countdown covers everything, and reloading does not lift it. The numbers are
`MAX_STRIKES`, `STRIKE_WINDOW_MS` and `LOCKOUT_MS` in `src/worker.js`. Attempts are counted in the
`strikes` table against a hash of the player's secret token, and deleted when they expire.

Every refused name is written to the Worker's logs with the player id and the country the request
came from (never the IP address). To see them: Cloudflare dashboard → Workers & Pages →
`arrows-game` → Logs, and search for `name refused`. Logs are kept for a few days.

Players can report a name from the leaderboard (tap a name, then "Report name").

**Admin page.** Open `/admin` on your site and enter the admin key. It lists reported names and
suspicious scores, refused names, all players (rename, remove the name, delete) and the usage counts.
Set the key once with `npx wrangler secret put ADMIN_KEY`; choose a long random one.
The page also lists the feedback players sent from Settings and the clubs, each with a Delete button.

**Cheat checks.** The server refuses scores no real game can produce: more stars or bosses than the
cleared levels allow, a total above what those levels can pay (`TOTAL_CAPS` in `src/worker.js`), or
a daily score without a real game. A player who reports many more levels than the time since their
last post allows is kept but marked for the admin page. The server does not replay games, so a
score inside those limits is still taken on trust.

The same can be done from the terminal:
```bash
npx wrangler d1 execute arrows-game --remote --command "SELECT id, nick, total, d_score FROM scores ORDER BY total DESC LIMIT 20"
npx wrangler d1 execute arrows-game --remote --command "DELETE FROM scores WHERE id='<player-id>'"
```
Or set an admin key once (`npx wrangler secret put ADMIN_KEY`) and call
`curl -X DELETE https://<your-url>/api/score/<player-id> -H "Authorization: Bearer <ADMIN_KEY>"`.

## Good to know
- Players have no accounts. Each browser gets a random player id plus a secret token, so nobody can
  overwrite someone else's row. Progress is stored in that browser.
- Player names are unique, ignoring upper and lower case (`migrations/0002_unique_nick.sql`). The API
  answers 409 when a name belongs to someone else, and the game asks for another one. Because there
  are no accounts, a name is tied to one browser; it is released for others once its owner has not
  posted a score for 90 days (`NICK_HOLD_MS` in `src/worker.js`).
- The game runs in the browser, so a determined player could post a fake score. The API rejects
  impossible values; add a WAF rate-limiting rule on `/api/score` (Security → WAF → Rate limiting rules)
  for extra protection.
