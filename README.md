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
src/worker.js              API: GET /api/scores, POST /api/score, DELETE /api/score/:id (admin)
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
| `player.js`, `progress.js`, `badges.js`, `economy.js` | Save data (localStorage), recording results, badges and coins. |
| `week.js`, `format.js`, `icons.js`, `dom.js`, `feedback.js` | Weekly calendar, formatting, SVG snippets, DOM helpers, sound and vibration. |
| `router.js`, `ui/*.js` | Screen switching and one file per screen or dialog (home, map, event, shop, badges, settings, leaderboard, level preview, modal). |
| `game/*.js` | The game screen: shared state (`state.js`), tap rules, bosses, superpowers, clock, animations, canvas rendering, input, and win/lose handling (`outcome.js`). |
| `main.js` | Entry point: starts every module. |

Common changes:
- New superpower: add it to `POWERS` in `content.js`, its effect to `EFFECTS` in `game/powers.js`, a
  starting count to `DEFAULTS.pw` in `player.js`, and its name and description to the language files.
- New boss attack: add it to `ATTACKS` in `content.js` and to `EFFECTS` in `game/bosses.js`.
- New weekly event: add it to `EVENTS` in `content.js`. Its `mod` values feed `stageCfg` in `levels.js`.
- New badge: add an entry to `BADGES` in `badges.js` and `badge.<id>.name` / `badge.<id>.desc` to the
  language files.

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
