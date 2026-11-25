// The player's friends: a list of player names kept in the save data. Names are unique on the
// server, so a name is enough to find someone. Friendship is one-sided, like following.

import { player, persist } from './player.js';

const MAX_FRIENDS = 50; // matches MAX_FRIENDS in src/worker.js
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const friends = () => player.friends;
export const isFriend = name => !!name && player.friends.some(f => same(f, name));

/** Returns false when the list is full. Adding someone twice is harmless. */
export function addFriend(name) {
  if (isFriend(name)) return true;
  if (player.friends.length >= MAX_FRIENDS) return false;
  player.friends.push(name.trim());
  persist();
  return true;
}

export function removeFriend(name) {
  player.friends = player.friends.filter(f => !same(f, name));
  persist();
}
