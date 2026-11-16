import { CHAPTERS } from './src/story.js';
const out = [];
for (const c of CHAPTERS) {
  out.push({ key: `${c.id}.intro`, ch: c.id, who: 'narrator', sk: c.intro.sk, en: c.intro.en });
  for (const [id, n] of Object.entries(c.nodes)) {
    if (n.sk && n.sk !== '…') out.push({ key: `${c.id}.${id}`, ch: c.id, who: n.who, sk: n.sk, en: n.en });
    (n.choices || []).forEach((ch, i) => out.push({ key: `${c.id}.${id}.c${i}`, ch: c.id, who: 'player', sk: ch.sk, en: ch.en }));
  }
  if (c.brief) out.push({ key: `${c.id}.brief`, ch: c.id, who: 'narrator', sk: c.brief.sk, en: c.brief.en });
  out.push({ key: `${c.id}.history`, ch: c.id, who: 'narrator', sk: c.history.sk, en: c.history.en });
}
console.log(JSON.stringify(out));
