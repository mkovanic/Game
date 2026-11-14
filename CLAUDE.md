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

- `story.js` – kapitoly, NPC (`look` vrátane `look.model`, `voice`, `pos`), dialógy SK/EN, historické karty
- `world.js` – procedurálne scény; `crowd()` kreslí dav cez `InstancedMesh` zo „zapečených“ póz; `snd()` vkladá model SND
- `people.js` – postavy Rocketbox: `initPeople()`, `makeCharacter(look)`, `bakeCrowd()`; `people-assets.js` – importy GLB
- `buildings.js` – GLB budovy (`initBuildings()`, `makeBuilding(name, { night, lit })`)
- `main.js` – slučka, ovládanie, dialógy, menu; `voice.js`, `audio.js`, `textures.js`

## Stav (november 2026)

- **Hlas (hotovo):** slovenčina cez edge-tts (`tools-voice.py`, Lukas/Viktoria, 44,1 kHz / 96 kb/s). Angličtina ostala Kokoro.
- **Postavy (hotovo):** Microsoft Rocketbox (MIT), `tools/people.sh` (Blender `tools/convert.py` + `tools/pack.mjs`).
  Zdroj sa klonuje sparse do `~/rbwork/rb`. Pozor: materiál z Blendera má `depthWrite: false` (opravuje `prepModel`),
  siete sú po meshopt kvantované (polohy vo svete rátaj cez `applyBoneTransform`), výšku nesie uzol `Bip01`.
- **Budovy (rozpracované):** pilot SND hotový (`tools/buildings/snd.py`). Čakajú: Univerzita Komenského (kap. 1),
  Námestie SNP (kap. 2), chemický závod (kap. 3), priechod Petržalka – Berg (kap. 4); voliteľne CC0 dlažba a obloha z Poly Haven.
- Overenie v prehliadači: `window.__game.loadChapter(i)` načíta kapitolu bez menu; veľkosť `dist/index.html` držať do ~25 MB (teraz ~8 MB).
- Každý nový zdroj (model, fotka, textúra) zapíš do README s autorom, licenciou a odkazom.
