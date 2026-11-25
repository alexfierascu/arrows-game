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
| `weekly.js`, `skins.js`, `avatars.js`, `friends.js` | This week's numbers for the recap, arrow skins, avatars and the friends list. |
| `analytics.js` | Anonymous usage counts (see "Usage statistics"). |
| `week.js`, `format.js`, `icons.js`, `dom.js`, `feedback.js` | Weekly calendar, formatting, SVG snippets, DOM helpers, sound and vibration. |
| `router.js`, `ui/*.js` | Screen switching and one file per screen or dialog (home, map, event, shop, badges, settings, leaderboard, level preview, how to play, language menu, avatar picker, weekly recap, sharing, modal). |
| `game/*.js` | The game screen: shared state (`state.js`), tap rules, bosses, superpowers, clock, animations, canvas rendering, pointer and keyboard input, and win/lose handling (`outcome.js`). |
| `main.js` | Entry point: starts every module. |

Common changes:
- New superpower: add it to `POWERS` in `content.js`, its effect to `EFFECTS` in `game/powers.js`, a
  starting count to `DEFAULTS.pw` in `player.js`, and its name and description to the language files.
- New boss attack: add it to `ATTACKS` in `content.js` and to `EFFECTS` in `game/bosses.js`.
- New weekly event: add it to `EVENTS` in `content.js`. Its `mod` values feed `stageCfg` in `levels.js`.
- New skin: add an entry to `SKINS` in `skins.js` and its name (`skin.<id>`) to the language files.
- New badge: add an entry to `BADGES` in `badges.js` and `badge.<id>.name` / `badge.<id>.desc` to the
  language files.

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
  arrows, Enter or Space taps the highlighted one and Escape pauses (`game/keyboard.js`).
- Dialogs take the keyboard focus when they open and give it back when they close.
- Settings has a "Reduce motion" switch; the system-wide reduced-motion preference is also respected
  (`motion.js`).
- Phones held sideways get their own layout: the board fills the height, with the clock and
  superpowers beside it.
- In-game messages are announced to screen readers. The board itself is drawn on a canvas, so its
  arrows are not individually described.

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
`node scripts/update-ldnoobw.mjs`. That list also contains ordinary words and names (Peter, Regina,
Anita, Mama), which are refused as whole names or whole words of a name. Spelling tricks such
as `p.u.l.a`, `puuula` or `sh1t` are caught without listing them.

Three refused names within ten minutes lock that player out of the game for five minutes: a
screen with a countdown covers everything, and reloading does not lift it. The numbers are
`MAX_STRIKES`, `STRIKE_WINDOW_MS` and `LOCKOUT_MS` in `src/worker.js`. Attempts are counted in the
`strikes` table against a hash of the player's secret token, and deleted when they expire.

Every refused name is written to the Worker's logs with the player id and the country the request
came from (never the IP address). To see them: Cloudflare dashboard → Workers & Pages →
`arrows-game` → Logs, and search for `name refused`. Logs are kept for a few days.

The filter only checks names as they are posted. To find and remove names that got in earlier:
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
