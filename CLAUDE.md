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
- **Budovy:** SND, UK, Stará tržnica hotové (`tools/buildings/*.py` + `lib.py`, vkladá `B.landmark()` / `B.snd()`).
  Čakajú: chemický závod (kap. 3) a priechod Berg (kap. 4) – zatiaľ procedurálne. Dlažba z Poly Haven, obloha je gradient.
- **Akčné scénky:** `src/actions.js` – `raid`, `chase`, `keys`, `siren`, `wire`; spúšťa `startAction()` po finálnom dialógu,
  hovorený úvod je `chapter.brief`. Nepridávaj svetlá počas hry (prekompilovanie shaderov) – použi sprity.
  Príznaky (`helpedAnna`, `caught`, `leaflets`, `keysRang`, `sirenOnTime`, `wire`) číta `epilogue()` a `cond` pri NPC.
- **Úlohy:** NPC s `quest: { need, ask, wait, done, hint }` + `chapter.items` (zobrazia sa po `ask`, `E` = vziať, nastaví príznak).
  Pozor na jedinečné ID uzlov v rámci kapitoly (esbuild hlási duplicitné kľúče). Vozidlá: `src/vehicles.js` (`makeVehicle`).
  Dav: `world.setCrowd('cheer')`, `world.setRepel([{x,z,r}])`; kľak hráča `player.kneel` (kláves C).
- **Zvuk:** nahrávky v `dist/sfx/*.mp3` (`Audio.sample`, slučky `Audio.loop`, kroky `Audio.step`), inak syntéza. Všetko cez `<audio>` (file://). Po zmene textov: `node tools-export.mjs > lines.json`
  a `python3 tools-voice.py lines.json` (SK celé; EN len repliky, ktoré v manifeste chýbajú → `en-extra.mp3`).
- Headless test s reálnym GPU: Playwright `channel: 'chrome'` (swiftshader je príliš pomalý).
- Overenie v prehliadači: `window.__game.loadChapter(i)` načíta kapitolu bez menu; veľkosť `dist/index.html` držať do ~25 MB (teraz ~8 MB).
- Každý nový zdroj (model, fotka, textúra) zapíš do README s autorom, licenciou a odkazom.
- **Nasadenie:** `npm run site` (tools/build-site.mjs) → `site/`; `Dockerfile` (nginx) + `docker-compose.stack.yml` (Portainer Swarm,
  port 5496, doména cez Nginx Proxy Manager). Cieľ: `https://17november.eu`. Obraz: `registry.kovanic.sk/matokovanic/sviecky-a-kluce:<verzia>`
  (nikdy neprepisuj už pushnutý tag). Snímky pre web: `web/img/`. Dabing je teraz SK aj EN cez edge-tts (Kokoro sa už nepoužíva).
- **PostHog (voliteľný):** kľúč sa dáva pri builde obrazu `--build-arg POSTHOG_KEY=phc_…` (+ `POSTHOG_HOST`, predvolene EU).
  Bez kľúča sa nič nevkladá. Lišta so súhlasom (`CONSENT` v build-site, `localStorage.ph_consent`, odkaz „Nastavenia súkromia“
  v pätičke): bez súhlasu `persistence: 'memory'` a bez nahrávania, so súhlasom cookies + session replay (vstupy maskované). Udalosti hry: `track()` v `main.js`
  (`chapter_started`, `action_started`, `chapter_completed`, `game_finished`, `author_note_seen`).
