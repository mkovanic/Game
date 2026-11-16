// Dobové vozidlá poskladané z tvarovaných karosérií (nie z kociek): osobné auto, hliadkové auto VB,
// nákladné auto s plachtou a cisterna s vodným delom. Predok smeruje k +Z, počiatok je na zemi v strede.
import * as THREE from 'three';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const GLASS = () => std(0x141a20, { roughness: 0.12, metalness: 0.7 });
const TYRE = () => std(0x131313, { roughness: 0.9 });
const CHROME = () => std(0xb8bcc0, { roughness: 0.25, metalness: 0.9 });

function put(g, geo, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m;
}
const box = (g, sx, sy, sz, mat, x, y, z) => put(g, new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z);

// teleso vytiahnuté z bočného profilu [[z, y], …] na šírku w
function profile(pts, w, bevel = 0.05) {
  const s = new THREE.Shape();
  pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: w - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2 });
  geo.translate(0, 0, -(w - bevel * 2) / 2);
  geo.rotateY(-Math.PI / 2); // profil (z, y) -> os Z, vytiahnutie -> os X
  return geo;
}

function wheel(g, x, z, r = 0.3, w = 0.2) {
  put(g, new THREE.CylinderGeometry(r, r, w, 18), TYRE(), x, r, z).rotateZ(Math.PI / 2);
  put(g, new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 14), std(0x8a8d90, { metalness: 0.7, roughness: 0.4 }), x, r, z, false).rotateZ(Math.PI / 2);
}

function label(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96;
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 96);
  x.fillStyle = fg; x.font = 'bold 76px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// sedan v štýle Škody 120 / Lady; vb = hliadkové auto Verejnej bezpečnosti
function sedan({ color = 0x9aa4a0, night = false, vb = false }) {
  const g = new THREE.Group(), W = 1.62;
  const paint = std(vb ? 0xe6dfb8 : color, { roughness: 0.35, metalness: 0.35 });
  // spodná časť karosérie a kabína
  put(g, profile([[-2.05, 0.32], [-2.08, 0.62], [-2.0, 0.88], [-1.2, 0.92], [0.95, 0.9], [1.95, 0.8], [2.08, 0.6], [2.05, 0.32]], W), paint, 0, 0, 0);
  put(g, profile([[-1.25, 0.9], [-0.8, 1.38], [0.3, 1.4], [0.92, 0.9]], W - 0.16, 0.06), paint, 0, 0, 0);
  // sklá: čelné, zadné a bočné
  const glass = GLASS(), sideGlass = GLASS(); glass.side = sideGlass.side = THREE.DoubleSide;
  const ws = put(g, new THREE.PlaneGeometry(W - 0.3, 0.6), glass, 0, 1.15, 0.64, false); ws.rotation.set(-0.89, 0, 0);
  const rw = put(g, new THREE.PlaneGeometry(W - 0.32, 0.58), glass, 0, 1.15, -1.05, false); rw.rotation.set(0.75, 0, 0);
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); [[-1.08, 0.96], [-0.76, 1.31], [0.26, 1.33], [0.74, 0.96]].forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
    const sg = new THREE.ShapeGeometry(sh); sg.rotateY(-Math.PI / 2);
    put(g, sg, sideGlass, s * ((W - 0.16) / 2 + 0.012), 0, 0, false);
    box(g, 0.02, 0.36, 0.05, paint, s * ((W - 0.16) / 2 + 0.016), 1.14, -0.25);          // stĺpik medzi dverami
    box(g, 0.02, 0.02, 3.6, CHROME(), s * (W / 2 + 0.005), 0.74, 0);                      // bočná lišta
    for (const z of [-0.75, 0.35]) box(g, 0.03, 0.03, 0.14, CHROME(), s * (W / 2 + 0.01), 0.84, z); // kľučky
    for (const z of [-1.3, 1.32]) wheel(g, s * 0.74, z, 0.3, 0.2);
    if (vb) {
      box(g, 0.012, 0.16, 3.7, std(0x2f6b3a, { roughness: 0.5 }), s * (W / 2 + 0.008), 0.62, 0);
      const t = put(g, new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshStandardMaterial({ map: label('VB', '#e6dfb8', '#2f6b3a'), roughness: 0.5 }), s * (W / 2 + 0.012), 0.82, -0.2, false);
      t.rotation.y = s * Math.PI / 2;
    }
  }
  // nárazníky, maska, svetlá, značky
  for (const z of [2.1, -2.1]) box(g, W + 0.06, 0.13, 0.12, CHROME(), 0, 0.42, z);
  box(g, 1.0, 0.2, 0.04, std(0x15171a), 0, 0.66, 2.07);
  const hl = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: night || vb ? 0xfff0c0 : 0x222222, emissiveIntensity: night || vb ? 2.2 : 0.3 });
  const tl = new THREE.MeshStandardMaterial({ color: 0x8a1410, emissive: 0xb01a10, emissiveIntensity: night || vb ? 1.4 : 0.2 });
  for (const s of [-1, 1]) {
    put(g, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14), hl, s * 0.6, 0.67, 2.075, false).rotateX(Math.PI / 2);
    box(g, 0.3, 0.13, 0.04, tl, s * 0.6, 0.72, -2.07);
  }
  for (const z of [2.17, -2.17]) box(g, 0.42, 0.1, 0.01, std(0xf2f2ee), 0, 0.44, z);
  if (vb) { // modrý maják a reproduktor
    box(g, 0.5, 0.05, 0.3, std(0x2a2a2a), 0, 1.43, -0.2);
    put(g, new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x2a50ff, emissive: 0x2040ff, emissiveIntensity: 2.5, transparent: true, opacity: 0.9 }), 0, 1.53, -0.2, false);
  }
  g.userData = { L: 4.2, W };
  return g;
}

// nákladné auto: valník s plachtou, alebo (cannon) cisterna s vodným delom
function lorry({ color = 0x55603f, cannon = false }) {
  const g = new THREE.Group(), W = 2.4;
  const paint = std(color, { roughness: 0.7, metalness: 0.15 }), dark = std(0x1e2124, { roughness: 0.8 });
  box(g, 1.0, 0.22, 7.0, dark, 0, 0.95, 0);                                                    // rám
  // kabína so šikmým čelným sklom a kapotou
  put(g, profile([[1.3, 1.05], [1.3, 2.55], [2.35, 2.6], [2.8, 1.95], [3.55, 1.85], [3.7, 1.05]], W - 0.1, 0.07), paint, 0, 0, 0);
  const ws = put(g, new THREE.PlaneGeometry(W - 0.45, 0.62), GLASS(), 0, 2.28, 2.6, false); ws.rotation.set(-0.6, 0, 0);
  for (const s of [-1, 1]) {
    box(g, 0.02, 0.5, 0.75, GLASS(), s * (W / 2 - 0.03), 2.15, 1.85);
    box(g, 0.06, 0.2, 0.12, dark, s * (W / 2 + 0.1), 2.2, 2.45);                                 // spätné zrkadlá
    for (const z of [-2.5, -1.35, 2.75]) wheel(g, s * 1.02, z, 0.52, 0.36);
    put(g, new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 1.2 }), s * 0.85, 1.35, 3.72, false).rotateX(Math.PI / 2);
    box(g, 0.75, 0.08, 1.5, dark, s * 1.02, 1.12, 2.75);                                          // blatníky
  }
  box(g, W + 0.1, 0.22, 0.18, dark, 0, 0.9, 3.78);                                                // nárazník
  box(g, 1.3, 0.5, 0.05, dark, 0, 1.5, 3.71);                                                     // maska
  if (cannon) {
    put(g, new THREE.CylinderGeometry(1.08, 1.08, 4.6, 20), paint, 0, 2.1, -1.2).rotateX(Math.PI / 2); // nádrž
    for (const z of [-3.1, -1.2, 0.7]) put(g, new THREE.TorusGeometry(1.09, 0.035, 6, 24), dark, 0, 2.1, z, false);
    box(g, W - 0.2, 0.25, 4.8, dark, 0, 1.12, -1.2);
    // otočná veža s dýzou
    put(g, new THREE.CylinderGeometry(0.42, 0.5, 0.45, 14), dark, 0, 3.35, 0.2);
    const nozzle = put(g, new THREE.CylinderGeometry(0.07, 0.11, 1.5, 10), dark, 0, 3.55, 0.85); nozzle.rotateX(Math.PI / 2 - 0.2);
    for (const s of [-1, 1]) put(g, new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x2a50ff, emissive: 0x2040ff, emissiveIntensity: 2 }), s * 0.8, 2.72, 1.9, false);
  } else {
    box(g, W, 0.12, 4.7, std(0x4a3a2a), 0, 1.1, -1.25);                                          // korba
    for (const s of [-1, 1]) box(g, 0.08, 0.55, 4.7, paint, s * (W / 2 - 0.04), 1.42, -1.25);
    box(g, W, 0.55, 0.08, paint, 0, 1.42, -3.6);
    // plachta s oblým vrchom
    const tarp = put(g, profile([[-3.55, 1.7], [-3.55, 2.75], [-3.3, 3.0], [0.85, 3.0], [1.1, 2.75], [1.1, 1.7]], W - 0.06, 0.1), std(0x5d6248, { roughness: 0.95 }), 0, 0, 0);
    tarp.castShadow = true;
  }
  g.userData = { L: 7.6, W: 2.5 };
  return g;
}

export function makeVehicle(kind = 'car', opts = {}) {
  if (kind === 'truck') return lorry(opts);
  if (kind === 'cannon') return lorry({ ...opts, cannon: true });
  if (kind === 'vb') return sedan({ ...opts, vb: true });
  return sedan(opts);
}
