# Bosser og animationer — "det dyr barnet ser, er det dyr det kæmper mod"

Kenneth: *"De forskellige bosser ligner hinanden og stemmer ikke overens med det vi
snakkede om for nogle dage siden."*
Kenneth: *"Du ved at billede i verden 1 afspejler et dyr, det dyr skal også være bossen
man kæmper mod."*
Kenneth: *"Hvad med animationer, kan man lave noget med de hopper frem og at der sker lidt?"*

Dette dokument er skrevet **før** koden blev ændret. Det er aftalen — ikke en efterrationalisering.

---

## 0. De to fejl, verificeret i koden

**FEJL 1 — alle 36 bosser var den SAMME tegning.**
`function dragonSvgMarkup(c1, c2)` (index.html linje 4272) tegnede alle 36 bosser.
Kun `c1`/`c2` skiftede. `BOSSES` havde en `emoji` pr. boss, men den blev **kun brugt som
label** — kampen kaldte `dragonSvgMarkup(dragon.c1, dragon.c2)`. Derfor 36 farvekombinationer
af den samme drage. Kenneths klage er bogstaveligt talt sand: de ligner hinanden, fordi de ER
hinanden.

**FEJL 2 — 28 af 36 verdener viste et andet dyr end bossen.**
Målt ved at sammenligne `WORLDS[i].emoji` med `BOSSES[i].emoji` for alle 36:

| | |
|---|---|
| verden 1 viser | 🦖 dinosaur, men bossen er "Slimklumpen" 🫧 |
| verden 3 viser | 🐼 panda, men bossen er "Ekko-uglen" 🦉 |
| verden 21 viser | 🌳 træ, men bossen er "Frøen" 🐸 |
| … | i alt **28 af 36** |
| i orden i dag | 13, 18, 20, 22, 23, 25, 33, 36 (8 stk. — men se nedenfor) |

Et barn på 7 bygger sin forventning på **billedet**. Det billede må ikke lyve.

### To låste ting, som designet skal respektere

1. **`tests/ordj_monstre.js` låser alle 36 boss-navne** i sin `VENTET`-tabel
   ("Denne tabel er aftalen med Kenneth"). **Ingen boss må hedde noget nyt.**
2. Samme pakke kræver at **alle 36 boss-emoji er unikke** (`new Set(...).size === 36`).
   Derfor kan to verdener ikke vise samme ikon — heller ikke to trolde.

Regel 3 i opgaven forbyder at svække de 1079 eksisterende tests. Derfor er begge låse
behandlet som fakta i designet herunder, ikke som noget der skulle fjernes.

---

## 1. Reglen

> **Det ikon barnet ser på verdenskortet SKAL være den skabning det møder i kampen.**

Konkret, i kode: `WORLDS[i].emoji === BOSSES[i].emoji` for alle 36, og bossens tegning
kommer fra `BOSSES[i].form` — ikke fra en fælles funktion med to farver.

Konsekvens for ikonerne: nogle steder retter vi **verdenens ikon** (den var tilfældig),
andre steder retter vi **bossens skabning** (navnet var intetsigende). Begrundelsen pr. par
står i tabellen nedenfor. Tre principper har styret valget:

1. **Navnet er aftalen.** "Ekko-uglen" i Lyd-dalen er et godt navn med et godt tema
   (lyd → ekko). Vi smider ikke et godt navn væk for at redde et tilfældigt panda-ikon.
   Her retter vi ikonet til 🦉.
2. **Ikke-skabninger skal skiftes ud.** 📚 ✏️ 🏆 🏔️ 🌫️ 🏙️ 🎒 🏛️ 🏰 ⚽ 💖 😌 🐾 👕 er
   bogstaver, ting eller begreber — ikke noget man møder som monster. Der bliver verdenens
   ikon skabningens ikon.
3. **Undtagelsen: objekt-monstret.** Hvor bossens navn *er* tingen (Bogsnapperen,
   Urmonstret, Madmonstret, Sokkemonstret, Ballonmonstret, Hustrolden, Klokketrolden,
   Spejl-trolden, Trafik-trolden), er tingen monsterets KROP. Så er 📚 🍎 ⏰ 🧦 🎈 det
   rigtige ikon: barnet ser en levende bog på kortet og kæmper mod en bog med tænder.
   Det er ikke en undtagelse fra reglen — det er reglen, tegnet rigtigt.

---

## 2. Tabellen — alle 36 valg

Kolonne **"Valg"** = hvad der blev ændret: `BOSS` (bossens skabning), `IKON` (verdenens
ikon) eller `—` (var i forvejen rigtigt). Kolonne **Familie** er skabnings-familien fra §3.

### Side A — Galaksen (0–11)

| # | Verden | Ikon før | Boss (navn låst) | Boss-ikon før | Valg | Skabning efter | Familie |
|---|---|---|---|---|---|---|---|
| 1 | Start-planeten | 🦖 | Slimklumpen | 🫧 | **BOSS** | Slim-dinosaur 🦖 | Krybdyr |
| 2 | Ord-bjergene | 🦊 | Bjergtrolden | 🪨 | **IKON** | Bjergtrold 🧌 | Trold |
| 3 | Lyd-dalen | 🐼 | Ekko-uglen | 🦉 | **IKON** | Ekko-ugle 🦉 | Fugl |
| 4 | Sætnings-skoven | 🐸 | Skovtrolden | 🌳 | **IKON** | Træ-trold 🌳 | Trold |
| 5 | Gåde-øen | 🦁 | Gåde-kraken | 🐙 | **IKON** | Gåde-kraken 🐙 | Vand |
| 6 | Fart-floden | 🐯 | Strømhesten | 🐎 | **IKON** | Strømhest 🐎 | Pattedyr |
| 7 | Hemmelige-hulen | 🐨 | Huleflagermusen | 🦇 | **IKON** | Huleflagermus 🦇 | Fugl (luft) |
| 8 | Tids-tårnet | 🦄 | Klokketrolden | 🕰️ | **IKON** | Klokke-trold 🔔 | Trold/objekt |
| 9 | Stjernemarken | 🐲 | Stjernevogteren | ⭐ | **BOSS+IKON** | Bjørn 🐻 | Pattedyr |
| 10 | Måne-byen | 🤖 | Månemanden | 🌜 | **IKON** | Månemanden 🌝 | Ånd/magisk |
| 11 | Raket-havet | 👾 | Raketkraken | 🚀 | **IKON** | Raket-blæksprutte 🦑 | Vand |
| 12 | Galaksens kerne | 🚀 | Galakse-kejseren | 🌀 | **IKON** | Alien-kejser 👾 | Alien/robot |

**Begrundelser, side A**

1. **BOSS.** Verden 1 viser en dinosaur; bossen hed 🫧 "Slimklumpen" og var en boble.
   Navnet er låst (VENTET-tabellen), men namet passer stadig: skabningen er en
   **dinosaurbygget af slim** (c1/c2 er slime-grøn `#6ee7b7`/`#059669`). Barnet ser 🦖 på
   kortet og møder en dryppende dinosaurus med haler og pigge. Ikke en boble.
2. **IKON.** "Bjergtrolden" rummer verdensnavnet ("bjergene"). En ræv på Ord-bjergene var
   tilfældig. Trolden bliver, ikonet bliver 🧌.
3. **IKON.** Aftalen fra Kenneth selv: navnet "Ekko-uglen" er godt og passer til lyd-temaet
   (uglens huu er et ekko). **Verdenens ikon rettes til 🦉** — pandaen har intet med lyd at gøre.
4. **IKON.** "Skovtrolden" hører til i en skov. Bossens gamle ikon var 🌳 (et træ) — og et
   **træ-trolde** (en trold der ER et træ, med rødder til ben og løv som hår) er en stærkere
   historie end endnu en 🧌, som allerede er brugt i verden 2 og må være unik. Verdenens ikon
   bliver 🌳. (Verden 21 mister derfor sit 🌳 — se #21, hvor frøen overtager.)
5. **IKON.** En kraken hører til ved en ø. Løven var tilfældig. Gåde-kraken beholder navnet
   (gåde = den stiller gåder med sine arme) og får 🐙.
6. **IKON.** Fart-floden + "Strømhesten" er en vandhest (i dansk folketro: nøkken, der
   lokker i vandet) — en meget bedre historie end en tiger. Verdens ikon bliver 🐎.
7. **IKON.** Hemmelige-hulen med en huleflagermus er præcis hvad stedet lover. Koalaen var
   tilfældig. Ikonet bliver 🦇.
8. **IKON.** Tids-tårnet + "Klokketrolden": en trold der ER en klokke i tårnet — tårnet
   har en klokke, verdensordet "klokken" står i ordlisten. Ikonet bliver 🔔. (Ikke 🕰️,
   fordi verden 23 allerede har ⏰ — to urskiver til et barn er for ens, og "klokke" betyder
   klokke.)
9. **BOSS + IKON.** Her er både ikonet 🐲 (en **drage**) og bossens ⭐ (en **stjerne**)
   forkerte: der må kun være én drage i spillet (Mester-dragen), og en stjerne er ikke en
   skabning. Valget: navnet "Stjernevogteren" beholdes og bliver en **bjørn** 🐻 — den
   vogter stjernerne, og **Store Bjørn** (Karlsvognen) ER et stjernelignende dyr på himlen.
   Ikonet 🐲 frigives dermed til verden 26, hvor dragen hører til.
10. **IKON.** "Månemanden" findes virkelig: han er et **ansigt på månen**. Ikonet bliver 🌝
    (måneansigt) — samme skabning på kortet og i kampen. Robotten 🤖 var et gæt.
11. **IKON.** "Raketkraken" havde 🚀 (en raket, ikke en skabning) og verden viste 👾.
    Ikonet bliver 🦑 — **blæksprutte**, ikke 🐙, fordi verden 5 allerede har 🐙 og fordi en
    blæksprutte med raketdyser ser anderledes ud end en kraken (finner og 6 arme mod 8 arme).
12. **IKON.** Galaksens kerne viste 🚀 og bossen 🌀 (en spiral). Ingen af dem er en skabning.
    "Galakse-kejseren" bliver en **alien-kejser** 👾 — 👾 er nu ledig, fordi Raket-havet
    (11) fik 🦑.

### Side B — Ord-akademiet (12–23)

> **OPDATERET 18. sep:** siden hedder nu **🌲 Den forbudte skov**, og 5 af monstrene er nye
> skovvæsner (Spindelvæveren, Vildsvinet, Natsværmeren, Mangeøjet, Skyggeløberen) sammen med
> 7 nye steds-navne. Tabellen nedenfor er den første beslutning (ikon-reglen og begrundelsen
> for ikonerne gælder stadig); den nye beslutning står i **Docs/den-forbudte-skov.md**.

| # | Verden | Ikon før | Boss (navn låst) | Boss-ikon før | Valg | Skabning efter | Familie |
|---|---|---|---|---|---|---|---|
| 13 | Bog-klassen | 📚 | Bogsnapperen | 📚 | — | Bog-monster 📚 | Objekt |
| 14 | Skrive-værkstedet → *nu "Hjemmets rum"* | ✏️ | Hustrolden | 🏠 | **IKON** | Hus-trold 🏠 | Objekt/trold |
| 15 | Familiens hus | 🏠 | Troldefamilien | 👪 | **IKON** | Troldefamilie 👪 | Trold |
| 16 | Dyre-parken | 🐾 | Ræven | 🦊 | **IKON** | Ræv 🦊 | Pattedyr |
| 17 | Lege-pladsen | ⚽ | Ballonmonstret | 🎈 | **IKON** | Ballon-monster 🎈 | Objekt |
| 18 | Mad-markedet | 🍎 | Madmonstret | 🍎 | — | Mad-monster 🍎 | Objekt |
| 19 | Tøj-kammeret | 👕 | Sokkemonstret | 🧦 | **IKON** | Sokke-monster 🧦 | Objekt |
| 20 | Krop-værkstedet | 💪 | Muskelmonstret | 💪 | — | Muskel-monster 💪 | Kæmpe |
| 21 | Natur-haven | 🌳 | Frøen | 🐸 | **IKON** | Frø 🐸 | Krybdyr |
| 22 | Handle-hallen | 🏃 | Hurtigløberen | 🏃 | — | Løber 🏃 | Menneske |
| 23 | Tids-uret | ⏰ | Urmonstret | ⏰ | — | Ur-monster ⏰ | Objekt |

**Begrundelser, side B**

13. **—.** 📚 er ikke et dyr, men bossen **er** bogen: "Bogsnapperen" er en levende bog med
    tænder og øjne. Ikon og boss er samme skabning i dag — vi rører den ikke, men den får
    sin egen FORM (en bog, ikke en drage).
14. **IKON.** Verden 14 handler om **hus-ord** ("hus, køkken, stue, seng, dør, vindue…").
    "Hustrolden" er en trold der ER et hus (skorstenhat, vindue som mave). Ikonet bliver
    🏠 — som samtidig fortæller barnet hvad verdens ord handler om. Blyanten ✏️ sagde intet.
15. **IKON.** "Troldefamilien" er tre trolde i flok — bossens 👪 er den rigtige skabning
    (en familie). Verdenens 🏠 (som nu hører til verden 14) flyttes til 👪. Formen tegnes som
    **tre** figurer, så den ikke kan forveksles med en enkelt trold.
16. **IKON.** En dyrepark med poter 🐾 og en boss "Ræven" 🦊: barnet skal ikke gætte om det
    er en elefant. Ikonet bliver 🦊 — det konkrete dyr, ikke et spor.
17. **IKON.** Lege-pladsen havde en fodbold ⚽. En bold er ikke en skabning; "Ballonmonstret"
    er. Ikonet bliver 🎈.
18. **—.** Mad-markedet og "Madmonstret" 🍎 er samme skabning allerede (æble med tænder).
19. **IKON.** Tøj-kammeret med 👕 og bossen "Sokkemonstret" 🧦 — begge er tøj, men kun det
    ene er skabningen. Ikonet bliver 🧦.
20. **—.** 💪 er monsterets egen krop (Muskelmonstret er arme og lidt hoved). Rigtigt i dag.
21. **IKON.** Natur-haven får 🐸 ("Frøen") — der bor frøer i en have, og verdenens ord er
    naturord. 🌳 flytter til verden 4, hvor træet er skabningen.
22. **—.** 🏃 viser præcis skabningen (Hurtigløberen).
23. **—.** ⏰ er monsterets egen krop (Urmonstret er et vækkeur med ben).

### Side C — Mester-riget (24–35)

| # | Verden | Ikon før | Boss (navn låst) | Boss-ikon før | Valg | Skabning efter | Familie |
|---|---|---|---|---|---|---|---|
| 24 | Følelses-skoven | 💖 | Følelsernes Kejser | 😊 | **IKON** | Følelses-kejser 😊 | Menneske/magisk |
| 25 | Den svære skov | 🌲 | Stavelses-trolden | 🌲 | **IKON** | Stavelses-trold 👹 | Trold |
| 26 | Mesterskabet | 🏆 | Mester-dragen | 🐉 | **IKON** | Drage 🐉 (den ENESTE) | Drage |
| 27 | Dobbelt-bjerget | 🏔️ | Tvillingen | 👯 | **IKON** | Tvilling 👯 (to figurer) | Menneske |
| 28 | Stum-skoven | 🌫️ | Stilheds-ånden | 👻 | **IKON** | Stilheds-ånd 🫥 | Ånd |
| 29 | Byens gader | 🏙️ | Trafik-trolden | 🚦 | **IKON** | Trafiklys-monster 🚦 | Objekt/maskine |
| 30 | Skole-loftet | 🎒 | Klassens Spøgelse | 🎓 | **IKON** | Klassespøgelse 👻 | Ånd |
| 31 | Vildt-reservatet | 🦌 | Ulveflokken | 🐺 | **IKON** | Ulveflok 🐺 | Pattedyr |
| 32 | Følelses-fjeldet | 😌 | Sorgens Skygge | 😢 | **IKON** | Sorgens skygge 😢 | Ånd |
| 33 | Spejl-søen | 🪞 | Spejl-trolden | 🪞 | — | Spejl-trold 🪞 | Trold/objekt |
| 34 | Samfunds-byen | 🏛️ | Byens Vogter | 🚓 | **IKON** | Vogter-robot 🚓 | Robot |
| 35 | Eventyr-riget | 🏰 | Troldmands-kongen | 🧙 | **IKON** | Troldmands-konge 🧙 | Menneske/magisk |
| 36 | Drømme-tårnet | 🌌 | Drømme-kejseren | 🌌 | — | Drømme-kejser 🌌 | Ånd/kosmisk |

**Begrundelser, side C**

24. **IKON.** Følelses-skoven havde 💖 (et hjerte, ikke en skabning). "Følelsernes Kejser"
    bærer ansigtet — ikonet bliver 😊, og formen tegnes som en kejser med **flere ansigter**
    (glad/vred/trist), så den ikke kan forveksles med Sorgens Skygge (#32).
25. **IKON.** "Stavelses-trolden" havde 🌲 (et træ) og verdenen 🌲. Et træ er ikke en trold.
    Ikonet bliver 👹 — den STORE trold (verden 25 er nummer to i sværhedsgrad og har kraft 95),
    og den er ledig, fordi 🧌 er brugt i verden 2 og alle emoji skal være unikke.
26. **IKON.** Verdens ikon bliver 🐉, bossens eget. Begrundelse: verden hedder **Mesterskabet**
    — det er her mesterskabet står, og mesteren er dragen. Dragen er den eneste drage i
    spillet (testet), og trofæ-temaet bæres videre i formen: den holder et **guld-trofæ** og
    har mesterskabs-bælte. 🏆 flyttede over i selve skabningen i stedet for at være verdens ikon.
27. **IKON.** Dobbelt-bjerget handler om dobbeltkonsonanter — alt kommer i par. "Tvillingen"
    👯 ér parret. Ikonet bliver 👯 og formen skal være **to** identiske figurer (ikke én).
28. **IKON.** Stum-skoven handler om bogstaver der ikke siges. "Stilheds-ånden" viser det i
    navnet, og 👻 er nødvendig for spøgelset i verden 30. Derfor 🫥 — "den der er der, men
    hverken ses eller høres". Formen er en diset skikkelse uden mund.
29. **IKON.** Byens gader med 🏙️. "Trafik-trolden" er et levende trafiklys (dets krop ER
    skiltet) — ikonet bliver 🚦, og barnet kæmper mod netop det lys det ser.
30. **IKON.** Skole-loftet havde 🎒 og bossen en studenterhue 🎓 (en HUE, ikke en skabning).
    "Klassens Spøgelse" er skabningen: ikonet bliver 👻, og formen er et spøgelse med
    studenterhue og tavle-mave, så det er til at skelne fra Stilheds-ånden (#28).
31. **IKON.** Vildt-reservatet havde 🦌, bossen er "Ulveflokken" 🐺. En flok er ikke et rådyr.
    Ikonet bliver 🐺, og formen tegnes som **to** ulve (en flok, ikke ét dyr).
32. **IKON.** Følelses-fjeldet havde 😌, bossen 😢 "Sorgens Skygge". 😢 bliver ikonet: barnet
    ser den triste skikkelse det skal møde. Formen er en hængende skygge med tårer.
33. **—.** Spejl-søen og "Spejl-trolden" har samme ikon i dag — men trolden blev TEGNET som
    en drage. Den bliver nu en trold hvis mave er et spejl (og som spejler sig i navnet).
34. **IKON.** Samfunds-byen havde 🏛️, bossen 🚓 "Byens Vogter". Vogteren er en
    **maskine/robot** (politibil-krop med lys og arme), så ikonet bliver 🚓.
35. **IKON.** Eventyr-riget havde 🏰, bossen 🧙 "Troldmands-kongen". Slottet er kulissen, ikke
    skurken. Ikonet bliver 🧙.
36. **—.** Drømme-tårnet og "Drømme-kejseren" har 🌌 i dag, og det er rigtigt: kejseren er
    bygget AF stjernetågen — samme materiale som barnet ser på kortet. Formen tegnes som en
    kosmisk skikkelse med krone af stjerner.

**Resultat:** 29 verdener rettet — 28 hvor **verdenens ikon** flyttes til skabningen,
1 hvor **bossens skabning** skiftes (verden 1, fordi ikonet 🦖 er det gode) og 1 hvor
begge (verden 9). 7 var i forvejen rigtige (13, 18, 20, 22, 23, 33, 36). Efter ændringen gælder
`WORLDS[i].emoji === BOSSES[i].emoji` for alle 36 — og ingen boss-navn er ændret.

---

## 3. Skabningerne — former, ikke farver

Farverne (`c1`/`c2`) er fine og bevares pr. boss. Men et barn på 7 læser **formen** først.
Derfor tegnes hver boss ud fra `BOSSES[i].form` — en form-funktion, ikke en farve.

**Ikke 36 unikke tegninger fra bunden** — men 36 former fordelt på **10 familier**, hvor
formen inden for familien er synligt forskellig (det er kravet: to bosser må aldrig kunne
forveksles, heller ikke i samme familie).

| Familie | Bosser | Form-forskelle inden for familien |
|---|---|---|
| **Pattedyr** | 6 Strømhesten, 9 Stjernevogteren, 16 Ræven, 31 Ulveflokken | hest (lang manke, hove) · bjørn (rund krop, små ører, stjerner) · ræv (spids snude, stor hale) · **to** ulve (flok) |
| **Fugl/luft** | 3 Ekko-uglen, 7 Huleflagermusen | uglen (rund krop, kæmpe øjne, **ekko-ringe**) · flagermus (spredte vinger, ører, hænger ned) |
| **Krybdyr/kæmpe/amfibie** | 1 Slimklumpen, 20 Muskelmonstret, 21 Frøen | **dinosaur** (hale, pigge, dryppende slim) · kæmpe (kæmpe arme, lille hoved) · frø (bred mund, **tunge**, lange ben) |
| **Vand** | 5 Gåde-kraken, 11 Raketkraken | kraken (**otte** arme, kuppel-hoved, spørgsmålstegn) · blæksprutte (**seks** arme, finner, raketdyser) |
| **Trold** | 2 Bjergtrolden, 4 Skovtrolden, 15 Troldefamilien, 25 Stavelses-trolden, 33 Spejl-trolden | bjergtrold (klippe-skuldre, stenkølle) · træ-trold (rødder, løv) · troldefamilie (**tre** figurer) · stavelsestrold (bogstav-klodser, stor) · spejltrold (spejl-mave, glans) |
| **Ånd/spøgelse/skygge/drøm** | 10 Månemanden, 28 Stilheds-ånden, 30 Klassens Spøgelse, 32 Sorgens Skygge, 36 Drømme-kejseren | måneansigt (kratere) · diset ånd (**ingen mund**) · spøgelse (hue + tavle-mave) · skygge (hængende, tårer) · kosmisk kejser (stjerne-krone, tåge-krop) |
| **Objekt-monster** | 8 Klokketrolden, 13 Bogsnapperen, 14 Hustrolden, 17 Ballonmonstret, 18 Madmonstret, 19 Sokkemonstret, 23 Urmonstret | klokke (hammer+pendul) · bog (opslået bog med tænder) · hus (skorstenhat, vindue-mave) · ballon (knude-ører, snor-ben) · mad (æblebid, tand) · sok (stribet, knap-øje) · ur (vækkeur med ringeklokker, viser-ben) |
| **Robot/maskine/alien** | 12 Galakse-kejseren, 29 Trafik-trolden, 34 Byens Vogter | alien (tre øjne, antenner, kejserkappe) · trafiklys (rød/gul/grøn krop) · vogter (bil-krop, blink-lys, arme) |
| **Menneske/magisk** | 22 Hurtigløberen, 24 Følelsernes Kejser, 27 Tvillingen, 35 Troldmands-kongen | løber (løbeben, fart-striber) · følelseskejser (**tre** ansigter) · tvilling (**to** ens figurer) · troldmand (spids hat, langt skæg, stav) |
| **Drage** | 26 Mester-dragen | den eneste: vinger, horn, ild — og et **guld-trofæ** (Mesterskabet) |

Tekniske krav til tegningerne:
- Ren SVG, ingen eksterne filer (spillet er én fil + `audio/`).
- Samme `viewBox="0 0 220 190"` som den gamle drage, så layoutet i kamp-boksen ikke rykker.
- Enkle former: 6–16 elementer pr. skabning. Det skal kunne ses på en iPad i en kamp-boks,
  ikke bedømmes på en 4K-skærm.
- Mester-dragen er den **eneste** med vinger/horn/ild (testet).

---

## 4. Animationerne — "de hopper frem, og der sker lidt"

Udgangspunktet (verificeret): helten havde `attack-1/2/3` (springer frem mod monsteret),
monsteret havde `counter` (stikker frem), ramte figurer fik `recoil` + `hit-flash`,
`shakeScreen()` fandtes, og `charge-warn` blinkede i UI'et — men **monsteret selv** viste
ikke at det ladede op.

| Handling | Før | Efter |
|---|---|---|
| **Monsteret angriber** | `dragonCounter`: gled 42 px ind og tilbage (et "stik") | `@keyframes dragonCounter` er skrevet om til et **spring**: tilløb (16 px væk + synker sammen), **spring** (56 px frem og op i luften), **landsætning** (squash). Navnet og klassen `counter` er beholdt, fordi både koden og den eksisterende test `ordj_bevaegelse.js` kender kontrakten. Oveni findes `monsterLeap()`/`monsterLeapBig()` til de store spring |
| **Helten angriber** | `heroLunge(1-3)`: fremad på jorden | `heroLunge()` udbygget: hop med **bue** (op i luften midt i springet) og en **støvsky** ved afsæt |
| **Ramte figurer** | `recoil` (helt) + `hit-flash` | begge veje: monsteret får `knockback` (kastes baglæns + roterer let), helten får `recoil`. Begge blinker i rammer-farven (`flashHit`) |
| **Opladnings-advarslen** | kun teksten i toppen blinkede | monsteret får klassen `charging`: **vokser** (1 → 1.12, pulserende), **gløder** (drop-shadow i elementfarven) og der lægges en **pulserende ring på gulvet** under det. Klassen sættes i `renderChargeWarn()` og fjernes i samme sekund opladningen forsvinder (parade/slag) |
| **Arenaen ryster** | hele skærmen rystede | som før, **plus** `arenaQuake()` der ryster selve `.boss-arena` ved store slag (signaturangreb, kritisk hit, opladet slag) — bevægelsen sker der hvor slaget er |
| **`prefers-reduced-motion`** | blev ignoreret | CSS: `@media (prefers-reduced-motion: reduce)` slår alle kamp-animationer og rystelser fra og gør overgange øjeblikkelige. JS: `reducedMotion()` læses defensivt (`typeof matchMedia`), og **støv, gnister, ryst og flash** springes over. Spillet skal kunne spilles af et barn der bliver dårligt af bevægelse |

Alt i CSS og ren JS. Ingen biblioteker. Alle nye DOM-kald er defensive
(`if (el && el.classList && typeof el.classList.toggle === "function")`), fordi test-harnesset
bruger stubs uden fuld DOM.

---

## 5. Testene — de skal fange det barnet oplever

Lærepenge fra projektets dyreste fejl (en test der krævede at alle opgaver var bygget ens):
**en test skal beskytte FORMÅLET, ikke FORMEN.** Derfor testes ikke "findes funktionen?" men
"kan barnet se forskel?":

1. **Ingen to bosser tegnes ens.** Markup for hver boss normaliseres (alle farver, id'er,
   tal og mellemrum fjernes) og hashes. 36 forskellige hashes = ingen kan forveksles.
   Farverne må ikke indgå → netop fejlen "kun farven skifter" fanges.
2. **Hver verdens ikon og dens boss er samme skabning.** `WORLDS[i].emoji === BOSSES[i].emoji`
   for alle 36, **og** verdenskortets DOM (den rigtige render-funktion) viser samme emoji
   som kampen tegner. Det fanger hvis nogen senere ændrer den ene uden den anden.
3. **En boss kan kendes uden farve.** To bosser fra samme familie (fx de to kraker, de to
   ånder) skal have forskellig form-signatur (antal og slags elementer) — ikke kun farve.
4. **Kun én drage.** Kun Mester-dragen har vinger/horn/ild.
5. **prefers-reduced-motion respekteres.** CSS'en skal have sin media-query, og med
   `matchMedia` stub'et til `matches: true` skal JS'en ikke sætte ryst-/glimt-klasser.
6. **Animationerne sker.** `monsterLeap()` sætter spring-klassen på monsteret,
   `renderChargeWarn()` sætter `charging` når der lades op og fjerner den igen,
   `shakeScreen("big")` ryster arenaen, og heltens angreb sætter hop-klassen.

Hver test efterprøves med en **mutation** (ændringen laves bevidst i koden og testen SKAL
fejle), så vi ved den har tænder.

---

## 6. Sådan blev det bygget (skrevet efter koden)

**Kode (`index.html`)**
- `BOSSES` har fået et `form`-felt pr. boss (36 forskellige form-navne) og bossens `emoji`
  er nu skabningens emoji. **Ingen boss har fået nyt navn.**
- `WORLDS[i].emoji` er sat lig `BOSSES[i].emoji` for alle 36 (én kilde til sandheden).
- `MONSTER_FORMS` (36 form-funktioner) + `MONSTER_FAMILIES` (10 familier) erstatter
  `dragonSvgMarkup(c1,c2)`. Farverne `c1`/`c2` er uændrede og bruges som gradient.
  Hver tegning har `data-form` og `aria-label`, så både en skærmlæser og en test kan se
  hvilken skabning der er tegnet.
- `monsterSvgMarkup(worldIdx)` tegner ud fra VERDENEN. `dragonSvgMarkup(c1,c2)` findes
  stadig som tynd bagud-kompatibel skal (tegner verden 1's skabning med de givne farver).
- Kamp-knappen på verdens-skærmen viser nu **skabningens eget ikon** i stedet for 🐉.
- `monsterLeap()`, `monsterKnockback()`, `arenaQuake()`, `dustPuff()`, `reducedMotion()`
  + `renderChargeWarn()` sætter `charging` på monsteret. `@keyframes dragonCounter` er
  skrevet om til et spring (kontrakten `counter` er bevaret, se §4).
- QA-krog: `?screen=boss&world=N` viser en bestemt verdens skabning (til skærmbilleder).

**Test (`tests/ordj_bosser.js`, ny pakke — 47 kontroller)**
Dækker præcis de fire ting Kenneth kan se: at ingen to skabninger tegnes ens (630 par,
sammenlignet uden farve), at verdenskortet/skærmen/kampen viser samme skabning (alle 36,
målt på den rigtige render-funktion), at kun Mester-dragen er en drage, og at spring,
rekyl, opladning, rysten og `prefers-reduced-motion` virker.

**Mutations-bevis** (hver mutation blev lagt ind, testen skulle fejle, og koden blev
rullet tilbage — alle 8 blev fanget):

| Mutation | Fangede |
|---|---|
| former ignoreres (alle tegnes som dinosaur = den oprindelige fejl) | "ingen boss falder tilbage…" |
| to trolde tegnes ens (`troldSkov` = `troldBjerg`) | "ingen to bosser tegnes ens UDEN farve :: 2=4" |
| verdens ikon ændres til noget andet end bossen | "verdens ikon og bossens ikon er den SAMME" |
| kampen tegner altid verden 1 | "kampen tegner præcis den skabning barnet så" |
| springet fjernes fra `monsterLeap()` | "monsteret SPRINGER frem" |
| `charging` fjernes fra `renderChargeWarn()` | "opladnings-advarslen vises PÅ monsteret" |
| `dustPuff()` ignorerer `reducedMotion()` | "reducer bevægelse: INTET støv i DOMen" |
| kamp-knappen viser 🐉 igen | "kamp-knappen viser skabningens ikon + navn" |
