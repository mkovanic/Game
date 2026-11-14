# Sviečky a kľúče – poznámky pre Claude Code

3D príbehová hra (three.js) o Nežnej revolúcii. S používateľom komunikuj po slovensky.
Prehľad hry, kapitol a ovládania je v `README.md`.

## Pravidlá práce

- **Rozpočet:** používateľ chce minúť najviac ~50 % tokenov/limitov. Pracuj úsporne: žiadne
  rozsiahle fan-outy subagentov, žiadne zbytočné výpisy dlhých súborov, screenshoty v malom rozlíšení.
- Vyvíja sa na vetve `claude/nice-hopper-cwdf5t`. PR nevytváraj, kým o to používateľ nepožiada.
- `dist/index.html` je commitnutý výstup – po zmene v `src/` vždy spusti `npm run build` a commitni aj `dist/`.

## Build a spustenie

```bash
npm install
npm run build        # esbuild -> dist/index.html (jeden súbor, GLB modely vložené ako binárky)
```

Hra sa spúšťa dvojklikom na `dist/index.html` (file://), preto **všetky modely musia byť vložené
v bundli** (`import x from '../assets/x.glb'`, loader `binary`) – `fetch` z file:// v Chrome nefunguje.
Dabing (`dist/voice/*.mp3`) leží vedľa `index.html` a hrá cez `<audio>`.
Na ladenie je v konzole `window.__game` (stav, npcs, startDialogue, advance, choose).

## Štruktúra `src/`

- `story.js` – kapitoly, NPC (`look`, `voice`, `pos`), dialógy SK/EN, historické karty
- `world.js` – procedurálne scény; `crowd()` (~riadok 400) kreslí dav cez `InstancedMesh` zo „zapečených“ póz
- `people.js` – postavy: `initPeople()`, `makeCharacter(look)` (NPC so skeletom a mixerom),
  `bakeCrowd()` / `crowdPoses()` / `crowdMaterial()` (dav, 2 úrovne detailu)
- `main.js` – slučka, ovládanie, dialógy, menu; `voice.js`, `audio.js`, `textures.js`

## Rozpracovaná úloha: realistické postavy

Cieľ: nahradiť `assets/Xbot.glb` (prefarbený manekýn) a `assets/Soldier.glb` realistickými
otextúrovanými ľuďmi. V cloudovej relácii sa overil zdroj, konverzia sa ešte nezačala
(v repozitári zatiaľ nie je žiadna zmena kódu).

**Zdroj: [microsoft/Microsoft-Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox)** – licencia MIT,
115 rigovaných postáv + 417 animácií na rovnakom skelete (3ds Max Biped, kosti `Bip01 …`),
takže netreba retargeting. Repozitár je veľký – klonuj úsporne:

```bash
git clone --filter=blob:none --no-checkout --depth 1 https://github.com/microsoft/Microsoft-Rocketbox rb
cd rb && git sparse-checkout set --no-cone '/Assets/Avatars/Adults/Female_Adult_04/Export/Female_Adult_04.fbx' '/Assets/Avatars/Adults/Female_Adult_04/Textures/*_color*.tga'   # + ďalšie cesty
git checkout
```

- Postava: `Assets/Avatars/{Adults,Professions}/<Meno>/Export/<Meno>.fbx` (~0,6 MB, ~10k trojuholníkov;
  `_facial.fbx` netreba) + `Textures/*_body_color.tga`, `*_head_color.tga`, `*_opacity_color.tga`
  (2048², 12 MB – zmenšiť na 512–1024 JPG/WebP; normal/specular vynechať). Náhľad: `<Meno>/<Meno>.png`.
- Animácie: `Assets/Animations/all_animations_max_motextr_static/*.max.fbx` (na mieste) a
  `…_motextr_xy/` (chôdza/beh). Vhodné: `m_idle_neutral_01`, `f_idle_neutral_01`, `m_idle_look_around_01`,
  `m_gestic_talk_neutral_01`, `m_gestic_talk_relaxed_01`, `f_gestic_talk_neutral_01`,
  `m_gestic_listen_neutral_01`, `m_walk_neutral`, `m_claphands_01`, `m_cheer_01`.

**Navrhnuté obsadenie** (podľa náhľadov; pokojne uprav):

| NPC (`story.js`) | Model |
|---|---|
| anna (staršia pani, šatka, sviečka) | `Business_Female_03` |
| vb + policajný kordón (`world.js` ~622) | `Police_Male_03` |
| katka | `Female_Adult_04` |
| peto (študent) | `Male_Adult_12` |
| kollar (ŠtB, klobúk) | `Business_Male_03` |
| igor (herec) | `Male_Adult_07` |
| otec | `Male_Adult_03` |
| ondrej (majster) + robotníci v dave | `Construction_Male_02`, `_03`, `_05` |
| zuzka | `Female_Adult_15` |
| guard (pohraničník) | `Military_Male_05` – textúru prefarbiť z digitálneho maskáča na olivovú/kaki |
| gerti | `Female_Adult_14` |
| dav | `Male_Adult_03/04/07/13`, `Business_Male_02`, `Female_Adult_09/11/14`, `Business_Female_02` |

**Postup (lokálne, s Blenderom):**

1. `tools/convert.py` spúšťaný cez `blender -b -P` – import FBX, pripojiť zmenšené textúry,
   export GLB do `assets/people/`. Animácie exportovať ako samostatné GLB len so skeletom
   (ideálne 15 fps, bez prstov), alebo všetky ako akcie v jednom GLB.
2. Voliteľne `npx @gltf-transform/cli optimize` (quantize/meshopt, WebP) – strážiť veľkosť
   `dist/index.html` (teraz 7,5 MB, z toho ~5 MB Xbot+Soldier, ktoré odpadnú; cieľ do ~15 MB).
3. `people.js`: načítať nové GLB, `makeCharacter(look)` vyberá model podľa nového `look.model`;
   klipy sa viažu podľa mien kostí (GLTFLoader mení `Bip01 Head` → `Bip01_Head`). Zachovať čiapky,
   šály, sviečku (pripájajú sa na kosť hlavy / hrudníka / pravej ruky) a API `userData.tick`.
   Pri ženách/nižších postavách škálovať pozičnú stopu panvy, nech nelevitujú.
4. Dav: `bakeCrowd()` zapiecť pózy z viacerých modelov aj s UV; textúry tela/hlavy/vlasov zložiť
   do jedného atlasu na model (jeden materiál, `alphaTest`), blízka úroveň detailu = plná sieť,
   vzdialená = zhlukovanie vrcholov ako teraz. Farbu inštancie použiť len ako jemný odtieň.
5. Overiť v prehliadači všetkých 5 kapitol (aj „Grafika: nízka“), doplniť README (pôvod modelov + MIT).

Poznámka: oblečenie Rocketboxu je súčasné a ľahké (košele, saká, rifle), nie zimné kabáty z roku 1989.
S Blenderom a voľným internetom sa dajú zvážiť aj iné zdroje (Mixamo, Poly Haven pre rekvizity
a budovy, vlastné úpravy oblečenia) – dohodni s používateľom.
