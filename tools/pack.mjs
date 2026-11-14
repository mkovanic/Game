// Zmenší GLB z tools/convert.py: meshopt kompresia; pri animáciách ponechá len rotácie kostí
// (bez prstov a tváre) a posun koreňa Bip01 a panvy.
//   node tools/pack.mjs model in.glb out.glb
//   node tools/pack.mjs anim  in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, resample, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const [mode, src, out] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(src);
if (mode === 'anim') {
  const drop = /Finger|Eye|Jaw|Lip|Tongue|Mouth|Masseter|Caninus|Cheek|brow|Nose|Nub|Footsteps/;
  for (const a of doc.getRoot().listAnimations()) {
    for (const ch of a.listChannels()) {
      const n = ch.getTargetNode()?.getName() || '';
      const keep = !drop.test(n) && (ch.getTargetPath() === 'rotation' || (ch.getTargetPath() === 'translation' && (n === 'Bip01' || n === 'Bip01 Pelvis')));
      if (!keep) { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
    }
  }
  await doc.transform(resample({ tolerance: 0.0005 }));
}
await doc.transform(dedup(), prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, doc);
