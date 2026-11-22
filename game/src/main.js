// Boot: wire the canvas, input and audio, apply a ?shot= state when asked,
// then run the loop. In shot mode the world is frozen after setup and the
// frame renders identically every time, which is what a screenshot needs.
import { CONFIG } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createState, update } from './game.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const shot = params.get('shot');

const audio = createAudio();
const input = createInput(canvas);
const state = createState(seed);

if (shot) {
  applyShot(state, shot, seed);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.shotFrozen) {
    update(state, dt, input, audio);
  }
  render(ctx, state, state, now / 1000);
  requestAnimationFrame(frame);
}

// Clicking the title screen starts the game; the update loop reads the same
// click queue, so one click never starts the game twice.
canvas.addEventListener('pointerdown', () => audio.unlock());
requestAnimationFrame(frame);

// A handle for the curious and for automated checks.
window.__game = { state, config: CONFIG };
