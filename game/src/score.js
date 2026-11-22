// Escape scoring: the getaway pays off the planning. Loot is the haul, a
// fast night earns a time bonus, and every point of alarm at the exit costs
// money — a loud thief leaves rich but ranked low.
import { CONFIG } from './config.js';

export function scoreFor(state) {
  const timeBonus = Math.round(
    Math.max(0, CONFIG.scoreTimeBonusCapSeconds - state.time) *
      CONFIG.scoreTimeBonusPerSecond,
  );
  const alarmPenalty = Math.round(state.alarm) * CONFIG.scoreAlarmPenaltyPerPoint;
  const score = state.lootValue + timeBonus - alarmPenalty;
  return {
    score,
    timeBonus,
    alarmPenalty,
    rank: rankForScore(score),
  };
}

export function rankForScore(score) {
  if (score >= CONFIG.scoreGhostAt) return 'Ghost';
  if (score >= CONFIG.scoreCleanAt) return 'Clean';
  if (score >= CONFIG.scoreLoudAt) return 'Loud';
  return 'Sloppy';
}
