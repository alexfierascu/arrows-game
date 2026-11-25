// Game content: worlds, bosses, superpowers, weekly events and the numbers that tune them.
// Names and descriptions are added at startup from the language files (see i18n.js).

export const LEVELS_PER_WORLD=12;
export const WORLDS=[
 {col:'#2f6bff',sec:2.4},
 {col:'#ff7a1a',sec:1.35},
 {col:'#7b5cff',sec:1.6,dark:true},
 {col:'#14a5c0',sec:1.9,ice:.22},
 {col:'#e5484d',sec:1.45,ice:.15},
];
export const ATTACKS={
 fog:{},
 drain:{},
 blackout:{},
 freeze:{},
};
export const BOSSES=[
 {atk:['fog'],every:11,
  svg:'<polygon points="50,8 92,60 8,60" fill="#2f6bff"/><polygon points="8,60 50,94 92,60" fill="#1d47c4"/><polygon points="50,8 63,60 37,60" fill="#6f98ff"/><circle cx="38" cy="48" r="7" fill="#fff"/><circle cx="39" cy="49" r="3.4" fill="#161b3d"/><rect x="53" y="42" width="16" height="10" rx="3" fill="#161b3d"/><path d="M48 36l30-10" stroke="#161b3d" stroke-width="3"/><polygon points="44,62 60,70 44,76" fill="#f5b70a"/>'},
 {atk:['drain'],every:9,
  svg:'<circle cx="50" cy="58" r="34" fill="#ff7a1a"/><circle cx="50" cy="58" r="25" fill="#fff"/><circle cx="40" cy="52" r="3.6" fill="#161b3d"/><circle cx="60" cy="52" r="3.6" fill="#161b3d"/><path d="M50 58V40M50 58l11 7" stroke="#ff7a1a" stroke-width="3.5" stroke-linecap="round"/><path d="M33 70q8-7 17 0q9-7 17 0" stroke="#161b3d" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="28" y="10" width="44" height="16" rx="4" fill="#161b3d"/><rect x="20" y="23" width="60" height="7" rx="3.5" fill="#161b3d"/><rect x="44" y="14" width="12" height="7" rx="2" fill="#f5b70a"/>'},
 {atk:['blackout'],every:12,
  svg:'<ellipse cx="28" cy="50" rx="23" ry="31" fill="#7b5cff" transform="rotate(-22 28 50)"/><ellipse cx="72" cy="50" rx="23" ry="31" fill="#7b5cff" transform="rotate(22 72 50)"/><circle cx="25" cy="46" r="8" fill="#c2b5ff"/><circle cx="75" cy="46" r="8" fill="#c2b5ff"/><ellipse cx="50" cy="58" rx="11" ry="28" fill="#2a1f66"/><circle cx="45" cy="44" r="4.2" fill="#f5b70a"/><circle cx="55" cy="44" r="4.2" fill="#f5b70a"/><path d="M46 32Q40 14 28 11M54 32Q60 14 72 11" stroke="#2a1f66" stroke-width="3.2" fill="none" stroke-linecap="round"/>'},
 {atk:['freeze'],every:9,
  svg:'<circle cx="50" cy="62" r="30" fill="#c9f2ff"/><polygon points="22,40 31,12 40,35 50,4 60,35 69,12 78,40" fill="#14a5c0"/><circle cx="50" cy="22" r="4" fill="#fff"/><circle cx="40" cy="60" r="4.2" fill="#161b3d"/><circle cx="60" cy="60" r="4.2" fill="#161b3d"/><path d="M41 76q9 5 18 0" stroke="#161b3d" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="31" cy="70" r="4.5" fill="#86dcef"/><circle cx="69" cy="70" r="4.5" fill="#86dcef"/>'},
 {atk:['fog','drain','freeze','blackout'],every:8,
  svg:'<polygon points="50,2 59,20 41,20" fill="#f5b70a"/><rect x="15" y="20" width="70" height="70" rx="15" fill="#e5484d"/><path d="M15 38h70" stroke="#b5232a" stroke-width="3"/><circle cx="36" cy="56" r="10" fill="#fff"/><circle cx="37" cy="57" r="4.5" fill="#161b3d"/><circle cx="64" cy="56" r="12" fill="#fff" stroke="#f5b70a" stroke-width="4"/><circle cx="64" cy="57" r="5" fill="#161b3d"/><path d="M33 76h34M40 76v-5M50 76v-5M60 76v-5" stroke="#161b3d" stroke-width="3.5" stroke-linecap="round"/>'},
];
export const POWERS=[
 {id:'smash',price:60,d:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'},
 {id:'radar',price:30,d:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>'},
 {id:'freeze',price:40,d:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>'},
 {id:'shield',price:35,d:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'},
 {id:'magnet',price:50,d:'<path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3zM6 7h4M14 7h4"/>'},
 {id:'heart',price:45,d:'<path d="M12 20s-7-4.3-8.8-8.6C1.9 8.3 3.8 5 7 5c2 0 3.3 1 4 2.2C11.7 6 13 5 15 5c3.2 0 5.1 3.3 3.8 6.4"/><path d="M19 14v7M15.5 17.5h7"/>'},
];
export const EVENTS=[
 {id:'rush',col:'#ff7a1a',kind:'rush',d:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'},
 {id:'blizzard',col:'#14a5c0',kind:'ladder',d:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>',mod:{ice:.45,sec:2.1}},
 {id:'blackout',col:'#7b5cff',kind:'ladder',d:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',mod:{blackout:true,dark:true,sec:2.3}},
 {id:'gold',col:'#d99a00',kind:'ladder',d:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5h4.5a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5H15"/>',mod:{gold:.32,sec:1.8}},
];
export const STAGE_REWARDS=[
 {coins:40},
 {coins:20,power:'radar'},
 {coins:60},
 {coins:30,power:'smash'},
 {coins:150,power:'magnet'},
];
export const RUSH_TIERS=[{score:1500,coins:50},{score:4000,coins:100},{score:8000,coins:200}];

export const TOTAL_LEVELS=WORLDS.length*LEVELS_PER_WORLD;
export const EVENT_STAGES=STAGE_REWARDS.length;
export const MAX_STARS=TOTAL_LEVELS*3;

// Rules and rewards shared by several modules.
export const COMBO_WINDOW_MS=1600;   // taps closer together than this keep a combo going
export const MAX_COMBO=8;
export const GOLD_MULTIPLIER=3;      // gold arrows: triple points and triple boss damage
export const START_HEARTS=3;
export const MAX_HEARTS=5;
export const RUSH_SECONDS=120;       // starting clock of a Time Attack run
export const RUSH_BOARD_BONUS=10;    // seconds added per cleared Time Attack board
export const RUSH_BUMP_PENALTY=5;    // seconds lost per bump in Time Attack
export const CONTINUE_COST=50;
export const BOSS_REWARD=150;
export const BADGE_REWARD=25;
export const GIFT_COINS=30;
export const STREAK_COINS=10;        // per day of daily streak, from the second day on
export const STREAK_COINS_DAYS=7;    // the streak bonus stops growing after this many days
