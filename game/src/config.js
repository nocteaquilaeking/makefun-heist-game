// Tuning constants for The Velvet Vault. One place holds every number the
// rest of the game reads, so balancing never means hunting through logic.
export const CONFIG = {
  width: 1280,
  height: 720,

  // Wren, the thief.
  playerRadius: 13,
  walkSpeed: 175,
  sneakSpeed: 96,

  // Guards.
  guardRadius: 14,
  guardSpeed: 92,
  guardChaseSpeed: 152,
  guardViewRange: 235,
  guardViewHalfAngle: 0.61, // ~35 degrees each side
  guardPauseSeconds: 1.4,
  suspicionRate: 0.85, // per second while fully seen, standing
  suspicionSneakFactor: 0.45, // sneaking is much harder to spot
  suspicionDecay: 0.32,
  suspiciousThreshold: 0.55, // guard turns and closes in
  spottedGraceSeconds: 1.2, // fair warning before a chase means caught
  searchSeconds: 3.0,

  // Cameras.
  cameraViewRange: 265,
  cameraViewHalfAngle: 0.52,
  cameraAlarmRate: 26, // alarm points per second while seen
  guardAlarmRate: 13,

  // Alarm meter 0..100.
  alarmDecay: 4.5,

  // Alarm stages: the hotter the museum, the faster every patrol walks.
  // CALM below 35, WARY from 35, LOCKDOWN from 70.
  alarmWaryAt: 35,
  alarmLockdownAt: 70,
  guardSpeedCalm: 1,
  guardSpeedWary: 1.12,
  guardSpeedLockdown: 1.25,

  // Escape scoring: loot, plus a bonus for a fast night, minus the noise.
  scoreTimeBonusPerSecond: 150, // for every second under 300
  scoreTimeBonusCapSeconds: 300,
  scoreAlarmPenaltyPerPoint: 400,
  scoreGhostAt: 100000,
  scoreCleanAt: 60000,
  scoreLoudAt: 30000,

  // Tools.
  smokeCharges: 3,
  smokeRadius: 96,
  smokeSeconds: 4,
  coinCount: 5,
  coinLureRadius: 420,
  empCharges: 2,
  empSeconds: 6,

  // Loot.
  pickupRadius: 46,
  starValue: 50000,

  // Colours of the gallery, so the look stays consistent.
  colors: {
    floorA: '#1c2340',
    floorB: '#20284a',
    carpet: '#7e2438',
    carpetEdge: '#a8324a',
    wall: '#3a2f4d',
    wallTop: '#54466e',
    cover: '#1f6f6b',
    coverEdge: '#37a89f',
    gold: '#f2c14e',
    goldDeep: '#c9922e',
    lootGlow: '#ffe9a8',
    coneCalm: 'rgba(242, 193, 78, 0.20)',
    coneSuspicious: 'rgba(242, 140, 60, 0.30)',
    coneAlert: 'rgba(226, 52, 52, 0.34)',
    cameraCone: 'rgba(96, 165, 250, 0.20)',
    cameraConeSeen: 'rgba(226, 52, 52, 0.32)',
    player: '#8b7cf6',
    playerCloak: '#5b4bc4',
    guard: '#3d4457',
    guardCap: '#232838',
  },
};
