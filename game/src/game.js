// The game itself: state machine (title / playing / busted / escaped), the
// alarm meter, win and lose conditions, and the update loop that ties the
// player, guards, cameras and loot together.
import { CONFIG } from './config.js';
import { updateAlarmStage } from './alarm.js';
import { scoreFor } from './score.js';
import { createCamera, updateCamera } from './cameras.js';
import { createGuard, updateGuard } from './guards.js';
import { buildLevel } from './level.js';
import { createLoot } from './loot.js';
import { createPlayer, handleClick, updatePlayer, useSelectedTool } from './player.js';

export function createState(seed = 1) {
  const level = buildLevel();
  return {
    mode: 'title',
    seed,
    time: 0,
    titleTime: 0,
    alarm: 0,
    alarmStage: 'CALM',
    lootValue: 0,
    lootTaken: 0,
    hasStar: false,
    cabinetUsed: false,
    message: '',
    messageTimer: 0,
    bustedReason: '',
    rank: '',
    score: null,
    shotFrozen: false,
    spaceHeld: false,
    level,
    player: createPlayer(level.spawn),
    guards: level.guardRoutes.map((route, i) => createGuard(route, i)),
    cameras: level.cameraMounts.map((mount) => createCamera(mount)),
    loot: createLoot(level),
    smoke: [],
    coins: [],
    caughtBy: null,
  };
}

export function update(state, dt, input, audio) {
  if (state.mode === 'title') {
    state.titleTime += dt;
    // The gallery lives behind the title: guards patrol, cameras sweep.
    stepWorld(state, worldOf(state, audio), dt);
    if (input.keys.has('enter') || input.takeClick()) {
      state.mode = 'playing';
      audio.unlock();
    }
    return;
  }
  if (state.mode !== 'playing') {
    if (input.keys.has('r')) {
      resetState(state);
    }
    return;
  }

  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;

  const world = worldOf(state, audio);
  updatePlayer(state.player, dt, world, input);

  // Space uses the selected tool (edge-triggered: only on a fresh press).
  if (input.keys.has('space') && !state.spaceHeld) {
    useSelectedTool(state.player, world);
    state.spaceHeld = true;
  }
  if (!input.keys.has('space')) state.spaceHeld = false;

  // Mouse clicks: mark, toss a coin, or grab loot.
  const click = input.takeClick();
  if (click) {
    audio.unlock();
    handleClick(state.player, click, world);
  }

  stepWorld(state, world, dt);

  // Alarm: rises while seen, decays while hidden.
  const maxSuspicion = Math.max(0, ...state.guards.map((g) => g.suspicion));
  const cameraSeen = state.cameras.some((c) => c.seeingPlayer);
  if (cameraSeen) {
    state.alarm += CONFIG.cameraAlarmRate * dt;
  } else if (maxSuspicion >= CONFIG.suspiciousThreshold) {
    state.alarm += CONFIG.guardAlarmRate * maxSuspicion * dt;
  } else {
    state.alarm -= CONFIG.alarmDecay * dt;
  }
  state.alarm = Math.max(0, Math.min(100, state.alarm));
  updateAlarmStage(state, audio);

  // A chase whose grace window ran out with the thief still in sight ends it.
  // Suspicion only stays at its peak while the guard still sees Wren: if the
  // thief broke line of sight during the window, it has decayed below 0.99
  // and the guard falls back to searching instead.
  const chaser = state.guards.find(
    (g) => g.mode === 'chase' && g.spottedTimer <= 0 && g.suspicion >= 0.99,
  );
  if (chaser) {
    bust(state, audio, `Caught by ${chaser.name} in the open.`);
    return;
  }
  if (state.caughtBy) {
    bust(state, audio, `Caught by ${state.caughtBy.name} — too close, too late.`);
    return;
  }
  if (state.alarm >= 100) {
    bust(state, audio, 'The alarm hit 100% — the museum locked down.');
    return;
  }

  // Supply cabinet: one restock per run.
  const cab = state.level.cabinet;
  if (
    !state.cabinetUsed &&
    state.player.x > cab.x - 20 &&
    state.player.x < cab.x + cab.w + 20 &&
    state.player.y > cab.y - 20 &&
    state.player.y < cab.y + cab.h + 20
  ) {
    state.cabinetUsed = true;
    state.player.tools.smoke += 1;
    state.player.tools.coin += 2;
    state.player.tools.emp += 1;
    state.message = 'Supply cabinet: +1 smoke, +2 coins, +1 EMP';
    state.messageTimer = 3;
    audio.pickup();
  }

  // Win: the Star, then the skylight. The getaway scores the whole night.
  if (state.hasStar) {
    const exit = state.level.exit;
    if (Math.hypot(state.player.x - exit.x, state.player.y - exit.y) < exit.r + 6) {
      state.mode = 'escaped';
      state.score = scoreFor(state);
      state.rank = state.score.rank;
      audio.win();
    }
  }
}

function worldOf(state, audio) {
  return {
    state,
    audio,
    level: state.level,
    player: state.player,
    guards: state.guards,
    cameras: state.cameras,
    loot: state.loot,
    smoke: state.smoke,
    coins: state.coins,
    caughtBy: null,
  };
}

function stepWorld(state, world, dt) {
  for (const guard of state.guards) {
    updateGuard(guard, dt, world);
  }
  for (const camera of state.cameras) {
    updateCamera(camera, dt, world);
  }
  if (world.caughtBy) state.caughtBy = world.caughtBy;
  // Smoke clouds and coin rings fade.
  for (const cloud of state.smoke) cloud.ttl -= dt;
  state.smoke = state.smoke.filter((c) => c.ttl > 0);
  for (const coin of state.coins) {
    coin.ttl -= dt;
    coin.ring += dt * 40;
  }
  state.coins = state.coins.filter((c) => c.ttl > 0);
}

function bust(state, audio, reason) {
  state.mode = 'busted';
  state.bustedReason = reason;
  audio.busted();
}

function resetState(state) {
  const fresh = createState(state.seed);
  for (const key of Object.keys(fresh)) {
    state[key] = fresh[key];
  }
  state.mode = 'playing';
}
