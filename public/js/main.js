// Arrows Escape: entry point. Each module sets up its own screen; this file only starts them.
// The language loads first, because every screen draws its texts from it.

import { initLanguage } from './i18n.js';
import { applyMotionSetting, applyContrastSetting } from './motion.js';
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
import { initLeaderboard, acceptInvite } from './ui/leaderboard.js';
import { openChallenge } from './ui/challenge.js';
import { openRaceLink } from './ui/race.js';
import { openClubLink } from './ui/clubs.js';
import { openProfileLink } from './ui/profile.js';
import { claimSeasonPrize } from './ui/season-prize.js';
import { initPwa } from './pwa.js';
import { initMusic } from './music.js';
import { initTapSound } from './feedback.js';
import { initLockout } from './ui/lockout.js';
import { initGame } from './game/index.js';

await initLanguage();
applyMotionSetting();
applyContrastSetting();
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
// A link that brings its own dialog (challenge, race, club, profile) takes the place of the
// season prize and the weekly recap: one dialog at a time.
const query = new URLSearchParams(location.search);
const invited = query.has('c') || query.has('race');
acceptInvite(invited); // reads the link's friend before the dialogs below clear the address
if (!(openChallenge() || openRaceLink() || openClubLink() || openProfileLink())) {
  if (!showLastWeekRecap()) claimSeasonPrize();
}
trackVisit();
initMusic();
initTapSound();
initPwa();
