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

### Akčné scénky

Po záverečnom rozhovore každej kapitoly nasleduje interaktívna scénka (`src/actions.js`, v `story.js` polia `action` a `brief`):

- **Prológ – zásah polície:** 70 sekúnd na námestí; vodné delá mieria za hráčom, autá VB vchádzajú do davu, kordón postupuje. Hráč chráni plameň sviečky (`F` – znova zapáliť) a môže pomôcť spadnutej pani Anne (`E`).
- **Kapitola 1 – letáky:** rozdať 5 letákov skôr, než hráča dobehne muž v koženom kabáte (`Shift` – beh).
- **Kapitola 2 – štrnganie kľúčmi:** `Medzerník` / klik v rytme; čím presnejšie, tým viac sa pridáva (a jasá) celé námestie.
- **Kapitola 3 – siréna:** dôjsť k siréne pri bráne a spustiť ju presne o 12:00.
- **Kapitola 4 – ostnatý drôt:** pri plote podržať `E` a prestrihnúť tri drôty železnej opony.

Výsledky scénok menia odvahu a dôveru, zapisujú sa ako príznaky a vracajú sa neskôr: ak hráč pomohol pani Anne, stretne ju v kapitole 2; epilóg má odseky podľa toho, čo hráč spravil.

### Budovy, prostredie a zvuky

Budovy sú vymodelované skriptami v Blenderi (`tools/buildings/*.py`, spoločné pomôcky v `lib.py`) a vložené ako GLB bez textúr; fotografie slúžili len ako predloha proporcií a farieb:

| Model | Predloha (Wikimedia Commons) | Autor, licencia |
|---|---|---|
| `snd.glb` – historická budova SND | [Bratislava Hviezdoslavovo nam opera SND.jpg](https://commons.wikimedia.org/wiki/File:Bratislava_Hviezdoslavovo_nam_opera_SND.jpg) | Peter Zelizňák, public domain |
| `uk.glb` – Univerzita Komenského | [Šafárikovo námestie and Univerzita Komenského…JPG](https://commons.wikimedia.org/wiki/File:%C5%A0af%C3%A1rikovo_n%C3%A1mestie_(%C5%A0af%C3%A1rikovo_Square)_and_Univerzita_Komensk%C3%A9ho_(Comenius_University)_in_Bratislava,_Slovak_Republic.JPG) | Kiwiev, CC0 |
| `trznica.glb` – Stará tržnica (Námestie SNP) | [Bratislava stará tržnica 1.jpg](https://commons.wikimedia.org/wiki/File:Bratislava_star%C3%A1_tr%C5%BEnica_1.jpg) | Wizzard, public domain |

Ďalšie prevzaté zdroje:

- Dlažba: [Cobblestone Floor 04](https://polyhaven.com/a/cobblestone_floor_04) – Poly Haven, CC0 (`assets/textures/`, zmenšené na 512 px).
- `dist/sfx/siren.mp3`: [Civil-defense-siren-waver.ogg](https://commons.wikimedia.org/wiki/File:Civil-defense-siren-waver.ogg) – Techtonic, public domain.
- `dist/sfx/applause.mp3`: [Slow starting applause.ogg](https://commons.wikimedia.org/wiki/File:Slow_starting_applause.ogg) – stephan, public domain.
- `dist/sfx/bells.mp3`: [Bells ringing in Tower of Přibyslav.ogg](https://commons.wikimedia.org/wiki/File:Bells_ringing_in_Tower_of_P%C5%99ibyslav.ogg) – Bazi, upravil Blahma, CC BY-SA 3.0 (skrátené, znormalizovaná hlasitosť).

Chemický závod a hraničný priechod sú zatiaľ procedurálne (`src/world.js`). Ostatné zvuky sú syntetizované (`src/audio.js`). Nové anglické repliky (scénky, pani Anna v kap. 2) sú nahovorené hlasmi Microsoft `en-GB-RyanNeural` / `en-GB-SoniaNeural` (`dist/voice/en-extra.mp3`).

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
- Modely chemického závodu a hraničného priechodu Petržalka – Berg podľa vzoru SND.
- Natívna aplikácia pre Mac/Windows (Electron/Tauri obal okolo `dist/index.html`).
- Ďalšie kapitoly: 1968 (august), SNP 1944, voľby 1990, vznik SR 1993.

---

## English

A 3D story game about the road to the **Velvet Revolution in Slovakia (1988–1989)**. Open `dist/index.html` in any modern browser on macOS or Windows – no install needed. Press **L** in-game to switch between Slovak and English (text and voice-over). Voice-over uses your OS speech voices; Microsoft Edge offers the most natural ones. Characters are fictional; events, places and dates are real, summarised in a "What really happened" card after each chapter.
