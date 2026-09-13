# Ordjægeren — CURRENT

**Status:** Live og stabil. Selvforbedring er kernen i spillet.

## Links
- **Spil (live):** https://majlundbot.github.io/ordjaegeren/
- **GitHub:** https://github.com/majlundbot/ordjaegeren
- **Drive-kopi:** `~/Library/CloudStorage/GoogleDrive-kennedmajlund@gmail.com/Mit drev/02 Projects/Personal/Ordjægeren/`
- **Git tag:** `v1.0.0` (før Verden 2)

## Kør tests (altid før deploy)
```bash
bash tests/run-all.sh      # 296 tests i 18 pakker — alle skal være grønne
```

## Spillets indhold
- **24 verdener × 10 ord = 240 ord**, med lyd (edge-tts `da-DK-JeppeNeural`)
  - 🌌 Verden 1 (0-11): **Galaksen** — funktionsord
  - 🎓 Verden 2 (12-23): **Ord-akademiet** — sværere børneord
- **3 spil pr. verden:** Hør & Slå (lyt+vælg), Fang ordet (stav), Sætningsgåden (fyld hul)
- **24 drager** med D&D-d20-kampe (2d20 efter 4 besejrede drager)
- **Gear/loot**, Horadric-kuben (altid synlig under helten), lykkehjul
- **MYTISK** (10% drop), **SECRET** (7% fra akademi-drager, kan ikke cubes)
- **Profiler** pr. spiller (Robin, Joey …), forældre-statistik
- **To verdenskort med swipe** (native scroll-snap — virker på iPad)

## Selvforbedring (nøglen)
1. **12 lærings-mønstre — alle 240 ord dækket**
   💨 hv-ord · ✌️ dobbelt-bogstaver · 🚀 to konsonanter i starten · 🤫 stumt D efter N · 🐘 lange ord
   🇩🇰 æ · 🇩🇰 ø · 🇩🇰 å · ✍️ ord med J · 📝 -er-endelser · 📏 korte ord · 🔤 flere stavelser
2. **Øjeblikkelig fejl-forklaring** — fejler han et ord, vises reglen med det samme (gul boks → lektion)
3. **Mønster-mestring** — 🟥 svag / 🟨 øver / 🟩 stærk, med konfetti + "🌟 MESTRET!" ved stærk
4. **Synlig fremgang** — "📈 80% → 20% fejl" i statistikken
5. **Adaptiv sværhedsgrad** — +2 ord når det flyver, -2 når det er tungt
6. **Smart review** — ord fra svage mønstre prioriteres
7. **Midt-i-mission-nudge** — 3 fejl af samme mønster → tilbyd lektionen straks
8. **Adaptiv træningslængde** — drill giver 6/8/10 ord efter svaghed
9. **Lærings-opsummering** på resultat-skærmen

## Kode-struktur (index.html — én selvstændig fil)
- `WORDS` (240 ord→sætninger), `WORLDS` (24×10), `BOSSES` (24 drager), `MAP_POS` (24)
- `SPELL_PATTERNS` (12 mønstre) + `patternStats()` / `patternMastery()` / `patternImprovement()`
- `markWrong` / `markRight` — registrerer fejl + mønster-tælling pr. mission
- `buildWordList` — smart review (svage mønster-ord først, derpå svage enkelt-ord)
- `adaptiveWordCount` / `adaptiveNote` / `checkPatternMastery` / `updatePatternSnapshots`
- `startPatternDrill` — adaptiv drill-længde
- `finishGame` — lærings-opsummering + mestrings-check + snapshots
- Skærme: `screen-stats`/`screen-hero`/`screen-achieve`/`screen-lesson` har klassen `tall`
  (blok-layout → kan ALTID scrolles helt ned)
- `state`: `worlds, wrong, gear, bag, skin, lootCount, heroClass, xp, potions, talentPoints,
  talents, achievements, seenPatterns, mastered, patternSnapshots, mapAt, stats`

## Kendte faldgruber
- **Flexbox-centrering + overflow klipper indhold.** Brug aldrig `justify-content: center` på
  scrollbare containere — brug `justify-content: flex-start` + `::before/::after { margin: auto }`,
  eller `display: block` (klassen `tall`).
- **CSS-transform til kort-swipe virker ikke på iPad/Safari** → brug native scroll-snap.
- **CSS-variabler i WAAPI-keyframes virker ikke på ældre Safari** → sæt keyframes i JS.
- **WAAPI med `fill: "forwards"` holder fat** → annullér gamle animationer før ny.
- **MP3 skal regenereres** når en sætning ændres:
  `/tmp/ttsvenv/bin/edge-tts --voice da-DK-JeppeNeural --text "..." --write-media audio/sentences/<ord>.mp3`

## Næste skridt (ikke bygget)
- Matematik-modul (samme motor, tal-verdener der følger niveau)
- Ugentlig forældre-rapport
- Flere spil-typer der bruger mønster-data