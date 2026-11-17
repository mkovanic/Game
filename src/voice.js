// Dabing cez Web Speech API – používa hlasy nainštalované v systéme / prehliadači.
// macOS: slovenská „Laura“, Windows: „Filip“ / v Edge neurálne „Viktória“ a „Lukáš“.

const FEMALE = /(laura|viktoria|viktória|zuzana|samantha|karen|serena|moira|tessa|victoria|zira|hazel|susan|libby|sonia|aria|jenny|female|žena|kate|fiona|emma|ava|allison|natasha|clara)/i;
const MALE = /(filip|lukas|lukáš|daniel|alex|fred|arthur|oliver|david|mark|george|ryan|guy|(?<!fe)male|muž|james|tom|aaron|rishi|thomas|william|brian|christopher)/i;

import manifest from './voice-manifest.json';

// Nahraný dabing: jeden MP3 „sprite“ na jazyk a kapitolu, manifest = { 'sk/kapitola.uzol': [súbor, začiatok, dĺžka] }
const players = {};
let cur = null, timer = null, gen = 0;
function playSprite(lang, key) {
  const m = manifest[`${lang}/${key}`];
  if (!m) return Promise.resolve(false);
  const my = gen;
  return new Promise((res) => {
    let a = players[m[0]];
    if (!a) { a = players[m[0]] = new Audio((window.__voiceBase || 'voice/') + m[0]); a.preload = 'auto'; }
    const start = () => {
      if (my !== gen) return res(true);
      try { a.currentTime = m[1]; } catch {}
      cur = a;
      a.play().then(() => { timer = setTimeout(() => { a.pause(); res(true); }, m[2] * 1000 + 120); }).catch(() => res(my !== gen));
    };
    if (a.readyState >= 1) start();
    else { a.addEventListener('loadedmetadata', start, { once: true }); a.addEventListener('error', () => res(false), { once: true }); a.load(); }
  });
}
export const voiceDebug = () => Object.entries(players).map(([k, a]) => [k, a.paused, +a.currentTime.toFixed(1), a.readyState, a.error && a.error.code]);
export function preloadVoice(lang, chapter) {
  const f = `${lang}-${chapter}.mp3`;
  if (!players[f]) { const a = players[f] = new Audio((window.__voiceBase || 'voice/') + f); a.preload = 'auto'; a.load(); }
}

let voices = [];
function load() { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch { voices = []; } }
if (typeof window !== 'undefined' && window.speechSynthesis) {
  load();
  speechSynthesis.addEventListener('voiceschanged', load);
}

export const Voice = {
  enabled: true,
  available() { return !!window.speechSynthesis; },
  voicesFor(lang) { load(); return voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang)); },
  hasLang(lang) { return this.voicesFor(lang).length > 0; },

  pick(lang, g) {
    const list = this.voicesFor(lang);
    if (!list.length) return null;
    const pref = lang === 'en' ? /en-gb/i : /sk-sk/i;
    let best = list[0], bestScore = -Infinity;
    for (const v of list) {
      let s = 0;
      if (/natural|neural|online|premium|enhanced|siri/i.test(v.name)) s += 6;
      if (pref.test(v.lang)) s += 2;
      if (g === 'f' && FEMALE.test(v.name)) s += 4;
      if (g === 'm' && MALE.test(v.name)) s += 4;
      if (g === 'f' && MALE.test(v.name)) s -= 3;
      if (g === 'm' && FEMALE.test(v.name)) s -= 3;
      if (/google/i.test(v.name)) s += 1;
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return { voice: best, genderMatch: g === 'f' ? FEMALE.test(best.name) : MALE.test(best.name) };
  },

  stop() { gen++; clearTimeout(timer); if (cur) cur.pause(); try { window.speechSynthesis && speechSynthesis.cancel(); } catch {} },

  async speak(text, lang, opts = {}, key = null) {
    if (!this.enabled) return;
    this.stop();
    if (key) { const my = gen; const ok = await playSprite(lang, key); if (ok || my !== gen) return; }
    return this.synth(text, lang, opts);
  },

  synth(text, lang, { g = 'm', pitch = 1, rate = 1 } = {}) {
    return new Promise((resolve) => {
      if (!this.enabled || !window.speechSynthesis || !text || text === '…') return resolve();
      const u = new SpeechSynthesisUtterance(text.replace(/[–—]/g, ','));
      const p = this.pick(lang, g);
      u.lang = lang === 'sk' ? 'sk-SK' : 'en-GB';
      let pt = pitch;
      if (p) {
        u.voice = p.voice;
        // ak systém nemá hlas správneho pohlavia, posunieme výšku hlasu
        if (!p.genderMatch) pt *= g === 'm' ? 0.78 : 1.25;
      }
      u.pitch = Math.max(0.1, Math.min(2, pt));
      u.rate = rate * (lang === 'sk' ? 1.0 : 1.02);
      let done = false;
      const fin = () => { if (!done) { done = true; clearInterval(keep); resolve(); } };
      u.onend = fin; u.onerror = fin;
      // Chrome občas „zaspí“ pri dlhších vetách
      const keep = setInterval(() => { if (speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume(); } }, 10000);
      setTimeout(fin, 4000 + text.length * 120);
      speechSynthesis.speak(u);
    });
  },
};
