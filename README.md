# Sviečky a kľúče · Candles and Keys

3D príbehová hra z cesty k **Nežnej revolúcii na Slovensku (1988 – 1989)**. Hráš za študenta Jana Mráza a prežívaš skutočné udalosti – od Sviečkovej manifestácie až po pochod „Ahoj, Európa“ cez železnú oponu. Dialógy majú voľby, ktoré ovplyvňujú **odvahu**, **dôveru** a záverečný epilóg. Všetky postavy hovoria **po slovensky aj po anglicky** (dabing).

> Postavy sú fiktívne. Udalosti, miesta a dátumy sú skutočné – po každej kapitole nasleduje karta „Čo sa naozaj stalo“.

## Kapitoly

| | Dátum | Miesto | Udalosť |
|---|---|---|---|
| Prológ | 25. 3. 1988 | Hviezdoslavovo námestie | Sviečková manifestácia |
| 1 | 16. 11. 1989 | Pred univerzitou | Pochod bratislavských študentov (+ nátlak ŠtB) |
| 2 | koniec nov. 1989 | Námestie SNP | Mítingy VPN, štrnganie kľúčmi |
| 3 | 27. 11. 1989 | Chemický závod | Generálny štrajk 12:00 – 14:00 |
| 4 | 10. 12. 1989 | Hranica Petržalka – Berg | „Ahoj, Európa“ – pochod do Hainburgu |

## Ako hrať

**Najjednoduchšie:** otvor súbor [`dist/index.html`](dist/index.html) v prehliadači (dvojklik). Celá hra je v jednom súbore, funguje offline na **macOS aj Windows** (Chrome, Edge, Safari, Firefox).

Ovládanie: **WASD** chôdza · **myš** rozhliadanie (klikni do hry) · **Shift** beh · **E** hovoriť · **medzerník / klik** ďalej · **1 – 3** voľba · **L** prepnúť jazyk · **Esc / P** pauza. Na tablete: ľavá polovica obrazovky = chôdza, pravá = rozhliadanie.

### Dabing (slovenčina / angličtina)

Všetky repliky sú **vopred nahrané neurálnymi hlasmi** (`dist/voice/*.mp3`, 44,1 kHz / 96 kb/s) – fungujú v každom prehliadači bez nastavovania. Slovenčina: Microsoft Edge neurálne hlasy `sk-SK-LukasNeural` (muži) a `sk-SK-ViktoriaNeural` (ženy) cez balík [edge-tts](https://github.com/rany2/edge-tts); postavy sa líšia len jemne rýchlosťou a výškou. Angličtina: Kokoro (rôzni hovoriaci).

Slovenský dabing sa po úprave textov v `src/story.js` pregeneruje takto: `node tools-export.mjs > lines.json` a `python3 tools-voice.py lines.json` (vyžaduje `pip install edge-tts`, `ffmpeg` a internet). Ukážky jednotlivých replík: `python3 tools-voice.py lines.json --sample out/ candle.k1`.

### 3D postavy

Postavy a dav sú realistické otextúrované rigované modely s motion-capture animáciami z knižnice **[Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox)** (autor: Microsoft, licencia MIT) – 18 postáv a 16 animácií na spoločnom skelete (`assets/people/*.glb`). Konverziu robí `tools/people.sh` (Blender `tools/convert.py`: zloženie textúr do atlasu, export GLB; `tools/pack.mjs`: meshopt kompresia cez gltf-transform). Oblečenie sa v shaderi prefarbuje podľa častí tela do tmavších zimných tónov (`look.coat`, `look.pants`), trup je mierne „nafúknutý“ a postavy dostávajú čiapky, šatky a šály. Dav sa kreslí inštancovane zo „zapečených“ póz 8 modelov v dvoch úrovniach detailu.

### Budovy

Historická budova SND v prológu je vymodelovaná skriptom v Blenderi (`tools/buildings/snd.py` → `assets/buildings/snd.glb`, ~9 400 trojuholníkov, 120 kB) podľa fotografie [Bratislava Hviezdoslavovo nam opera SND.jpg](https://commons.wikimedia.org/wiki/File:Bratislava_Hviezdoslavovo_nam_opera_SND.jpg) (autor: Peter Zelizňák, public domain, Wikimedia Commons). Fotka slúžila len ako predloha proporcií a farieb; model neobsahuje žiadne textúry z nej. Ostatné scény sú zatiaľ procedurálne (`src/world.js`).

## Vývoj

```bash
npm install
npm run build      # zostaví dist/index.html
```

Zdrojáky sú v `src/`:

- `story.js` – celý príbeh: kapitoly, dialógy (SK/EN), voľby, historické karty, epilóg
- `world.js` – procedurálne 3D scény (budovy, dav, sviečky, počasie, hranica, fabrika…)
- `main.js` – herná slučka, ovládanie, dialógový systém, menu, ukladanie
- `voice.js` – dabing cez Web Speech API (výber hlasu podľa jazyka a pohlavia)
- `audio.js` – syntetizované zvuky (dážď, dav, štrngot kľúčov, sirény)

Pridanie novej kapitoly = nový objekt v `CHAPTERS` v `story.js` (+ prípadne nová scéna v `world.js`).

### Ďalšie možné kroky

- Nahradiť syntetický dabing nahratými hlasmi hercov alebo AI hlasmi (súbory `.mp3` podľa ID uzla dialógu).
- Ďalšie budovy podľa vzoru SND: Univerzita Komenského, Námestie SNP, chemický závod, hraničný priechod Petržalka – Berg.
- Natívna aplikácia pre Mac/Windows (Electron/Tauri obal okolo `dist/index.html`).
- Ďalšie kapitoly: 1968 (august), SNP 1944, voľby 1990, vznik SR 1993.

---

## English

A 3D story game about the road to the **Velvet Revolution in Slovakia (1988–1989)**. Open `dist/index.html` in any modern browser on macOS or Windows – no install needed. Press **L** in-game to switch between Slovak and English (text and voice-over). Voice-over uses your OS speech voices; Microsoft Edge offers the most natural ones. Characters are fictional; events, places and dates are real, summarised in a "What really happened" card after each chapter.
