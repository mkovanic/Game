// Všetky zvuky sú syntetizované cez Web Audio – žiadne externé súbory.
let ctx, master, ambient = [];

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(sec = 2, brown = false) {
  const c = ac();
  const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}

function loopNoise({ brown = false, type = 'bandpass', freq = 500, q = 0.7, gain = 0.2, lfo = 0 }) {
  const c = ac();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(3, brown); src.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 2);
  src.connect(f); f.connect(g); g.connect(master);
  if (lfo) {
    const o = c.createOscillator(); o.frequency.value = lfo;
    const og = c.createGain(); og.gain.value = gain * 0.4;
    o.connect(og); og.connect(g.gain); o.start();
    ambient.push({ stop: () => o.stop() });
  }
  src.start();
  ambient.push({ stop: () => { g.gain.linearRampToValueAtTime(0, c.currentTime + 1); setTimeout(() => src.stop(), 1100); } });
}

// hukot davu – niekoľko „hlasov“ (formantov) na hnedom šume
function murmur(gain = 0.15) {
  loopNoise({ brown: true, type: 'bandpass', freq: 380, q: 0.9, gain, lfo: 0.27 });
  loopNoise({ brown: true, type: 'bandpass', freq: 820, q: 1.4, gain: gain * 0.5, lfo: 0.41 });
}

export const Audio = {
  unlock() { ac(); },
  context() { return ac(); },
  output() { ac(); return master; },
  // skutočná nahrávka z dist/sfx (leží vedľa index.html); ak sa nedá prehrať, vráti false
  sample(name, vol = 0.7) {
    try {
      const a = document.createElement('audio'); a.src = `sfx/${name}.mp3`; a.volume = vol * (master ? master.gain.value : 0.8);
      a.play().catch(() => {});
      return true;
    } catch { return false; }
  },
  setVolume(v) { ac(); master.gain.value = v; },
  ambience(kind) {
    this.stopAmbience();
    ac();
    switch (kind) {
      case 'candle': loopNoise({ type: 'highpass', freq: 1800, q: 0.3, gain: 0.12 }); loopNoise({ type: 'lowpass', freq: 400, gain: 0.08 }); murmur(0.08); break;
      case 'students': murmur(0.12); loopNoise({ type: 'lowpass', freq: 250, gain: 0.05 }); break;
      case 'square': murmur(0.22); loopNoise({ type: 'lowpass', freq: 300, gain: 0.07, lfo: 0.1 }); break;
      case 'strike': loopNoise({ brown: true, type: 'lowpass', freq: 120, gain: 0.25 }); murmur(0.07); break;
      case 'border': loopNoise({ type: 'bandpass', freq: 600, q: 0.3, gain: 0.05, lfo: 0.08 }); murmur(0.1); break;
    }
  },
  stopAmbience() { ambient.forEach((a) => a.stop()); ambient = []; },

  sfx(name) {
    const c = ac(), t0 = c.currentTime;
    if (name === 'keys') {
      // tisíce kľúčov – krátke kovové zábleskové tóny
      for (let i = 0; i < 900; i++) {
        const t = t0 + Math.random() * 5;
        const o = c.createOscillator(); o.type = 'triangle';
        o.frequency.value = 2500 + Math.random() * 5000;
        const g = c.createGain();
        const env = Math.min(1, (t - t0) / 1.2) * Math.min(1, (t0 + 5 - t) / 1.2);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.012 * env, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08 + Math.random() * 0.1);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25);
      }
      const src = c.createBufferSource(); src.buffer = noiseBuffer(5);
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
      const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.1, t0 + 1.5); g.gain.linearRampToValueAtTime(0, t0 + 5);
      src.connect(f); f.connect(g); g.connect(master); src.start();
    }
    if (name === 'bells') { this.sample('bells', 0.8); return; }
    if (name === 'applause') { this.sample('applause', 0.8); return; }
    if (name === 'siren' && this.sample('siren', 0.55)) return;
    if (name === 'siren') {
      for (const [delay, pan] of [[0, -0.6], [0.7, 0.6], [1.6, 0]]) {
        const o = c.createOscillator(); o.type = 'sawtooth';
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
        const g = c.createGain(); const p = c.createStereoPanner(); p.pan.value = pan;
        const t = t0 + delay;
        o.frequency.setValueAtTime(300, t);
        for (let k = 0; k < 3; k++) { o.frequency.linearRampToValueAtTime(620, t + k * 3 + 1.5); o.frequency.linearRampToValueAtTime(300, t + k * 3 + 3); }
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 / (1 + delay), t + 1); g.gain.linearRampToValueAtTime(0, t + 9);
        o.connect(f); f.connect(g); g.connect(p); p.connect(master); o.start(t); o.stop(t + 9.2);
      }
    }
    if (name === 'water') {
      const src = c.createBufferSource(); src.buffer = noiseBuffer(4);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.5;
      const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.35, t0 + 0.4); g.gain.linearRampToValueAtTime(0, t0 + 4);
      src.connect(f); f.connect(g); g.connect(master); src.start();
    }
    if (name === 'hymn' || name === 'crowd') {
      // vzdialený zborový spev / skandovanie – akord so samohláskovým filtrom
      const notes = name === 'hymn' ? [196, 247, 294, 392] : [220, 277, 330];
      notes.forEach((fq, i) => {
        for (let v = 0; v < 4; v++) {
          const o = c.createOscillator(); o.type = 'sawtooth';
          o.frequency.value = fq * (1 + (Math.random() - 0.5) * 0.012);
          const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700 + v * 150; f.Q.value = 3;
          const g = c.createGain();
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.008, t0 + 1.5 + i * 0.1); g.gain.linearRampToValueAtTime(0, t0 + 7);
          o.connect(f); f.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 7.2);
        }
      });
    }
    if (name === 'blip') {
      const o = c.createOscillator(); o.frequency.value = 660;
      const g = c.createGain(); g.gain.setValueAtTime(0.04, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      o.connect(g); g.connect(master); o.start(); o.stop(t0 + 0.2);
    }
  },
};
