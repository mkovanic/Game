// Rozpoznateľné budovy vymodelované skriptom v Blenderi (tools/buildings/*.py) a vložené ako GLB.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import sndBin from '../assets/buildings/snd.glb';

const BINS = { snd: sndBin };
const loaded = {};

export async function initBuildings() {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  await Promise.all(Object.entries(BINS).map(([k, bin]) => new Promise((res, rej) =>
    loader.parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', (g) => { loaded[k] = g.scene; res(); }, rej))));
}

// kópia budovy s vlastnými materiálmi; v noci sa okná (materiál „glass“) rozsvietia
export function makeBuilding(name, { night = false, lit = 0.8 } = {}) {
  const obj = loaded[name].clone(true);
  const mats = new Map();
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    if (!mats.has(o.material)) {
      const m = o.material.clone();
      if (m.name === 'glass' && night) { m.emissive = new THREE.Color(0xffc878); m.emissiveIntensity = lit; m.color.set(0x6a5a40); }
      mats.set(o.material, m);
    }
    o.material = mats.get(o.material);
  });
  return obj;
}
