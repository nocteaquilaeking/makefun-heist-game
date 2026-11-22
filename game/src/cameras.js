// Security cameras: wall-mounted, sweeping their cones back and forth. Being
// seen by a camera raises the alarm faster than a guard's suspicion, which is
// why the EMP tool exists. A camera never sees through walls or smoke, and an
// EMP burst switches it off for a while.
import { CONFIG } from './config.js';
import {
  angleDiff,
  blockers,
  segmentBlocked,
  segmentHitsCircle,
} from './level.js';

export function createCamera(mount) {
  return {
    id: mount.id,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    speed: mount.speed,
    angle: mount.baseAngle,
    time: 0,
    disabledTimer: 0,
    seeingPlayer: false,
    marked: false,
    markTimer: 0,
  };
}

export function updateCamera(camera, dt, world) {
  const { player, level, smoke } = world;
  camera.time += dt;
  if (camera.markTimer > 0) camera.markTimer -= dt;
  if (camera.disabledTimer > 0) {
    camera.disabledTimer -= dt;
    camera.seeingPlayer = false;
    return;
  }
  camera.angle =
    camera.baseAngle + Math.sin(camera.time * camera.speed) * camera.sweep;
  camera.seeingPlayer = cameraSeesPlayer(camera, player, level, smoke);
}

export function cameraSeesPlayer(camera, player, level, smoke) {
  if (camera.disabledTimer > 0) return false;
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneak
    ? CONFIG.cameraViewRange * 0.62
    : CONFIG.cameraViewRange;
  if (dist > range) return false;
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, camera.angle)) > CONFIG.cameraViewHalfAngle) {
    return false;
  }
  if (segmentBlocked(camera.x, camera.y, player.x, player.y, blockers(level))) {
    return false;
  }
  for (const cloud of smoke) {
    if (segmentHitsCircle(camera.x, camera.y, player.x, player.y, cloud.x, cloud.y, cloud.r)) {
      return false;
    }
  }
  return true;
}
