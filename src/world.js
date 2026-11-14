import * as THREE from 'three';
import * as T from './textures.js';
import { makeCharacter, crowdPoses } from './people.js';

// ───────────────────────────── pomocné ─────────────────────────────
const matCache = new Map();
function std(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
  return matCache.get(key);
}

function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
}

const TILE = 12; // 4 osi × 3 m

function scaleBoxUV(geo, sx, sy, sz) {
  const uv = geo.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * dims[f][0] / TILE, uv.getY(idx) * dims[f][1] / TILE);
    }
  }
  uv.needsUpdate = true;
}

// ───────────────────────────── kontext sveta ─────────────────────────────
class Builder {
  constructor(root, env) {
    this.root = root;
    this.env = env;
    this.boxes = [];
    this.circles = [];
    this.updaters = [];
    this.lights = 0;
    this.facades = [];
    const variants = env.palette || [0xc9b79c, 0xd8c8a8, 0xb9a48a, 0xcfc0a0, 0xa89f94, 0xd6cdb8, 0xc2a88c, 0xb5b0a4];
    variants.forEach((base, i) => this.facades.push(T.facade({ base, seed: 11 + i * 7, night: env.night, lit: env.lit ?? 0.35, style: env.style || 'old' })));
    this.facadeMats = this.facades.map((f) => new THREE.MeshStandardMaterial({
      map: f.map, roughness: 0.9,
      emissive: f.emissive ? 0xffffff : 0x000000, emissiveMap: f.emissive, emissiveIntensity: f.emissive ? 1.1 : 0,
    }));
  }

  add(o) { this.root.add(o); return o; }

  collideBox(cx, cz, sx, sz) {
    this.boxes.push({ minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2 });
  }

  building(cx, cz, sx, sz, h, { v = 0, roof = 'gable', roofColor = 0x5e3328 } = {}) {
    const geo = new THREE.BoxGeometry(sx, h, sz);
    scaleBoxUV(geo, sx, h, sz);
    const side = this.facadeMats[v % this.facadeMats.length];
    const top = std(roofColor);
    const b = mesh(geo, [side, side, top, top, side, side], cx, h / 2, cz);
    this.add(b);
    const base = this.env.palette ? this.env.palette[v % this.env.palette.length] : 0xb0a290;
    this.add(mesh(new THREE.BoxGeometry(sx + 0.5, 0.45, sz + 0.5), std(new THREE.Color(base).multiplyScalar(0.85).getHex()), cx, h, cz));
    // sokel
    this.add(mesh(new THREE.BoxGeometry(sx + 0.15, 1.1, sz + 0.15), std(0x5a544c), cx, 0.55, cz, false));
    if (roof === 'gable') {
      const along = sx > sz ? 'x' : 'z';
      const span = along === 'x' ? sz : sx, len = along === 'x' ? sx : sz;
      const rh = Math.min(6, span * 0.45);
      const s = new THREE.Shape();
      s.moveTo(-span / 2 - 0.3, 0); s.lineTo(span / 2 + 0.3, 0); s.lineTo(0, rh); s.closePath();
      const rg = new THREE.ExtrudeGeometry(s, { depth: len + 0.3, bevelEnabled: false });
      rg.translate(0, 0, -(len + 0.3) / 2);
      const r = mesh(rg, std(roofColor), cx, h + 0.2, cz);
      if (along === 'x') r.rotation.y = Math.PI / 2;
      this.add(r);
      // komín
      this.add(mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), std(0x7a5a48), cx + (along === 'x' ? len * 0.2 : span * 0.15), h + rh * 0.6, cz + (along === 'z' ? len * 0.2 : span * 0.15)));
    }
    this.collideBox(cx, cz, sx, sz);
    return b;
  }

  // rad domov pozdĺž osi
  row({ axis, fixed, from, to, depth, facing, hMin = 12, hMax = 20, seed = 1, roof = 'gable', roofColor }) {
    const r = T.rng(seed);
    let p = from;
    let v = Math.floor(r() * 8);
    while (p < to - 4) {
      const w = Math.min(to - p, 8 + r() * 8);
      const h = hMin + Math.floor(r() * ((hMax - hMin) / 3 + 1)) * 3;
      const c = p + w / 2;
      const off = fixed + facing * depth / 2;
      if (axis === 'z') this.building(off, c, depth, w, h, { v: v++, roof, roofColor });
      else this.building(c, off, w, depth, h, { v: v++, roof, roofColor });
      p += w;
    }
  }

  lamp(x, z, { light = false, h = 5 } = {}) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pole = std(0x2a2c2e, { metalness: 0.6, roughness: 0.5 });
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.11, h, 8), pole, 0, h / 2, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), pole, 0.5, h - 0.1, 0).rotateZ(Math.PI / 2));
    const on = this.env.night || this.env.dusk;
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: on ? 0xffc77a : 0x000000, emissiveIntensity: on ? 2.5 : 0 });
    g.add(mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.3, 10), std(0x333333), 1.05, h - 0.15, 0));
    g.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), bulbMat, 1.05, h - 0.32, 0, false));
    if (on && light && this.lights < 5) {
      const L = new THREE.PointLight(0xffc27a, this.env.night ? 40 : 8, 26, 1.5);
      L.position.set(1.05, h - 0.6, 0);
      g.add(L);
      this.lights++;
    }
    if (on) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
      s.position.set(1.05, h - 0.35, 0); s.scale.setScalar(1.8);
      g.add(s);
    }
    this.add(g);
    this.circles.push({ x, z, r: 0.25 });
  }

  tree(x, z, seed = 1, scale = 1, conifer = false) {
    const r = T.rng(seed);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    const bark = std(0x3b2f27);
    if (conifer) {
      g.add(mesh(new THREE.CylinderGeometry(0.15, 0.22, 2, 6), bark, 0, 1, 0));
      const leaf = std(this.env.snowy ? 0x2b4a3a : 0x22402e);
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.ConeGeometry(2.2 - i * 0.45, 2.6, 8), leaf, 0, 2.2 + i * 1.5, 0));
      if (this.env.snowy) for (let i = 0; i < 3; i++) g.add(mesh(new THREE.ConeGeometry(1.6 - i * 0.45, 0.7, 8), std(0xeef3f7), 0, 3.4 + i * 1.5, 0, false));
    } else {
      const H = 4.5 + r() * 2.5;
      g.add(mesh(new THREE.CylinderGeometry(0.14, 0.26, H, 7), bark, 0, H / 2, 0));
      const br = (parent, len, rad, depth, y) => {
        const n = depth === 0 ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const b = new THREE.Group();
          b.position.y = y * (0.55 + r() * 0.45);
          b.rotation.y = r() * Math.PI * 2;
          b.rotation.z = 0.5 + r() * 0.5;
          const m = mesh(new THREE.CylinderGeometry(rad * 0.6, rad, len, 5), bark, 0, len / 2, 0);
          b.add(m);
          parent.add(b);
          if (depth < 1) br(b, len * 0.6, rad * 0.6, depth + 1, len);
        }
      };
      br(g, 2.4, 0.1, 0, H);
    }
    this.add(g);
    this.circles.push({ x, z, r: 0.4 * scale });
  }

  car(x, z, rot = 0, color = 0x9aa4a0, kind = 'car') {
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rot;
    const body = std(color, { roughness: 0.45, metalness: 0.3 });
    const glass = std(0x1a2026, { roughness: 0.15, metalness: 0.6 });
    const wheel = std(0x151515);
    let L = 4, W = 1.6;
    if (kind === 'truck') {
      L = 7.5; W = 2.5;
      g.add(mesh(new THREE.BoxGeometry(W, 2.4, 5.2), body, 0, 2.0, -1.0));
      g.add(mesh(new THREE.BoxGeometry(W, 2.1, 2.0), body, 0, 1.85, 2.6));
      g.add(mesh(new THREE.BoxGeometry(W - 0.1, 0.8, 0.1), glass, 0, 2.3, 3.62));
      // vodné delo
      g.add(mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 10), std(0x333333), 0, 3.4, 1.8));
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), std(0x222222), 0, 3.55, 2.5).rotateX(Math.PI / 2 - 0.15));
      for (const zz of [-2.6, -0.6, 2.6]) for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), wheel, s * 1.2, 0.5, zz).rotateZ(Math.PI / 2));
    } else {
      g.add(mesh(new THREE.BoxGeometry(W, 0.65, L), body, 0, 0.62, 0));
      g.add(mesh(new THREE.BoxGeometry(W - 0.12, 0.55, L * 0.5), body, 0, 1.2, -0.15));
      g.add(mesh(new THREE.BoxGeometry(W - 0.08, 0.42, L * 0.48), glass, 0, 1.2, -0.15));
      for (const zz of [-1.25, 1.25]) for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12), wheel, s * 0.75, 0.3, zz).rotateZ(Math.PI / 2));
      const hl = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: this.env.night ? 0xffffcc : 0, emissiveIntensity: 1 });
      for (const s of [-1, 1]) g.add(mesh(new THREE.CircleGeometry(0.12, 10), hl, s * 0.55, 0.7, L / 2 + 0.01, false));
    }
    this.add(g);
    // kolízia (osovo zarovnaná aproximácia)
    const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
    this.collideBox(x, z, W * c + L * s, L * c + W * s);
    return g;
  }

  // klasická budova s portikom (divadlo, univerzita)
  grand(cx, cz, sx, sz, h, { color = 0xd8c49a, sign = null, lit = false } = {}) {
    const base = new THREE.Color(color);
    const f = T.facade({ base: color, seed: 99, night: this.env.night, lit: lit ? 0.9 : 0.3, style: 'old' });
    const m = new THREE.MeshStandardMaterial({ map: f.map, emissive: f.emissive ? 0xffffff : 0, emissiveMap: f.emissive, emissiveIntensity: f.emissive ? 1.4 : 0, roughness: 0.85 });
    const geo = new THREE.BoxGeometry(sx, h, sz);
    scaleBoxUV(geo, sx, h, sz);
    this.add(mesh(geo, m, cx, h / 2, cz));
    this.collideBox(cx, cz, sx, sz);
    const trim = std(base.clone().multiplyScalar(1.05).getHex());
    const front = cz + sz / 2;
    // portikus
    const pw = Math.min(sx * 0.5, 18), cols = 6;
    this.add(mesh(new THREE.BoxGeometry(pw + 2, 1.2, 5), std(0x9a9284), cx, 0.6, front + 2.5));
    for (let i = 0; i < cols; i++) {
      const x = cx - pw / 2 + (pw / (cols - 1)) * i;
      this.add(mesh(new THREE.CylinderGeometry(0.45, 0.5, h * 0.55, 14), trim, x, 1.2 + h * 0.275, front + 4));
      this.circles.push({ x, z: front + 4, r: 0.55 });
    }
    this.add(mesh(new THREE.BoxGeometry(pw + 2, 1.4, 5), trim, cx, 1.2 + h * 0.55 + 0.7, front + 2.5));
    const s = new THREE.Shape();
    s.moveTo(-pw / 2 - 1, 0); s.lineTo(pw / 2 + 1, 0); s.lineTo(0, 3.2); s.closePath();
    const ped = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
    this.add(mesh(ped, trim, cx, 1.2 + h * 0.55 + 1.4, front + 3.8));
    // mansardová strecha a kupola
    this.add(mesh(new THREE.BoxGeometry(sx - 2, 3, sz - 2), std(0x3e4a4a, { metalness: 0.3 }), cx, h + 1.5, cz));
    this.add(mesh(new THREE.SphereGeometry(4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x4f6e66, { metalness: 0.4, roughness: 0.5 }), cx, h + 3, cz));
    if (sign) {
      const t = T.signTex([sign], { bg: '#e9dfc4', fg: '#3a2a10', w: 1024, h: 128 });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw / 8), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
      p.position.set(cx, 1.2 + h * 0.55 + 0.7, front + 5.02);
      this.add(p);
    }
    if (lit && this.env.night) {
      const L = new THREE.SpotLight(0xffd9a0, 300, 60, 0.7, 0.6, 1.5);
      L.position.set(cx, 2, front + 22); L.target.position.set(cx, h * 0.6, front);
      this.add(L); this.add(L.target);
    }
  }

  statue(x, z, { scale = 1.35, pedestal = [2.4, 3.2, 2.4], figures = 1 } = {}) {
    const stone = std(0x8d8a82, { roughness: 0.75 });
    this.add(mesh(new THREE.BoxGeometry(pedestal[0] + 0.8, 0.5, pedestal[2] + 0.8), stone, x, 0.25, z));
    this.add(mesh(new THREE.BoxGeometry(...pedestal), stone, x, 0.5 + pedestal[1] / 2, z));
    this.add(mesh(new THREE.BoxGeometry(pedestal[0] + 0.3, 0.35, pedestal[2] + 0.3), stone, x, 0.5 + pedestal[1], z));
    const bronze = new THREE.MeshStandardMaterial({ color: 0x3f4a3c, metalness: 0.7, roughness: 0.45 });
    for (let i = 0; i < figures; i++) {
      const p = makePerson({ material: bronze, coatLong: true, hat: 'none' });
      p.scale.setScalar(scale * (i === 2 ? 0.7 : 1));
      p.position.set(x + (i - (figures - 1) / 2) * 0.9, 0.5 + pedestal[1] + 0.17, z + (i === 1 ? -0.3 : 0));
      p.rotation.y = (i - 1) * 0.25;
      if (p.userData.armR) p.userData.armR.rotation.x = i === 0 ? -2.2 : -0.3;
      this.add(p);
    }
    this.collideBox(x, z, pedestal[0] + 0.8, pedestal[2] + 0.8);
  }

  banner(x, z, text, rot = 0, opts = {}) {
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rot;
    const { w = 3.6, ...texOpts } = opts;
    const pole = std(0x6b4f32);
    for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.9, 5), pole, s * w / 2, 1.45, 0));
    const tex = T.banner(text, texOpts);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4, 8, 1), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 1 }));
    cloth.position.y = 2.4;
    cloth.castShadow = true;
    g.add(cloth);
    this.add(g);
    const ph = Math.random() * 6;
    this.updaters.push((t) => { g.position.y = Math.sin(t * 2 + ph) * 0.05; cloth.rotation.y = Math.sin(t * 1.3 + ph) * 0.06; });
  }

  flag(x, z, tex, h = 3.2) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 5), std(0x6b4f32), 0, h / 2, 0));
    const geo = new THREE.PlaneGeometry(1.2, 0.8, 10, 4);
    const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 1 }));
    cloth.position.set(0.6, h - 0.45, 0);
    g.add(cloth);
    const pos = geo.attributes.position;
    const base = pos.array.slice();
    const ph = Math.random() * 6;
    this.updaters.push((t) => {
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        pos.setZ(i, Math.sin(bx * 4 + t * 4 + ph) * 0.12 * (bx + 0.6));
      }
      pos.needsUpdate = true;
      g.rotation.y = Math.sin(t * 0.5 + ph) * 0.4;
    });
    this.add(g);
  }

  ground(kind, { size = 400, rep = 80, color = 0xffffff, rough = 0.95, metal = 0 } = {}) {
    const tex = T.ground(kind);
    tex.repeat.set(rep, rep);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, color, roughness: rough, metalness: metal }));
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    this.add(g);
    return g;
  }
}

let _glow;
function glowTex() { return _glow || (_glow = T.glowSprite()); }

// ───────────────────────────── postava ─────────────────────────────
export function makePerson(look = {}) {
  const g = new THREE.Group();
  const M = (c) => look.material || std(c);
  const coat = M(look.coat ?? 0x3a4250), pants = M(look.pants ?? 0x222222), skin = M(look.skin ?? 0xd9ad8f);
  const hair = M(look.hair ?? 0x3a2a1a), shoe = M(0x161210);
  const legs = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.1, 0.9, 0);
    leg.add(mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.85, 8), pants, 0, -0.43, 0));
    leg.add(mesh(new THREE.BoxGeometry(0.12, 0.08, 0.26), shoe, 0, -0.86, 0.05));
    legs.add(leg);
  }
  g.add(legs);
  // kabát (lathe)
  const prof = look.coatLong
    ? [[0, 0.45], [0.27, 0.45], [0.25, 0.9], [0.23, 1.2], [0.25, 1.45], [0.2, 1.52], [0.08, 1.56], [0, 1.56]]
    : [[0, 0.82], [0.22, 0.82], [0.22, 1.0], [0.22, 1.25], [0.24, 1.45], [0.19, 1.52], [0.08, 1.56], [0, 1.56]];
  const coatGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14);
  coatGeo.scale(1, 1, 0.7);
  const body = mesh(coatGeo, coat);
  g.add(body);
  // ruky
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.25, 1.48, 0);
    arm.add(mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.62, 8), coat, 0, -0.31, 0));
    arm.add(mesh(new THREE.SphereGeometry(0.055, 8, 6), skin, 0, -0.64, 0));
    arm.rotation.z = s * 0.12;
    g.add(arm);
    g.userData[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // hlava
  const head = new THREE.Group();
  head.position.y = 1.6;
  head.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), skin, 0, 0, 0));
  const skull = mesh(new THREE.SphereGeometry(0.115, 16, 12), skin, 0, 0.14, 0);
  skull.scale.set(0.92, 1.08, 1);
  head.add(skull);
  head.add(mesh(new THREE.SphereGeometry(0.03, 6, 5), skin, 0, 0.13, 0.11)); // nos
  if (!look.material) {
    const eye = std(0x1a1a1a);
    for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.014, 6, 5), eye, s * 0.04, 0.17, 0.1, false));
  }
  const hairCap = mesh(new THREE.SphereGeometry(0.122, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.16, -0.01);
  hairCap.scale.set(0.95, 1.05, 1.05);
  head.add(hairCap);
  const hc = M(look.hatColor ?? 0x222222);
  switch (look.hat) {
    case 'beret': {
      const b = mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.06, 14), hc, 0.02, 0.27, 0);
      b.rotation.z = -0.15; head.add(b); break;
    }
    case 'fedora':
      head.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), hc, 0, 0.24, 0));
      head.add(mesh(new THREE.CylinderGeometry(0.11, 0.125, 0.13, 14), hc, 0, 0.31, 0));
      break;
    case 'cap':
      head.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 14), hc, 0, 0.26, 0));
      head.add(mesh(new THREE.BoxGeometry(0.2, 0.015, 0.1), hc, 0, 0.235, 0.12));
      break;
    case 'police':
      head.add(mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.09, 14), hc, 0, 0.29, 0));
      head.add(mesh(new THREE.BoxGeometry(0.2, 0.015, 0.1), std(0x111111), 0, 0.245, 0.12));
      head.add(mesh(new THREE.BoxGeometry(0.05, 0.04, 0.01), std(0xc9a227, { metalness: 0.8 }), 0, 0.3, 0.14, false));
      break;
    case 'ushanka':
      head.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 14), hc, 0, 0.27, 0));
      for (const s of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(0.03, 0.12, 0.1), hc, s * 0.13, 0.17, 0));
      break;
    case 'scarf':
      head.add(mesh(new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hc, 0, 0.15, -0.015));
      break;
  }
  g.add(head);
  if (look.scarf) g.add(mesh(new THREE.TorusGeometry(0.1, 0.04, 6, 14), M(look.scarf), 0, 1.52, 0.01).rotateX(Math.PI / 2));
  if (look.candle) {
    const arm = g.userData.armR;
    arm.rotation.x = -0.9;
    const c = new THREE.Group();
    c.position.set(0, -0.62, 0.05);
    c.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), std(0xf3ecd8), 0, 0.08, 0, false));
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb04a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.position.y = 0.21; flame.scale.setScalar(0.22);
    c.add(flame);
    arm.add(c);
    g.userData.flame = flame;
  }
  g.userData.head = head;
  g.userData.body = body;
  return g;
}

// ───────────────────────────── dav ─────────────────────────────
const COATS = [0x2f3338, 0x3d3229, 0x46413a, 0x26303f, 0x4b3b2b, 0x5a4a3a, 0x3b4a3b, 0x6b5b4b, 0x2a2a2a, 0x54303a, 0x7a6a55, 0x384858, 0x6e6658];
const HATS = [0x1f1f1f, 0x3a2f28, 0x2b3445, 0x6b2a2a, 0x555555, 0xb8b0a0];

function crowd(B, { count, area, clear = [], seed = 5, faceTarget = null, candles = 0, kneel = 0, move = null, lanes = null, coats = COATS }) {
  const r = T.rng(seed);
  const pts = [];
  let tries = 0;
  while (pts.length < count && tries < count * 30) {
    tries++;
    const x = area.minX + r() * (area.maxX - area.minX);
    const z = area.minZ + r() * (area.maxZ - area.minZ);
    if (lanes && !lanes.some(([a, b]) => x >= a && x <= b)) continue;
    if (clear.some((c) => c.length === 3 && (x - c[0]) ** 2 + (z - c[1]) ** 2 < c[2] * c[2])) continue;
    if (clear.some((c) => c.length === 4 && x > c[0] && x < c[1] && z > c[2] && z < c[3])) continue;
    if (pts.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 0.42)) continue;
    pts.push({ x, z });
  }
  const CP = crowdPoses();
  const mods = CP.models.map((M, mi) => mi).filter((mi) => !move || CP.models[mi].walk);
  const NG = move ? 8 : 3;
  const people = pts.map((p) => {
    let yaw = r() * Math.PI * 2;
    if (faceTarget) yaw = Math.atan2(faceTarget[0] - p.x, faceTarget[1] - p.z) + (r() - 0.5) * 0.9;
    if (move) yaw = Math.atan2(move.dir[0], move.dir[1]) + (r() - 0.5) * 0.25;
    const pray = !move && r() < kneel;
    return {
      x: p.x, z: p.z, yaw, h: 0.95 + r() * 0.1, w: 0.96 + r() * 0.12, ph: r() * 10, sp: move ? move.speed * (0.85 + r() * 0.3) : 0,
      m: mods[Math.floor(r() * mods.length)], g: move ? Math.floor(r() * NG) : pray ? 2 : Math.floor(r() * 2), candle: r() < candles,
      coat: new THREE.Color(coats[Math.floor(r() * coats.length)]).multiplyScalar(0.8 + r() * 0.4),
      hat: r() < 0.5 ? new THREE.Color(HATS[Math.floor(r() * HATS.length)]) : null,
    };
  });
  // čiapky (len časť davu) – jedna inštancovaná sieť pre všetkých
  const hatted = people.filter((p) => p.hat);
  const capGeo = new THREE.SphereGeometry(1, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
  capGeo.scale(1, 0.95, 1.1);
  const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), Math.max(1, hatted.length));
  caps.count = hatted.length; caps.frustumCulled = false; caps.castShadow = true;
  hatted.forEach((p, i) => { p.hi = i; caps.setColorAt(i, p.hat); });
  B.add(caps);
  const groups = [];
  for (const mi of mods) {
    const M = CP.models[mi], geos = move ? M.walk : M.idle;
    for (let g = 0; g < NG; g++) {
      const list = people.filter((p) => p.m === mi && p.g === g);
      if (!list.length) continue;
      const hi = new THREE.InstancedMesh(geos[g].hi, M.mat, Math.min(list.length, 48));
      const lo = new THREE.InstancedMesh(geos[g].lo, M.mat, list.length);
      hi.castShadow = true; hi.receiveShadow = true; lo.castShadow = !B.env.night;
      hi.frustumCulled = lo.frustumCulled = false;
      B.add(hi); B.add(lo);
      groups.push({ list, hi, lo, max: hi.count, g, geos, M });
    }
  }
  // sviečky
  const cand = people.filter((p) => p.candle);
  let candlePts = null;
  if (cand.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cand.length * 3), 3));
    candlePts = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex(), color: 0xffb04a, size: 0.3, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    candlePts.frustumCulled = false;
    B.add(candlePts);
    if (B.env.night) for (let i = 0; i < 4 && i < cand.length; i++) {
      const c = cand[Math.floor((i / 4) * cand.length)];
      const L = new THREE.PointLight(0xffa040, 8, 12, 1.5);
      L.position.set(c.x, 1.6, c.z);
      B.add(L);
    }
  }
  const circles = people.map((p) => ({ x: p.x, z: p.z, r: 0.26 }));
  people.forEach((p, i) => (p.ci = i));
  B.circles.push(...circles);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), v = new THREE.Vector3(), hv = new THREE.Vector3();
  let frame = -1, lx = 1e9, lz = 1e9;
  const NEAR2 = 11 * 11;
  const update = (t, dt, pp = { x: 0, z: 0 }) => {
    const f = Math.floor(t * 11);
    const moved = (pp.x - lx) ** 2 + (pp.z - lz) ** 2 > 2.25;
    const still = !move && frame >= 0 && !moved;
    if (!still) { lx = pp.x; lz = pp.z; }
    for (const G of groups) {
      const geo = move ? G.geos[(G.g + f) % NG] : G.geos[G.g];
      if (move && f !== frame) { G.hi.geometry = geo.hi; G.lo.geometry = geo.lo; }
      if (still) continue; // stojaci dav stačí rozmiestniť, len keď sa hráč pohne
      const head = geo.hi.userData.head, capR = 0.108, capY = G.M.headTop - 0.125;
      let nh = 0, nl = 0;
      for (let i = 0; i < G.list.length; i++) {
        const p = G.list[i];
        if (move) {
          p.x += move.dir[0] * p.sp * dt; p.z += move.dir[1] * p.sp * dt;
          if (p.z < area.minZ) p.z = area.maxZ; if (p.z > area.maxZ) p.z = area.minZ;
          circles[p.ci].x = p.x; circles[p.ci].z = p.z;
        }
        e.set(0, p.yaw, 0); q.setFromEuler(e);
        s.set(p.w * p.h, p.h, p.w * p.h); v.set(p.x, 0, p.z);
        m4.compose(v, q, s);
        if ((p.x - pp.x) ** 2 + (p.z - pp.z) ** 2 < NEAR2 && nh < G.max) { G.hi.setMatrixAt(nh, m4); G.hi.setColorAt(nh++, p.coat); }
        else { G.lo.setMatrixAt(nl, m4); G.lo.setColorAt(nl++, p.coat); }
        if (p.hat && G.M.noHat) { m4.makeScale(0, 0, 0); caps.setMatrixAt(p.hi, m4); }
        else if (p.hat) {
          hv.copy(head).multiply(s).applyQuaternion(q); hv.y += capY * p.h;
          v.add(hv); s.set(capR * p.w * p.h, capR * p.h, capR * p.w * p.h); m4.compose(v, q, s); caps.setMatrixAt(p.hi, m4);
        }
      }
      G.hi.count = nh; G.lo.count = nl;
      for (const m of [G.hi, G.lo]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    }
    if (!still) caps.instanceMatrix.needsUpdate = true;
    frame = f;
    if (candlePts) {
      const cp = candlePts.geometry.attributes.position;
      if (move || t === 0) {
        cand.forEach((p, i) => cp.setXYZ(i, p.x + Math.sin(p.yaw) * 0.28 + Math.cos(p.yaw) * 0.12, 1.02 * p.h, p.z + Math.cos(p.yaw) * 0.28 - Math.sin(p.yaw) * 0.12));
        cp.needsUpdate = true;
      }
      candlePts.material.size = 0.29 + Math.sin(t * 17) * 0.02;
    }
  };
  update(0, 0);
  B.updaters.push(update);
  return people;
}

// ───────────────────────────── počasie ─────────────────────────────
function rain(B, count = 4000) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 6);
  const R = 30;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * R * 2, y = Math.random() * 20, z = (Math.random() - 0.5) * R * 2;
    pos.set([x, y, z, x + 0.03, y - 0.5, z], i * 6);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9fb0c8, transparent: true, opacity: 0.35 }));
  lines.frustumCulled = false;
  B.add(lines);
  B.updaters.push((t, dt, pp) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      let y = a[o + 1] - 16 * dt;
      let x = a[o], z = a[o + 2];
      if (y < 0) { y = 18 + Math.random() * 3; x = pp.x + (Math.random() - 0.5) * R * 2; z = pp.z + (Math.random() - 0.5) * R * 2; }
      a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = x + 0.03; a[o + 4] = y - 0.5; a[o + 5] = z;
    }
    geo.attributes.position.needsUpdate = true;
  });
}

function snow(B, count = 5000, speed = 1.1) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const ph = new Float32Array(count);
  const R = 35;
  for (let i = 0; i < count; i++) { pos.set([(Math.random() - 0.5) * R * 2, Math.random() * 22, (Math.random() - 0.5) * R * 2], i * 3); ph[i] = Math.random() * 10; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.flake(), size: 0.12, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0.9 }));
  pts.frustumCulled = false;
  B.add(pts);
  B.updaters.push((t, dt, pp) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const o = i * 3;
      a[o + 1] -= speed * dt;
      a[o] += Math.sin(t * 0.8 + ph[i]) * 0.4 * dt;
      if (a[o + 1] < 0) { a[o + 1] = 20; a[o] = pp.x + (Math.random() - 0.5) * R * 2; a[o + 2] = pp.z + (Math.random() - 0.5) * R * 2; }
    }
    geo.attributes.position.needsUpdate = true;
  });
}

// ───────────────────────────── prostredia ─────────────────────────────
const ENV = {
  candle: { night: true, sky: [0x070a12, 0x1c2334], fog: [0x141a26, 0.024], hemi: [0x6a7898, 0x2a2622, 0.95], sun: [0x8899cc, 0.5, [20, 40, 10]], exposure: 1.35, palette: [0xb8a98c, 0xc9b79c, 0xa89a84, 0xbfb29a, 0x9c9488, 0xcab89a] },
  students: { dusk: true, sky: [0x5b6676, 0xc9a37e], fog: [0x8f8f94, 0.014], hemi: [0xc4cbd8, 0x6a6258, 1.5], sun: [0xffc996, 1.5, [-30, 30, 40]], exposure: 1.0, lit: 0.15, palette: [0xc9b79c, 0xd8c8a8, 0xb9a48a, 0xcfc0a0, 0xa89f94, 0xd6cdb8] },
  square: { night: true, snowy: true, sky: [0x080b14, 0x262c3e], fog: [0x1f2534, 0.019], hemi: [0x7888a8, 0x3a3a40, 1.0], sun: [0x99aadd, 0.55, [-20, 40, 20]], exposure: 1.35, lit: 0.55, palette: [0xb8a98c, 0xc0b6a6, 0xa69e92, 0xc9b89c, 0x9fa0a0, 0xb0a490] },
  strike: { sky: [0x8f99a6, 0xc7cbd0], fog: [0xb4b9bf, 0.009], hemi: [0xd8dde6, 0x5a5650, 1.3], sun: [0xf0f0ff, 1.4, [30, 50, 20]], exposure: 1.0, style: 'panel', palette: [0x9a958c, 0xa8a49c, 0x8f8a82, 0xb0aaa0] },
  border: { snowy: true, sky: [0x6f9fd0, 0xe4ecf2], fog: [0xdde5ec, 0.0075], hemi: [0xdde8f6, 0xb8c0c8, 1.2], sun: [0xffe4c4, 2.2, [-30, 25, -60]], exposure: 0.95 },
};

export function buildWorld(scene, kind, { clear = [] } = {}) {
  const env = ENV[kind];
  const root = new THREE.Group();
  scene.add(root);
  const B = new Builder(root, env);

  // obloha + hmla + svetlá
  const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 16), new THREE.MeshBasicMaterial({ map: T.skyGradient(...env.sky), side: THREE.BackSide, fog: false, depthWrite: false }));
  root.add(sky);
  scene.fog = new THREE.FogExp2(env.fog[0], env.fog[1]);
  scene.background = new THREE.Color(env.sky[1]);
  root.add(new THREE.HemisphereLight(...env.hemi));
  const sun = new THREE.DirectionalLight(env.sun[0], env.sun[1]);
  sun.position.set(...env.sun[2]);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  root.add(sun);
  if (env.night) {
    const stars = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 600; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2;
      sp.push(Math.cos(th) * Math.sin(ph) * 400, Math.cos(ph) * 400, Math.sin(th) * Math.sin(ph) * 400);
    }
    stars.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    if (kind !== 'candle') root.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.6 })));
  }

  let bounds, exposure = env.exposure;
  const cl = clear;

  if (kind === 'candle') {
    B.ground('cobble', { rep: 70, color: 0xb4b4b8, rough: 0.4 });
    B.row({ axis: 'z', fixed: -19, from: -46, to: 46, depth: 12, facing: -1, seed: 3 });
    B.row({ axis: 'z', fixed: 19, from: -46, to: 46, depth: 12, facing: 1, seed: 4 });
    B.row({ axis: 'x', fixed: 48, from: -19, to: 19, depth: 12, facing: 1, seed: 5 });
    B.grand(0, -60, 34, 18, 16, { color: 0xd8c49a, sign: 'SLOVENSKÉ NÁRODNÉ DIVADLO', lit: true });
    B.row({ axis: 'x', fixed: -50, from: -40, to: -18, depth: 12, facing: -1, seed: 6 });
    B.row({ axis: 'x', fixed: -50, from: 18, to: 40, depth: 12, facing: -1, seed: 7 });
    B.statue(0, -12, { scale: 1.5 });
    for (let z = -40; z <= 40; z += 10) { B.tree(-14.5, z + 3, z + 100, 1.1); B.tree(14.5, z - 2, z + 200, 1.1); }
    for (let z = -36; z <= 40; z += 13) { B.lamp(-16.5, z, { light: z % 26 === 0 }); B.lamp(16.5, z + 6, { light: (z + 13) % 26 === 0 }); }
    B.car(-14.5, 32, 0, 0x55603f, 'truck');
    B.car(-14.5, 41, 0, 0x55603f, 'truck');
    B.car(14.8, 36, Math.PI, 0xd4cfa2);
    // policajný kordón
    for (let i = 0; i < 7; i++) {
      const p = makeCharacter({ model: 'Police_Male_03', coat: 0x4a5a3e, pants: 0x3a4632, tint: 0.85, idle: 'idle' });
      p.position.set(-12.5 + (i % 2) * 0.6, 0, 22 + i * 1.6);
      p.rotation.y = Math.PI / 2;
      root.add(p);
      B.updaters.push((t, dt) => p.userData.tick(dt, 0, false, t));
      B.circles.push({ x: p.position.x, z: p.position.z, r: 0.35 });
    }
    crowd(B, { count: 700, area: { minX: -11.5, maxX: 11.5, minZ: -34, maxZ: 26 }, clear: cl, faceTarget: [0, -60], candles: 0.65, kneel: 0.2, seed: 9 });
    rain(B);
    bounds = { minX: -17.5, maxX: 17.5, minZ: -42, maxZ: 46 };
  }

  if (kind === 'students') {
    B.ground('cobble', { rep: 70, color: 0xbdb6ac });
    B.row({ axis: 'z', fixed: -19, from: -44, to: 46, depth: 12, facing: -1, seed: 13, hMin: 15, hMax: 21 });
    B.row({ axis: 'z', fixed: 19, from: -44, to: 46, depth: 12, facing: 1, seed: 14, hMin: 12, hMax: 21 });
    B.row({ axis: 'x', fixed: 46, from: -19, to: 19, depth: 12, facing: 1, seed: 15 });
    B.grand(0, -56, 38, 16, 18, { color: 0xcfc6b0, sign: 'UNIVERZITA KOMENSKÉHO' });
    for (let z = -36; z <= 40; z += 15) { B.lamp(-16.5, z); B.lamp(16.5, z + 7); }
    for (let z = -30; z <= 36; z += 11) { B.tree(-15, z, z + 7, 1.0); B.tree(15, z + 5, z + 9, 1.0); }
    B.car(-15.2, 24, 0, 0x111214); // čierna Volga
    B.car(15.2, 14, Math.PI, 0xb7c4c9);
    B.car(15.2, 28, Math.PI, 0x8a2c22);
    crowd(B, { count: 420, area: { minX: -12, maxX: 12, minZ: -30, maxZ: 4 }, clear: cl, faceTarget: [0, -80], seed: 21, coats: [0x2f3338, 0x26303f, 0x4b3b2b, 0x6b5b4b, 0x3b4a3b, 0x54303a, 0x7a6a55, 0x384858, 0x5f4a6a] });
    const ban = ['SLOBODU ŠTÚDIA', 'DIALÓG!', 'NIE NÁSILIU', 'PRAVDU!', 'ŠTUDENTI ZA SLOBODU'];
    ban.forEach((t, i) => B.banner(-8 + i * 4, -6 - (i % 2) * 8, t, 0, { w: 3.4 }));
    for (let i = 0; i < 5; i++) B.flag(-10 + i * 5, -18 + (i % 2) * 6, T.flagCS(), 3.4);
    bounds = { minX: -17.5, maxX: 17.5, minZ: -42, maxZ: 44 };
  }

  if (kind === 'square') {
    B.ground('cobble', { rep: 80, color: 0xc8ccd4, rough: 0.8 });
    B.row({ axis: 'z', fixed: -27, from: -46, to: 46, depth: 14, facing: -1, seed: 31, hMin: 15, hMax: 24, roofColor: 0xd0d6dc });
    B.row({ axis: 'z', fixed: 27, from: -46, to: 46, depth: 14, facing: 1, seed: 32, hMin: 15, hMax: 24, roofColor: 0xd0d6dc });
    B.row({ axis: 'x', fixed: 46, from: -27, to: 27, depth: 12, facing: 1, seed: 33, roofColor: 0xd0d6dc });
    B.row({ axis: 'x', fixed: -46, from: -27, to: 27, depth: 14, facing: -1, seed: 34, hMin: 18, hMax: 24, roofColor: 0xd0d6dc, roof: 'flat' });
    B.statue(15, -6, { scale: 1.4, pedestal: [3, 4.5, 3], figures: 3 });
    for (let z = -40; z <= 40; z += 12) { B.lamp(-24, z, { light: z % 24 === 0 }); B.lamp(24, z + 6, { light: (z + 12) % 24 === 0 }); }
    // tribúna
    const wood = std(0x5a4632);
    root.add(mesh(new THREE.BoxGeometry(14, 1.4, 6), wood, 0, 0.7, -38));
    B.collideBox(0, -38, 14, 6);
    const back = T.banner('VEREJNOSŤ PROTI NÁSILIU', { bg: '#f4f1ea', fg: '#0b4ea2', w: 1024, h: 160 });
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(13, 2), new THREE.MeshStandardMaterial({ map: back, emissive: 0xffffff, emissiveMap: back, emissiveIntensity: 0.35 }));
    bw.position.set(0, 4.6, -40.9);
    root.add(bw);
    root.add(mesh(new THREE.BoxGeometry(14, 5.5, 0.3), std(0x2a2a2a), 0, 3.4, -41.1));
    for (const s of [-1, 1]) {
      root.add(mesh(new THREE.BoxGeometry(1.2, 2.6, 1), std(0x111111), s * 6.4, 2.7, -36.5));
      root.add(mesh(new THREE.BoxGeometry(1, 1.4, 0.9), std(0x151515), s * 6.4, 4.7, -36.5));
      const sp = new THREE.SpotLight(0xfff0d8, 400, 45, 0.5, 0.5, 1.5);
      sp.position.set(s * 12, 9, -26); sp.target.position.set(0, 1.5, -38);
      root.add(sp); root.add(sp.target);
    }
    root.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), std(0x222222), 0, 2.15, -36));
    crowd(B, { count: 1100, area: { minX: -22, maxX: 22, minZ: -33, maxZ: 28 }, clear: [...cl, [-1.6, 1.6, -40, 50]], faceTarget: [0, -40], candles: 0.12, seed: 41 });
    const ban = ['SLOBODNÉ VOĽBY', 'DIALÓG', 'KONIEC VLÁDY JEDNEJ STRANY', 'VPN', 'GENERÁLNY ŠTRAJK 27. 11.', 'PRAVDA ZVÍŤAZÍ'];
    ban.forEach((t, i) => B.banner(-16 + i * 6.5, -10 + (i % 3) * 9, t, 0, { w: 3.6 }));
    for (let i = 0; i < 10; i++) B.flag(-20 + i * 4.4, -26 + (i * 7) % 40, i % 2 ? T.flagCS() : T.flagTricolor(), 3.6);
    snow(B);
    bounds = { minX: -25.5, maxX: 25.5, minZ: -34, maxZ: 44 };
  }

  if (kind === 'strike') {
    B.ground('concrete', { rep: 50, color: 0xb0aca4 });
    // hlavná hala s pílovou strechou
    const hall = std(0x8f8a80);
    root.add(mesh(new THREE.BoxGeometry(56, 12, 22), hall, 0, 6, -34));
    B.collideBox(0, -34, 56, 22);
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(7, 0); s.lineTo(0, 3.5); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 22, bevelEnabled: false });
      const m = mesh(g, std(0x6f6a62), -28 + i * 7, 12, -45);
      root.add(m);
      root.add(mesh(new THREE.PlaneGeometry(22, 3.4), new THREE.MeshStandardMaterial({ color: 0x8fa0b0, roughness: 0.2, metalness: 0.5 }), -28 + i * 7 + 0.05, 13.7, -34).rotateY(-Math.PI / 2));
    }
    const fac = T.facade({ base: 0x8f8a80, seed: 5, style: 'panel' });
    const fw = new THREE.Mesh(new THREE.PlaneGeometry(56, 8), new THREE.MeshStandardMaterial({ map: fac.map }));
    fac.map.repeat.set(56 / 12, 8 / 12);
    fw.position.set(0, 7.5, -22.95); root.add(fw);
    root.add(mesh(new THREE.BoxGeometry(8, 6, 0.3), std(0x2b2f33), 0, 3, -22.9, false)); // vráta
    const sign = T.signTex(['CHEMICKÝ ZÁVOD'], { bg: '#e8e2d0', fg: '#1a3a6a', w: 1024, h: 128 });
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.75), new THREE.MeshStandardMaterial({ map: sign }));
    sp.position.set(0, 10.6, -22.8); root.add(sp);
    // bočné haly
    for (const s of [-1, 1]) { root.add(mesh(new THREE.BoxGeometry(14, 10, 46), std(0x9a958c), s * 30, 5, 0)); B.collideBox(s * 30, 0, 14, 46); }
    // komíny
    const strip = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#b02a24' : '#e8e4dc'; g.fillRect(0, i * 8, 4, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    for (const [x, z, h] of [[-22, -70, 70], [12, -78, 85], [40, -62, 55]]) {
      root.add(mesh(new THREE.CylinderGeometry(1.6, 2.8, h, 16), new THREE.MeshStandardMaterial({ map: strip }), x, h / 2, z));
      const smoke = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flake(), color: 0xd0d0d0, transparent: true, opacity: 0.5, depthWrite: false }));
      smoke.position.set(x, h + 6, z); smoke.scale.set(18, 12, 1); root.add(smoke);
      B.updaters.push((t) => { smoke.position.x = x + Math.sin(t * 0.2) * 3; });
    }
    for (const [x, z] of [[-40, -40], [-40, -52], [44, -30]]) root.add(mesh(new THREE.CylinderGeometry(6, 6, 12, 24), std(0xc8c8c4, { metalness: 0.5, roughness: 0.4 }), x, 6, z));
    root.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 70, 10), std(0x777777, { metalness: 0.6 }), 0, 14.5, -24).rotateZ(Math.PI / 2));
    // plot a brána
    for (const s of [-1, 1]) {
      const len = 20;
      root.add(mesh(new THREE.BoxGeometry(len, 2.6, 0.3), std(0x7a776f), s * (5 + len / 2), 1.3, 30));
      B.collideBox(s * (5 + len / 2), 30, len, 0.4);
      root.add(mesh(new THREE.BoxGeometry(1, 4, 1), std(0x6a665e), s * 5, 2, 30));
    }
    const ck = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshStandardMaterial({ map: T.clockFace(11, 58) }));
    ck.position.set(5, 5, 29.4); ck.rotation.y = Math.PI; root.add(ck);
    root.add(mesh(new THREE.CylinderGeometry(1, 1, 0.2, 32), std(0x333333), 5, 5, 29.55).rotateX(Math.PI / 2));
    // nákladné autá, sudy
    B.car(-16, 18, 0.2, 0x3e5f8a, 'truck');
    B.car(15, -12, -0.1, 0x7a3a2a, 'truck');
    for (let i = 0; i < 12; i++) root.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12), std(i % 3 ? 0x2b5c8a : 0xb7472a, { metalness: 0.4 }), 18 + (i % 4) * 0.8, 0.45, 8 + Math.floor(i / 4) * 0.8));
    B.collideBox(19.2, 8.8, 3.6, 2.8);
    crowd(B, { count: 280, area: { minX: -18, maxX: 18, minZ: -18, maxZ: 16 }, clear: cl, faceTarget: [0, -24], seed: 51, coats: [0x2b3f63, 0x2b3f63, 0x3a4a6a, 0x5a6a7a, 0x4a4a4a, 0x6b6b5b, 0x7a8a9a] });
    B.banner(-6, -18, 'GENERÁLNY ŠTRAJK 12.00 – 14.00', 0, { w: 5, fg: '#0b4ea2' });
    B.banner(7, -16, 'SME SO ŠTUDENTMI', 0, { w: 3.6 });
    for (let i = 0; i < 6; i++) B.flag(-14 + i * 5.5, -8 + (i % 2) * 10, i % 2 ? T.flagCS() : T.flagTricolor(), 3.4);
    bounds = { minX: -22, maxX: 22, minZ: -21, maxZ: 28 };
  }

  if (kind === 'border') {
    B.ground('snow', { rep: 40, color: 0xffffff, rough: 0.9 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 400), new THREE.MeshStandardMaterial({ map: (() => { const t = T.ground('asphalt'); t.repeat.set(2, 100); return t; })(), roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; root.add(road);
    // dvojitý plot so ostnatým drôtom
    const post = std(0x5a5a5a, { metalness: 0.5 });
    const wireVerts = [];
    for (const fz of [0, 7]) {
      for (let x = -120; x <= 120; x += 3) {
        if (Math.abs(x) < 7) continue;
        root.add(mesh(new THREE.BoxGeometry(0.12, 3, 0.12), post, x, 1.5, fz));
        const arm = mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), post, x, 3.15, fz - 0.2); arm.rotation.x = -0.6; root.add(arm);
        if (x + 3 <= 120 && Math.abs(x + 3) >= 7) for (const h of [0.4, 0.9, 1.4, 1.9, 2.4, 2.9]) wireVerts.push(x, h, fz, x + 3, h, fz);
      }
      B.collideBox(-63.5, fz, 113, 0.5);
      B.collideBox(63.5, fz, 113, 0.5);
      // otvorená brána
      for (const s of [-1, 1]) {
        const gate = new THREE.Group();
        gate.position.set(s * 7, 0, fz); gate.rotation.y = s * 1.3;
        gate.add(mesh(new THREE.BoxGeometry(0.1, 3, 0.1), post, 0, 1.5, 0));
        gate.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 5), post, 0, 2.8, -2.5));
        gate.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 5), post, 0, 0.3, -2.5));
        gate.add(mesh(new THREE.BoxGeometry(0.1, 3, 0.1), post, 0, 1.5, -5));
        root.add(gate);
      }
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wireVerts, 3));
    root.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x3a3a3a })));
    // ostnatý drôt – špirály
    const coil = new THREE.TorusGeometry(0.4, 0.015, 4, 16);
    const coils = new THREE.InstancedMesh(coil, std(0x555555, { metalness: 0.6 }), 160);
    const m4 = new THREE.Matrix4(); let ci = 0;
    for (let x = -120; x <= 120 && ci < 160; x += 1.5) { if (Math.abs(x) < 7) continue; m4.makeRotationY(Math.PI / 2); m4.setPosition(x, 0.4, 3.5); coils.setMatrixAt(ci++, m4); }
    coils.count = ci; root.add(coils);
    // strážna veža
    const tw = new THREE.Group(); tw.position.set(16, 0, 10);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tw.add(mesh(new THREE.BoxGeometry(0.25, 9, 0.25), std(0x4a4a44), a * 1.3, 4.5, b * 1.3));
    tw.add(mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), std(0x5b6648), 0, 10, 0));
    tw.add(mesh(new THREE.BoxGeometry(3.5, 0.9, 3.7), std(0x20252a, { roughness: 0.2 }), 0, 10.3, 0));
    tw.add(mesh(new THREE.ConeGeometry(3.1, 1.4, 4), std(0x3a3a34), 0, 11.9, 0).rotateY(Math.PI / 4));
    root.add(tw); B.collideBox(16, 10, 3, 3);
    // hraničné značky
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), new THREE.MeshStandardMaterial({ map: T.signTex(['ŠTÁTNA HRANICA', 'ČSSR'], { bg: '#ffffff', fg: '#b01818' }) }));
    s1.position.set(-6, 2.6, 12); root.add(s1);
    root.add(mesh(new THREE.BoxGeometry(0.1, 2, 0.1), post, -6, 1, 11.95));
    const s2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), new THREE.MeshStandardMaterial({ map: T.signTex(['REPUBLIK', 'ÖSTERREICH'], { bg: '#ffffff', fg: '#111111' }) }));
    s2.position.set(6, 2.6, -8); root.add(s2);
    root.add(mesh(new THREE.BoxGeometry(0.1, 2, 0.1), post, 6, 1, -8.05));
    B.flag(9, -9, T.flagAT(), 5);
    B.flag(-9, 13, T.flagCS(), 5);
    // stôl s čajom
    root.add(mesh(new THREE.BoxGeometry(2.4, 0.08, 1), std(0x8a6a4a), -9, 0.9, -16));
    for (const s of [-1, 1]) root.add(mesh(new THREE.BoxGeometry(0.08, 0.9, 0.9), std(0x6a4a2a), -9 + s * 1.1, 0.45, -16));
    for (let i = 0; i < 5; i++) root.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8), std(0xf0f0f0), -9.8 + i * 0.4, 1.0, -16));
    root.add(mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.4, 10), std(0x9a2a2a, { metalness: 0.4 }), -8.3, 1.15, -16));
    B.collideBox(-9, -16, 2.4, 1);
    // stromy a kopce
    const r = T.rng(77);
    for (let i = 0; i < 70; i++) {
      const x = (r() < 0.5 ? -1 : 1) * (14 + r() * 60), z = -60 + r() * 120;
      B.tree(x, z, i + 300, 0.9 + r() * 0.6, r() < 0.4);
    }
    const hill = std(0xe8eef3, { roughness: 1 });
    for (const [x, z, s] of [[-60, -170, 60], [30, -200, 80], [120, -150, 50], [-150, -120, 50]]) {
      const h = mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hill, x, 0, z, false);
      h.scale.set(s * 1.4, s * 0.45, s); root.add(h);
    }
    // hrad Hainburg na kopci
    const castle = std(0x9a948a);
    root.add(mesh(new THREE.BoxGeometry(14, 8, 8), castle, -60, 30, -170, false));
    root.add(mesh(new THREE.CylinderGeometry(3, 3, 14, 10), castle, -52, 32, -168, false));
    crowd(B, { count: 520, area: { minX: -3.8, maxX: 3.8, minZ: -58, maxZ: 58 }, lanes: [[-3.8, -1.1], [1.1, 3.8]], move: { dir: [0, -1], speed: 1.15 }, seed: 61 });
    snow(B, 1500, 0.6);
    bounds = { minX: -30, maxX: 30, minZ: -56, maxZ: 52 };
  }

  return {
    root,
    boxes: B.boxes,
    circles: B.circles,
    bounds,
    exposure,
    night: !!env.night,
    update(t, dt, pp) { for (const u of B.updaters) u(t, dt, pp); },
    dispose() {
      scene.remove(root);
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach((m) => { if (m.map && m.map !== _glow) m.map.dispose(); if (m.emissiveMap) m.emissiveMap.dispose(); m.dispose(); });
      });
      matCache.clear();
    },
  };
}
