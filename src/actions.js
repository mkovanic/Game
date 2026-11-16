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
    wet: 'Zasiahlo ťa vodné delo', baton: 'Kordón ťa odtlačil obuškami', anna: 'Pani Anna spadla – pomôž jej vstať', annaE: '<kbd>E</kbd> Pomôcť pani Anne', annaOk: 'Ďakujem ti, synku.',
    raidEnd: (p) => `Vydržali ste. Plameň horel ${p} % času.`, time: 'Do konca zásahu',
    keysObj: 'Vytiahni kľúče a štrngaj v rytme námestia.', keysHint: '<kbd>Medzerník</kbd> alebo klik – štrngaj v rytme', keysMeter: 'Námestie',
    chaseObj: (n) => `Rozdaj letáky (${n}/5). Muž v koženom kabáte ťa sleduje – nenechaj sa dobehnúť. <kbd>Shift</kbd> = beh.`,
    leaflet: 'Leták odovzdaný', caught: '„Občiansky preukaz!“ Zdržal ťa a zapísal si tvoje meno.', chaseEnd: 'Všetky letáky sú medzi ľuďmi.', chaseClean: 'Všetky letáky sú medzi ľuďmi – a eštebák ťa nechytil.',
    sirenObj: 'O 12:00 sa začína generálny štrajk. Dôjdi k siréne pri bráne a spusti ju presne na poludnie.', sirenE: '<kbd>E</kbd> Spustiť sirénu', sirenEarly: 'Ešte nie – počkaj na 12:00',
    sirenOk: 'Presne na poludnie. Celý závod stojí.', sirenLate: 'Siréna znie. Generálny štrajk sa začal.', clock: 'Čas',
    wireObj: 'Železná opona padá. Dôjdi k plotu vľavo od cesty a prestrihni ostnatý drôt.', wireE: 'Drž <kbd>E</kbd> – strihať drôt', wireCut: (n) => `Prestrihnuté ${n}/3`, wireEnd: 'Kúsok ostnatého drôtu si berieš so sebou. Na pamiatku.',
    good: 'Presne!', keysEnd: 'Celé námestie štrngá kľúčmi. Posledné zvonenie.', keysEndWeak: 'Kľúče zneli námestím.',
  },
  en: {
    raidStart: '10:30 pm – the police move in', raidObj: 'Hold your ground and protect the candle flame. Avoid the water cannons and cars.',
    lit: 'Candle is burning', out: 'Candle is out – press <kbd>F</kbd>', lighting: 'Lighting…', car: 'Watch out, a car!', hit: 'A car knocked you down',
    wet: 'The water cannon hit you', baton: 'The cordon shoved you back with batons', anna: 'Mrs Anna has fallen – help her up', annaE: '<kbd>E</kbd> Help Mrs Anna', annaOk: 'Thank you, son.',
    raidEnd: (p) => `You held on. The flame burned ${p}% of the time.`, time: 'Until the raid ends',
    keysObj: 'Take out your keys and jingle them in rhythm with the square.', keysHint: '<kbd>Space</kbd> or click – jingle on the beat', keysMeter: 'The square',
    chaseObj: (n) => `Hand out the leaflets (${n}/5). The man in the leather coat is following you – don't let him catch up. <kbd>Shift</kbd> = run.`,
    leaflet: 'Leaflet handed over', caught: '“Your papers!” He held you up and wrote down your name.', chaseEnd: 'All the leaflets are out among the people.', chaseClean: 'All the leaflets are out – and the secret policeman never caught you.',
    sirenObj: 'The general strike begins at 12:00. Reach the siren by the gate and sound it exactly at noon.', sirenE: '<kbd>E</kbd> Sound the siren', sirenEarly: 'Not yet – wait for 12:00',
    sirenOk: 'Exactly at noon. The whole plant stands still.', sirenLate: 'The siren wails. The general strike has begun.', clock: 'Time',
    wireObj: 'The Iron Curtain is falling. Go to the fence left of the road and cut the barbed wire.', wireE: 'Hold <kbd>E</kbd> – cut the wire', wireCut: (n) => `Cut ${n}/3`, wireEnd: 'You take a piece of barbed wire with you. To remember.',
    good: 'On the beat!', keysEnd: 'The whole square is jingling keys. The last bell tolls.', keysEndWeak: 'Keys rang across the square.',
  },
};

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
// svetlá majákov a reflektorov sú len žiariace sprity – nové svetlá by uprostred hry vynútili prekompilovanie shaderov
const blueGlow = () => new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite('90,140,255'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
const box = (g, sx, sy, sz, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };

export function createAction(kind, ctx) {
  return ({ raid, keys, chase, siren, wire }[kind] || keys)(ctx);
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

  // policajný kordón postupuje do davu (smerom k pani Anne)
  const cordon = ctx.world.police;
  let marching = false, lastBaton = -9;

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

      // kordón: od 12. sekundy postupuje, hráča odtláča obuškami
      if (t > 12 && !marching) { marching = true; cordon.forEach((c) => c.obj.userData.setAnim?.('walk')); }
      if (marching) for (const c of cordon) {
        const o = c.obj;
        if (o.position.x < 6) o.position.x += 0.42 * dt; else if (c.walking !== false) { c.walking = false; o.userData.setAnim?.('idle'); }
        c.circle.x = o.position.x;
        const dx = player.x - o.position.x, dz = player.z - o.position.z;
        if (dx > -0.5 && dx < 1.1 && Math.abs(dz) < 0.9) {
          player.x = o.position.x + 1.1;
          if (t - lastBaton > 2.5) { lastBaton = t; hits++; douse(S.baton); flash = 1; }
        }
      }

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
      ctx.world.setCrowd(meter > 45 || done ? 'cheer' : 'idle');
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
      camera.remove(ring); scene.remove(sparks); ctx.world.setCrowd('idle');
      el.action.classList.add('hidden'); el.action.classList.remove('hit');
    },
  };
}

// svietiaca značka cieľa
function beacon(scene, x, z, y = 1.6) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xffc85a })));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite('255,200,90'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(1.6); g.add(s);
  scene.add(g);
  return g;
}

// ───────────────────────────── letáky a muž v koženom kabáte ─────────────────────────────
function chase(ctx) {
  const { scene, player, el } = ctx, S = TXT[ctx.lang()];
  const spots = [[-9, 12], [9, 16], [-4, 25], [11, 7], [-11, 22]].map(([x, z]) => ({ x, z, m: beacon(scene, x, z) }));
  const agent = ctx.npcs.find((n) => n.def.id === 'kollar');
  let t = 0, given = 0, caught = 0, cool = 3, done = false, moving = false, flash = 0;
  el.action.classList.remove('hidden');
  const hud = () => { ctx.setObjective(S.chaseObj(given)); el.action.innerHTML = `<div class="bar gold"><i style="width:${given * 20}%"></i></div><div class="row"><span>📄 ${given}/5</span><span>${caught ? '⚠ ' + caught : ''}</span></div>`; };
  hud();
  return {
    update(dt) {
      t += dt;
      for (const s of spots) {
        if (s.done) continue;
        s.m.rotation.y = t * 2; s.m.position.y = 1.6 + Math.sin(t * 3 + s.x) * 0.1;
        if (!done && Math.hypot(s.x - player.x, s.z - player.z) < 1.7) { s.done = true; scene.remove(s.m); given++; ctx.toast(S.leaflet); Audio.sfx('blip'); hud(); }
      }
      if (agent && !done) {
        const o = agent.obj, dx = player.x - o.position.x, dz = player.z - o.position.z, d = Math.hypot(dx, dz);
        cool -= dt;
        const go = cool <= 0 && d > 1.0;
        if (go !== moving) { moving = go; o.userData.setAnim?.(go ? 'walk' : 'idle'); }
        if (go) { const sp = 2.75 * dt; o.position.x += (dx / d) * sp; o.position.z += (dz / d) * sp; o.rotation.y = Math.atan2(dx, dz); }
        if (cool <= 0 && d < 1.3) { caught++; cool = 5; flash = 1; ctx.toast(S.caught); hud(); }
      }
      if (flash > 0) flash = Math.max(0, flash - dt * 1.2);
      el.flash.style.background = '#a01818'; el.flash.style.opacity = (flash * 0.6).toFixed(2);
      if (!done && given >= 5) {
        done = true; agent?.obj.userData.setAnim?.('idle');
        ctx.finish({ fx: caught ? { trust: -1 } : { courage: 1 }, flag: caught ? 'caught' : 'leaflets', text: caught ? S.chaseEnd : S.chaseClean });
      }
    },
    key() {}, tap() {},
    dispose() { spots.forEach((s) => scene.remove(s.m)); el.action.classList.add('hidden'); el.flash.style.opacity = 0; },
  };
}

// ───────────────────────────── siréna generálneho štrajku ─────────────────────────────
function siren(ctx) {
  const { scene, player, el } = ctx, S = TXT[ctx.lang()];
  const X = 10, Z = -21, root = new THREE.Group(); scene.add(root);
  box(root, 0.16, 4.2, 0.16, std(0x4a4a4a, { metalness: 0.5 }), X, 2.1, Z);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 12, 1, true), std(0xb03a2a, { side: THREE.DoubleSide })); horn.rotation.x = -Math.PI / 2; horn.position.set(X, 4.1, Z + 0.4); root.add(horn);
  box(root, 0.4, 0.5, 0.2, std(0xc8b020), X, 1.3, Z + 0.15);
  const mark = beacon(scene, X, Z + 0.6, 2.2);
  const LEAD = 32;            // sekúnd do poludnia
  let t = 0, done = false, near = false, warned = -9;
  el.action.classList.remove('hidden'); ctx.setObjective(S.sirenObj);
  const clock = () => { const r = Math.round(t - LEAD), a = Math.abs(r); return (r < 0 ? '11:59:' + String(60 - a).padStart(2, '0') : '12:00:' + String(a).padStart(2, '0')); };
  const ring = () => {
    done = true; scene.remove(mark); el.prompt.classList.add('hidden');
    const onTime = Math.abs(t - LEAD) <= 2.5;
    Audio.sfx('siren'); Audio.sfx('crowd'); ctx.world.setCrowd('cheer');
    ctx.finish({ fx: onTime ? { courage: 1 } : {}, flag: onTime ? 'sirenOnTime' : null, text: onTime ? S.sirenOk : S.sirenLate, delay: 6000 });
  };
  return {
    update(dt) {
      t += dt; mark.rotation.y = t * 2;
      if (done) return;
      near = Math.hypot(X - player.x, Z + 0.8 - player.z) < 2.6;
      el.prompt.innerHTML = S.sirenE; el.prompt.classList.toggle('hidden', !near);
      const p = Math.min(1, t / LEAD);
      el.action.innerHTML = `<div class="bar${t >= LEAD - 2.5 ? ' gold' : ''}"><i style="width:${(p * 100).toFixed(1)}%"></i></div><div class="row"><span>${S.clock}</span><span class="clock">${clock()}</span></div>`;
      if (t > LEAD + 12) ring();   // sirénu spustí niekto iný
    },
    key(code) {
      if (done || code !== 'KeyE' || !near) return;
      if (t < LEAD - 2.5) { if (t - warned > 1.5) { warned = t; ctx.toast(S.sirenEarly); } return; }
      ring();
    },
    tap() { this.key('KeyE'); },
    dispose() { scene.remove(root); scene.remove(mark); el.action.classList.add('hidden'); el.prompt.classList.add('hidden'); },
  };
}

// ───────────────────────────── strihanie ostnatého drôtu ─────────────────────────────
function wire(ctx) {
  const { scene, player, el } = ctx, S = TXT[ctx.lang()];
  const X = -10.5, Z = 7.14, root = new THREE.Group(); scene.add(root);
  const wm = std(0x8a8a8a, { metalness: 0.8, roughness: 0.4 });
  const strands = [0.9, 1.4, 1.9].map((y) => {
    const g = new THREE.Group(); g.position.set(X, y, Z);
    const halves = [-1, 1].map((s) => { const h = new THREE.Group(); h.position.x = s * 1.5; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 6), wm); m.rotation.z = Math.PI / 2; m.position.x = -s * 0.75; h.add(m); for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02), wm); b.position.set(-s * (0.2 + k * 0.36), 0, 0); b.rotation.x = k; h.add(b); } g.add(h); return { h, s }; });
    root.add(g); return { halves, cut: false, sag: 0 };
  });
  const mark = beacon(scene, X, Z + 0.5, 2.6);
  let t = 0, prog = 0, n = 0, done = false, near = false;
  el.action.classList.remove('hidden'); ctx.setObjective(S.wireObj);
  return {
    held: false,
    update(dt) {
      t += dt; mark.rotation.y = t * 2;
      for (const s of strands) if (s.cut && s.sag < 1) { s.sag = Math.min(1, s.sag + dt * 2.5); s.halves.forEach(({ h, s: sd }) => (h.rotation.z = sd * s.sag * 1.15)); }
      if (done) return;
      near = Math.abs(player.x - X) < 2.2 && player.z > Z && player.z < Z + 2.4;
      el.prompt.innerHTML = S.wireE; el.prompt.classList.toggle('hidden', !near);
      if (near && this.held) { prog += dt / 1.3; if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) Audio.sfx('blip'); } else prog = Math.max(0, prog - dt);
      if (prog >= 1) {
        prog = 0; strands[n].cut = true; n++; ctx.toast(S.wireCut(n)); jingle(0.8);
        if (n >= 3) { done = true; scene.remove(mark); el.prompt.classList.add('hidden'); ctx.finish({ fx: { courage: 1 }, flag: 'wire', text: S.wireEnd, delay: 3600 }); }
      }
      el.action.innerHTML = `<div class="bar gold"><i style="width:${(((n + prog) / 3) * 100).toFixed(1)}%"></i></div><div class="row"><span>✂ ${n}/3</span></div>`;
    },
    key(code) { if (code === 'KeyE') this.held = true; },
    keyup(code) { if (code === 'KeyE') this.held = false; },
    tap() { this.held = !this.held; },
    dispose() { scene.remove(root); scene.remove(mark); el.action.classList.add('hidden'); el.prompt.classList.add('hidden'); },
  };
}
