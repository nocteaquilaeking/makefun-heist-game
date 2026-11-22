// Wren, the thief: movement with wall collision, sneaking, marking, and the
// three tools — smoke, coin toss and EMP — each spent from a limited supply.
import { CONFIG } from './config.js';
import { blockers, circleHitsRect } from './level.js';
import { lootAtPoint, nearestLoot, takeLoot } from './loot.js';

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: -Math.PI / 2,
    sneak: false,
    tools: {
      smoke: CONFIG.smokeCharges,
      coin: CONFIG.coinCount,
      emp: CONFIG.empCharges,
    },
    selectedTool: 'smoke',
    moving: false,
  };
}

export function updatePlayer(player, dt, world, input) {
  const { level } = world;
  const move = input.moveVector();
  player.moving = move.x !== 0 || move.y !== 0;
  player.sneak = input.keys.has('shift');
  const speed = player.sneak ? CONFIG.sneakSpeed : CONFIG.walkSpeed;
  if (player.moving) {
    player.angle = Math.atan2(move.y, move.x);
    const step = speed * dt;
    tryMove(player, move.x * step, 0, level);
    tryMove(player, 0, move.y * step, level);
  }

  // Tool selection.
  if (input.keys.has('1')) player.selectedTool = 'smoke';
  if (input.keys.has('2')) player.selectedTool = 'coin';
  if (input.keys.has('3')) player.selectedTool = 'emp';

  // E picks up the nearest loot in reach.
  if (input.keys.has('e')) {
    const item = nearestLoot(world.loot, player.x, player.y);
    if (item && takeLoot(item, world.state)) {
      world.audio.pickup(item.kind === 'star');
    }
  }
}

// Axis-separated movement so Wren slides along walls instead of sticking.
function tryMove(player, dx, dy, level) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  for (const r of blockers(level)) {
    if (circleHitsRect(nx, ny, CONFIG.playerRadius, r)) return;
  }
  player.x = nx;
  player.y = ny;
}

// Resolve one mouse click: mark a guard/camera, throw a coin, or grab loot.
export function handleClick(player, click, world) {
  const { guards, cameras, loot } = world;

  for (const guard of guards) {
    if (Math.hypot(guard.x - click.x, guard.y - click.y) < 34) {
      guard.marked = !guard.marked;
      guard.markTimer = guard.marked ? 6 : 0;
      world.state.message = guard.marked
        ? `${guard.name}'s patrol marked — watch the route`
        : `${guard.name} unmarked`;
      world.state.messageTimer = 2;
      return 'mark';
    }
  }
  for (const camera of cameras) {
    if (Math.hypot(camera.x - click.x, camera.y - click.y) < 34) {
      camera.marked = !camera.marked;
      camera.markTimer = camera.marked ? 6 : 0;
      world.state.message = camera.marked
        ? 'Camera sweep marked — time the gap'
        : 'Camera unmarked';
      world.state.messageTimer = 2;
      return 'mark';
    }
  }
  if (player.selectedTool === 'coin') {
    return throwCoin(player, click, world);
  }
  const item = lootAtPoint(loot, click.x, click.y);
  if (item && Math.hypot(item.x - player.x, item.y - player.y) < 90) {
    if (takeLoot(item, world.state)) {
      world.audio.pickup(item.kind === 'star');
      return 'loot';
    }
  }
  return null;
}

export function throwCoin(player, target, world) {
  if (player.tools.coin <= 0) {
    world.state.message = 'No coins left — check the supply cabinet';
    world.state.messageTimer = 2;
    return null;
  }
  player.tools.coin -= 1;
  world.coins.push({ x: target.x, y: target.y, ttl: 5, ring: 0 });
  world.audio.coin();
  // The nearest guard in earshot goes to investigate the clink.
  let best = null;
  let bestDist = CONFIG.coinLureRadius;
  for (const guard of world.guards) {
    const d = Math.hypot(guard.x - target.x, guard.y - target.y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  if (best) {
    best.mode = 'investigate';
    best.investigateTarget = { x: target.x, y: target.y };
    best.investigateTimer = 3;
    best.suspicion = Math.min(best.suspicion, 0.4);
  }
  return 'coin';
}

// Space uses the selected tool where it makes sense.
export function useSelectedTool(player, world) {
  if (player.selectedTool === 'smoke') {
    if (player.tools.smoke <= 0) {
      world.state.message = 'No smoke pellets left';
      world.state.messageTimer = 2;
      return;
    }
    player.tools.smoke -= 1;
    world.smoke.push({
      x: player.x,
      y: player.y,
      r: CONFIG.smokeRadius,
      ttl: CONFIG.smokeSeconds,
    });
    world.audio.smoke();
  } else if (player.selectedTool === 'emp') {
    if (player.tools.emp <= 0) {
      world.state.message = 'No EMP charges left';
      world.state.messageTimer = 2;
      return;
    }
    player.tools.emp -= 1;
    for (const camera of world.cameras) {
      camera.disabledTimer = CONFIG.empSeconds;
    }
    world.state.message = 'EMP burst — cameras down!';
    world.state.messageTimer = 2.5;
    world.audio.emp();
  } else if (player.selectedTool === 'coin') {
    world.state.message = 'Click the floor to toss a coin there';
    world.state.messageTimer = 2;
  }
}
