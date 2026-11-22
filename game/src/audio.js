// Sound, synthesised with WebAudio — no audio files, nothing to download.
// Everything is a short oscillator blip, created lazily on the first gesture
// so browsers never complain about autoplay.
export function createAudio() {
  let ctx = null;

  function context() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }

  function tone(freq, seconds, type = 'sine', volume = 0.08, when = 0) {
    const ac = context();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') void ac.resume();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = ac.currentTime + when;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + seconds + 0.02);
    } catch {
      // Silence is fine; the game never depends on sound.
    }
  }

  return {
    unlock() {
      context();
    },
    pickup(star = false) {
      tone(star ? 880 : 660, 0.12, 'sine', 0.09);
      tone(star ? 1318 : 990, 0.16, 'sine', 0.08, 0.07);
    },
    coin() {
      tone(1568, 0.08, 'triangle', 0.07);
      tone(2093, 0.1, 'triangle', 0.05, 0.05);
    },
    smoke() {
      tone(220, 0.3, 'sawtooth', 0.04);
    },
    emp() {
      tone(180, 0.25, 'square', 0.05);
      tone(90, 0.3, 'square', 0.05, 0.12);
    },
    alert() {
      tone(440, 0.14, 'square', 0.07);
      tone(587, 0.14, 'square', 0.07, 0.12);
    },
    busted() {
      tone(311, 0.25, 'sawtooth', 0.08);
      tone(233, 0.4, 'sawtooth', 0.08, 0.2);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.09, i * 0.11));
    },
  };
}
