// Dabing cez Web Speech API – používa hlasy nainštalované v systéme / prehliadači.
// macOS: slovenská „Laura“, Windows: „Filip“ / v Edge neurálne „Viktória“ a „Lukáš“.

const FEMALE = /(laura|viktoria|viktória|zuzana|samantha|karen|serena|moira|tessa|victoria|zira|hazel|susan|libby|sonia|aria|jenny|female|žena|kate|fiona|emma|ava|allison|natasha|clara)/i;
const MALE = /(filip|lukas|lukáš|daniel|alex|fred|arthur|oliver|david|mark|george|ryan|guy|(?<!fe)male|muž|james|tom|aaron|rishi|thomas|william|brian|christopher)/i;

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
    let best = null, bestScore = -1;
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

  stop() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch {} },

  speak(text, lang, { g = 'm', pitch = 1, rate = 1 } = {}) {
    return new Promise((resolve) => {
      if (!this.enabled || !window.speechSynthesis || !text || text === '…') return resolve();
      this.stop();
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
