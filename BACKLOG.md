# Ordjægeren — backlog fra Kenneth (16. sep 2026, aften)

Kenneth skal teste spillet med **hele Robins klasse**. Nedenstående er hans liste,
i den rækkefølge han gav den. Status: `[ ]` = ikke begyndt, `[~]` = i gang, `[x]` = færdig.

## 1. Flere verdener — 3-4 nye med sværere ord
`[x] AFKLARET` — Kenneth: *"Verden 3 og 4 så 2 nye"* → **2 nye verdener**. Design i
`Docs/nye-verdener-og-asegard.md`. **De 20 ord + 260 lydfiler er lavet** (`Docs/nye-ord.json`
+ `audio/v2/`). Mangler: ind i `index.html` (WORDS, WORLDS, MAP_POS, BOSSES, kort, tests)
— **blokeret indtil beslutning om tredje kort-side** (se nedenfor).

**Verden 25 "Den svære skov" 🌲** — ord der staves anderledes end de lyder:
dejligt · skønt · specielt · sikkert · ellers · næsten · sjovt · farligt · rigtigt · færdig

**Verden 26 "Mesterskabet" 🏆** — lange sammensatte ord:
sommerfugl · fødselsdag · jordbær · skolegård · bibliotek · sommerferie · computer ·
telefon · fodboldbane · aftensmad

**Spillet bliver 260 ord, ikke 240.** Det tal står i titel, fortælling og fem testpakker
(ordj_maps, ordj_monstre, ordj_data, ordj_smoke_all, ordj_trappestige). Find ALLE steder.

**ÅBENT SPØRGSMÅL:** skal de 2 nye verdener have deres **egen tredje kort-side**? Kenneth har
insisteret på at de to eksisterende kort skal være identiske i layout — så en tredje side bør
følge samme mønster. Assistenten hælder klart til det. **Afventer svar.**

## 1b. Nyt item-niveau over SECRET: ASEGÅRD 🏔️
`[ ]` Design i `Docs/nye-verdener-og-asegard.md`. Seks items, én pr. slot, alle rigtige
nordiske mytologi-genstande: Ægishjálmr (hjelm), Mjölnir (våben), Svalin (skjold),
Megingjörð (rustning), Vidars jernsko (støvler), Draupnir (amulet). Kraft ×45-60,
lille styrke-spænd (5 %), **lysende guld-hvidt** i stedet for en ny mærket farve.

**Nøglen:** man får dem ved at **besejre de to nye verdener** — ikke fra kuben. Kuben
belønner tålmodighed; de nye verdener belønner at man gjorde noget svært. Det er den
kobling der holder en 10-årig i gang.

## 2. Vælg verden frit fra starten
`[ ]`
Man skal kunne **vælge hvilken som helst verden fra begyndelsen** — ikke være låst til
progressions-rækkefølgen.

**Skal afklares:** skal alt være låst op fra start, eller skal verdener låses op ved
stjerner men spillet bare ikke tvinge rækkefølgen? (Kenneths ord: *"fra start skal man
selv kunne vælge den verden man vil"* → antagelse: alt åbent fra start.)

## 3. Lykkehjulet skal være smartere — "det ser billigt ud"
`[ ]`
Nuværende: `wheelOverlay`, `wheelSpin`, `wheelBtn`, `wheelPending`; Web Animations API;
segmenter 25/25/50 (akademi: 10/20/20/50).

**Retning:** rigtigt hjul med skive der drejer (SVG/canvas), pointer der klikker,
acceleration + udløb, vinder-segment lyser op, præmie-kort der folder ud, lyd pr. segment.
I dag ser det billigt ud fordi det sandsynligvis er en simpel rotation uden "feel".

## 4. Ny måde at equippe items på
`[ ]`
Kenneth: *"Måden nu er ikke så god, og man kan ikke tage ting af igen."*

**Den konkrete fejl:** man kan ikke **unequippe**. Det er en ægte funktionel mangel —
og den hænger sammen med `state.gear` / `state.gearRoll` og `equipItem`.

**Retning:** et rigtigt udstyrs-panel med 6 slot-pladser, tap på slot → se hvad der er
i tasken til den slot → udrust / tag af. Plus: vis kraft-forskel ("+0,8 kraft"),
sammenlign med det man har på, og en "tag af"-knap der lægger itemet tilbage i tasken.

## 5. Endnu et UX-løft
`[ ]`
Ikke specificeret nærmere. Skal fortolkes som: konsistent afstand, luft, centrering,
tydeligere trykflader, roligere farver, bedre overgange — og verificeres med
**skærmbilleder i iPad-størrelse + vision-analyse**, som fandt de sidste fejl.

---

# Sådan arbejdes der (erfaringer fra i dag)

- **Testene er porten:** `bash tests/run-all.sh` skal være grøn før deploy. Er den ikke
  grøn, pushes intet — så et halvfærdigt arbejde kan ikke ødelægge det live spil.
- **Skærmbilleder fanger det tests ikke kan.** Vision-analysen fandt skæve knapper og
  klemt tekst som 586 grønne tests ikke så.
- **Lyd kan ikke verificeres maskinelt af mig.** Whisper er ubrugelig på enkelte danske
  ord. Kenneths ører er det eneste pålidelige instrument — send filer og spørg.
- **GitHub Pages' CDN cacher på STIEN, ikke på query-strengen.** `?v=2` virker ikke som
  cache-buster. Skift stien (`audio/v2/`) i stedet.
- **Vær varsom med lister og data.** Fire gange i dag fangede testene fejl i noget JEG
  havde lavet — og det var hver gang et data-problem: en ordliste, et array, en klasse.
  Tjek indholdet før der antages noget.
- **Lydstier:** `audio/v2/words/<ord>.mp3` og `audio/v2/sentences/<ord>.mp3`.
