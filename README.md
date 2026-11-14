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

Hlasy zabezpečuje syntetizátor reči operačného systému (Web Speech API), preto nie sú potrebné žiadne zvukové súbory:

- **Microsoft Edge** (Windows aj Mac) má najprirodzenejšie neurálne hlasy vrátane slovenských (Viktória, Lukáš).
- **macOS:** Systémové nastavenia → Prístupnosť → Hovorený obsah → Systémový hlas → Spravovať hlasy → *Slovenčina (Laura)*.
- **Windows:** Nastavenia → Čas a jazyk → Reč → Pridať hlasy → *Slovenčina*.

Ak slovenský hlas chýba, hra na to upozorní v menu a texty sa zobrazia aj bez dabingu.

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
- Detailnejšie 3D modely (glTF) skutočných budov – SND, Univerzita Komenského, Námestie SNP.
- Natívna aplikácia pre Mac/Windows (Electron/Tauri obal okolo `dist/index.html`).
- Ďalšie kapitoly: 1968 (august), SNP 1944, voľby 1990, vznik SR 1993.

---

## English

A 3D story game about the road to the **Velvet Revolution in Slovakia (1988–1989)**. Open `dist/index.html` in any modern browser on macOS or Windows – no install needed. Press **L** in-game to switch between Slovak and English (text and voice-over). Voice-over uses your OS speech voices; Microsoft Edge offers the most natural ones. Characters are fictional; events, places and dates are real, summarised in a "What really happened" card after each chapter.
