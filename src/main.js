import * as THREE from 'three';
import { CHAPTERS, CAST, epilogue } from './story.js';
import { buildWorld } from './world.js';
import { createAction } from './actions.js';
import { initBuildings } from './buildings.js';
import { initPeople, makeCharacter, crowdPoses, peopleDebug } from './people.js';
import { Audio } from './audio.js';
import { Voice, voiceDebug, preloadVoice } from './voice.js';
import * as T from './textures.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ───────────────────────────── texty rozhrania ─────────────────────────────
const UI = {
  sk: {
    subtitle: 'Príbeh z Nežnej revolúcie · Slovensko 1988 – 1989',
    newGame: 'Nová hra', cont: 'Pokračovať', chapters: 'Kapitoly', lang: 'Jazyk', voice: 'Dabing',
    on: 'zapnutý', off: 'vypnutý', start: 'Začať', next: 'Ďalej', talk: 'Hovoriť',
    history: 'Čo sa naozaj stalo', paused: 'Pauza', resume: 'Pokračovať', menu: 'Hlavné menu',
    controls: '<b>WASD</b> chôdza · <b>myš</b> rozhliadanie · <b>Shift</b> beh · <b>E</b> hovoriť · <b>medzerník / klik</b> ďalej · <b>1–3</b> voľba · <b>L</b> jazyk · <b>Esc</b> pauza',
    disclaimer: 'Postavy sú fiktívne. Udalosti, miesta a dátumy sú skutočné – zhrnutia nájdeš na konci každej kapitoly.',
    epilogue: 'Epilóg', theEnd: 'Koniec', courage: 'Odvaha', trust: 'Dôvera', chapter: 'Kapitola', prologue: 'Prológ',
    noVoiceSk: 'Na tomto zariadení chýba slovenský hlas. <b>Mac:</b> Systémové nastavenia → Prístupnosť → Hovorený obsah → Systémový hlas → Spravovať hlasy → Slovenčina. <b>Windows:</b> Nastavenia → Čas a jazyk → Reč → Pridať hlasy → Slovenčina. Najprirodzenejšie hlasy má prehliadač <b>Microsoft Edge</b>.',
    noVoiceEn: 'Na tomto zariadení chýba anglický hlas.',
    quality: 'Grafika', qHigh: 'vysoká', qLow: 'nízka (rýchlejšia)', voiceInfo: 'Dabing: nahrané neurálne hlasy (SK aj EN) – fungujú v každom prehliadači.', voices: 'Nájdené hlasy', noSpeech: 'Tento prehliadač nepodporuje syntézu reči – texty sa zobrazia bez dabingu.',
    hint: 'medzerník / klik – ďalej', choose: 'vyber 1 – 3', clickToLook: 'Klikni do hry pre ovládanie myšou',
    again: 'Hrať znova', credits: 'Vytvorené s Three.js. Zvuky sú syntetizované, dabing zabezpečuje hlasový syntetizér systému.',
    objective: 'Úloha',
  },
  en: {
    subtitle: 'A story of the Velvet Revolution · Slovakia 1988 – 1989',
    newGame: 'New game', cont: 'Continue', chapters: 'Chapters', lang: 'Language', voice: 'Voice-over',
    on: 'on', off: 'off', start: 'Begin', next: 'Next', talk: 'Talk to',
    history: 'What really happened', paused: 'Paused', resume: 'Resume', menu: 'Main menu',
    controls: '<b>WASD</b> walk · <b>mouse</b> look · <b>Shift</b> run · <b>E</b> talk · <b>space / click</b> next · <b>1–3</b> choose · <b>L</b> language · <b>Esc</b> pause',
    disclaimer: 'The characters are fictional. The events, places and dates are real – a summary follows each chapter.',
    epilogue: 'Epilogue', theEnd: 'The End', courage: 'Courage', trust: 'Trust', chapter: 'Chapter', prologue: 'Prologue',
    noVoiceSk: 'No Slovak voice found on this device. <b>Mac:</b> System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Slovak. <b>Windows:</b> Settings → Time & Language → Speech → Add voices → Slovak. <b>Microsoft Edge</b> has the most natural voices.',
    noVoiceEn: 'No English voice found on this device.',
    quality: 'Graphics', qHigh: 'high', qLow: 'low (faster)', voiceInfo: 'Voice-over: pre-recorded neural voices (Slovak and English) – works in every browser.', voices: 'Voices found', noSpeech: 'This browser does not support speech synthesis – text will be shown without voice-over.',
    hint: 'space / click – next', choose: 'choose 1 – 3', clickToLook: 'Click the game to control with the mouse',
    again: 'Play again', credits: 'Made with Three.js. Sounds are synthesised; voice-over uses your system\'s speech synthesiser.',
    objective: 'Objective',
  },
};

// ───────────────────────────── stav ─────────────────────────────
const SAVE_KEY = 'sviecky-a-kluce-v1';
const state = { chapter: 0, maxChapter: 0, stats: { courage: 0, trust: 0 }, flags: {}, lang: 'sk', voice: true, quality: /[?&]lite/.test(location.search) ? 'low' : 'high' };
let snapshot = null; // stav na začiatku kapitoly (pre pokračovanie)
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (s) { Object.assign(state, s.settings || {}); snapshot = s.snapshot || null; state.maxChapter = s.maxChapter || 0; }
} catch {}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ settings: { lang: state.lang, voice: state.voice, quality: state.quality }, snapshot, maxChapter: state.maxChapter })); } catch {}
}
const L = () => UI[state.lang];
const tr = (o) => (o ? o[state.lang] ?? o.sk : '');
Voice.enabled = state.voice;

// ───────────────────────────── renderer ─────────────────────────────
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(state.quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
renderer.shadowMap.enabled = state.quality === 'high';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 900);
camera.rotation.order = 'YXZ';
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.45, 0.7, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// ───────────────────────────── DOM ─────────────────────────────
const $ = (id) => document.getElementById(id);
const el = {
  menu: $('menu'), card: $('card'), hud: $('hud'), dlg: $('dialogue'), pause: $('pause'), fade: $('fade'),
  speaker: $('speaker'), line: $('line'), choices: $('choices'), hint: $('hint'),
  prompt: $('prompt'), objective: $('objective'), chapterTag: $('chapterTag'), toast: $('toast'), action: $('action'), flash: $('flash'), stats: $('stats'), lookHint: $('lookHint'),
};
const show = (e, on = true) => e.classList.toggle('hidden', !on);

// ───────────────────────────── hra ─────────────────────────────
let mode = 'menu';
let world = null;
let npcs = [];
let talked = {};
const player = { x: 0, z: 0, yaw: 0, pitch: 0, bob: 0 };
let chapterDef = null;

function clearChapter() {
  if (action) { action.dispose(); action = null; }
  if (menuWorld) { menuWorld.dispose(); menuWorld = null; }
  if (world) world.dispose();
  npcs.forEach((n) => scene.remove(n.obj));
  npcs = [];
  world = null;
}

function fade(fn) {
  el.fade.classList.add('on');
  setTimeout(() => { fn(); setTimeout(() => el.fade.classList.remove('on'), 60); }, 650);
}

function loadChapter(i) {
  clearChapter();
  state.chapter = i;
  chapterDef = CHAPTERS[i];
  talked = {};
  state.maxChapter = Math.max(state.maxChapter, i);
  snapshot = { chapter: i, stats: { ...state.stats }, flags: { ...state.flags } };
  save();
  const clear = chapterDef.npcs.filter((n) => !n.cond || n.cond(state)).map((n) => [n.pos[0], n.pos[1], 2.4]);
  clear.push([chapterDef.spawn[0], chapterDef.spawn[1], 3.5]);
  clear.push([-1.3, 1.3, -200, 200]);
  world = buildWorld(scene, chapterDef.scene, { clear });
  renderer.toneMappingExposure = world.exposure;
  bloom.strength = world.night ? 0.6 : 0.22;
  for (const n of chapterDef.npcs) {
    if (n.cond && !n.cond(state)) continue;
    const obj = makeCharacter({ ...n.look, glow: T.glowSprite(), long: n.voice.g === 'f' });
    obj.position.set(n.pos[0], 0, n.pos[1]);
    obj.rotation.y = Math.atan2(chapterDef.spawn[0] - n.pos[0], chapterDef.spawn[1] - n.pos[1]);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.label(tr(n.name)), depthTest: false, transparent: true }));
    label.scale.set(1.8, 0.45, 1); label.position.y = 2.12; label.renderOrder = 10;
    obj.add(label);
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xffc94a, depthTest: false, transparent: true, opacity: 0.95 }));
    marker.position.y = 2.5; marker.renderOrder = 11;
    obj.add(marker);
    scene.add(obj);
    npcs.push({ def: n, obj, label, marker, ph: Math.random() * 6 });
  }
  player.x = chapterDef.spawn[0]; player.z = chapterDef.spawn[1];
  player.yaw = 0; player.pitch = 0;
  Audio.ambience(chapterDef.scene);
  preloadVoice(state.lang, chapterDef.id);
  refreshHud();
}

function refreshLabels() {
  for (const n of npcs) {
    n.label.material.map.dispose();
    n.label.material.map = T.label(tr(n.def.name));
    n.label.material.needsUpdate = true;
  }
}

function chapterName(i) { return i === 0 ? L().prologue : `${L().chapter} ${i}`; }

function refreshHud() {
  if (!chapterDef) return;
  el.chapterTag.innerHTML = `<span>${chapterName(state.chapter)} · ${tr(chapterDef.title)}</span><small>${tr(chapterDef.date)} — ${tr(chapterDef.place)}</small>`;
  el.objective.innerHTML = `<b>${L().objective}:</b> ${tr(chapterDef.objective)}`;
  const dots = (v) => '●'.repeat(Math.max(0, Math.min(6, v))) + '○'.repeat(Math.max(0, 6 - Math.max(0, v)));
  el.stats.innerHTML = `${L().courage} <i>${dots(state.stats.courage)}</i> &nbsp; ${L().trust} <i>${dots(state.stats.trust)}</i>`;
}

// ───────────────────────────── karty (úvod, história, epilóg) ─────────────────────────────
let cardSpeech = null;
function showCard({ kicker, title, sub, body, button, onNext, speak = true, extra = '', voiceKey = null }) {
  mode = 'card';
  document.exitPointerLock?.();
  el.card.innerHTML = `
    <div class="card-inner">
      ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
      <h1>${title}</h1>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
      <div class="body">${body.split('\n\n').map((p) => `<p>${p}</p>`).join('')}</div>
      ${extra}
      <button class="primary" id="cardBtn">${button}</button>
    </div>`;
  show(el.card); show(el.hud, false); show(el.dlg, false);
  if (speak) cardSpeech = Voice.speak(body.replace(/\n/g, ' '), state.lang, CAST.narrator.voice, voiceKey);
  $('cardBtn').onclick = () => { Voice.stop(); Audio.sfx('blip'); show(el.card, false); onNext(); };
  $('cardBtn').focus();
}

function introCard(i) {
  const c = CHAPTERS[i];
  showCard({
    kicker: chapterName(i),
    title: tr(c.title),
    sub: `${tr(c.date)} · ${tr(c.place)}`,
    body: tr(c.intro),
    voiceKey: `${c.id}.intro`,
    button: L().start,
    onNext: () => startPlay(),
  });
}

function startPlay() {
  mode = 'play';
  show(el.hud); show(el.lookHint, !document.pointerLockElement);
  requestLock();
}

// akčná scénka po záverečnom rozhovore kapitoly
let action = null;
function startAction() {
  mode = 'action';
  requestLock();
  if (chapterDef.brief) Voice.speak(tr(chapterDef.brief), state.lang, CAST.narrator.voice, `${chapterDef.id}.brief`);
  const mine = (action = createAction(chapterDef.action, {
    scene, camera, player, npcs, el, toast, world, state, lang: () => state.lang,
    setObjective: (html) => (el.objective.innerHTML = `<b>${L().objective}:</b> ${html}`),
    finish: ({ fx, flag, text, delay = 2800 }) => {
      applyFx({ fx: fx && Object.keys(fx).length ? fx : null, flag });
      el.objective.innerHTML = text;
      setTimeout(() => { if (action !== mine) return; action.dispose(); action = null; chapterComplete(); }, delay);
    },
  }));
}

function chapterComplete() {
  mode = 'card';
  setTimeout(() => {
    const c = chapterDef;
    showCard({
      kicker: `${chapterName(state.chapter)} · ${tr(c.title)}`,
      title: L().history,
      body: tr(c.history),
      voiceKey: `${c.id}.history`,
      button: L().next,
      onNext: () => {
        const next = state.chapter + 1;
        if (next < CHAPTERS.length) fade(() => { loadChapter(next); introCard(next); });
        else endGame();
      },
    });
  }, 900);
}

function endGame() {
  state.maxChapter = CHAPTERS.length - 1;
  save();
  showCard({
    kicker: L().epilogue,
    title: state.lang === 'sk' ? 'Sviečky a kľúče' : 'Candles and Keys',
    body: epilogue(state, state.lang),
    extra: `<div class="credits">${L().credits}</div>`,
    button: L().menu,
    onNext: () => { clearChapter(); openMenu(); },
  });
}

// ───────────────────────────── menu ─────────────────────────────
function openMenu() {
  mode = 'menu';
  Audio.stopAmbience();
  document.exitPointerLock?.();
  show(el.hud, false); show(el.dlg, false); show(el.pause, false); show(el.card, false);
  show(el.menu);
  renderMenu();
}

function renderMenu() {
  const l = L();
  const chapters = CHAPTERS.map((c, i) => `<button class="chap" data-i="${i}" ${i > state.maxChapter ? 'disabled' : ''}><b>${chapterName(i)}</b> ${tr(c.title)}<small>${tr(c.date)}</small></button>`).join('');
  const vs = `<div class="voices">${l.voiceInfo}</div>`;
  el.menu.innerHTML = `
    <div class="menu-inner">
      <div class="logo"><span class="candle"></span><span class="keys">🔑</span></div>
      <h1>${state.lang === 'sk' ? 'Sviečky a kľúče' : 'Candles and Keys'}</h1>
      <div class="sub">${l.subtitle}</div>
      <div class="row">
        ${snapshot ? `<button class="primary" id="btnCont">${l.cont} — ${chapterName(snapshot.chapter)}</button>` : ''}
        <button class="${snapshot ? '' : 'primary'}" id="btnNew">${l.newGame}</button>
      </div>
      <div class="row settings">
        <span>${l.lang}:</span>
        <button class="toggle ${state.lang === 'sk' ? 'on' : ''}" data-lang="sk">Slovensky</button>
        <button class="toggle ${state.lang === 'en' ? 'on' : ''}" data-lang="en">English</button>
        <button class="toggle" id="btnQ">${l.quality}: ${state.quality === 'high' ? l.qHigh : l.qLow}</button>
        <span style="margin-left:14px">${l.voice}:</span>
        <button class="toggle ${state.voice ? 'on' : ''}" id="btnVoice">${state.voice ? l.on : l.off}</button>
      </div>
      ${vs}
      <h3>${l.chapters}</h3>
      <div class="chapters">${chapters}</div>
      <div class="controls">${l.controls}</div>
      <div class="disclaimer">${l.disclaimer}</div>
    </div>`;
  const begin = (i, snap) => {
    Audio.unlock();
    if (snap) { state.stats = { ...snap.stats }; state.flags = { ...snap.flags }; }
    else if (i === 0) { state.stats = { courage: 0, trust: 0 }; state.flags = {}; }
    show(el.menu, false);
    fade(() => { loadChapter(i); introCard(i); });
  };
  $('btnNew').onclick = () => begin(0, null);
  if ($('btnCont')) $('btnCont').onclick = () => begin(snapshot.chapter, snapshot);
  el.menu.querySelectorAll('.chap').forEach((b) => (b.onclick = () => {
    const i = +b.dataset.i;
    // pri preskočení kapitoly použijeme uložený stav, inak neutrálny
    begin(i, snapshot && snapshot.chapter === i ? snapshot : { stats: { courage: i, trust: i }, flags: { refused: i > 1 } });
  }));
  el.menu.querySelectorAll('[data-lang]').forEach((b) => (b.onclick = () => setLang(b.dataset.lang)));
  $('btnQ').onclick = () => { state.quality = state.quality === 'high' ? 'low' : 'high'; save(); location.reload(); };
  $('btnVoice').onclick = () => { state.voice = !state.voice; Voice.enabled = state.voice; if (!state.voice) Voice.stop(); save(); renderMenu(); };
}

function setLang(lang) {
  state.lang = lang;
  save();
  document.documentElement.lang = lang;
  if (mode === 'menu') renderMenu();
  refreshHud();
  refreshLabels();
  if (mode === 'dialogue' && dlg.node) renderNode(true);
  if (mode === 'paused') renderPause();
}

// ───────────────────────────── pauza ─────────────────────────────
function renderPause() {
  const l = L();
  el.pause.innerHTML = `<div class="menu-inner small">
    <h2>${l.paused}</h2>
    <button class="primary" id="pResume">${l.resume}</button>
    <div class="row settings">
      <button class="toggle ${state.lang === 'sk' ? 'on' : ''}" data-lang="sk">Slovensky</button>
      <button class="toggle ${state.lang === 'en' ? 'on' : ''}" data-lang="en">English</button>
      <button class="toggle ${state.voice ? 'on' : ''}" id="pVoice">${l.voice}: ${state.voice ? l.on : l.off}</button>
    </div>
    <div class="controls">${l.controls}</div>
    <button id="pMenu">${l.menu}</button></div>`;
  $('pResume').onclick = resume;
  $('pMenu').onclick = () => { clearChapter(); openMenu(); };
  $('pVoice').onclick = () => { state.voice = !state.voice; Voice.enabled = state.voice; save(); renderPause(); };
  el.pause.querySelectorAll('[data-lang]').forEach((b) => (b.onclick = () => setLang(b.dataset.lang)));
}
let pausedFrom = 'play';
function pause() {
  if (mode !== 'play' && mode !== 'action') return;
  pausedFrom = mode;
  mode = 'paused';
  document.exitPointerLock?.();
  renderPause();
  show(el.pause);
}
function resume() {
  show(el.pause, false);
  mode = pausedFrom;
  requestLock();
}

// ───────────────────────────── dialógy ─────────────────────────────
const dlg = { npc: null, node: null, nodeId: null, typing: 0, full: '', onEnd: null, startedFrom: null, voiceToken: 0 };

function allRequiredDone() {
  return chapterDef.npcs.filter((n) => n.required).every((n) => talked[n.id]);
}

function startDialogue(n) {
  mode = 'dialogue';
  document.exitPointerLock?.();
  show(el.lookHint, false);
  dlg.npc = n;
  const d = n.def;
  let start;
  if (d.final && !allRequiredDone()) start = d.wait;
  else if (talked[d.id]) start = d.after;
  else start = d.start;
  dlg.startedFrom = start;
  show(el.dlg); show(el.prompt, false); document.body.classList.add('talking');
  Audio.sfx('blip');
  goNode(start);
}

function speakerOf(who) {
  if (who === 'player') return CAST.player;
  if (who === 'narrator') return CAST.narrator;
  const d = chapterDef.npcs.find((n) => n.id === who);
  return d ? { name: d.name, voice: d.voice } : CAST.narrator;
}

function toast(txt) {
  el.toast.textContent = txt;
  el.toast.classList.remove('show'); void el.toast.offsetWidth; el.toast.classList.add('show');
}

function applyFx(o) {
  if (o.fx) {
    const parts = [];
    for (const [k, v] of Object.entries(o.fx)) {
      state.stats[k] = (state.stats[k] || 0) + v;
      parts.push(`${v > 0 ? '+' : ''}${v} ${k === 'courage' ? L().courage : L().trust}`);
    }
    toast(parts.join(' · '));
    refreshHud();
  }
  if (o.flag) state.flags[o.flag] = true;
}

function goNode(id) {
  let node = chapterDef.nodes[id];
  while (node && node.branch && !node.sk) { id = node.branch(state); node = chapterDef.nodes[id]; }
  if (!node) { endDialogue(); return; }
  dlg.nodeId = id;
  dlg.node = node;
  dlg.key = `${chapterDef.id}.${id}`;
  applyFx(node);
  if (node.sfx) Audio.sfx(node.sfx);
  renderNode(false);
}

function renderNode(refresh) {
  const node = dlg.node;
  const sp = speakerOf(node.who);
  el.speaker.textContent = tr(sp.name);
  el.speaker.className = node.who === 'player' ? 'me' : node.who === 'narrator' ? 'narr' : '';
  dlg.full = tr(node);
  dlg.typing = refresh ? dlg.full.length : 0;
  el.line.textContent = '';
  el.choices.innerHTML = '';
  el.hint.textContent = '';
  const token = ++dlg.voiceToken;
  Voice.speak(dlg.full, state.lang, sp.voice, dlg.key).then(() => {
    // automaticky nič neposúvame – hráč číta vlastným tempom
    if (token !== dlg.voiceToken) return;
  });
}

function finishTyping() {
  dlg.typing = dlg.full.length;
  el.line.textContent = dlg.full;
  showChoices();
}

function showChoices() {
  const node = dlg.node;
  if (el.choices.childElementCount || !node) return;
  if (node.choices) {
    node.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<kbd>${i + 1}</kbd> ${tr(c)}`;
      b.onclick = (e) => { e.stopPropagation(); choose(i); };
      el.choices.appendChild(b);
    });
    el.hint.textContent = L().choose;
  } else {
    el.hint.textContent = L().hint;
  }
}

function choose(i) {
  const node = dlg.node;
  if (!node?.choices || dlg.typing < dlg.full.length) return;
  const c = node.choices[i];
  if (!c) return;
  Audio.sfx('blip');
  applyFx(c);
  // hráč vysloví svoju voľbu
  dlg.key = `${chapterDef.id}.${dlg.nodeId}.c${i}`;
  dlg.node = { who: 'player', sk: c.sk, en: c.en, next: c.next };
  renderNode(false);
}

function advance() {
  if (mode !== 'dialogue') return;
  if (dlg.typing < dlg.full.length) { finishTyping(); return; }
  const node = dlg.node;
  if (node.choices) return;
  if (node.branch) { goNode(node.branch(state)); return; }
  if (node.next) { goNode(node.next); return; }
  endDialogue();
}

function endDialogue() {
  Voice.stop();
  show(el.dlg, false); document.body.classList.remove('talking');
  const d = dlg.npc.def;
  const wasMain = dlg.startedFrom === d.start;
  if (wasMain) talked[d.id] = true;
  dlg.npc = null; dlg.node = null;
  if (wasMain && d.final) { if (chapterDef.action) startAction(); else chapterComplete(); return; }
  mode = 'play';
  requestLock();
}

// ───────────────────────────── vstup ─────────────────────────────
const keys = {};
let dragging = false, lastMX = 0, lastMY = 0;
const touch = { move: null, look: null, mx: 0, mz: 0 };

function requestLock() {
  if (matchMedia('(pointer: coarse)').matches) return;
  try { const p = canvas.requestPointerLock?.(); if (p && p.catch) p.catch(() => {}); } catch {}
}
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  if (mode === 'play') show(el.lookHint, !locked);
});

canvas.addEventListener('click', () => {
  if (mode === 'action') { if (!document.pointerLockElement) requestLock(); action?.tap(); }
  else if (mode === 'play' && !document.pointerLockElement) requestLock();
  else if (mode === 'dialogue') advance();
});
el.dlg.addEventListener('click', () => advance());
el.prompt.addEventListener('click', () => { if (mode === 'play' && nearNpc) startDialogue(nearNpc); });

window.addEventListener('mousemove', (e) => {
  if (mode !== 'play') return;
  if (document.pointerLockElement === canvas) {
    // prehliadače občas pošlú po zamknutí kurzora nezmyselný skok – ignorujeme ho
    if (performance.now() - lockedAt < 150 || Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return;
    look(e.movementX, e.movementY);
  }
  else if (dragging) { look(e.clientX - lastMX, e.clientY - lastMY); lastMX = e.clientX; lastMY = e.clientY; }
});
canvas.addEventListener('mousedown', (e) => { dragging = true; lastMX = e.clientX; lastMY = e.clientY; });
window.addEventListener('mouseup', () => (dragging = false));

function look(dx, dy) {
  player.yaw -= dx * 0.0022;
  player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - dy * 0.0022));
}

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyL' && mode !== 'menu') { setLang(state.lang === 'sk' ? 'en' : 'sk'); return; }
  if (mode === 'play') {
    if (e.code === 'KeyE' && nearNpc) startDialogue(nearNpc);
    if (e.code === 'Escape' || e.code === 'KeyP') pause();
  } else if (mode === 'action') {
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') pause(); else action?.key(e.code);
  } else if (mode === 'dialogue') {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); advance(); }
    const d = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (d !== undefined) choose(d);
  } else if (mode === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
    resume();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; if (mode === 'action') action?.keyup?.(e.code); });
// pri strate pointer locku (Esc) prepneme do pauzy
let wasLocked = false, lockedAt = 0;
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  if (locked) lockedAt = performance.now();
  if (!locked && wasLocked && (mode === 'play' || mode === 'action')) pause();
  wasLocked = locked;
});

// dotykové ovládanie (iPad / mobil): ľavá polovica = chôdza, pravá = rozhliadanie
canvas.addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX < window.innerWidth * 0.45 && !touch.move) touch.move = { id: t.identifier, x: t.clientX, y: t.clientY };
    else if (!touch.look) touch.look = { id: t.identifier, x: t.clientX, y: t.clientY };
  }
  if (mode === 'dialogue') advance();
  if (mode === 'action' && e.changedTouches[0].clientX > window.innerWidth * 0.45) action?.tap();
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { touch.mx = (t.clientX - touch.move.x) / 60; touch.mz = (t.clientY - touch.move.y) / 60; }
    if (touch.look && t.identifier === touch.look.id) { if (mode === 'play') look((t.clientX - touch.look.x) * 1.6, (t.clientY - touch.look.y) * 1.6); touch.look.x = t.clientX; touch.look.y = t.clientY; }
  }
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.mx = touch.mz = 0; }
    if (touch.look && t.identifier === touch.look.id) touch.look = null;
  }
});

// ───────────────────────────── fyzika ─────────────────────────────
const PR = 0.3;
function collide() {
  for (const b of world.boxes) {
    const cx = Math.max(b.minX, Math.min(player.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(player.z, b.maxZ));
    const dx = player.x - cx, dz = player.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < PR * PR) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2); player.x = cx + (dx / d) * PR; player.z = cz + (dz / d) * PR; }
      else {
        // vo vnútri – vytlačiť najkratšou cestou
        const opts = [[b.minX - PR - player.x, 0], [b.maxX + PR - player.x, 0], [0, b.minZ - PR - player.z], [0, b.maxZ + PR - player.z]];
        opts.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]));
        player.x += opts[0][0]; player.z += opts[0][1];
      }
    }
  }
  const circ = (x, z, r) => {
    const dx = player.x - x, dz = player.z - z, rr = r + PR;
    const d2 = dx * dx + dz * dz;
    if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2); player.x = x + (dx / d) * rr; player.z = z + (dz / d) * rr; }
  };
  for (const c of world.circles) {
    if (Math.abs(c.x - player.x) > 1.2 || Math.abs(c.z - player.z) > 1.2) continue;
    circ(c.x, c.z, c.r * 0.7);
  }
  for (const n of npcs) circ(n.obj.position.x, n.obj.position.z, 0.35);
  const B = world.bounds;
  player.x = Math.max(B.minX, Math.min(B.maxX, player.x));
  player.z = Math.max(B.minZ, Math.min(B.maxZ, player.z));
}

// ───────────────────────────── hlavná slučka ─────────────────────────────
let nearNpc = null;
const clock = new THREE.Clock();
let time = 0;
const tmpV = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  if (mode === 'menu' && !world) {
    renderMenuScene(dt);
    return;
  }
  if (!world) return;

  if (mode === 'play' || mode === 'action') {
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz -= 1;
    if (keys.KeyS || keys.ArrowDown) fz += 1;
    if (keys.KeyA || keys.ArrowLeft) fx -= 1;
    if (keys.KeyD || keys.ArrowRight) fx += 1;
    fx += touch.mx; fz += touch.mz;
    const len = Math.hypot(fx, fz);
    if (len > 0.01) {
      const k = Math.min(1, len) / len;
      fx *= k; fz *= k;
      const sp = (keys.ShiftLeft || keys.ShiftRight ? 6 : 3.2) * dt;
      const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
      player.x += (fx * c + fz * s) * sp;
      player.z += (-fx * s + fz * c) * sp;
      player.bob += dt * (keys.ShiftLeft ? 13 : 9);
    }
    collide();
    // najbližšia postava
    nearNpc = null;
    let best = 2.8;
    for (const n of mode === 'play' ? npcs : []) {
      const d = Math.hypot(n.obj.position.x - player.x, n.obj.position.z - player.z);
      if (d < best) { best = d; nearNpc = n; }
    }
    if (mode === 'action') { /* výzvy riadi scénka */ }
    else if (nearNpc) {
      el.prompt.innerHTML = `<kbd>E</kbd> ${L().talk}: <b>${tr(nearNpc.def.name)}</b>`;
      show(el.prompt);
    } else show(el.prompt, false);
  }

  if (mode === 'dialogue' && dlg.npc) {
    // písací stroj
    if (dlg.typing < dlg.full.length) {
      dlg.typing = Math.min(dlg.full.length, dlg.typing + dt * 55);
      el.line.textContent = dlg.full.slice(0, Math.floor(dlg.typing));
      if (dlg.typing >= dlg.full.length) showChoices();
    }
    // kamera sa otočí k postave
    const p = dlg.npc.obj.position;
    const ty = Math.atan2(-(p.x - player.x), -(p.z - player.z));
    let dy = ty - player.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    player.yaw += dy * Math.min(1, dt * 4);
    const dist = Math.hypot(p.x - player.x, p.z - player.z);
    const tp = Math.atan2(1.6 - 1.65, dist) - 0.02;
    player.pitch += (tp - player.pitch) * Math.min(1, dt * 4);
  }

  // NPC: dýchanie, otáčanie hlavy k hráčovi, značky
  const ready = chapterDef && allRequiredDone();
  for (const n of npcs) {
    const o = n.obj, u = o.userData;
    const dx = player.x - o.position.x, dz = player.z - o.position.z;
    const d = Math.hypot(dx, dz);
    const inTalk = mode === 'dialogue' && dlg.npc === n;
    let a = Math.atan2(dx, dz) - o.rotation.y;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    if (inTalk) o.rotation.y += a * Math.min(1, dt * 3);
    const talking = inTalk && dlg.node && dlg.node.who === n.def.id;
    u.tick(dt, d < 6 && !inTalk ? Math.max(-0.9, Math.min(0.9, a)) : 0, talking, time + n.ph);
    if (u.flame) u.flame.scale.setScalar(0.2 + Math.sin(time * 19 + n.ph) * 0.02);
    const needs = !talked[n.def.id] && (n.def.required || (n.def.final && ready));
    n.marker.visible = needs;
    n.marker.position.y = 2.5 + Math.sin(time * 3 + n.ph) * 0.08;
    n.marker.rotation.y = time * 2;
    n.label.visible = d < 14;
  }

  if (mode === 'action' && action) action.update(dt);

  world.update(time, dt, player);

  const bob = Math.sin(player.bob) * 0.035;
  camera.position.set(player.x, 1.65 + bob, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  (state.quality === 'high' ? composer.render() : renderer.render(scene, camera));
}

// pozadie hlavného menu – pomaly sa otáčajúca scéna so sviečkami
let menuWorld = null;
function renderMenuScene(dt) {
  if (!menuWorld) {
    menuWorld = buildWorld(scene, 'candle', { clear: [[0, 30, 4]] });
    renderer.toneMappingExposure = menuWorld.exposure;
  }
  const t = time * 0.05;
  camera.position.set(Math.sin(t) * 6, 2.4, 30 + Math.cos(t) * 4);
  camera.rotation.set(-0.05, Math.sin(t) * 0.25, 0);
  menuWorld.update(time, dt, { x: 0, z: 27 });
  (state.quality === 'high' ? composer.render() : renderer.render(scene, camera));
}


// ───────────────────────────── štart ─────────────────────────────
document.documentElement.lang = state.lang;
if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', () => { if (mode === 'menu') renderMenu(); });
el.menu.innerHTML = '<div class="menu-inner"><div class="sub">Načítavam… / Loading…</div></div>';
Promise.all([initPeople(), initBuildings()]).then(() => { openMenu(); tick(); });

// ladenie / automatické testy
window.__game = { voiceDebug, startAction, get action() { return action; }, people: peopleDebug, loadChapter: (i) => { show(el.menu, false); loadChapter(i); }, poses: crowdPoses, renderer, player, state, get mode() { return mode; }, get npcs() { return npcs; }, startDialogue: (i) => startDialogue(npcs[i]), advance, choose };
