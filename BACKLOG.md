# Ordjægeren — backlog fra Kenneth (16. sep 2026, aften)

Kenneth skal teste spillet med **hele Robins klasse**. Nedenstående er hans liste,
i den rækkefølge han gav den. Status: `[ ]` = ikke begyndt, `[~]` = i gang, `[x]` = færdig.

## 1. Flere verdener — 3-4 nye med sværere ord
`[x] FÆRDIG (17. sep)` — 2 nye verdener i `index.html`: WORDS (20 nye ord), WORLDS,
MONSTRE (Stavelses-trolden + Mester-dragen), MAP_POS, og en **tredje kort-side**
(24 verdener på de to gamle + 2 på side C). Spillet hedder nu 260 ord / 26 verdener.
Tests opdateret i 9 pakker + ny pakke `ordj_asgard.js`. Hele suiten grøn.

**Verden 25 "Den svære skov" 🌲** — ord der staves anderledes end de lyder:
dejligt · skønt · specielt · sikkert · ellers · næsten · sjovt · farligt · rigtigt · færdig

**Verden 26 "Mesterskabet" 🏆** — lange sammensatte ord:
sommerfugl · fødselsdag · jordbær · skolegård · bibliotek · sommerferie · computer ·
telefon · fodboldbane · aftensmad

**Spillet bliver 260 ord, ikke 240.** Tallet er rettet i titel, fortælling og i alle
testpakker, der havde antagelser om 24/240 (ordj_maps, ordj_monstre, ordj_data,
ordj_smoke_all, ordj_vaelgverden, ordj_integration, ordj_test2, ordj_gear, ordj_stress).

## 1c. Tredje kort-side gjort færdig: 10 nye verdener (27-36)
`[x] FÆRDIG (17. sep)` — Kenneth: *"Jeg kan godt lide den sidste verden du har lavet, men
du skal lave den som de andre. Så der er 12 forskellige."* Side C havde kun 2 verdener
mod de to andre sidens 12. Nu har ALLE TRE sider 12 verdener: **360 ord / 36 verdener /
108 missioner.** Alle tre kort er identiske i layout (samme 12 positioner i `MAP_POS` pr.
side), og `mapPageForWorld(i)` styrer uændret hvilket kort en verden hører til.

**De 10 nye verdener (tema i parentes)** — hver med 10 ord, sit eget monster og 200 nye
lydfiler i `audio/v2/`:

| Verden | Navn | Tema | Monster (kraft) |
|---|---|---|---|
| 27 | Dobbelt-bjerget 🏔️ | dobbeltkonsonanter | Tvillingen 👯 (116) |
| 28 | Stum-skoven 🌫️ | stumme bogstaver | Stilheds-ånden 👻 (122) |
| 29 | Byens gader 🏙️ | fremmedord | Trafik-trolden 🚦 (128) |
| 30 | Skole-loftet 🎒 | skole- og fagord | Klassens Spøgelse 🎓 (134) |
| 31 | Vildt-reservatet 🦌 | natur og dyr | Ulveflokken 🐺 (140) |
| 32 | Følelses-fjeldet 😌 | følelser og egenskaber | Sorgens Skygge 😢 (147) |
| 33 | Spejl-søen 🪞 | ej-/øj-lyde | Spejl-trolden 🪞 (154) |
| 34 | Samfunds-byen 🏛️ | samfunds-ord | Byens Vogter 🚓 (161) |
| 35 | Eventyr-riget 🏰 | eventyr og myteri | Troldmands-kongen 🧙 (170) |
| 36 | Drømme-tårnet 🌌 | de sværeste ord | Drømme-kejseren 🌌 (180) |

**Kraft-kurven:** den stiger uafbrudt i alle 36 verdener (testen kræver det), så den
SIDSTE verden er nu den stærkeste i spillet. Mester-dragen (110, verden 26) er stadig
den eneste drage og den eneste vej til 🏔️ ASEGÅRD — en anden og vigtigere slags
"stærkest". Det er skrevet ind i koden og i testen, så ingen af de to roller kan forsvinde.

**Sproget blev kontrolleret maskinelt:** alle 100 nye sætninger har ordet stående i
PRÆCIS sin egen form (ingen bøjning), og `tests/tools/check_saetninger.js` viser at alle
100 er rene. De 47 afvigelser rapporten viser, er ALLE gamle ord fra verden 1-26
(hund→"Hunden logrer", æble→"Æblet er rødt") — de er ikke rørt i denne omgang.

**Faldgrube fundet (og undgået):** `tests/ordj_adaptiv.js` og `tests/ordj_selv3.js`
låser hv-drillen til PRÆCIS 6 ord ("alle 6 hv-ord"). Derfor står der ingen hv-ord i de
nye lister (hvid/hval blev skiftet til fugl/kugle) — ellers ville to grønne pakker blive
røde uden at spillet var blevet dårligere. Skal hv-drillen udvides senere, skal de to
tests opdateres med vilje.

**BESLUTNING TAGET (assistenten, 17. sep): TREDJE KORT-SIDE.** Kenneth svarede ikke inden
natten, men der er kun én løsning der opfylder hans eget krav om at de to eksisterende kort
skal være **identiske i layout**: lægger man de nye verdener på akademi-kortet, holder de ikke
længere. Så verden 25 og 26 fik deres egen tredje side, bygget efter præcis samme mønster
(`renderMapPanel(elId, start, end, title)` + swipe). Nemt at vende hvis Kenneth er uenig.

## 1b. Nyt item-niveau over SECRET: ASEGÅRD 🏔️
`[x] FÆRDIG (17. sep)` — 6 items, én pr. slot, alle rigtige nordiske mytologi-genstande:
Ægishjálmr (hjelm), Mjölnir (våben), Svalin (skjold), Megingjörð (rustning), Vidars jernsko
(støvler), Draupnir (amulet). Kraft ×45-60, styrke-spænd 5 %, **lysende guld-hvidt**
(`.rarity-asgard` + `asgardGlow`) i stedet for en ny mættet farve. De 6 står som silhuetter
i skatte-tavlen fra starten, så barnet kan se hvad det jager.

**Nøglen (implementeret):** man får dem ved at **besejre de to nye verdener** — ikke fra kuben
(kuben afviser dem) og ikke fra lykkehjulet (intet hjul har et ASEGÅRD-segment). Verden 25
giver ét item (Ægishjálmr); verden 26 giver resten, ét ad gangen, altid det næste man mangler —
så det tager tid at samle alle 6. Bedrifter: "Gudernes vogter" (1 item) og "Asgårds-mester" (6).

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
- **Objekt-nøgler kan skjule en dublet.** Skrives den samme nøgle to gange i `WORDS`,
  forsvinder den første sporløst i JavaScript — antallet af ord bliver forkert, uden at
  nogen kan se det i filen. `ordj_data.js` tæller derfor både de SKREVNE nøgler og de
  unikke (260 = 260), og `ordj_filltest.js` giver et hul for hvert eneste ord.
- **Et nyt ord skal tjekkes for ledighed FØR det bruges** (er det allerede i spillet?) og
  for at dets sætning faktisk kan give et hul. `meget`/`over`-fælden kostede en usynlig
  dublet; ordet `dejligt` står i sin sætning som `dejlig`, og `blankInSentence` fandt det
  ikke før den lærte intetkøns-formen (ord uden -t).
- **Vær varsom med lister og data.** Fire gange i dag fangede testene fejl i noget JEG
  havde lavet — og det var hver gang et data-problem: en ordliste, et array, en klasse.
  Tjek indholdet før der antages noget.
- **Lydstier:** `audio/v2/words/<ord>.mp3` og `audio/v2/sentences/<ord>.mp3`.
