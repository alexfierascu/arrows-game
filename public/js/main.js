// Arrows Escape: entry point. Each module sets up its own screen; this file only starts them.
// The language loads first, because every screen draws its texts from it.

import { initLanguage } from './i18n.js';
import { applyMotionSetting } from './motion.js';
import { trackVisit } from './analytics.js';
import { rollWeek } from './weekly.js';
import { showLastWeekRecap } from './ui/recap.js';
import { initNavigation, show } from './router.js';
import { initModal } from './ui/modal.js';
import { initLanguageMenu } from './ui/language-menu.js';
import { initHome } from './ui/home.js';
import { initMap } from './ui/map.js';
import { initEvent } from './ui/event.js';
import { initShop } from './ui/shop.js';
import { initBadges } from './ui/badges.js';
import { initLeaderboard } from './ui/leaderboard.js';
import { initLockout } from './ui/lockout.js';
import { initGame } from './game/index.js';

await initLanguage();
applyMotionSetting();
initModal();
initLanguageMenu();
initNavigation();
initHome();
initMap();
initEvent();
initShop();
initBadges();
initLeaderboard();
initGame();
show('home');
initLockout();
rollWeek();
showLastWeekRecap();
trackVisit();
