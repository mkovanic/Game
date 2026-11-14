// Skutočné rigované 3D postavy s motion-capture animáciami (modely z projektu three.js, pôvod Mixamo).
// Xbot = civilisti (prefarbení podľa častí tela + vlasy, čiapky, šály), Soldier = uniformované zložky.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import xbotBin from '../assets/Xbot.glb';
import soldierBin from '../assets/Soldier.glb';

let xbot = null, soldier = null, baked = null;
const parse = (bin) => new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej));

export async function initPeople() {
  [xbot, soldier] = await Promise.all([parse(xbotBin), parse(soldierBin)]);
  xbot.scene.traverse((o) => { if (o.isSkinnedMesh) classify(o); });
  baked = bakeCrowd();
}
export const peopleReady = () => !!xbot;

// časť tela podľa dominantnej kosti: 0 = kabát, 1 = pokožka, 2 = nohavice, 3 = topánky
function classify(mesh) {
  const g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const names = mesh.skeleton.bones.map((b) => b.name.replace('mixamorig:', ''));
  const part = new Float32Array(si.count);
  const pos = g.attributes.position, nor = g.attributes.normal;
  for (let i = 0; i < si.count; i++) {
    let best = 0, bw = -1;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
    const n = names[best];
    let p = 0;
    if (/Head|Neck/.test(n)) p = 1;
    else if (/Hand/.test(n)) p = 1;
    else if (/Foot|Toe/.test(n)) p = 3;
    else if (/Leg/.test(n)) p = 2;
    part[i] = p;
    // zimné oblečenie – trup a ruky trochu „nafúkneme“
    const k = p === 0 ? 0.022 : p === 2 ? 0.008 : 0;
    if (k) pos.setXYZ(i, pos.getX(i) + nor.getX(i) * k, pos.getY(i) + nor.getY(i) * k, pos.getZ(i) + nor.getZ(i) * k);
  }
  g.userData.part = part;
}

function colorize(geo, look) {
  const part = geo.userData.part, n = part.length;
  const cols = [look.coat ?? 0x3a4250, look.skin ?? 0xd9ad8f, look.pants ?? 0x23252b, 0x141210].map((c) => new THREE.Color(c));
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const c = cols[part[i]]; a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
}

const stdm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

function headgear(look, hh) {
  // hh = výška hlavy v metroch; skupina je v metroch, počiatok v kosti hlavy
  const g = new THREE.Group();
  const cy = hh * 0.56, r = hh * 0.67;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const hair = stdm(look.hair ?? 0x3a2a1a, { roughness: 0.95 });
  const hc = stdm(look.hatColor ?? 0x222222);
  if (look.hat !== 'scarf') {
    const h = add(new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, 0, cy + 0.012, -0.012);
    h.scale.set(1, 1.02, 1.1);
    if (look.long) { const b = add(new THREE.SphereGeometry(r * 0.98, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.8), hair, 0, cy - 0.02, -0.035); b.scale.set(1.02, 1.15, 0.9); }
  }
  switch (look.hat) {
    case 'beret': { const b = add(new THREE.CylinderGeometry(r * 1.2, r * 1.05, 0.045, 18), hc, 0.015, cy + r * 0.78, -0.01); b.rotation.z = -0.18; break; }
    case 'fedora':
      add(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.014, 22), hc, 0, cy + r * 0.55, 0.01);
      add(new THREE.CylinderGeometry(r * 0.92, r * 1.02, 0.11, 18), hc, 0, cy + r * 0.55 + 0.06, 0);
      break;
    case 'cap':
      add(new THREE.CylinderGeometry(r * 1.04, r * 1.06, 0.06, 18), hc, 0, cy + r * 0.72, -0.005);
      add(new THREE.BoxGeometry(r * 1.5, 0.012, 0.08), hc, 0, cy + r * 0.6, r * 1.02);
      break;
    case 'scarf': {
      const s = add(new THREE.SphereGeometry(r * 1.07, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.68), hc, 0, cy + 0.005, -0.018);
      s.scale.set(1, 1.05, 1.08);
      add(new THREE.SphereGeometry(r * 0.5, 10, 8), hc, 0, cy - r * 1.05, r * 0.5);
      break;
    }
  }
  return g;
}

export function makeCharacter(look = {}) {
  const uniform = look.hat === 'police' || look.hat === 'ushanka';
  const src = uniform ? soldier : xbot;
  const inner = skClone(src.scene);
  const root = new THREE.Group();
  root.add(inner);
  if (uniform) inner.rotation.y = Math.PI; // Soldier je otočený chrbtom
  let head = null, spine = null, handR = null;
  inner.traverse((o) => {
    if (o.isSkinnedMesh) {
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      if (!uniform) {
        const g = o.geometry.clone(); g.userData.part = o.geometry.userData.part;
        colorize(g, look);
        o.geometry = g;
        o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
      } else {
        o.material = o.material.clone();
        o.material.color.set(look.hat === 'ushanka' ? 0xb8c0a0 : 0xa8b4a0);
      }
    }
    if (o.isBone) {
      if (o.name === 'mixamorigHead' || o.name === 'mixamorig:Head') head = o;
      if (/Spine2$/.test(o.name)) spine = o;
      if (/RightHand$/.test(o.name)) handR = o;
    }
  });
  root.updateMatrixWorld(true);
  const ws = new THREE.Vector3();
  if (head && !uniform) {
    head.getWorldScale(ws);
    const top = head.children.find((c) => /HeadTop/.test(c.name));
    const hh = (top ? top.position.length() : 18) * ws.y;
    const hg = headgear(look, hh);
    hg.scale.setScalar(1 / ws.y);
    head.add(hg);
  }
  if (spine && look.scarf && !uniform) {
    spine.getWorldScale(ws);
    const s = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.035, 8, 18), stdm(look.scarf, { roughness: 1 }));
    s.rotation.x = Math.PI / 2; s.scale.setScalar(1 / ws.y); s.position.set(0, 0.155 / ws.y, 0.02 / ws.y);
    spine.add(s);
  }
  let flame = null;
  if (look.candle && handR) {
    handR.getWorldScale(ws);
    const c = new THREE.Group();
    c.scale.setScalar(1 / ws.y);
    const wq = new THREE.Quaternion(); handR.getWorldQuaternion(wq); c.quaternion.copy(wq.invert()); // sviečka vždy zvislo
    c.position.set(0, 0.08 / ws.y, 0.03 / ws.y);
    c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), stdm(0xf3ecd8)));
    flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: look.glow, color: 0xffb04a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.position.y = 0.15; flame.scale.setScalar(0.2);
    c.add(flame);
    const L = new THREE.PointLight(0xffa040, 1.2, 4, 1.5); L.position.y = 0.2; c.add(L);
    handR.add(c);
  }
  const mixer = new THREE.AnimationMixer(inner);
  const clip = src.animations.find((a) => /^idle$/i.test(a.name));
  const act = mixer.clipAction(clip); act.play(); act.time = Math.random() * clip.duration;
  mixer.update(0);
  let hy = 0;
  root.userData = {
    flame,
    // dt, cieľové natočenie hlavy (rad), či postava práve hovorí
    tick(dt, yaw, talking, t) {
      mixer.update(dt);
      hy += (yaw - hy) * Math.min(1, dt * 4);
      if (head) { head.rotateY(uniform ? hy : hy); if (talking) head.rotateX(Math.sin(t * 7) * 0.035 + Math.sin(t * 2.3) * 0.03); }
    },
  };
  return root;
}

// ───────────────────────────── dav: „zapečené“ pózy ─────────────────────────────
function bakeCrowd() {
  const inst = skClone(xbot.scene);
  const holder = new THREE.Group(); holder.add(inst);
  const meshes = []; let headBone = null;
  inst.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); if (o.isBone && /:?Head$/.test(o.name)) headBone = o; });
  // priradíme časti tela (klon zdieľa geometriu s originálom)
  const makeMaps = (CELL) => meshes.map((m) => {
    const pos = m.geometry.attributes.position, part = m.geometry.userData.part;
    const key = new Map(), rep = [], remap = new Int32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const c = part[i] === 1 ? CELL * 0.7 : CELL; // hlavu a ruky necháme jemnejšie
      const k = `${Math.round(pos.getX(i) / c)},${Math.round(pos.getY(i) / c)},${Math.round(pos.getZ(i) / c)},${part[i]}`;
      let r = key.get(k);
      if (r === undefined) { r = rep.length; key.set(k, r); rep.push(i); }
      remap[i] = r;
    }
    const idx = m.geometry.index.array, out = [];
    for (let i = 0; i < idx.length; i += 3) {
      const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]];
      if (a !== b && b !== c && a !== c) out.push(a, b, c);
    }
    return { m, rep, tris: out, part };
  });
  const SKIN = new THREE.Color(0xd9ad8f), PANTS = new THREE.Color(0x22242a), SHOE = new THREE.Color(0x121010);
  const v = new THREE.Vector3();
  const mixer = new THREE.AnimationMixer(inst);
  const HI = makeMaps(0.03), LO = makeMaps(0.085);
  const pose = (clipName, time, maps) => {
    mixer.stopAllAction();
    const clip = xbot.animations.find((a) => a.name === clipName);
    const act = mixer.clipAction(clip); act.play(); mixer.setTime(time * clip.duration);
    holder.updateMatrixWorld(true);
    const P = [], C = [], A = [], I = [];
    let base = 0;
    for (const { m, rep, tris, part } of maps) {
      m.skeleton.update();
      const pos = m.geometry.attributes.position;
      for (const i of rep) {
        v.fromBufferAttribute(pos, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld);
        P.push(v.x, v.y, v.z);
        const p = part[i];
        const c = p === 1 ? SKIN : p === 2 ? PANTS : p === 3 ? SHOE : null;
        if (c) C.push(c.r, c.g, c.b); else C.push(1, 1, 1);
        A.push(p);
      }
      for (const t of tris) I.push(t + base);
      base += rep.length;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 1));
    g.setIndex(I);
    g.computeVertexNormals();
    // posun, aby postava stála v počiatku (XZ) – a pozícia hlavy pre čiapky
    const hp = new THREE.Vector3(); headBone.getWorldPosition(hp);
    g.userData.head = hp;
    return g;
  };
  const out = {
    idle: [['idle', 0.05], ['idle', 0.4], ['idle', 0.75], ['sad_pose', 0]].map(([c, t]) => ({ hi: pose(c, t, HI), lo: pose(c, t, LO) })),
    walk: Array.from({ length: 8 }, (_, i) => ({ hi: pose('walk', i / 8, HI), lo: pose('walk', i / 8, LO) })),
  };
  out.tris = [out.idle[0].hi.index.count / 3, out.idle[0].lo.index.count / 3];
  return out;
}
export const crowdPoses = () => baked;

export function crowdMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  m.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aPart;\n' + s.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n  if (aPart > 0.5) vColor.rgb = color.rgb;');
  };
  return m;
}
