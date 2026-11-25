// English texts, and the reference for every other language file: same keys, same {placeholders}.
// `ui` holds interface texts by key; the other sections name the game content from content.js.
// A text may instead be a set of plural forms chosen by {n}, e.g. { "one": "…", "other": "…" },
// using the category names of Intl.PluralRules for the language.
export default {
  "ui": {
    "tagline": "Slide every arrow off the board.",
    "weekend": "Double coins weekend: every reward ×2 until Sunday night.",
    "play": "Play",
    "tile.daily": "Daily challenge",
    "tile.worlds": "Worlds",
    "tile.board": "Leaderboard",
    "tile.board.sub": "Daily and all-time",
    "tile.shop": "Superpowers",
    "tile.badges": "Badges and stats",
    "tile.gift": "Daily gift",
    "title.event": "Weekly event",
    "settings": "Settings",
    "back": "Back",
    "pause": "Pause",
    "zoom.in": "Zoom in",
    "zoom.out": "Zoom out",
    "zoom.fit": "Fit board",
    "shield.up": "Shield up",
    "score": "Score",
    "tab.today": "Today",
    "tab.alltime": "All-time",
    "tab.stars": "Stars",
    "nick.placeholder": "Your player name",
    "nick.aria": "Player name",
    "save": "Save",
    "shop.note": "Earn coins with stars, daily gifts, daily challenges and badges.",
    "ok": "OK",
    "close": "Close",
    "fight": "Fight",
    "replay": "Replay",
    "next": "Next",
    "quit": "Quit",
    "retry": "Retry",
    "done": "Done",
    "buy": "Buy",
    "not.now": "Not now",
    "collect": "Collect",
    "level.title": "Level {id}",
    "world.boss": "World {n} boss",
    "daily.short": "Daily",
    "stage.of": "Stage {n} of {total}",
    "event.stage": "{event} · stage {n}",
    "dur.d": "d",
    "dur.h": "h",
    "dur.m": "m",
    "home.event.kicker": "This week’s event",
    "home.best.run": "Best run: {n}",
    "home.stages": "{n} of {total} stages cleared",
    "ends.in": "Ends in {time}",
    "home.daily.best": "Today’s best: {n}",
    "home.daily.new": "New board every day",
    "home.worlds": "{stars} of {max} stars · {bosses}/{total} bosses",
    "home.bag": "{n} in your bag",
    "home.badges": "{n} of {total} badges",
    "gift.ready": "Ready to open",
    "gift.wait": "Come back tomorrow",
    "gift.opened.title": "Already opened",
    "gift.opened.text": "A new gift arrives tomorrow.",
    "gift.title": "Nice!",
    "map.boss": "Boss: {name}.",
    "map.locked": "Beat {boss} in level {level} to unlock this world.",
    "map.boss.locked": "Boss, locked",
    "locked": "Locked",
    "boss": "Boss",
    "defeated": "Defeated",
    "weak.title": "Weak spots",
    "weak.text": "Gold arrows deal triple damage. Clearing every arrow defeats the boss.",
    "first.win": "First win:",
    "preview.world": "World {n} · {name}",
    "preview.daily.text": "One new board every day. Your best score today goes on the leaderboard.",
    "preview.event": "{event} event",
    "preview.reward": "Reward for first clear: {reward}",
    "fact.board": "{w}×{h} board",
    "fact.arrows": "{n} arrows",
    "fact.clock": "Clock {time}",
    "fact.ice": "{n} ice",
    "fact.gold": "{n} gold",
    "fact.dark": "Dark board",
    "goal.boss": "Defeat the boss",
    "goal.clear": "Clear the board",
    "goal.hearts": "Lose no hearts",
    "goal.time": "Finish within {time}",
    "preview.best": "Best: {score} points in {time}",
    "coins": "{n} coins",
    "reward": "Reward: {reward}",
    "tier.score": "Score {n}",
    "tier.done": "Reward collected",
    "rush.best": "Your best run this week",
    "rush.boards": "{n} boards",
    "rush.start": "Start run",
    "stage.n": "Stage {n}",
    "stage.cleared": "Cleared, best {n}",
    "event.next": "Next week: {name}. Event scores have their own leaderboard tab.",
    "shop.own": "You have {n}",
    "stat.levels": "levels cleared",
    "stat.stars": "stars",
    "stat.bosses": "bosses beaten",
    "stat.score": "total score",
    "stat.arrows": "arrows out",
    "stat.combo": "best combo",
    "sound": "Sound",
    "vibration": "Vibration",
    "language": "Language",
    "reset.label": "Reset all progress",
    "reset": "Reset",
    "reset.confirm": "Tap again to confirm",
    "board.empty.daily": "No one has finished today’s daily challenge yet. Be the first.",
    "board.empty.event": "No event scores yet this week.",
    "board.empty": "No scores yet. Clear a level to get on the board.",
    "board.bosses": {
      "one": "{n} boss",
      "other": "{n} bosses"
    },
    "board.player": "Player {id}",
    "you": "(you)",
    "board.loading": "Loading scores…",
    "board.error": "Can’t reach the leaderboard right now.",
    "board.stale": "Couldn’t refresh; showing the last scores loaded.",
    "board.readonly": "Your scores can’t be posted from this browser.",
    "board.auto": "Scores sync automatically after each win.",
    "saved": "Saved",
    "nick.ask": "Choose a name for the leaderboard",
    "nick.checking": "Checking the name…",
    "nick.taken": "That name is taken. Try another.",
    "hud.left": "{n} left",
    "hud.board": "Board {n}",
    "hud.frozen": "Frozen",
    "hud.attack": "{name} in {n}s",
    "hud.combo": "×{n} combo",
    "hud.power.aria": "{name}, {n} left",
    "tip.first": "Tap an arrow to slide it out. Don’t let it hit another one!",
    "tip.boss": "{name} attacks every few seconds. Watch the bar up top.",
    "tip.lamp": "Tap empty space to move your lamp.",
    "tip.ice": "Ice arrows need one tap to crack first.",
    "pop.crack": "Crack!",
    "pop.smash": "Smash!",
    "seconds.plus": "+{n} seconds",
    "seconds.minus": "−{n} seconds",
    "toast.shield.hit": "Shield took the hit",
    "toast.shield.blocked": "Your shield blocked {name}",
    "toast.fog": "Paper storm!",
    "toast.drain.blocked": "Your combo blocked the Time thief!",
    "toast.drain": "{boss} stole {n} seconds",
    "toast.blackout": "Lights out! Tap empty space to move your lamp",
    "toast.freeze": "Frost! {n} arrows froze",
    "toast.smash.on": "Tap any arrow to smash it",
    "toast.smash.off": "Smash cancelled",
    "toast.radar": "Radar: blinking arrows can leave",
    "toast.freeze.boss": "Clock and boss frozen for {n} seconds",
    "toast.freeze.clock": "Clock frozen for {n} seconds",
    "toast.shield.already": "Shield is already up",
    "toast.shield": "Shield up",
    "toast.hearts.full": "Hearts are full",
    "toast.magnet.none": "Nothing can leave right now",
    "toast.next.board": "+{n} seconds · board {board}",
    "buy.out": "Out of {name}",
    "buy.ask": "Buy one for {price}?",
    "buy.need": "You need {price} coins and have {coins}.",
    "paused": "Paused",
    "pause.progress": "{title} · {done} of {total} cleared",
    "resume": "Resume",
    "restart": "Restart",
    "win.1": "Cleared!",
    "win.2": "Great run!",
    "win.3": "Perfect!",
    "win.boss": "Boss defeated!",
    "row.arrows": "Arrows and combos (best ×{n})",
    "row.time": "Time left {time}",
    "row.hearts": "Hearts left {n}",
    "row.flawless": "Flawless",
    "row.boss": "Boss bonus",
    "total": "Total",
    "new.best": "New best",
    "weekend.x2": "(weekend ×2)",
    "rush.over": "Time’s up!",
    "rush.row.boards": "Boards cleared",
    "rush.row.arrows": "Arrows out",
    "rush.row.combo": "Best combo",
    "run.again": "Run again",
    "continue.time": "Keep going: +{n} seconds for {price}",
    "continue.heart": "Keep going: +1 heart for {price}",
    "lose.time": "Out of time",
    "lose.hearts": "Out of hearts",
    "lose.boss": "{name} had {n} health left.",
    "lose.text": "{done} of {total} arrows cleared. Every board can be solved, so look for arrows with a clear runway.",
    "extra.defeated": "{name} defeated",
    "extra.power": "+1 {name}",
    "extra.event": "Event complete",
    "extra.gold": "{n} gold arrows",
    "badge.first.name": "First escape",
    "badge.first.desc": "Clear your first level",
    "badge.flawless.name": "Flawless",
    "badge.flawless.desc": "Clear a level without losing a heart",
    "badge.combo5.name": "On fire",
    "badge.combo5.desc": "Reach a ×5 combo",
    "badge.speed.name": "Speedster",
    "badge.speed.desc": "Finish with half the clock left",
    "badge.boss1.name": "Boss slayer",
    "badge.boss1.desc": "Defeat your first boss",
    "badge.bossall.name": "Nemesis",
    "badge.bossall.desc": "Defeat all 5 bosses",
    "badge.daily.name": "Daily player",
    "badge.daily.desc": "Finish a daily challenge",
    "badge.event.name": "Event champion",
    "badge.event.desc": "Finish all 5 stages of an event",
    "badge.rush5.name": "Speed demon",
    "badge.rush5.desc": "Clear 5 boards in one Time Attack run",
    "badge.power10.name": "Power user",
    "badge.power10.desc": "Use 10 superpowers",
    "badge.w3.name": "Night owl",
    "badge.w3.desc": "Finish World 3",
    "badge.w5.name": "Grandmaster",
    "badge.w5.desc": "Finish all 5 worlds",
    "badge.arrows.name": "Arrow wrangler",
    "badge.arrows.desc": "Send 1,000 arrows off the board",
    "badge.stars.name": "Star collector",
    "badge.stars.desc": "Collect 90 stars"
  },
  "worlds": [
    {
      "name": "Paper Trail",
      "desc": "Learn the ropes. Small boards and a generous clock."
    },
    {
      "name": "Rush Hour",
      "desc": "Same rules, a much tighter clock. Chain taps for combos."
    },
    {
      "name": "Night Shift",
      "desc": "Bigger boards, played in the dark."
    },
    {
      "name": "Frozen",
      "desc": "Ice arrows need one tap to crack before they can move."
    },
    {
      "name": "Grandmaster",
      "desc": "Huge boards, ice and a hard clock. Good luck."
    }
  ],
  "bosses": [
    {
      "name": "Captain Crease",
      "line": "An origami pirate who buries the board under paper."
    },
    {
      "name": "The Conductor",
      "line": "Runs every train on time, mostly by stealing yours."
    },
    {
      "name": "Moth Mother",
      "line": "She loves the dark and hates your lamp."
    },
    {
      "name": "Queen Frostbyte",
      "line": "Freezes anything that tries to leave her court."
    },
    {
      "name": "The Architect",
      "line": "Designed every board you have played. Uses every trick."
    }
  ],
  "attacks": {
    "fog": {
      "name": "Paper storm",
      "desc": "Scraps of paper cover parts of the board for 5 seconds."
    },
    "drain": {
      "name": "Time thief",
      "desc": "Steals 8 seconds. A ×3 combo or better blocks it."
    },
    "blackout": {
      "name": "Lights out",
      "desc": "Only a small circle stays lit for 7 seconds. Tap empty space to move it."
    },
    "freeze": {
      "name": "Frost",
      "desc": "Freezes 5 arrows; each needs a tap to crack."
    }
  },
  "powers": {
    "smash": {
      "name": "Smash",
      "desc": "Destroy any arrow, even a blocked one."
    },
    "radar": {
      "name": "Radar",
      "desc": "Light up every arrow that can leave right now."
    },
    "freeze": {
      "name": "Freeze",
      "desc": "Stop the clock (and boss attacks) for 15 seconds."
    },
    "shield": {
      "name": "Shield",
      "desc": "Blocks your next bump or the next boss attack."
    },
    "magnet": {
      "name": "Magnet",
      "desc": "Pulls up to 6 free arrows off the board."
    },
    "heart": {
      "name": "Heart",
      "desc": "One extra heart, up to 5."
    }
  },
  "events": {
    "rush": {
      "name": "Time Attack",
      "desc": "Clear as many boards as you can before the clock runs out. Each board adds 10 seconds; each bump costs 5."
    },
    "blizzard": {
      "name": "Blizzard",
      "desc": "Five stages buried in ice. Almost half the arrows start frozen."
    },
    "blackout": {
      "name": "Blackout",
      "desc": "Five dark stages played by lamplight. Tap empty space to move your lamp."
    },
    "gold": {
      "name": "Gold Rush",
      "desc": "Five stages full of gold arrows. Each gold arrow is worth triple points and 2 coins."
    }
  }
};
