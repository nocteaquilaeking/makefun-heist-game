// Alarm stages: the museum heats up as the meter climbs, and the whole
// floor feels it — guards walk faster at WARY, faster still at LOCKDOWN.
// A stage change is announced once, with a message and an alarm sting.
import { CONFIG } from './config.js';

export function alarmStage(alarm) {
  if (alarm >= CONFIG.alarmLockdownAt) return 'LOCKDOWN';
  if (alarm >= CONFIG.alarmWaryAt) return 'WARY';
  return 'CALM';
}

export function guardSpeedFactor(alarm) {
  const stage = alarmStage(alarm);
  if (stage === 'LOCKDOWN') return CONFIG.guardSpeedLockdown;
  if (stage === 'WARY') return CONFIG.guardSpeedWary;
  return CONFIG.guardSpeedCalm;
}

export function alarmStageMessage(stage) {
  if (stage === 'LOCKDOWN') {
    return 'LOCKDOWN — every patrol is running now!';
  }
  if (stage === 'WARY') {
    return 'Alarm WARY — guards are walking faster';
  }
  return '';
}

// Watch the meter each frame; announce a stage change exactly once.
export function updateAlarmStage(state, audio) {
  const stage = alarmStage(state.alarm);
  if (stage === state.alarmStage) return;
  state.alarmStage = stage;
  const message = alarmStageMessage(stage);
  if (message) {
    state.message = message;
    state.messageTimer = 3;
    audio.alert();
  }
}
