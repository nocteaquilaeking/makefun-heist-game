// Guards: patrol, vision cones, suspicion, chase and the fair caught moment.
// A guard never sees through walls, cases or smoke, and a chase always starts
// with a SPOTTED! grace window so breaking line of sight saves the run.
// Guards radio each other: one guard's shout pulls nearby patrols toward
// the last-seen spot, so a sloppy sighting escalates across the whole floor.
import { CONFIG } from './config.js';
import { guardSpeedFactor } from './alarm.js';
import {
  angleDiff,
  angleTo,
  blockers,
  segmentBlocked,
  segmentHitsCircle,
} from './level.js';

export function createGuard(route, index) {
  const start = route.waypoints[0];
  return {
    name: route.name,
    x: start.x,
    y: start.y,
    angle: 0,
    waypoints: route.waypoints,
    waypointIndex: 1,
    pauseTimer: 0,
    suspicion: 0,
    mode: 'patrol', // patrol | suspicious | chase | investigate | search
    spottedTimer: 0,
    searchTimer: 0,
    lastSeen: null,
    investigateTarget: null,
    investigateTimer: 0,
    marked: false,
    markTimer: 0,
    phase: index * 1.7, // staggers patrol pauses so cones never sync up
  };
}

// Can this guard see the player right now? Cones, range, walls, smoke.
export function guardSeesPlayer(guard, player, level, smoke) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneak
    ? CONFIG.guardViewRange * 0.62
    : CONFIG.guardViewRange;
  if (dist > range) return false;
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, guard.angle)) > CONFIG.guardViewHalfAngle) return false;
  if (segmentBlocked(guard.x, guard.y, player.x, player.y, blockers(level))) return false;
  for (const cloud of smoke) {
    if (segmentHitsCircle(guard.x, guard.y, player.x, player.y, cloud.x, cloud.y, cloud.r)) {
      return false;
    }
  }
  return true;
}

export function updateGuard(guard, dt, world) {
  const { player, level, smoke } = world;
  if (guard.markTimer > 0) guard.markTimer -= dt;

  // The hotter the alarm, the faster every patrol walks.
  const speedFactor = guardSpeedFactor(world.state.alarm);
  const patrolSpeed = CONFIG.guardSpeed * speedFactor;

  const seen = guardSeesPlayer(guard, player, level, smoke);
  let rate = seen
    ? CONFIG.suspicionRate * (player.sneak ? CONFIG.suspicionSneakFactor : 1)
    : -CONFIG.suspicionDecay;
  if (seen) {
    guard.lastSeen = { x: player.x, y: player.y };
  }
  // Footsteps: a running thief is heard up close, even out of sight, so
  // sneaking matters beyond the cones. Sneaking itself stays silent. Heard
  // footsteps outweigh the calm-down: the guard grows suspicious, not calmer.
  if (!seen && player.moving && !player.sneak) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (dist < 150) {
      rate = 0.3;
      guard.lastSeen = { x: player.x, y: player.y };
    }
  }
  guard.suspicion = Math.max(0, Math.min(1, guard.suspicion + rate * dt));

  // Entering a chase always starts the fair grace window first, and the
  // guard radios it: nearby patrols turn suspicious and converge.
  if (guard.mode !== 'chase' && guard.suspicion >= 1) {
    guard.mode = 'chase';
    guard.spottedTimer = CONFIG.spottedGraceSeconds;
    radioAlert(guard, world.guards);
    world.audio.alert();
  }

  switch (guard.mode) {
    case 'patrol':
      patrolStep(guard, dt, patrolSpeed);
      if (guard.suspicion >= CONFIG.suspiciousThreshold) {
        guard.mode = 'suspicious';
      }
      break;
    case 'suspicious': {
      // Turn to the thief and close in slowly; lose the trail and calm down.
      const target = guard.lastSeen ?? { x: player.x, y: player.y };
      turnToward(guard, angleTo(guard.x, guard.y, target.x, target.y), dt, 5);
      moveToward(guard, target.x, target.y, patrolSpeed * 0.55, dt, level);
      if (guard.suspicion >= 1) {
        guard.mode = 'chase';
        guard.spottedTimer = CONFIG.spottedGraceSeconds;
        radioAlert(guard, world.guards);
      } else if (guard.suspicion <= 0.1) {
        guard.mode = 'patrol';
      }
      break;
    }
    case 'chase': {
      if (guard.spottedTimer > 0) {
        guard.spottedTimer -= dt;
        // The guard shouts and points; the thief still has the grace window.
        turnToward(guard, angleTo(guard.x, guard.y, player.x, player.y), dt, 7);
      } else if (seen) {
        moveToward(guard, player.x, player.y, CONFIG.guardChaseSpeed, dt, level);
        turnToward(guard, angleTo(guard.x, guard.y, player.x, player.y), dt, 7);
      } else {
        // Lost sight: search the last-seen spot, then give up and patrol.
        guard.mode = 'search';
        guard.searchTimer = CONFIG.searchSeconds;
      }
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (dist < CONFIG.guardRadius + CONFIG.playerRadius + 4) {
        world.caughtBy = guard;
      }
      break;
    }
    case 'investigate': {
      const target = guard.investigateTarget;
      if (!target) {
        guard.mode = 'patrol';
        break;
      }
      const arrived = moveToward(guard, target.x, target.y, patrolSpeed, dt, level);
      turnToward(
        guard,
        angleTo(guard.x, guard.y, target.x, target.y),
        dt,
        5,
      );
      if (arrived) {
        guard.investigateTimer -= dt;
        guard.angle += dt * 1.6; // look around the spot
        if (guard.investigateTimer <= 0) {
          guard.mode = 'patrol';
          guard.investigateTarget = null;
        }
      }
      break;
    }
    case 'search': {
      guard.searchTimer -= dt;
      if (guard.lastSeen) {
        const arrived = moveToward(
          guard,
          guard.lastSeen.x,
          guard.lastSeen.y,
          patrolSpeed,
          dt,
          level,
        );
        if (arrived) guard.angle += dt * 2.2;
      }
      if (guard.searchTimer <= 0) {
        guard.mode = 'patrol';
        guard.suspicion = 0.6;
      }
      break;
    }
    default:
      break;
  }
}

function patrolStep(guard, dt, speed) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = speed * dt;
  if (dist <= step) {
    guard.x = target.x;
    guard.y = target.y;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseTimer = CONFIG.guardPauseSeconds;
    return;
  }
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
}

// A guard that spots the thief radios it: patrols within earshot turn
// suspicious and head for the same last-seen spot. The shout never
// teleports anyone — they still have to walk there.
function radioAlert(shouter, guards) {
  const spot = shouter.lastSeen ?? { x: shouter.x, y: shouter.y };
  for (const other of guards) {
    if (other === shouter) continue;
    if (other.mode === 'chase') continue;
    const dist = Math.hypot(other.x - shouter.x, other.y - shouter.y);
    if (dist > CONFIG.coinLureRadius) continue;
    other.mode = 'suspicious';
    other.suspicion = Math.max(other.suspicion, CONFIG.suspiciousThreshold);
    other.lastSeen = { x: spot.x, y: spot.y };
  }
}

function turnToward(guard, targetAngle, dt, speed) {
  const diff = angleDiff(targetAngle, guard.angle);
  const step = speed * dt;
  if (Math.abs(diff) <= step) {
    guard.angle = targetAngle;
  } else {
    guard.angle += Math.sign(diff) * step;
  }
}

// Move toward a point without walking through walls; returns true on arrival.
function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const solids = blockers(level);
  let blocked = false;
  for (const r of solids) {
    if (circleInRect(nx, guard.y, CONFIG.guardRadius, r)) {
      blocked = true;
      break;
    }
  }
  if (!blocked) guard.x = nx;
  blocked = false;
  for (const r of solids) {
    if (circleInRect(guard.x, ny, CONFIG.guardRadius, r)) {
      blocked = true;
      break;
    }
  }
  if (!blocked) guard.y = ny;
  return false;
}

function circleInRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}
