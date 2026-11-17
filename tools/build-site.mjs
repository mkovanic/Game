// Zostaví web na nasadenie do priečinka site/: úvodná stránka (SK/EN) a podstránky o historických
// udalostiach pre vyhľadávače, hra v /hra/, sitemap.xml a robots.txt.
//   SITE_URL=https://17november.eu node tools/build-site.mjs
import { CHAPTERS } from '../src/story.js';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';

const SITE = (process.env.SITE_URL || 'https://17november.eu').replace(/\/$/, '');
const OUT = 'site';
rmSync(OUT, { recursive: true, force: true });
const w = (path, html) => { mkdirSync(`${OUT}/${path}`.replace(/\/[^/]*$/, ''), { recursive: true }); writeFileSync(`${OUT}/${path}`, html); };
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const T = {
  sk: {
    home: '', game: 'hra/', hist: 'historia', name: 'Sviečky a kľúče',
    title: 'Sviečky a kľúče – 3D hra o Nežnej revolúcii (17. november 1989)',
    desc: 'Bezplatná 3D príbehová hra v prehliadači o ceste Slovenska k slobode: Sviečková manifestácia 1988, študentský pochod, Námestie SNP, generálny štrajk a pochod Ahoj, Európa. S dabingom, po slovensky aj anglicky.',
    h1: 'Sviečky a kľúče', lead: '3D príbehová hra o Nežnej revolúcii na Slovensku 1988 – 1989',
    play: 'Hrať zadarmo v prehliadači', free: 'Bez inštalácie a registrácie · beží v prehliadači na počítači · slovenský a anglický dabing · asi 45 minút',
    about: 'O hre', aboutP: [
      'Si Ján Mráz, devätnásťročný študent Filozofickej fakulty v Bratislave. V marci 1988 stojíš so sviečkou na Hviezdoslavovom námestí a o rok a pol neskôr štrngáš kľúčmi na Námestí SNP. Medzi tým ťa čaká rozhovor s mužom v koženom kabáte, ktorý o tebe vie všetko.',
      'Hra vedie cez päť skutočných udalostí, ktoré zmenili Československo. Rozprávaš sa s ľuďmi, ktorí pri tom boli: s babkou so sviečkou, príslušníkom Verejnej bezpečnosti, hercom zo štrajkujúceho divadla, majstrom z chemického závodu aj pohraničníkom, ktorý dvadsať rokov strážil ostnatý drôt. Tvoje rozhodnutia menia odvahu a dôveru a podľa nich sa píše epilóg.',
      'Každá kapitola sa končí krátkou historickou kartou s faktami, takže hra poslúži aj na hodine dejepisu alebo občianskej náuky.',
    ],
    chapters: 'Päť kapitol, päť skutočných udalostí', more: 'Čo sa naozaj stalo', inGame: 'V hre',
    do: 'Čo v hre robíš', doList: ['Chrániš plameň sviečky pred vodnými delami a pomáhaš ľuďom, ktorí spadli.', 'Podávaš letáky a unikáš príslušníkovi Štátnej bezpečnosti.', 'Štrngáš kľúčmi v rytme stotisícového námestia.', 'Presne na poludnie spúšťaš sirénu generálneho štrajku.', 'Striháš ostnatý drôt železnej opony.'],
    school: 'Pre školy a učiteľov', schoolP: 'Hra je zadarmo, bez reklám a bez zbierania údajov. Jedna kapitola trvá 8 až 10 minút a končí sa zhrnutím historických faktov, takže sa zmestí do vyučovacej hodiny. Dá sa spustiť od ľubovoľnej kapitoly.',
    controls: 'Ovládanie', controlsP: 'WASD – pohyb, myš – rozhliadanie, Shift – beh, C – kľaknúť si, E – hovoriť a konať, L – prepnutie jazyka.',
    src: 'Zdroje a licencie', srcP: 'Postavy: Microsoft Rocketbox (MIT). Budovy sú vymodelované podľa fotografií z Wikimedia Commons. Dlažba: Poly Haven (CC0). Dabing: neurálne hlasy Microsoft. Historické postavy v dialógoch sú fiktívne, udalosti sú skutočné.',
    back: '← Späť na úvod', other: 'English', date: 'Dátum', place: 'Miesto',
  },
  en: {
    home: 'en/', game: 'hra/?lang=en', hist: 'en/history', name: 'Candles and Keys',
    title: 'Candles and Keys – a 3D game about the Velvet Revolution in Slovakia (1989)',
    desc: 'A free 3D story game in your browser about Slovakia\'s road to freedom: the 1988 Candle Demonstration, the student march, SNP Square, the general strike and the Hello, Europe march. Fully voiced in Slovak and English.',
    h1: 'Candles and Keys', lead: 'A 3D story game about the Velvet Revolution in Slovakia, 1988 – 1989',
    play: 'Play free in your browser', free: 'No install, no sign-up · runs in a desktop browser · Slovak and English voice-over · about 45 minutes',
    about: 'About the game', aboutP: [
      'You are Ján Mráz, a nineteen-year-old philosophy student in Bratislava. In March 1988 you stand with a candle on Hviezdoslav Square; a year and a half later you jingle your keys on SNP Square. In between, a man in a leather coat who knows everything about you wants a word.',
      'The game takes you through five real events that changed Czechoslovakia. You talk to the people who were there: a grandmother with a candle, a police officer, an actor from a theatre on strike, a foreman from a chemical plant and a border guard who watched the barbed wire for twenty years. Your choices change your courage and trust, and the epilogue is written from them.',
      'Each chapter ends with a short card of historical facts, so the game also works in a history or civics lesson.',
    ],
    chapters: 'Five chapters, five real events', more: 'What really happened', inGame: 'In the game',
    do: 'What you do in the game', doList: ['Shield a candle flame from water cannons and help people who have fallen.', 'Hand out leaflets and slip away from a secret police agent.', 'Jingle your keys in rhythm with a square of a hundred thousand people.', 'Sound the general strike siren exactly at noon.', 'Cut the barbed wire of the Iron Curtain.'],
    school: 'For schools and teachers', schoolP: 'The game is free, has no ads and collects no data. A chapter takes 8 to 10 minutes and ends with a summary of historical facts, so it fits into a lesson. You can start from any chapter.',
    controls: 'Controls', controlsP: 'WASD – move, mouse – look, Shift – run, C – kneel, E – talk and act, L – switch language.',
    src: 'Sources and licences', srcP: 'Characters: Microsoft Rocketbox (MIT). Buildings are modelled after photographs from Wikimedia Commons. Paving: Poly Haven (CC0). Voice-over: Microsoft neural voices. The characters in the dialogues are fictional; the events are real.',
    back: '← Back to the home page', other: 'Slovensky', date: 'Date', place: 'Place',
  },
};
const IMG = { candle: 'svieckova-manifestacia', students: 'studenti-univerzita', square: 'namestie-snp', strike: 'generalny-strajk', border: 'ahoj-europa' };
const SLUG = {
  sk: { candle: 'svieckova-manifestacia-1988', students: 'studentsky-pochod-16-november-1989', square: 'namestie-snp-verejnost-proti-nasiliu', strike: 'generalny-strajk-27-november-1989', border: 'ahoj-europa-hainburg-1989' },
  en: { candle: 'candle-demonstration-1988', students: 'student-march-16-november-1989', square: 'snp-square-public-against-violence', strike: 'general-strike-27-november-1989', border: 'hello-europe-hainburg-1989' },
};
const HTITLE = {
  sk: { candle: 'Sviečková manifestácia 25. marca 1988', students: 'Študentský pochod 16. novembra 1989 v Bratislave', square: 'Námestie SNP a Verejnosť proti násiliu (november 1989)', strike: 'Generálny štrajk 27. novembra 1989', border: 'Ahoj, Európa: pochod do Hainburgu 10. decembra 1989' },
  en: { candle: 'The Candle Demonstration, 25 March 1988', students: 'The Bratislava student march, 16 November 1989', square: 'SNP Square and Public Against Violence (November 1989)', strike: 'The general strike of 27 November 1989', border: 'Hello, Europe: the march to Hainburg, 10 December 1989' },
};

const CSS = `:root{--bg:#0d0f14;--panel:#161a22;--line:#2a303c;--text:#e9e6df;--muted:#a5a8b0;--accent:#ffc94a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.65 Georgia,'Times New Roman',serif}
a{color:var(--accent)}main,header .in,footer{max-width:1040px;margin:0 auto;padding:0 20px}
header{position:relative;min-height:78vh;display:flex;align-items:flex-end;background:#000 center/cover no-repeat}
header::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,15,20,.25),rgba(13,15,20,.55) 55%,var(--bg))}
header .in{position:relative;z-index:1;width:100%;padding-bottom:48px}
nav{position:absolute;top:0;left:0;right:0;z-index:2;display:flex;justify-content:space-between;padding:16px 20px;font:600 14px system-ui,sans-serif}
nav a{color:#fff;text-decoration:none;opacity:.9}
h1{font-size:clamp(40px,7vw,76px);line-height:1.05;margin:0 0 8px;letter-spacing:.5px}
h2{font-size:30px;margin:56px 0 14px}h3{font-size:21px;margin:0 0 6px}
.lead{font-size:clamp(18px,2.4vw,24px);color:#f3efe6;margin:0 0 26px;max-width:720px}
.btn{display:inline-block;background:var(--accent);color:#1a1405;font:700 18px system-ui,sans-serif;padding:16px 28px;border-radius:10px;text-decoration:none;box-shadow:0 10px 30px rgba(255,201,74,.25)}
.btn:hover{filter:brightness(1.08)}.small{font:14px system-ui,sans-serif;color:var(--muted);margin-top:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;display:block}.card div{padding:14px 16px 18px}
.card small,.meta{font:13px system-ui,sans-serif;color:var(--accent);letter-spacing:.4px;text-transform:uppercase}
.card p{margin:8px 0 10px;font-size:15.5px;color:#d6d3cc}
ul{padding-left:22px}li{margin:6px 0}figure{margin:26px 0}figure img{width:100%;height:auto;border-radius:12px;display:block}
article p{max-width:760px}footer{color:var(--muted);font:14px/1.6 system-ui,sans-serif;border-top:1px solid var(--line);margin-top:64px;padding-top:22px;padding-bottom:40px}
.cta{text-align:center;margin:56px 0 0;padding:36px 20px;background:var(--panel);border:1px solid var(--line);border-radius:14px}`;

const page = ({ lang, path, alt, title, desc, image, ld, body }) => `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/${path}">
<link rel="alternate" hreflang="${lang}" href="${SITE}/${path}">
<link rel="alternate" hreflang="${lang === 'sk' ? 'en' : 'sk'}" href="${SITE}/${alt}">
<link rel="alternate" hreflang="x-default" href="${SITE}/${lang === 'sk' ? path : alt}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${T[lang].name}">
<meta property="og:locale" content="${lang === 'sk' ? 'sk_SK' : 'en_GB'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/${path}">
<meta property="og:image" content="${SITE}/img/${image}.jpg">
<meta property="og:image:width" content="1280"><meta property="og:image:height" content="720">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d0f14">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>
`;

const urls = [];
for (const lang of ['sk', 'en']) {
  const t = T[lang], o = lang === 'sk' ? 'en' : 'sk';
  const cards = CHAPTERS.map((c, i) => `<a class="card" href="/${t.hist}/${SLUG[lang][c.id]}/" style="text-decoration:none;color:inherit">
<img src="/img/${IMG[c.id]}.jpg" alt="${esc(HTITLE[lang][c.id])}" width="1280" height="720" loading="lazy">
<div><small>${i === 0 ? (lang === 'sk' ? 'Prológ' : 'Prologue') : (lang === 'sk' ? 'Kapitola ' : 'Chapter ') + i} · ${esc(c.date[lang])}</small><h3>${esc(c.title[lang])}</h3><p>${esc(c.history[lang].split('. ').slice(0, 2).join('. '))}.</p><span style="color:var(--accent);font:600 14px system-ui">${t.more} →</span></div></a>`).join('\n');
  w(`${t.home}index.html`, page({
    lang, path: t.home, alt: T[o].home, title: t.title, desc: t.desc, image: 'svieckova-manifestacia',
    ld: { '@context': 'https://schema.org', '@type': 'VideoGame', name: t.name, alternateName: T[o].name, url: `${SITE}/${t.home}`, description: t.desc, image: `${SITE}/img/svieckova-manifestacia.jpg`, inLanguage: ['sk', 'en'], genre: ['Adventure', 'Educational', 'Historical'], gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any', playMode: 'SinglePlayer', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, about: [{ '@type': 'Event', name: lang === 'sk' ? 'Nežná revolúcia' : 'Velvet Revolution', startDate: '1989-11-17', location: { '@type': 'Place', name: 'Bratislava' } }] },
    body: `<header style="background-image:url(/img/svieckova-manifestacia.jpg)"><nav><a href="/${t.home}">${t.name}</a><a href="/${T[o].home}" hreflang="${o}">${t.other}</a></nav>
<div class="in"><h1>${t.h1}</h1><p class="lead">${t.lead}</p><a class="btn" href="/${t.game}">▶ ${t.play}</a><p class="small">${t.free}</p></div></header>
<main>
<h2>${t.about}</h2>${t.aboutP.map((p) => `<p>${esc(p)}</p>`).join('')}
<figure><img src="/img/zasah-vodne-dela.jpg" alt="${esc(lang === 'sk' ? 'Zásah vodných diel na Sviečkovej manifestácii v hre' : 'Water cannons at the Candle Demonstration in the game')}" width="1280" height="720" loading="lazy"></figure>
<h2>${t.do}</h2><ul>${t.doList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>${t.chapters}</h2><div class="grid">${cards}</div>
<h2>${t.school}</h2><p>${esc(t.schoolP)}</p>
<h2>${t.controls}</h2><p>${esc(t.controlsP)}</p>
<div class="cta"><a class="btn" href="/${t.game}">▶ ${t.play}</a><p class="small">${t.free}</p></div>
</main>
<footer><b>${t.src}.</b> ${esc(t.srcP)}</footer>`,
  }));
  urls.push([t.home, '1.0']);
  CHAPTERS.forEach((c) => {
    const path = `${t.hist}/${SLUG[lang][c.id]}/`, alt = `${T[o].hist}/${SLUG[o][c.id]}/`, title = HTITLE[lang][c.id];
    const hist = c.history[lang];
    w(`${path}index.html`, page({
      lang, path, alt, title: `${title} – ${t.name}`, desc: hist.slice(0, 155).replace(/\s\S*$/, '') + '…', image: IMG[c.id],
      ld: { '@context': 'https://schema.org', '@type': 'Article', headline: title, inLanguage: lang, image: `${SITE}/img/${IMG[c.id]}.jpg`, mainEntityOfPage: `${SITE}/${path}`, isPartOf: { '@type': 'VideoGame', name: t.name, url: `${SITE}/${t.home}` }, about: { '@type': 'Event', name: title, location: { '@type': 'Place', name: c.place[lang] } } },
      body: `<header style="min-height:52vh;background-image:url(/img/${IMG[c.id]}.jpg)"><nav><a href="/${t.home}">${t.name}</a><a href="/${alt}" hreflang="${o}">${t.other}</a></nav>
<div class="in"><p class="meta">${esc(c.date[lang])} · ${esc(c.place[lang])}</p><h1 style="font-size:clamp(30px,5vw,54px)">${esc(title)}</h1></div></header>
<main><article>
<h2>${t.more}</h2><p>${esc(hist)}</p>
<h2>${t.inGame}: ${esc(c.title[lang])}</h2><p>${esc(c.intro[lang])}</p><p>${esc(c.brief ? c.brief[lang] : '')}</p>
</article>
<div class="cta"><a class="btn" href="/${t.game}">▶ ${t.play}</a><p class="small">${t.free}</p></div>
<p style="margin-top:28px"><a href="/${t.home}">${t.back}</a></p>
</main>
<footer><b>${t.src}.</b> ${esc(t.srcP)}</footer>`,
    }));
    urls.push([path, '0.7']);
  });
}

// hra: doplníme hlavičku pre vyhľadávače a zdieľanie
let game = readFileSync('dist/index.html', 'utf8');
const head = `<title>${esc(T.sk.name)} – hrať 3D hru o Nežnej revolúcii</title>
<meta name="description" content="${esc(T.sk.desc)}" />
<link rel="canonical" href="${SITE}/hra/" />
<meta property="og:title" content="${esc(T.sk.title)}" /><meta property="og:description" content="${esc(T.sk.desc)}" />
<meta property="og:image" content="${SITE}/img/svieckova-manifestacia.jpg" /><meta property="og:url" content="${SITE}/hra/" />
<meta name="twitter:card" content="summary_large_image" /><link rel="icon" href="/favicon.svg" type="image/svg+xml" />`;
game = game.replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, () => head);
w('hra/index.html', game);
cpSync('dist/voice', `${OUT}/hra/voice`, { recursive: true });
cpSync('dist/sfx', `${OUT}/hra/sfx`, { recursive: true });
cpSync('web/img', `${OUT}/img`, { recursive: true });
urls.push(['hra/', '0.9']);

w('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0d0f14"/><rect x="28" y="30" width="8" height="24" rx="2" fill="#efe6cc"/><path d="M32 8c7 8 8 13 8 16a8 8 0 0 1-16 0c0-3 1-8 8-16z" fill="#ffc94a"/></svg>`);
const today = new Date().toISOString().slice(0, 10);
w('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p]) => `<url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`);
w('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
w('404.html', page({ lang: 'sk', path: '404.html', alt: 'en/', title: 'Stránka sa nenašla – Sviečky a kľúče', desc: 'Stránka sa nenašla.', image: 'svieckova-manifestacia', ld: {}, body: `<main style="padding-top:18vh;text-align:center"><h1>404</h1><p class="lead" style="margin:0 auto 26px">Táto stránka neexistuje.</p><a class="btn" href="/">Späť na úvod</a></main>` }));
console.log(`site/ pre ${SITE}: ${urls.length} adries v sitemap`);
