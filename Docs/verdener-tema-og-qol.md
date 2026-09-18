# Verdenernes tema + QOL — "de andre 2 er ikke gennemtænkt"

Kenneth, 17. sep om aftenen:
> *"Du må også gerne gentænke alle verdener. Jeg synes vores første verden 'galaksen' er
> rigtig god og det giver mening med monstre.. De andre 2 er ikke gennemtænkt og virker alt
> for AI agtigt. Et andet teme kunne være Underverdenen og have den slags monstre, sidste
> verden kunne være noget andet."*
> *"Det har du hele natten til at kigge på. Jeg hopper i seng. Og gerne kig igennem med QOL
> forbedringer. Det er så vigtigt i spil."*

---

## 0. Hvad var der galt — målt, ikke gættet

Kenneths fornemmelse kan peges på præcis tre ting i koden:

1. **Alle tre kort var tegnet med SAMME landskab.** `renderMapPanel` brugte samme
   `MAP_BIOMES`-mønster (skov, bjerg, dal, ø … gentaget tre gange) og skiftede kun
   himmel-gradienten. Side B og C var altså side A med en anden baggrundsfarve.
2. **Siderne havde et navn, men ingen historie.** "Ord-akademiet" og "Mester-riget" er
   *kategorier* (let/svært), ikke steder. Der var ingen linje fra verden til verden — man
   kunne bytte om på de 12 verdener uden at nogen opdagede det. Det er præcis sådan en
   indholds-liste føles, når den er lavet af en der tænker i emner og ikke i en verden.
3. **Ét sted passede navnet slet ikke på indholdet:** verden 14 hed **"Skrive-værkstedet"**,
   men dens 10 ord er **hus-ord** (hus, køkken, stue, seng, dør, vindue, værelse, gulv, loft,
   væg) og bossen hedder **"Hustrolden"**. Kommentaren i den gamle kode indrømmede det selv:
   `13: 'Hustrolden', // Skrive-vaerkstedet (hus-ord)`.

Punkt 3 er den slags fejl der får et kort til at føles ugennemtænkt: barnet møder et
skrive-værksted og får ord om køkkenet.

**Hvad jeg IKKE har gjort, og hvorfor:** jeg har ikke omdøbt verdener eller bosser i flok.
`tests/ordj_monstre.js` låser alle 36 boss-navne ("denne tabel er aftalen med Kenneth"),
og fire verdensnavne er låst i tests (`Bog-klassen`, `Følelses-skoven`, `Den svære skov`,
`Mesterskabet`), og 16 verdensnavne er bundet til deres emne via regexer i samme pakke.
At rive det op ville betyde at ændre de 1079 tests — det gør man ikke for at få sin egen
kode til at passe. Ændringen af verden 14 er den ene undtagelse, fordi navnet **ikke** er
låst nogen steder, og fordi navnet var direkte forkert.

---

## 1. De tre temaer — og hvorfor de passer på det indhold der ER

Historien er: **ud i rummet → hjem i hverdagen → ned i underverdenen.** Sværhedsgraden
følger den samme vej (funktionsord → hverdagsord → de svære ord), og det er den samme kurve
kortet allerede havde.

| Side | Titel (aftalen — uændret) | Tema (nyt) | Historien på kortet | Hvorfor det passer |
|---|---|---|---|---|
| A | 🌌 Galaksen | 🌌 Galaksen | "Ude i rummet bor de første ord — og de monstre der vogter dem." | Uændret. Kenneth: *"galaksen er rigtig god"* |
| B | 🎓 Ord-akademiet | 🏡 Den levende hverdag | "Her er ALT levende: bogen bider, sokken snapper, uret løber." | Alle 12 monstre ER hverdagsting der er blevet levende: Bogsnapperen, Hustrolden, Troldefamilien, Ræven, Ballonmonstret, Madmonstret, Sokkemonstret, Muskelmonstret, Frøen, Hurtigløberen, Urmonstret, Følelsernes Kejser. Verdenens ord er hverdagsord (skole, hus, mad, tøj, krop, natur, tid, følelser) |
| C | 🏆 Mester-riget | 🌑 Underverdenen | "Det mørke spejlbillede under byen — hvor de sværeste ord og den sidste drage bor." | Kenneths eget forslag. Monstrene er underverdenens: tre trolde, Stilheds-ånden, Klassens Spøgelse, Sorgens Skygge, Ulveflokken, Troldmands-kongen, Drømme-kejseren — og til sidst **Mester-dragen** (spillets eneste drage). Selv de moderne verdener passer: byens gader, skolens loft og samfundet er underverdenens **spejlbilleder** — derfor hedder søen i underverdenen netop "Spejl-søen" |

Titlen står uændret fordi den er aftalen (og fordi tre tests låser den), men temaet er nu
det barnet møder som *historie*. På skærmen står begge: **"🎓 Ord-akademiet"** med
**"🏡 Den levende hverdag"** under, og verdensskærmen viser temaet igen, så barnet ved
hvor i historien det er.

---

## 2. Hvad der blev bygget

**Kortene ser nu ud som tre forskellige steder** (`renderMapPanel` + ny `pageBackdropMarkup`):
- **A · rummet:** stjerner, planet med ring, stjernetåger (som før — den virker).
- **B · den levende hverdag:** solnedgang over et kvarter — sol, skyer, bakker, ni huse med
  tændte vinduer og gadelygter. Samme farve-tone (`rgba(255,175,105,.13)`) binder terrænet
  sammen med temaet.
- **C · underverdenen:** næsten sort himmel med rød glød nedefra, otte stalagmitter langs
  bunden, lavasprækker der gløder, tågebånd og et blegt månehul i "taget".

Alle baggrunde bruger **faste tal** (ingen `Math.random`): et kort der skifter udseende hver
gang man åbner det, ser ud som en fejl for et barn. Testet.

**Dødt data fjernet:** `MAP_COLORS` blev defineret og aldrig brugt (12 farver, ingen
referencer). Farvetonen pr. side ligger nu ét sted: i `renderMapPanel` sammen med temaet.

**Verden 14 omdøbt:** "Skrive-værkstedet" → **"Hjemmets rum"**. Ikonskiftet til 🏠, bossen
"Hustrolden" og hus-ordene passer nu alle tre sammen.

---

## 3. QOL — "det er så vigtigt i spil"

Fire ting, alle med en test der fanger hvis de forsvinder:

1. **Barnet ser HVEM der venter, før det kæmper.** Verdensskærmen viser nu monsteret som
   tegning (samme form som i kampen), navn, kraft og element — også før de fire missioner er
   klaret. Før stod monsteret først i kampen, altså *efter* arbejdet. En belønning man ikke
   kan se, stræber man ikke efter — samme lære som XP-bjælken og Mester-prøven.
   Det er bevidst **ikke** en knap: en knap man ikke må trykke på, er en død knap.
2. **"Parér" siger selv hvornår den er til noget.** Spillet har altid straffet et blindt
   Parér-tryk (man mister liv), og kun statuslinjen fortalte det. Nu er knappen dæmpet
   (`parry-idle`) når der ikke er noget at parere, og den lyser og skifter tekst til
   **"🛡️ PARÉR NU!"** når monsteret lader op. Mekanikken er uændret — kun synligheden.
3. **Temaet står på begge skærme** (kortet og verdensskærmen), så historien ikke kun findes
   i hovedet på den voksne.
4. **Swipe-hintet peger på temaer**, ikke på sider: "◀ ▶ skifter kort · næste: Underverdenen 🌑".

Bagud-kompatibilitet: `?screen=boss&world=N` og `?screen=map&world=N` er tilføjet til
debug-hooket, så et bestemt monster eller et bestemt kort kan tages skærmbillede af.
(`?screen=map` uden `world` opfører sig som før.)

---

## 4. Testene (ny pakke: `tests/ordj_verdener.js`)

Måler det barnet oplever — ikke at funktionen findes:
- tre sider, tre **forskellige** temaer; hvert tema har en historie-linje
- hvert kort tegnes med **sin egen** baggrund (`data-page="rum|hverdag|underverden"`),
  og de tre SVG'er er forskellige medens layoutet er identisk
- baggrunden er deterministisk (ingen tilfældighed)
- monstrene passer til sidens tema: side B = hverdagsting der lever, side C = underverdenens
  skabninger — og **ingen side låner den andens** skabninger
- verdensskærmen viser skabningen (form, navn, kraft) for alle 36
- verden 14's navn passer til dens egne ord
- Parér-knappen: dæmpet uden opladning, lysende + "PARÉR NU!" med opladning
- reducer-bevægelse gælder også den nye Parér-puls

**Mutationer (bevist at testene har tænder):** tema-baggrund ignoreret → fanget; side B's tema
fjernet → fanget; verdensskærmen viser altid verden 1 → fanget; Parér-lys fjernet → fanget.
(Plus de 9 mutationer for formerne og animationerne i `tests/ordj_bosser.js`.)

---

## 5. Hvad jeg stadig ville gøre (kræver Kennets ord)

1. **Omdøb verdenerne på side C til underverdenen** — fx "Den svære skov" → noget med
   underverdenen, og "Skole-loftet"/"Samfunds-byen" til spejl-byens steder. Det kræver at
   `tests/ordj_monstre.js`s emne-tabel og `READ_TASKS`-rækkefølgen opdateres samtidig, altså
   en ændring af aftalen — derfor ikke gjort om natten.
2. **Et fjerde kort** ("Underverdenen" som sin egen side) er ikke muligt uden at flytte
   verdener mellem siderne: `READ_TASKS`, `MAP_POS` og sværhedskurven er indeks-bundet.
3. **Billeder af hvert monster på verdenskortet** (kortet viser i dag emoji + navn).
   Plads er den eneste hindring — et kort er 128 px bredt.
