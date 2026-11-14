import * as THREE from 'three';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

function shade(n, f) {
  const c = new THREE.Color(n);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

// Fasáda: 4 okenné osi × 4 podlažia v jednej dlaždici; vracia { map, emissive }
export function facade({ base = 0xc9b79c, seed = 1, night = false, lit = 0.35, style = 'old', windowTint = 0x1d2430 }) {
  const r = rng(seed);
  const W = 256, H = 256, cols = 4, rows = 4;
  const [c, g] = canvas(W, H);
  const [ce, ge] = canvas(W, H);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
  g.fillStyle = hex(base); g.fillRect(0, 0, W, H);
  // jemný šum omietky
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`;
    g.fillRect(r() * W, r() * H, 2 + r() * 4, 2 + r() * 4);
  }
  // špina zo zatekania
  for (let i = 0; i < 10; i++) {
    const x = r() * W;
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(40,35,30,0.12)');
    grd.addColorStop(1, 'rgba(40,35,30,0)');
    g.fillStyle = grd; g.fillRect(x, 0, 3 + r() * 6, H * r());
  }
  const cw = W / cols, rh = H / rows;
  for (let y = 0; y < rows; y++) {
    // rímsa
    g.fillStyle = shade(base, 0.82);
    g.fillRect(0, y * rh + rh - 5, W, 3);
    g.fillStyle = shade(base, 1.08);
    g.fillRect(0, y * rh + rh - 7, W, 2);
    for (let x = 0; x < cols; x++) {
      const ww = style === 'panel' ? cw * 0.7 : cw * 0.44;
      const wh = style === 'panel' ? rh * 0.45 : rh * 0.56;
      const wx = x * cw + (cw - ww) / 2, wy = y * rh + rh * 0.18;
      if (style === 'old') {
        g.fillStyle = shade(base, 1.12);
        g.fillRect(wx - 5, wy - 9, ww + 10, 6); // nadokenná rímsa
        g.fillStyle = shade(base, 0.9);
        g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8); // šambrána
      }
      const isLit = night && r() < lit;
      const warm = r() < 0.75;
      if (isLit) {
        g.fillStyle = warm ? '#f2c27a' : '#cfe0ff';
        ge.fillStyle = warm ? '#ffb85c' : '#9fc4ff';
        ge.fillRect(wx, wy, ww, wh);
      } else {
        g.fillStyle = hex(windowTint);
      }
      g.fillRect(wx, wy, ww, wh);
      // krížový rám
      g.fillStyle = style === 'panel' ? '#d8d8d0' : '#e9e2d4';
      g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      g.fillRect(wx, wy + wh * 0.35, ww, 2.5);
      ge.fillStyle = '#000';
      ge.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      // záclona
      if (!isLit && r() < 0.5) {
        g.fillStyle = 'rgba(230,225,210,0.25)';
        g.fillRect(wx, wy, ww * 0.3, wh);
      }
      // parapet
      g.fillStyle = shade(base, 0.7);
      g.fillRect(wx - 3, wy + wh, ww + 6, 4);
    }
  }
  return { map: toTex(c), emissive: night ? toTex(ce) : null };
}

export function ground(kind = 'cobble', seed = 3) {
  const r = rng(seed);
  const S = 512;
  const [c, g] = canvas(S, S);
  if (kind === 'cobble') {
    g.fillStyle = '#5e5a55'; g.fillRect(0, 0, S, S);
    const n = 16, s = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const off = (y % 2) * s / 2;
      const v = 115 + r() * 45;
      g.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
      g.beginPath();
      g.roundRect(x * s + off + 2, y * s + 2, s - 4, s - 4, 6);
      g.fill();
    }
  } else if (kind === 'asphalt') {
    g.fillStyle = '#3d3d3f'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) {
      const v = 40 + r() * 50;
      g.fillStyle = `rgba(${v},${v},${v},0.6)`;
      g.fillRect(r() * S, r() * S, 2, 2);
    }
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = 'rgba(20,20,20,0.5)'; g.lineWidth = 1.5;
      g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); }
      g.stroke();
    }
  } else if (kind === 'snow') {
    g.fillStyle = '#e6ebf0'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 5000; i++) {
      const v = 205 + r() * 50;
      g.fillStyle = `rgba(${v},${v + 3},${v + 8},0.7)`;
      g.fillRect(r() * S, r() * S, 3, 3);
    }
  } else if (kind === 'concrete') {
    g.fillStyle = '#7a7872'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 7000; i++) {
      const v = 95 + r() * 50;
      g.fillStyle = `rgba(${v},${v - 2},${v - 6},0.5)`;
      g.fillRect(r() * S, r() * S, 2, 2);
    }
    g.strokeStyle = 'rgba(40,40,40,0.5)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      g.beginPath(); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke();
      g.beginPath(); g.moveTo(i * S / 4, 0); g.lineTo(i * S / 4, S); g.stroke();
    }
  }
  return toTex(c);
}

export function glowSprite(color = '255,200,120') {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(255,255,240,1)`);
  grd.addColorStop(0.15, `rgba(${color},0.9)`);
  grd.addColorStop(0.5, `rgba(${color},0.25)`);
  grd.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return toTex(c, false);
}

export function flake() {
  const [c, g] = canvas(32, 32);
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  return toTex(c, false);
}

export function banner(text, { bg = '#f2eee4', fg = '#b01818', w = 1024, h = 256 } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // ručne maľované písmo
  g.fillStyle = fg;
  let size = h * 0.55;
  g.font = `bold ${size}px "Arial Black", Impact, sans-serif`;
  while (g.measureText(text).width > w * 0.9) { size *= 0.92; g.font = `bold ${size}px "Arial Black", Impact, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(w / 2, h / 2); g.rotate(-0.015);
  g.fillText(text, 0, 4);
  g.restore();
  // pokrčenie látky
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * w;
    const grd = g.createLinearGradient(x - 20, 0, x + 20, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(0,0,0,0.08)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - 20, 0, 40, h);
  }
  return toTex(c, false);
}

export function flagCS() {
  const [c, g] = canvas(300, 200);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 300, 100);
  g.fillStyle = '#d7141a'; g.fillRect(0, 100, 300, 100);
  g.fillStyle = '#11457e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, 100); g.lineTo(0, 200); g.fill();
  return toTex(c, false);
}

export function flagTricolor() {
  const [c, g] = canvas(300, 200);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 300, 67);
  g.fillStyle = '#0b4ea2'; g.fillRect(0, 67, 300, 67);
  g.fillStyle = '#ee1c25'; g.fillRect(0, 134, 300, 66);
  return toTex(c, false);
}

export function flagAT() {
  const [c, g] = canvas(300, 200);
  g.fillStyle = '#ed2939'; g.fillRect(0, 0, 300, 200);
  g.fillStyle = '#ffffff'; g.fillRect(0, 67, 300, 66);
  return toTex(c, false);
}

export function clockFace(h = 11, m = 50) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#222'; g.lineWidth = 8; g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineWidth = i % 3 === 0 ? 8 : 4;
    g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100);
    g.lineTo(128 + Math.sin(a) * 115, 128 - Math.cos(a) * 115); g.stroke();
  }
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2, ma = m / 60 * Math.PI * 2;
  g.lineCap = 'round';
  g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ha) * 60, 128 - Math.cos(ha) * 60); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ma) * 95, 128 - Math.cos(ma) * 95); g.stroke();
  return toTex(c, false);
}

export function label(text, sub = '') {
  const [c, g] = canvas(512, 128);
  g.font = 'bold 44px system-ui, -apple-system, Segoe UI, sans-serif';
  const w = Math.min(500, g.measureText(text).width + 40);
  g.fillStyle = 'rgba(10,12,18,0.65)';
  g.beginPath(); g.roundRect((512 - w) / 2, 20, w, 64, 32); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 54);
  if (sub) { g.font = '28px system-ui, sans-serif'; g.fillStyle = '#ffd77a'; g.fillText(sub, 256, 108); }
  const t = toTex(c, false);
  return t;
}

export function skyGradient(top, bottom) {
  const [c, g] = canvas(4, 256);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, hex(top)); grd.addColorStop(1, hex(bottom));
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  return toTex(c, false);
}

export function signTex(lines, { bg = '#f5f5f0', fg = '#111', w = 512, h = 256 } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lh = (h - 40) / lines.length;
  lines.forEach((l, i) => {
    let size = lh * 0.6;
    g.font = `bold ${size}px Arial, sans-serif`;
    while (g.measureText(l).width > w - 50) { size *= 0.92; g.font = `bold ${size}px Arial, sans-serif`; }
    g.fillText(l, w / 2, 20 + lh * (i + 0.5));
  });
  return toTex(c, false);
}
