// Every pixel of The Velvet Vault is drawn here, in code: the gallery floor,
// carpet, cases, loot, vision cones, guards, cameras, Wren, the HUD and the
// title / busted / escaped screens. Nothing is loaded from a file.
import { CONFIG } from './config.js';

const C = CONFIG.colors;

export function render(ctx, state, world, time) {
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
  drawFloor(ctx, world.level);
  drawLoot(ctx, world.loot, time);
  drawSmoke(ctx, world.smoke);
  drawCones(ctx, world);
  drawCameras(ctx, world.cameras, time);
  drawGuards(ctx, world.guards, time);
  drawPlayer(ctx, world.player, time);
  drawExit(ctx, world.level, state.hasStar, time);
  drawCabinet(ctx, world.level, state.cabinetUsed);
  drawHud(ctx, state, world);
  if (state.messageTimer > 0 && state.message) {
    drawToast(ctx, state.message);
  }
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'busted') drawBusted(ctx, state);
  if (state.mode === 'escaped') drawEscaped(ctx, state);
  if (state.mode === 'playing') {
    const chasing = world.guards.find((g) => g.mode === 'chase');
    if (chasing && chasing.spottedTimer > 0) {
      drawSpotted(ctx);
    }
  }
}

// --- the room -------------------------------------------------------------

function drawFloor(ctx, level) {
  // Checkerboard marble, two deep-navy tones.
  const tile = 64;
  for (let y = 0; y < CONFIG.height; y += tile) {
    for (let x = 0; x < CONFIG.width; x += tile) {
      const even = ((x + y) / tile) % 2 === 0;
      ctx.fillStyle = even ? C.floorA : C.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Red carpet runner along the main route.
  for (const c of level.carpet) {
    ctx.fillStyle = C.carpet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = C.carpetEdge;
    ctx.fillRect(c.x, c.y, c.w, 3);
    ctx.fillRect(c.x, c.y + c.h - 3, c.w, 3);
  }
  // Decorative wall paintings.
  for (const p of level.paintings) {
    ctx.fillStyle = C.goldDeep;
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.fillStyle = p.hue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(p.x, p.y, p.w, 6);
  }
  // Walls with a lighter top edge.
  for (const w of level.walls) {
    ctx.fillStyle = C.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = C.wallTop;
    if (w.h <= 24) ctx.fillRect(w.x, w.y + w.h - 5, w.w, 5);
    else ctx.fillRect(w.x + w.w - 5, w.y, 5, w.h);
  }
  // Display cases and pedestals.
  for (const c of [...level.cover, level.vaultPedestal]) {
    ctx.fillStyle = C.cover;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = C.coverEdge;
    ctx.fillRect(c.x, c.y, c.w, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
  }
}

function drawExit(ctx, level, hasStar, time) {
  const { x, y, r } = level.exit;
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  ctx.save();
  ctx.fillStyle = hasStar
    ? `rgba(242, 193, 78, ${pulse})`
    : 'rgba(120, 130, 160, 0.5)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#0e1428';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SKYLIGHT', x, y - 8);
  ctx.fillText('EXIT', x, y + 9);
  ctx.restore();
}

function drawCabinet(ctx, level, used) {
  const { x, y, w, h } = level.cabinet;
  ctx.fillStyle = used ? '#4a5468' : '#8a6d2f';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUPPLY', x + w / 2, y + h / 2 - 4);
  ctx.fillText('CABINET', x + w / 2, y + h / 2 + 9);
}

// --- loot -----------------------------------------------------------------

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const tw = 0.6 + 0.4 * Math.sin(time * 4 + item.sparkle);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.45 * tw;
    ctx.fillStyle = C.lootGlow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (item.kind === 'painting') {
      ctx.fillStyle = C.goldDeep;
      ctx.fillRect(item.x - 22, item.y - 16, 44, 32);
      ctx.fillStyle = '#b4632e';
      ctx.fillRect(item.x - 18, item.y - 12, 36, 24);
      ctx.fillStyle = '#f2d38a';
      ctx.beginPath();
      ctx.arc(item.x - 6, item.y - 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'gold') {
      ctx.fillStyle = C.goldDeep;
      ctx.fillRect(item.x - 16, item.y - 6, 32, 12);
      ctx.fillStyle = C.gold;
      ctx.fillRect(item.x - 13, item.y - 9, 26, 8);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(item.x - 13, item.y - 9, 26, 3);
    } else if (item.kind === 'gems') {
      ctx.fillStyle = C.coverEdge;
      ctx.fillRect(item.x - 14, item.y - 10, 28, 20);
      ctx.fillStyle = '#59d8ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 12);
      ctx.lineTo(item.x + 9, item.y);
      ctx.lineTo(item.x, item.y + 10);
      ctx.lineTo(item.x - 9, item.y);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === 'star') {
      // The Star of Marlowe: a big cut diamond on its pedestal.
      ctx.fillStyle = '#cfe9ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 18);
      ctx.lineTo(item.x + 16, item.y - 2);
      ctx.lineTo(item.x + 10, item.y + 14);
      ctx.lineTo(item.x - 10, item.y + 14);
      ctx.lineTo(item.x - 16, item.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(item.x - 4, item.y - 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ STAR OF MARLOWE ★', item.x, item.y - 30);
    }
  }
}

function drawSmoke(ctx, smoke) {
  for (const cloud of smoke) {
    const alpha = Math.max(0, Math.min(0.55, (cloud.ttl / CONFIG.smokeSeconds) * 0.55));
    ctx.fillStyle = `rgba(200, 205, 220, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(230, 233, 245, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 24, cloud.y + 12, cloud.r * 0.55, 0, Math.PI * 2);
    ctx.arc(cloud.x + 26, cloud.y - 14, cloud.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- vision cones -----------------------------------------------------------

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCones(ctx, world) {
  for (const guard of world.guards) {
    const color =
      guard.mode === 'chase'
        ? C.coneAlert
        : guard.suspicion >= CONFIG.suspiciousThreshold
          ? C.coneSuspicious
          : C.coneCalm;
    ctx.fillStyle = color;
    conePath(
      ctx,
      guard.x,
      guard.y,
      guard.angle,
      CONFIG.guardViewHalfAngle,
      CONFIG.guardViewRange,
    );
    ctx.fill();
  }
  for (const camera of world.cameras) {
    if (camera.disabledTimer > 0) continue;
    ctx.fillStyle = camera.seeingPlayer ? C.cameraConeSeen : C.cameraCone;
    conePath(
      ctx,
      camera.x,
      camera.y,
      camera.angle,
      CONFIG.cameraViewHalfAngle,
      CONFIG.cameraViewRange,
    );
    ctx.fill();
  }
  // Marked patrol routes, drawn when the player asked to see them.
  for (const guard of world.guards) {
    if (!guard.marked || guard.markTimer <= 0) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    guard.waypoints.forEach((w, i) => {
      if (i === 0) ctx.moveTo(w.x, w.y);
      else ctx.lineTo(w.x, w.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCameras(ctx, cameras, time) {
  for (const camera of cameras) {
    const disabled = camera.disabledTimer > 0;
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.fillStyle = '#20242e';
    ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = disabled ? '#555c6e' : camera.seeingPlayer ? '#e23434' : '#e2a63d';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    if (camera.seeingPlayer && !disabled) {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -16 - 3 * Math.sin(time * 8));
    }
    ctx.restore();
    if (camera.marked && camera.markTimer > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, CONFIG.cameraViewRange, camera.baseAngle - camera.sweep, camera.baseAngle + camera.sweep);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// --- people -----------------------------------------------------------------

function drawGuards(ctx, guards, time) {
  for (const guard of guards) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    // Body.
    ctx.fillStyle = C.guard;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.guardRadius, 0, Math.PI * 2);
    ctx.fill();
    // Cap brim points where the guard looks.
    ctx.rotate(guard.angle);
    ctx.fillStyle = C.guardCap;
    ctx.fillRect(6, -9, 12, 18);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Suspicion arc above the guard.
    if (guard.suspicion > 0.05) {
      const col =
        guard.mode === 'chase'
          ? '#e23434'
          : guard.suspicion >= CONFIG.suspiciousThreshold
            ? '#f28c3c'
            : '#f2c14e';
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, CONFIG.guardRadius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * guard.suspicion);
      ctx.stroke();
    }
    if (guard.marked && guard.markTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.name, guard.x, guard.y - 26);
    }
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 24 - 2 * Math.sin(time * 9));
    }
  }
}

function drawPlayer(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.angle);
  // Hooded cloak: a circle with a pointed hood.
  ctx.fillStyle = C.playerCloak;
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.playerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(2, -8);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.player;
  ctx.beginPath();
  ctx.arc(2, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.sneak) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y - 22);
  }
}

// --- HUD ----------------------------------------------------------------------

function drawHud(ctx, state, world) {
  // Top bar.
  ctx.fillStyle = 'rgba(10, 13, 28, 0.88)';
  ctx.fillRect(0, 0, CONFIG.width, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('THE VELVET VAULT', 16, 25);

  // Alarm meter.
  const ax = 250;
  const aw = 300;
  ctx.fillStyle = '#3a2030';
  ctx.fillRect(ax, 16, aw, 16);
  const alarmFrac = state.alarm / 100;
  ctx.fillStyle =
    state.alarm > 70 ? '#e23434' : state.alarm > 35 ? '#f28c3c' : '#3fae5a';
  ctx.fillRect(ax, 16, aw * alarmFrac, 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 16, aw, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('ALARM', ax, 44);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + aw, 44);
  ctx.textAlign = 'left';

  // Loot and time.
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`LOOT $${state.lootValue.toLocaleString('en-US')}`, 600, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`TIME ${formatTime(state.time)}`, 600, 40);

  // Tools.
  const tools = [
    { key: '1', name: 'Smoke', n: world.player.tools.smoke },
    { key: '2', name: 'Coin', n: world.player.tools.coin },
    { key: '3', name: 'EMP', n: world.player.tools.emp },
  ];
  tools.forEach((t, i) => {
    const x = 830 + i * 92;
    const selected =
      world.player.selectedTool === (i === 0 ? 'smoke' : i === 1 ? 'coin' : 'emp');
    ctx.fillStyle = selected ? '#f2c14e' : '#2a3352';
    ctx.fillRect(x, 10, 84, 28);
    ctx.fillStyle = selected ? '#14182a' : '#ffffff';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[${t.key}] ${t.name} ×${t.n}`, x + 42, 25);
    ctx.textAlign = 'left';
  });

  // Objective line.
  ctx.fillStyle = '#d7dcf0';
  ctx.font = '13px Georgia, serif';
  const objective = state.hasStar
    ? '★ Star secured — reach the SKYLIGHT EXIT (top right)'
    : 'Steal the STAR OF MARLOWE, then reach the skylight exit';
  ctx.fillText(objective, 16, 62);

  // Controls hint.
  ctx.fillStyle = 'rgba(215, 220, 240, 0.75)';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(
    'WASD move · Shift sneak · E grab loot · 1/2/3 tools · Space use tool · Click guard/camera to mark · R restart',
    16,
    CONFIG.height - 12,
  );
}

function drawToast(ctx, message) {
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  const w = ctx.measureText(message).width + 28;
  ctx.fillStyle = 'rgba(10, 13, 28, 0.85)';
  ctx.fillRect((CONFIG.width - w) / 2, 74, w, 30);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1;
  ctx.strokeRect((CONFIG.width - w) / 2, 74, w, 30);
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, CONFIG.width / 2, 90);
  ctx.restore();
}

function drawSpotted(ctx) {
  ctx.save();
  ctx.fillStyle = '#e23434';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPOTTED!', CONFIG.width / 2, 150);
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Break line of sight — NOW!', CONFIG.width / 2, 186);
  ctx.restore();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- screens ------------------------------------------------------------------

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 10, 22, ${alpha})`;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
}

function drawTitle(ctx, state) {
  overlay(ctx, 0.62);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE VELVET VAULT', CONFIG.width / 2, 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('One thief. Three guards. Two cameras. One diamond.', CONFIG.width / 2, 240);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#d7dcf0';
  const lines = [
    'WASD / arrows — move      Shift — sneak',
    'E — grab loot      1 / 2 / 3 — pick a tool      Space — use it',
    'Click a guard or camera to mark its patrol. Click the floor with Coin selected to toss a lure.',
    'Steal the STAR OF MARLOWE ($50,000), then slip out through the SKYLIGHT EXIT.',
    'If the alarm hits 100% — or a guard catches you — the night is over.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, CONFIG.width / 2, 300 + i * 30));
  const pulse = 0.6 + 0.4 * Math.sin(state.titleTime * 3);
  ctx.fillStyle = `rgba(242, 193, 78, ${pulse})`;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin', CONFIG.width / 2, 500);
  ctx.fillStyle = 'rgba(215, 220, 240, 0.8)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('All art drawn in code · No network · Best played with sound on', CONFIG.width / 2, 540);
}

function drawBusted(ctx, state) {
  overlay(ctx, 0.66);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5a5a';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText('BUSTED!', CONFIG.width / 2, 260);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(state.bustedReason, CONFIG.width / 2, 320);
  ctx.font = '17px Georgia, serif';
  ctx.fillText(
    `Loot kept: $${state.lootValue.toLocaleString('en-US')} · Time ${formatTime(state.time)}`,
    CONFIG.width / 2,
    360,
  );
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press R to try again', CONFIG.width / 2, 430);
}

function drawEscaped(ctx, state) {
  overlay(ctx, 0.6);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY!', CONFIG.width / 2, 220);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`The Star of Marlowe is gone, and so is Wren.`, CONFIG.width / 2, 280);
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillStyle = C.lootGlow;
  ctx.fillText(
    `Loot $${state.lootValue.toLocaleString('en-US')} · Time ${formatTime(state.time)} · Rank ${state.rank}`,
    CONFIG.width / 2,
    330,
  );
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#d7dcf0';
  ctx.fillText('Press R to run it again — louder, or cleaner.', CONFIG.width / 2, 390);
}
