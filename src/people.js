// Realistické rigované postavy Microsoft Rocketbox (MIT) s motion-capture animáciami.
// Modely a animácie pripravuje tools/people.sh (Blender + gltf-transform) do assets/people.
// Oblečenie sa prefarbuje v shaderi podľa časti tela (kabát / nohavice / topánky) – zimné tmavé tóny.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODEL_BINS, ANIM_BINS, CROWD_MODELS, CROWD_WALKERS } from './people-assets.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const parse = (bin) => new Promise((res, rej) => loader.parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej));
// postavy, ktoré už majú pokrývku hlavy (čiapka, prilba) – nepridávame ďalšiu
const HAS_HAT = /Police|Military|Construction/;

const models = {}, anims = { m: {}, f: {} };
let baked = null;

export async function initPeople() {
  const names = Object.keys(MODEL_BINS);
  const [gm, ga] = await Promise.all([
    Promise.all(names.map((n) => parse(MODEL_BINS[n]))),
    Promise.all(Object.keys(ANIM_BINS).map((k) => parse(ANIM_BINS[k]).then((g) => [k, g]))),
  ]);
  for (const [k, g] of ga) {
    const [s, n] = k.split('-'), clip = g.animations[0];
    const t = clip.tracks.find((t) => t.name === 'Bip01.position');
    anims[s][n] = { clip, hip: t ? t.values[1] : 0.9 };
  }
  names.forEach((n, i) => (models[n] = prepModel(n, gm[i])));
  baked = bakeCrowd();
}
export const peopleReady = () => !!baked;


// ───────────────────────────── príprava modelu ─────────────────────────────
// aPart: 0 = kabát/trup a ruky, 1 = dlane, 2 = nohavice, 3 = topánky, 4 = hlava/vlasy/výstroj (bez zmeny)
function prepModel(name, gltf) {
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  let mesh = null;
  scene.traverse((o) => { if (o.isSkinnedMesh) mesh = o; });
  const g = mesh.geometry, mat = mesh.material;
  const img = mat.map.image, bodyU = img.height / img.width;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, uv = g.attributes.uv;
  const pos = g.attributes.position, nor = g.attributes.normal;
  const bones = mesh.skeleton.bones.map((b) => b.name);
  const part = new Float32Array(si.count);
  // kľudová póza vo svete (siete sú kvantované, preto cez applyBoneTransform)
  const v = new THREE.Vector3(), headPts = [], world = (i) => mesh.applyBoneTransform(i, v.fromBufferAttribute(pos, i)).applyMatrix4(mesh.matrixWorld).clone();
  let lo = 0, hi = 0;
  for (let i = 1; i < si.count; i++) { if (pos.getY(i) < pos.getY(lo)) lo = i; if (pos.getY(i) > pos.getY(hi)) hi = i; }
  const unit = world(lo).distanceTo(world(hi)) / v.fromBufferAttribute(pos, lo).distanceTo(new THREE.Vector3().fromBufferAttribute(pos, hi));
  const puff = 0.014 / unit; // zimné oblečenie – trup a ruky trochu „nafúkneme“
  for (let i = 0; i < si.count; i++) {
    let best = 0, bw = -1;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
    const n = bones[best];
    let p = 4;
    if (uv.getX(i) < bodyU) {
      if (/Head|Neck/.test(n)) p = 4;
      else if (/Hand|Finger/.test(n)) p = 1;
      else if (/Foot|Toe/.test(n)) p = 3;
      else if (/Thigh|Calf/.test(n)) p = 2;
      else p = 0;
    }
    part[i] = p;
    if (/Head/.test(n)) headPts.push(world(i));
    if (p === 0) pos.setXYZ(i, pos.getX(i) + nor.getX(i) * puff, pos.getY(i) + nor.getY(i) * puff, pos.getZ(i) + nor.getZ(i) * puff);
  }
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1));
  g.computeBoundingSphere();
  const bone = (re) => mesh.skeleton.bones.find((b) => re.test(b.name));
  const head = bone(/_Head$/), hp = new THREE.Vector3(); head.getWorldPosition(hp);
  // rozmery hlavy (pre čiapky a šatky) v metroch, relatívne ku kosti hlavy
  const box = new THREE.Box3().setFromPoints(headPts);
  mat.alphaTest = 0.5; mat.transparent = false; mat.depthWrite = true; mat.side = THREE.FrontSide;
  mat.roughness = 0.85; mat.metalness = 0;
  return {
    name, scene, mat, f: /Female/.test(name) ? 'f' : 'm', clips: {},
    headTop: box.max.y - hp.y, headR: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2,
    headZ: (box.max.z + box.min.z) / 2 - hp.z, hip: scene.getObjectByName('Bip01').position.y,
  };
}

// klip z animácie pre daný model: rotácie kostí + posun panvy prepočítaný na výšku postavy
function clipFor(M, name) {
  if (M.clips[name]) return M.clips[name];
  const A = anims[M.f][name] || anims.m[name];
  const k = M.hip / A.hip;
  const tracks = [];
  for (const t of A.clip.tracks) {
    if (t.name.endsWith('.position')) {
      if (t.name !== 'Bip01.position') { tracks.push(t); continue; }
      const tr = t.clone(), v = tr.values, n = v.length / 3;
      const d = [v[v.length - 3] - v[0], v[v.length - 2] - v[1], v[v.length - 1] - v[2]];
      for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) v[i * 3 + c] = (v[i * 3 + c] - (name === 'walk' || name === 'run' ? d[c] * i / (n - 1) : 0)) * k;
      tracks.push(tr);
    } else tracks.push(t);
  }
  return (M.clips[name] = new THREE.AnimationClip(name, A.clip.duration, tracks));
}

function tintMaterial(base, coat, pants, amount) {
  const m = base.clone();
  m.userData.u = { uCoat: { value: new THREE.Color(coat) }, uPants: { value: new THREE.Color(pants) }, uTint: { value: amount } };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, m.userData.u);
    s.vertexShader = 'attribute float aPart;\nvarying float vPart;\n' + s.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vPart = aPart;');
    s.fragmentShader = 'uniform vec3 uCoat, uPants;\nuniform float uTint;\nvarying float vPart;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  {
    float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    if (vPart < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uCoat * (0.3 + 1.6 * l), uTint);
    else if (vPart > 1.5 && vPart < 2.5) diffuseColor.rgb = mix(diffuseColor.rgb, uPants * (0.3 + 1.6 * l), uTint * 0.8);
    else if (vPart > 2.5 && vPart < 3.5) diffuseColor.rgb *= 0.55;
  }`);
  };
  m.customProgramCacheKey = () => 'tint';
  return m;
}

const stdm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

// pokrývky hlavy: skupina so stredom v kosti hlavy, osi ako svet (Y hore, Z dopredu)
function headgear(look, M) {
  const g = new THREE.Group();
  const r = 0.108, top = M.headTop - 0.045, cy = top - r, z0 = M.headZ;
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z + z0); m.castShadow = true; g.add(m); return m; };
  const hc = stdm(look.hatColor ?? 0x222222);
  switch (look.hat) {
    case 'beret': { const b = add(new THREE.CylinderGeometry(r * 1.15, r * 1.0, 0.04, 18), hc, 0.012, top - 0.012, -0.01); b.rotation.z = -0.18; break; }
    case 'fedora':
      add(new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.012, 22), hc, 0, top - 0.035, 0);
      add(new THREE.CylinderGeometry(r * 0.9, r * 1.0, 0.1, 18), hc, 0, top + 0.012, 0);
      break;
    case 'cap':
      add(new THREE.CylinderGeometry(r * 1.0, r * 1.04, 0.06, 18), hc, 0, top - 0.018, -0.005);
      add(new THREE.BoxGeometry(r * 1.4, 0.012, 0.07), hc, 0, top - 0.04, r * 0.98);
      break;
    case 'ushanka': {
      const s = add(new THREE.SphereGeometry(r * 1.12, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hc, 0, cy + r * 0.35, -0.005);
      s.scale.set(1, 0.9, 1.05);
      break;
    }
    case 'scarf': {
      const s = add(new THREE.SphereGeometry(r * 1.1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hc, 0, cy + 0.004, -0.012);
      s.scale.set(1, 1.08, 1.1);
      add(new THREE.SphereGeometry(r * 0.42, 10, 8), hc, 0, cy - r * 1.05, r * 0.45);
      break;
    }
  }
  return g;
}

// pripojí objekt ku kosti tak, aby v kľudovej póze ležal na mieste `at` (svet) s osami sveta
function attach(bone, obj, at) {
  bone.updateWorldMatrix(true, false);
  const m = new THREE.Matrix4().makeTranslation(at.x, at.y, at.z);
  m.premultiply(new THREE.Matrix4().copy(bone.matrixWorld).invert());
  m.decompose(obj.position, obj.quaternion, obj.scale);
  bone.add(obj);
}

export function makeCharacter(look = {}) {
  const M = models[look.model] || models.Male_Adult_03;
  const inner = skClone(M.scene);
  const root = new THREE.Group();
  root.add(inner);
  const mat = tintMaterial(M.mat, look.coat ?? 0x3a4250, look.pants ?? 0x23252b, look.coat != null ? (look.tint ?? 0.7) : 0);
  const B = {};
  inner.traverse((o) => {
    if (o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = mat; }
    if (o.isBone) B[o.name.replace('Bip01_', '')] = o;
  });
  root.updateMatrixWorld(true);
  const head = B.Head, wp = (b) => b.getWorldPosition(new THREE.Vector3());
  const hp = wp(head);
  if (!HAS_HAT.test(M.name) && look.hat && look.hat !== 'none' && look.hat !== 'police') attach(head, headgear(look, M), hp);
  if (look.scarf) {
    const s = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.034, 8, 18), stdm(look.scarf, { roughness: 1 }));
    s.rotation.x = Math.PI / 2; s.castShadow = true;
    const n = wp(B.Neck); n.y -= 0.012; n.z += 0.018;
    attach(B.Neck, s, n);
  }
  let flame = null;
  if (look.candle && B.R_Hand) {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), stdm(0xf3ecd8)));
    flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: look.glow, color: 0xffb04a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.position.y = 0.15; flame.scale.setScalar(0.2);
    c.add(flame);
    const L = new THREE.PointLight(0xffa040, 1.2, 4, 1.5); L.position.y = 0.2; c.add(L);
    const h = wp(B.R_Hand), f = B.R_Finger2 ? wp(B.R_Finger2) : h.clone();
    attach(B.R_Hand, c, h.lerp(f, 0.7).add(new THREE.Vector3(0, 0.02, 0)));
  }
  const mixer = new THREE.AnimationMixer(inner);
  let idle = mixer.clipAction(clipFor(M, look.idle || (Math.random() < 0.5 ? 'idle' : 'idle3')));
  const talk = mixer.clipAction(clipFor(M, 'talk'));
  idle.play(); idle.time = Math.random() * idle.getClip().duration;
  mixer.update(0);
  // osi hlavy (svet hore / bok) v lokálnom priestore kosti – na otáčanie za hráčom a kývanie pri reči
  const iq = head.getWorldQuaternion(new THREE.Quaternion()).invert();
  const upL = new THREE.Vector3(0, 1, 0).applyQuaternion(iq), sideL = new THREE.Vector3(1, 0, 0).applyQuaternion(iq);
  // sánka – pohyb pier pri reči (animácie ju neovládajú)
  const jaw = B.MJaw, jawRest = jaw ? jaw.quaternion.clone() : null;
  const jawAxis = jaw ? new THREE.Vector3(1, 0, 0).applyQuaternion(jaw.getWorldQuaternion(new THREE.Quaternion()).invert()) : null;
  let hy = 0, speaking = false, mouth = 0;
  root.userData = {
    flame,
    // zmení základnú animáciu (napr. 'crouch', 'idle', 'clap')
    setAnim(name) {
      const a = mixer.clipAction(clipFor(M, name));
      if (a === idle) return;
      a.reset().play(); idle.crossFadeTo(a, 0.5, false); idle = a;
    },
    // dt, cieľové natočenie hlavy (rad), či postava práve hovorí
    tick(dt, yaw, talking, t) {
      if (talking !== speaking) {
        speaking = talking;
        const [a, b] = talking ? [idle, talk] : [talk, idle];
        b.reset().play(); a.crossFadeTo(b, 0.5, false);
      }
      mixer.update(dt);
      hy += (yaw - hy) * Math.min(1, dt * 4);
      head.rotateOnAxis(upL, hy);
      if (talking) head.rotateOnAxis(sideL, Math.sin(t * 7) * 0.03 + Math.sin(t * 2.3) * 0.025);
      if (jaw) {
        const open = talking ? Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4) * 0.16 : 0;
        mouth += (open - mouth) * Math.min(1, dt * 18);
        jaw.quaternion.copy(jawRest); if (mouth > 0.002) jaw.rotateOnAxis(jawAxis, mouth);
      }
    },
  };
  return root;
}

// ───────────────────────────── dav: „zapečené“ pózy ─────────────────────────────
// Pre každý model davu: blízka úroveň = plná sieť s textúrou, vzdialená = zhlukovanie vrcholov.
function bakeCrowd() {
  const v = new THREE.Vector3();
  const out = { models: [] };
  for (const name of CROWD_MODELS) {
    const M = models[name];
    const inst = skClone(M.scene);
    const holder = new THREE.Group(); holder.add(inst);
    let mesh = null, head = null;
    inst.traverse((o) => { if (o.isSkinnedMesh) mesh = o; if (o.isBone && /_Head$/.test(o.name)) head = o; });
    const G = mesh.geometry, pos = G.attributes.position, part = G.attributes.aPart, uv = G.attributes.uv, N = pos.count;
    // vzdialená úroveň: zhlukovanie vrcholov do mriežky (hlava a ruky jemnejšie)
    const CELL = 0.085, key = new Map(), rep = [], remap = new Int32Array(N);
    holder.updateMatrixWorld(true);
    for (let i = 0; i < N; i++) {
      mesh.applyBoneTransform(i, v.fromBufferAttribute(pos, i)).applyMatrix4(mesh.matrixWorld); // kľudová póza v metroch
      const p = part.getX(i), c = p === 4 || p === 1 ? CELL * 0.7 : CELL;
      const k = `${Math.round(v.x / c)},${Math.round(v.y / c)},${Math.round(v.z / c)},${p}`;
      let r = key.get(k);
      if (r === undefined) { r = rep.length; key.set(k, r); rep.push(i); }
      remap[i] = r;
    }
    // poradie vrcholov po zapečení do sveta overíme znamienkom objemu (kvantovanie/zrkadlenie ho môže obrátiť)
    let idx = G.index.array, vol = 0;
    const R = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { mesh.applyBoneTransform(i, v.fromBufferAttribute(pos, i)).applyMatrix4(mesh.matrixWorld); R[i * 3] = v.x; R[i * 3 + 1] = v.y; R[i * 3 + 2] = v.z; }
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      vol += R[a] * (R[b + 1] * R[c + 2] - R[b + 2] * R[c + 1]) + R[a + 1] * (R[b + 2] * R[c] - R[b] * R[c + 2]) + R[a + 2] * (R[b] * R[c + 1] - R[b + 1] * R[c]);
    }
    if (vol < 0) { idx = idx.slice(); for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
    const hiIdx = new THREE.BufferAttribute(idx, 1), loIdx = [];
    for (let i = 0; i < idx.length; i += 3) {
      const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]];
      if (a !== b && b !== c && a !== c) loIdx.push(a, b, c);
    }
    const loUv = new Float32Array(rep.length * 2), loPart = new Float32Array(rep.length);
    rep.forEach((i, j) => { loUv[j * 2] = uv.getX(i); loUv[j * 2 + 1] = uv.getY(i); loPart[j] = part.getX(i); });
    const mixer = new THREE.AnimationMixer(inst);
    const bone = {}; inst.traverse((o) => { if (o.isBone || o.name === 'Bip01') bone[o.name] = o; });
    const X = new THREE.Vector3(1, 0, 0), bq = new THREE.Quaternion(), bend = (b, a) => b.rotateOnAxis(X.clone().applyQuaternion(b.getWorldQuaternion(bq).invert()), a);
    const pose = (clip, time, kneel = false) => {
      mixer.stopAllAction();
      const c = clipFor(M, clip), act = mixer.clipAction(c); act.play(); mixer.setTime(time * c.duration);
      if (kneel) { // kľak na obe kolená: lýtka dozadu, trup klesne tak, aby kolená boli na zemi; hlava sklonená
        holder.updateMatrixWorld(true);
        for (const s of ['L', 'R']) { bend(bone[`Bip01_${s}_Calf`], 1.75); holder.updateMatrixWorld(true); bend(bone[`Bip01_${s}_Foot`], 0.7); }
        bend(bone.Bip01_Head, 0.3); bend(bone.Bip01_Spine1, 0.12);
        holder.updateMatrixWorld(true);
        bone.Bip01.position.y -= bone.Bip01_L_Calf.getWorldPosition(v).y - 0.09;
      }
      holder.updateMatrixWorld(true); mesh.skeleton.update();
      const P = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { v.fromBufferAttribute(pos, i); mesh.applyBoneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
      const hi = new THREE.BufferGeometry();
      hi.setAttribute('position', new THREE.BufferAttribute(P, 3));
      hi.setAttribute('uv', uv); hi.setAttribute('aPart', part); hi.setIndex(hiIdx);
      hi.computeVertexNormals();
      const LP = new Float32Array(rep.length * 3);
      rep.forEach((i, j) => LP.set(P.subarray(i * 3, i * 3 + 3), j * 3));
      const lo = new THREE.BufferGeometry();
      lo.setAttribute('position', new THREE.BufferAttribute(LP, 3));
      lo.setAttribute('uv', new THREE.BufferAttribute(loUv, 2)); lo.setAttribute('aPart', new THREE.BufferAttribute(loPart, 1));
      lo.setIndex(loIdx); lo.computeVertexNormals();
      const hp = new THREE.Vector3(); head.getWorldPosition(hp);
      hi.userData.head = hp;
      return { hi, lo };
    };
    const walk = CROWD_WALKERS.includes(name);
    out.models.push({
      name, mat: crowdMaterial(M.mat), headTop: M.headTop, noHat: HAS_HAT.test(name),
      idle: [pose('idle', 0.15), pose('idle2', 0.55), pose('idle', 0.6, true)],
      cheer: [pose('cheer', 0.2), pose('cheer', 0.4), pose('cheer', 0.6)],
      walk: walk ? Array.from({ length: 8 }, (_, i) => pose('walk', i / 8)) : null,
    });
  }
  out.tris = [out.models[0].idle[0].hi.index.count / 3, out.models[0].idle[0].lo.index.count / 3];
  return out;
}
export const crowdPoses = () => baked;

// farba inštancie = jemný odtieň kabáta
function crowdMaterial(base) {
  const m = base.clone();
  m.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aPart;\nvarying float vPart;\n' + s.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vPart = aPart;');
    s.fragmentShader = 'varying float vPart;\n' + s.fragmentShader
      .replace('#include <color_fragment>', '')
      .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
  #ifdef USE_COLOR
    if (vPart < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vColor * (0.3 + 1.6 * l), 0.6);
  #endif
    if (vPart > 1.5 && vPart < 2.5) diffuseColor.rgb *= 0.7;
    else if (vPart > 2.5 && vPart < 3.5) diffuseColor.rgb *= 0.55;
  }`);
  };
  m.customProgramCacheKey = () => 'crowd';
  return m;
}
export const peopleDebug = { models, anims };
