// Interaktívne akčné scénky, ktoré nasledujú po záverečnom rozhovore kapitoly (chapterDef.action).
//   raid – Sviečková manifestácia: vodné delá a autá VB vchádzajú do davu, hráč chráni plameň sviečky
//   keys – Námestie SNP: štrnganie kľúčmi v rytme davu
// createAction(kind, ctx) -> { update(dt), key(code), dispose() }; scénka sa končí volaním ctx.finish().
import * as THREE from 'three';
import { Audio } from './audio.js';
import * as T from './textures.js';

const TXT = {
  sk: {
    raidStart: '22:30 – polícia zasahuje', raidObj: 'Vydrž na námestí a chráň plameň sviečky. Vyhýbaj sa vodným delám a autám.',
    lit: 'Sviečka horí', out: 'Sviečka zhasla – stlač <kbd>F</kbd>', lighting: 'Zapaľuješ…', car: 'Pozor, auto!', hit: 'Zrazilo ťa auto',
    wet: 'Zasiahlo ťa vodné delo', anna: 'Pani Anna spadla – pomôž jej vstať', annaE: '<kbd>E</kbd> Pomôcť pani Anne', annaOk: 'Ďakujem ti, synku.',
    raidEnd: (p) => `Vydržali ste. Plameň horel ${p} % času.`, time: 'Do konca zásahu',
    keysObj: 'Vytiahni kľúče a štrngaj v rytme námestia.', keysHint: '<kbd>Medzerník</kbd> alebo klik – štrngaj v rytme', keysMeter: 'Námestie',
    good: 'Presne!', keysEnd: 'Celé námestie štrngá kľúčmi. Posledné zvonenie.', keysEndWeak: 'Kľúče zneli námestím.',
  },
  en: {
    raidStart: '10:30 pm – the police move in', raidObj: 'Hold your ground and protect the candle flame. Avoid the water cannons and cars.',
    lit: 'Candle is burning', out: 'Candle is out – press <kbd>F</kbd>', lighting: 'Lighting…', car: 'Watch out, a car!', hit: 'A car knocked you down',
    wet: 'The water cannon hit you', anna: 'Mrs Anna has fallen – help her up', annaE: '<kbd>E</kbd> Help Mrs Anna', annaOk: 'Thank you, son.',
    raidEnd: (p) => `You held on. The flame burned ${p}% of the time.`, time: 'Until the raid ends',
    keysObj: 'Take out your keys and jingle them in rhythm with the square.', keysHint: '<kbd>Space</kbd> or click – jingle on the beat', keysMeter: 'The square',
    good: 'On the beat!', keysEnd: 'The whole square is jingling keys. The last bell tolls.', keysEndWeak: 'Keys rang across the square.',
  },
};

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
// svetlá majákov a reflektorov sú len žiariace sprity – nové svetlá by uprostred hry vynútili prekompilovanie shaderov
const blueGlow = () => new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite('90,140,255'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
const box = (g, sx, sy, sz, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };

export function createAction(kind, ctx) {
  return kind === 'raid' ? raid(ctx) : keys(ctx);
}

// ───────────────────────────── zásah na Sviečkovej manifestácii ─────────────────────────────
function raid(ctx) {
  const { scene, camera, player, el } = ctx, S = TXT[ctx.lang()];
  const root = new THREE.Group(); scene.add(root);
  if (!camera.parent) scene.add(camera);
  const DUR = 70;
  let t = 0, lit = true, litTime = 0, relight = 0, hits = 0, flash = 0, done = false, lastWater = -9, nextCar = 7;

  // sviečka v ruke hráča
  const candle = new THREE.Group(); candle.position.set(0.27, -0.33, -0.62); camera.add(candle);
  candle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.24, 8), new THREE.MeshBasicMaterial({ color: 0xe9e0c6 })));
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite(), color: 0xffb04a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, depthTest: false }));
  flame.position.y = 0.16; flame.scale.setScalar(0.13); candle.add(flame);
  const glow = new THREE.PointLight(0xffa040, 2.2, 7, 1.6); glow.position.set(0.2, -0.1, -0.5); camera.add(glow);

  // cisterny s vodnými delami po stranách námestia
  const truckMat = std(0x55603f), dark = std(0x22262a);
  const jets = [[-15.2, 3, 1], [15.2, -22, -1]].map(([x, z, dir], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; root.add(g);
    box(g, 2.5, 2.4, 5.2, truckMat, 0, 2.0, -1.0); box(g, 2.5, 2.1, 2.0, truckMat, 0, 1.85, 2.6); box(g, 2.4, 0.8, 0.1, dark, 0, 2.3, 3.62);
    for (const wz of [-2.6, 0.2, 2.6]) for (const wx of [-1.2, 1.2]) box(g, 0.35, 1, 1, dark, wx, 0.5, wz);
    const beacon = blueGlow(); beacon.position.set(0, 3.5, 2.4); beacon.scale.setScalar(2.4); g.add(beacon);
    const N = 240, geo = new THREE.BufferGeometry(), u = new Float32Array(N), sd = new Float32Array(N * 2);
    for (let k = 0; k < N; k++) { u[k] = Math.random(); sd[k * 2] = Math.random() - 0.5; sd[k * 2 + 1] = Math.random() - 0.5; }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.glowSprite('220,235,255'), color: 0xcfe2ff, size: 0.55, transparent: true, opacity: 0.55, depthWrite: false }));
    pts.frustumCulled = false; root.add(pts);
    return { x, z, base: dir > 0 ? 0 : Math.PI, aim: 0, on: false, phase: i * 4.5, N, u, sd, pts, beacon, R: 27 };
  });

  // autá VB vchádzajúce do davu
  const cars = [];
  const spawnCar = () => {
    const g = new THREE.Group();
    box(g, 1.6, 0.6, 4, std(0xd8d4b0), 0, 0.65, 0); box(g, 1.5, 0.55, 2, std(0xd8d4b0), 0, 1.2, -0.2); box(g, 1.62, 0.2, 4.02, std(0x3d6b3a), 0, 0.72, 0);
    box(g, 0.25, 0.14, 0.25, new THREE.MeshBasicMaterial({ color: 0x4070ff }), 0, 1.55, -0.2);
    const b = blueGlow(); b.position.set(0, 1.7, -0.2); b.scale.setScalar(2.2); g.add(b);
    for (const hx of [-0.55, 0.55]) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite('255,245,210'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); h.position.set(hx, 0.7, -2.05); h.scale.setScalar(1.3); g.add(h); }
    const x = Math.max(-10, Math.min(10, player.x + (Math.random() - 0.5) * 1.5));
    g.position.set(x, 0, Math.min(44, player.z + 46)); root.add(g);
    cars.push({ g, b, hit: false });
    ctx.toast(S.car); Audio.sfx('siren');
  };

  // pani Anna spadne – hráč jej môže pomôcť
  const anna = ctx.npcs.find((n) => n.def.id === 'anna');
  let annaState = 0; // 0 stojí, 1 spadla, 2 pomohol

  const hud = () => {
    const left = Math.max(0, Math.ceil(DUR - t));
    const c = lit ? `<span class="ok">🕯 ${S.lit}</span>` : relight > 0 ? `<span>${S.lighting}</span>` : `<span class="warn">${S.out}</span>`;
    el.action.innerHTML = `<div class="bar"><i style="width:${(100 * (1 - t / DUR)).toFixed(1)}%"></i></div><div class="row"><span>${S.time}: ${left} s</span>${c}</div>`;
  };
  ctx.setObjective(S.raidObj); ctx.toast(S.raidStart); Audio.sfx('siren'); Audio.sfx('water');
  el.action.classList.remove('hidden'); hud();

  const douse = (msg) => {
    if (lit || relight > 0) ctx.toast(msg);
    lit = false; relight = 0; flash = 0.5;
  };

  const v = new THREE.Vector3();
  return {
    update(dt) {
      if (done) return;
      t += dt;
      if (lit) litTime += dt;
      if (relight > 0) { relight -= dt; if (relight <= 0) { lit = true; Audio.sfx('blip'); } }
      flame.visible = lit; glow.intensity = lit ? 2.2 + Math.sin(t * 19) * 0.25 : 0;
      candle.position.y = -0.33 + Math.sin(player.bob) * 0.008;

      // vodné delá: striedavo striekajú a pomaly mieria za hráčom
      for (const j of jets) {
        const cyc = (t + j.phase) % 10;
        j.on = t < DUR - 2 && cyc < 5.5;
        j.beacon.visible = Math.sin(t * 9 + j.phase) > 0;
        const want = Math.atan2(player.z - j.z, player.x - j.x);
        let d = want - j.aim; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        if (t < 0.1) j.aim = want + 0.6;
        j.aim += d * Math.min(1, dt * 0.3);
        const a = j.aim + Math.sin(t * 0.8 + j.phase) * 0.3, cx = Math.cos(a), cz = Math.sin(a);
        const p = j.pts.geometry.attributes.position;
        for (let k = 0; k < j.N; k++) {
          j.u[k] += dt * 1.5; if (j.u[k] > 1) j.u[k] -= 1;
          const u = j.u[k], r = 1.5 + u * j.R, sp = 0.15 + u * 1.3;
          if (!j.on && u < 0.9) { p.setXYZ(k, 0, -50, 0); continue; }
          p.setXYZ(k, j.x + cx * r - cz * j.sd[k * 2] * sp, Math.max(0.1, 3.5 - 3.4 * Math.pow(u, 1.5) + j.sd[k * 2 + 1] * sp * 0.6), j.z + cz * r + cx * j.sd[k * 2] * sp);
        }
        p.needsUpdate = true;
        if (j.on) {
          const dx = player.x - j.x, dz = player.z - j.z, along = dx * cx + dz * cz, perp = Math.abs(-dx * cz + dz * cx);
          if (along > 6 && along < j.R + 1 && perp < 0.9 + along * 0.035) {
            douse(S.wet);
            player.x += cx * dt * 3.2; player.z += cz * dt * 3.2;
            if (t - lastWater > 2.5) { lastWater = t; Audio.sfx('water'); }
          }
        }
      }

      // autá
      if (t > nextCar && t < DUR - 8) { nextCar = t + 9 + Math.random() * 4; spawnCar(); }
      for (const c of cars) {
        c.g.position.z -= 7.5 * dt;
        c.b.visible = Math.sin(t * 12) > 0;
        const dx = player.x - c.g.position.x, dz = player.z - c.g.position.z;
        if (!c.hit && Math.abs(dx) < 1.25 && Math.abs(dz) < 2.5) {
          c.hit = true; hits++; douse(S.hit); flash = 1;
          player.x += (dx >= 0 ? 1 : -1) * 2.2;
        }
        if (c.g.position.z < -44) { root.remove(c.g); c.dead = true; }
      }
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].dead) cars.splice(i, 1);

      // pani Anna
      if (anna) {
        const o = anna.obj;
        if (annaState === 0 && t > 18) { annaState = 1; o.userData.setAnim?.('crouch'); anna.marker.visible = true; ctx.toast(S.anna); }
        if (annaState === 1) {
          anna.marker.visible = true;
          const near = Math.hypot(o.position.x - player.x, o.position.z - player.z) < 2.6;
          el.prompt.innerHTML = S.annaE; el.prompt.classList.toggle('hidden', !near);
          this.nearAnna = near;
        }
      }

      if (flash > 0) flash = Math.max(0, flash - dt * 1.6);
      el.flash.style.opacity = flash.toFixed(2);
      el.flash.style.background = hits && flash > 0.5 ? '#a01818' : '#9fc0e8';
      hud();

      if (t >= DUR) {
        done = true;
        const pct = Math.round((litTime / DUR) * 100);
        const fx = {};
        if (pct >= 55) fx.courage = 1;
        if (annaState === 2) fx.trust = 1;
        el.prompt.classList.add('hidden'); el.flash.style.opacity = 0;
        ctx.finish({ fx, flag: annaState === 2 ? 'helpedAnna' : null, text: S.raidEnd(pct) });
      }
    },
    key(code) {
      if (done) return;
      if (code === 'KeyF' && !lit && relight <= 0) relight = 1.0;
      if (code === 'KeyE' && annaState === 1 && this.nearAnna) {
        annaState = 2; anna.obj.userData.setAnim?.('idle'); anna.marker.visible = false;
        el.prompt.classList.add('hidden'); ctx.toast(S.annaOk);
      }
    },
    tap() { this.key(this.nearAnna && annaState === 1 ? 'KeyE' : 'KeyF'); },
    dispose() {
      scene.remove(root); camera.remove(candle); camera.remove(glow);
      el.action.classList.add('hidden'); el.flash.style.opacity = 0;
    },
  };
}

// ───────────────────────────── štrnganie kľúčmi ─────────────────────────────
function jingle(vol = 1) {
  const c = Audio.context(), t0 = c.currentTime;
  for (let i = 0; i < 7; i++) {
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 2800 + Math.random() * 4200;
    const g = c.createGain(), t = t0 + Math.random() * 0.09;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03 * vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + Math.random() * 0.1);
    o.connect(g); g.connect(Audio.output()); o.start(t); o.stop(t + 0.3);
  }
}

function keys(ctx) {
  const { scene, camera, el } = ctx, S = TXT[ctx.lang()];
  if (!camera.parent) scene.add(camera);
  const BEAT = 0.6, DUR = 45;
  let t = 0, meter = 8, done = false, shake = 0, lastBeat = -1, endT = -1, good = 0;

  // zväzok kľúčov v ruke
  const ring = new THREE.Group(); ring.position.set(0.24, -0.2, -0.55); camera.add(ring);
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8c27a, metalness: 0.6, roughness: 0.35, emissive: 0x6a5820 });
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 6, 18), metal));
  const blades = [-0.5, 0.1, 0.6].map((a) => {
    const k = new THREE.Group(); k.position.y = -0.035; k.rotation.z = a;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 10), metal); head.rotation.x = Math.PI / 2; head.position.y = -0.016; k.add(head);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.06, 0.003), metal); blade.position.y = -0.06; k.add(blade);
    ring.add(k); return { k, a };
  });

  // záblesky kľúčov nad davom
  const N = 500, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 44; pos[i * 3 + 1] = 1.95 + Math.random() * 0.35; pos[i * 3 + 2] = -33 + Math.random() * 61; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.glowSprite('255,240,200'), color: 0xfff0c0, size: 0.22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  sparks.frustumCulled = false; scene.add(sparks);

  ctx.setObjective(S.keysObj);
  el.action.classList.remove('hidden');
  el.action.innerHTML = `<div class="beat"><i></i></div><div class="bar gold"><i style="width:8%"></i></div><div class="row"><span>${S.keysMeter}</span><span>${S.keysHint}</span></div>`;
  const beatEl = el.action.querySelector('.beat i'), barEl = el.action.querySelector('.bar i');

  return {
    update(dt) {
      t += dt;
      const ph = (t / BEAT) % 1, b = Math.floor(t / BEAT);
      if (b !== lastBeat) { lastBeat = b; if (meter > 12) jingle(Math.min(1.6, meter / 55)); }   // dav štrngá na dobu
      beatEl.style.transform = `scale(${(1.9 - ph * 0.9).toFixed(3)})`;
      beatEl.style.opacity = (0.35 + ph * 0.65).toFixed(2);
      shake = Math.max(0, shake - dt * 3);
      ring.rotation.z = Math.sin(t * 38) * shake * 0.5; ring.position.y = -0.2 + Math.sin(t * 30) * shake * 0.02;
      blades.forEach((k, i) => (k.k.rotation.z = k.a + Math.sin(t * 34 + i * 2) * shake * 0.8));
      if (!done) meter = Math.max(0, meter - dt * 1.2);
      barEl.style.width = `${Math.min(100, meter).toFixed(1)}%`;
      sparks.material.opacity = Math.min(0.9, meter / 100) * (0.55 + 0.45 * Math.sin(ph * Math.PI));
      sparks.material.size = 0.18 + 0.1 * (1 - ph);
      if (!done && (meter >= 100 || t >= DUR)) {
        done = true; endT = t;
        const full = meter >= 100;
        if (full) { Audio.sfx('keys'); Audio.sfx('crowd'); meter = 100; }
        ctx.finish({ fx: full || good >= 18 ? { courage: 1 } : {}, flag: full ? 'keysRang' : null, text: full ? S.keysEnd : S.keysEndWeak, delay: full ? 5200 : 2600 });
      }
      if (done) shake = Math.max(shake, 0.6);
    },
    key(code) {
      if (done || (code !== 'Space' && code !== 'KeyF' && code !== 'KeyE' && code !== 'Enter')) return;
      shake = 1; jingle(1);
      const ph = (t / BEAT) % 1, off = Math.min(ph, 1 - ph) * BEAT;
      if (off < 0.14) { meter += 6.5; good++; el.action.classList.remove('hit'); void el.action.offsetWidth; el.action.classList.add('hit'); }
      else meter = Math.max(0, meter - 1.5);
    },
    tap() { this.key('Space'); },
    dispose() {
      camera.remove(ring); scene.remove(sparks);
      el.action.classList.add('hidden'); el.action.classList.remove('hit');
    },
  };
}
