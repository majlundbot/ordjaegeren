# Ordjægeren — backlog fra Kenneth (16. sep 2026, aften)

Kenneth skal teste spillet med **hele Robins klasse**. Nedenstående er hans liste,
i den rækkefølge han gav den. Status: `[ ]` = ikke begyndt, `[~]` = i gang, `[x]` = færdig.

## 1. Flere verdener — 3-4 nye med sværere ord
`[ ]`
Spillet har 24 verdener (12 funktionsord + 12 temaer) med 240 ord.
Kenneth vil have **3-4 nye verdener med sværere ord**.

**Åbne spørgsmål der skal afklares før arbejdet begynder:**
- "3+4" kan betyde *"3 og 4"* (verdensnumre) eller *"3-4 nye"*. Antaget: 3-4 NYE verdener.
- Hvor svære? Længere ord (4-6 stavelser), sammensatte ord, ord med stumme bogstaver,
  ord der staves anderledes end de lyder (`meget`, `skønt`, `specielt`)?
- Skal de ligge i en **tredje verden-gruppe** ("Svær" / "Mester-akademiet") med eget kort?
  Det passer med den eksisterende to-korts-struktur (Galaksen + Ord-akademiet).
- **Konsekvens:** 24 verdener er bygget ind i kort, monstre, achievements, tests og
  "Fang de 240 vigtigste ord"-fortællingen. Nye verdener kræver: WORDS + WORLDS + MAP_POS
  + nye BOSSES/monstre + nyt kort (eller tredje side) + 480 nye lydfiler + test-opdatering.

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
