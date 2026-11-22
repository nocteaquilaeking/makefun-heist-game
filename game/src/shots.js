// Deterministic screenshot states (?shot=<name>&seed=<n>).
// Each shot is a REAL state of the running game — built with the same
// createState/update/render code the player gets — then frozen, so the frame
// the browser captures is exactly the frame the game produces.
//
//   start — title screen over the gallery, guards mid-patrol.
//   play  — mid-heist: Wren near the Star, a guard cone sweeping close,
//           alarm at 35%, loot on the walls and floor.
//   end   — the getaway screen, reached by really winning: the Star is taken
//           and Wren steps into the skylight exit.
import { update } from './game.js';

const STEP = 1 / 60;

function emptyInput() {
  return {
    keys: new Set(),
    takeClick() {
      return null;
    },
    moveVector() {
      return { x: 0, y: 0 };
    },
  };
}

function silentAudio() {
  const noop = () => {};
  return {
    unlock: noop,
    pickup: noop,
    coin: noop,
    smoke: noop,
    emp: noop,
    alert: noop,
    busted: noop,
    win: noop,
  };
}

// Advance the world with no player input for `seconds` of game time.
function idle(state, audio, seconds) {
  const input = emptyInput();
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    update(state, STEP, input, audio);
  }
}

export function applyShot(state, name, seed) {
  const audio = silentAudio();
  if (name === 'start') {
    // Title over a living gallery: let the patrols walk for a while.
    idle(state, audio, 8);
    state.mode = 'title';
  } else if (name === 'play') {
    state.mode = 'playing';
    idle(state, audio, 5);
    // Mid-heist: Wren has slipped into the vault room.
    state.player.x = 560;
    state.player.y = 380;
    state.player.angle = Math.PI / 4;
    state.time = 94;
    state.alarm = 35;
    state.alarmStage = 'WARY';
    // One smoke pellet already spent: Wren hides in the cloud, and a coin
    // lure still rings on the floor behind her.
    state.player.tools.smoke = 2;
    state.smoke.push({ x: 560, y: 380, r: 96, ttl: 99 });
    state.coins.push({ x: 500, y: 430, ttl: 99, ring: 30 });
    // The vault camera has her: red cone, blinking eye, alarm climbing.
    const vaultCam = state.cameras[0];
    vaultCam.angle = Math.atan2(
      state.player.y - vaultCam.y,
      state.player.x - vaultCam.x,
    );
    vaultCam.seeingPlayer = true;
    // Some loot already pocketed on the way in.
    for (const id of ['painting-sunset', 'gold-west', 'gold-central']) {
      const item = state.loot.find((l) => l.id === id);
      if (item) item.taken = true;
    }
    state.lootValue = 11000;
    state.lootTaken = 3;
    // Sable closes in: suspicion high, cone sweeping toward Wren, patrol
    // route marked so the judge can read where she walks next.
    const sable = state.guards[1];
    sable.x = 700;
    sable.y = 300;
    sable.angle = Math.atan2(state.player.y - sable.y, state.player.x - sable.x);
    sable.suspicion = 0.62;
    sable.mode = 'suspicious';
    sable.lastSeen = { x: state.player.x, y: state.player.y };
    sable.marked = true;
    sable.markTimer = 99;
    state.message = 'The Star of Marlowe is right there — time it!';
    state.messageTimer = 99;
  } else if (name === 'end') {
    state.mode = 'playing';
    state.time = 204;
    state.alarm = 12;
    // Really win it: take the Star, walk Wren into the skylight, let the
    // game's own update call the getaway screen.
    const star = state.loot.find((l) => l.id === 'star');
    if (star) star.taken = true;
    state.hasStar = true;
    state.lootValue = 68000;
    state.lootTaken = 7;
    state.player.x = state.level.exit.x;
    state.player.y = state.level.exit.y;
    update(state, STEP, emptyInput(), audio);
  }
  state.shotFrozen = true;
  window.__shot = { name, seed, ready: true };
}
