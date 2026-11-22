// The Marlowe Gallery: one floor, three connected rooms, hand-placed.
// Walls and display cases block movement and line of sight; the carpet marks
// the main route; paintings, loot, patrols and cameras are all placed here.
//
// Layout (canvas 1280x720):
//   West gallery  x 24..430   — entry, spawn at the bottom.
//   Central vault x 456..824  — the Star of Marlowe, densest patrols.
//   East gallery  x 850..1256 — the skylight exit at the top right.
// Door gaps join the rooms so every room has more than one route through it.

export function buildLevel() {
  const walls = [
    // Outer border.
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
    // Divider west/central: door gap y 444..540.
    { x: 430, y: 24, w: 26, h: 420 },
    { x: 430, y: 540, w: 26, h: 156 },
    // Divider central/east: door gap y 204..300.
    { x: 824, y: 24, w: 26, h: 180 },
    { x: 824, y: 300, w: 26, h: 396 },
  ];

  // Display cases and pedestals: cover to hide behind. They block sight.
  const cover = [
    { x: 120, y: 120, w: 90, h: 50, kind: 'case' },
    { x: 120, y: 520, w: 90, h: 50, kind: 'case' },
    { x: 280, y: 300, w: 44, h: 44, kind: 'pedestal' },
    { x: 300, y: 140, w: 70, h: 40, kind: 'case' },
    { x: 520, y: 140, w: 80, h: 44, kind: 'case' },
    { x: 700, y: 150, w: 60, h: 44, kind: 'case' },
    { x: 500, y: 480, w: 60, h: 44, kind: 'case' },
    { x: 680, y: 520, w: 90, h: 50, kind: 'case' },
    { x: 950, y: 150, w: 90, h: 50, kind: 'case' },
    { x: 1080, y: 420, w: 80, h: 44, kind: 'case' },
    { x: 950, y: 520, w: 70, h: 44, kind: 'case' },
    { x: 1150, y: 300, w: 44, h: 44, kind: 'pedestal' },
  ];

  // The vault pedestal the Star sits on (also cover).
  const vaultPedestal = { x: 620, y: 260, w: 40, h: 40, kind: 'pedestal' };

  // Loot placements: id, kind, position, value, label.
  const lootSpots = [
    { id: 'painting-sunset', kind: 'painting', x: 200, y: 46, value: 5000, label: 'Sunset Study' },
    { id: 'gold-west', kind: 'gold', x: 150, y: 300, value: 3000, label: 'Gold bars' },
    { id: 'gems-west', kind: 'gems', x: 340, y: 600, value: 12000, label: 'Sapphire case' },
    { id: 'painting-duchess', kind: 'painting', x: 560, y: 46, value: 8000, label: 'Duchess in Blue' },
    { id: 'gold-central', kind: 'gold', x: 760, y: 620, value: 3000, label: 'Gold bars' },
    { id: 'gems-central', kind: 'gems', x: 480, y: 560, value: 12000, label: 'Emerald case' },
    { id: 'star', kind: 'star', x: 640, y: 280, value: 50000, label: 'Star of Marlowe' },
    { id: 'painting-harbour', kind: 'painting', x: 1000, y: 46, value: 6000, label: 'Harbour at Dusk' },
    { id: 'gold-east', kind: 'gold', x: 1180, y: 500, value: 3000, label: 'Gold bars' },
    { id: 'gems-east', kind: 'gems', x: 900, y: 300, value: 12000, label: 'Ruby case' },
    { id: 'gold-east-2', kind: 'gold', x: 1080, y: 120, value: 3000, label: 'Gold bars' },
  ];

  // Guard patrol routes: named guards, waypoint loops.
  const guardRoutes = [
    {
      name: 'Bram',
      waypoints: [
        { x: 120, y: 200 },
        { x: 340, y: 200 },
        { x: 340, y: 480 },
        { x: 120, y: 480 },
      ],
    },
    {
      name: 'Sable',
      waypoints: [
        { x: 520, y: 200 },
        { x: 760, y: 200 },
        { x: 760, y: 560 },
        { x: 520, y: 560 },
      ],
    },
    {
      name: 'Rook',
      waypoints: [
        { x: 920, y: 180 },
        { x: 1160, y: 180 },
        { x: 1160, y: 560 },
        { x: 920, y: 560 },
      ],
    },
  ];

  // Wall cameras: mount position, base facing angle, sweep.
  const cameraMounts = [
    { id: 'cam-vault', x: 640, y: 26, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
    { id: 'cam-east', x: 1254, y: 360, baseAngle: Math.PI, sweep: 0.8, speed: 0.45 },
  ];

  return {
    walls,
    cover,
    vaultPedestal,
    lootSpots,
    guardRoutes,
    cameraMounts,
    spawn: { x: 80, y: 620 },
    exit: { x: 1196, y: 70, r: 34 },
    cabinet: { x: 60, y: 120, w: 46, h: 60 },
    // Red carpet runner: the main route across all three rooms.
    carpet: [
      { x: 40, y: 636, w: 1200, h: 30 },
      { x: 620, y: 300, w: 30, h: 340 },
    ],
    // Wall paintings that are decoration only (the loot ones hang on the
    // wall too, drawn by the loot renderer).
    paintings: [
      { x: 90, y: 30, w: 64, h: 40, hue: '#c96f4a' },
      { x: 300, y: 30, w: 52, h: 40, hue: '#4a7ec9' },
      { x: 520, y: 30, w: 64, h: 40, hue: '#7ec94a' },
      { x: 900, y: 30, w: 56, h: 40, hue: '#c94a8a' },
      { x: 1120, y: 30, w: 64, h: 40, hue: '#c9a44a' },
    ],
  };
}

// Every rectangle that blocks movement and sight.
export function blockers(level) {
  return [...level.walls, ...level.cover, level.vaultPedestal, level.cabinet];
}

// True when the segment from (x1,y1) to (x2,y2) touches any blocker rect.
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (const r of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

// Segment vs axis-aligned rectangle, by testing the four edges.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function side(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

export function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = side(x3, y3, x4, y4, x1, y1);
  const d2 = side(x3, y3, x4, y4, x2, y2);
  const d3 = side(x1, y1, x2, y2, x3, y3);
  const d4 = side(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True when the segment passes through the circle (a smoke cloud).
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
}

// Angle from (x1,y1) to (x2,y2), and the smallest difference between angles.
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Circle vs rect overlap, used for movement collision.
export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < radius * radius;
}
