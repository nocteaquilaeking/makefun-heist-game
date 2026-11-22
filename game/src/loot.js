// Loot: every stealable item in the gallery, from wall paintings to the Star
// of Marlowe itself. Picking loot up is the score; the Star is the win target.
import { CONFIG } from './config.js';

export function createLoot(level) {
  return level.lootSpots.map((spot) => ({
    ...spot,
    taken: false,
    sparkle: Math.random() * Math.PI * 2,
  }));
}

export function nearestLoot(loot, x, y, maxDist = CONFIG.pickupRadius) {
  let best = null;
  let bestDist = maxDist;
  for (const item of loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best;
}

export function lootAtPoint(loot, x, y, maxDist = 70) {
  return nearestLoot(loot, x, y, maxDist);
}

export function takeLoot(item, state) {
  if (!item || item.taken) return false;
  item.taken = true;
  state.lootValue += item.value;
  state.lootTaken += 1;
  if (item.kind === 'star') {
    state.hasStar = true;
    state.message = 'The Star of Marlowe is yours — reach the skylight!';
    state.messageTimer = 4;
  } else {
    state.message = `${item.label} — $${item.value.toLocaleString('en-US')}`;
    state.messageTimer = 2.2;
  }
  return true;
}

export function totalLootValue(level) {
  return level.lootSpots.reduce((sum, spot) => sum + spot.value, 0);
}
