# «Mester-prøven» — belønning for at øve sine EGNE svage ord

Kenneth: *"Kan vi lave en speciel belønning for at lave opgaverne fra statistikken?
Så vi giver et incitament for at blive bedre."*

## 0. Det reelle problem

Et barn vælger det den er god til. Det adaptive lag skubber de svage ord ind i runderne
(`rankedWeakWords`, `buildWordList`), men barnet kan stadig spille den nemme vej: svare
hurtigt, komme videre, lade de svære ord ligge. Der er **ingen belønning** for at tage
netop de ord man er dårligst til. Det er dem der skal have en belønning — ellers vælger
barnet altid det det allerede kan.

## 1. Fælden — og hvorfor den er hele opgaven

Belønning for at ØVE svage ord kan **købes**:

> Et barn der vil have belønningen kan svare bevidst forkert på ti nemme ord, skabe ti
> svage ord på ét minut og høste belønningen i morgen.

Det er samme fejlklasse som spillet lige har haft: **en mekanik der kan vindes uden at
gøre arbejdet.** To af de tre gamle spærringer i koden (`state.wrong`, `stats.words`)
kan skabes af spilleren selv ved at svare forkert med vilje.

### Løsningen har tre spærringer, og de skal alle være der

**Spærring 1 — kun ord der var svage FØR i dag.**
Hvert ord får et `weakDay` = den dag (`YYYY-MM-DD`) det *første gang* blev registreret
svagt. Et ord kan kun komme i Mester-prøven hvis `weakDay < i dag`. Svarer barnet
bevidst forkert i dag, får ordet `weakDay = i dag` — og er dermed **udelukket hele
dagen**. Snyd koster en dag og giver intet i mellemtiden. Det gør snyd dyrere end arbejde.

**Spærring 2 — to rigtige i træk, på tværs af sessioner.**
Et ord er *erobret* når det er svaret rigtigt **2 gange i træk**, hvor de to svar er
givet i **forskellige sessioner** (`state.mester.lastSession !== cur.session`). Svarer man
rigtigt og derefter forkert (med vilje eller ej), nulstilles rækken. Man kan altså ikke
sabotere sig til hurtigere fremgang — kun langsommere.

**Spærring 3 — fremgang tælles kun på ordet, aldrig på "at have svaret".**
`mesterFremgang()` rører kun ord der er kandidater **og** som står i den aktuelle prøve.
Der gives ingen XP, ingen point og ingen tælling for selve det at svare forkert. Den
eneste vej til belønningen går gennem at svare **rigtigt** på et ord der var svagt i går.
Det er samtidig det der gør "3 af 5" til et sandt tal: det kan ikke ændre sig af noget
barnet gør uden for prøven.

## 2. Hvad prøven er

- Spillet vælger **5 ord** fra barnets egne tal (`state.stats.words`), de værste først —
  men **kun** ord hvor `weakDay < i dag` og som ikke allerede er erobret.
- Ordene står fast i én prøve (`state.mester.prove.words`). Erobret ord bliver stående
  i listen med et flueben, så barnet **ser forvandlingen**:
  `~~dejlig~~  →  ✓ dejlig — fra svag til stærk`
- Prøven vokser: **5 → 8 → 12** ord. Den slutter ikke; næste prøve er større. Det gør
  belønningen til en trappe i stedet for en enkelt gevinst.
- **Belønningen er en TROFÆ** — en ny genstandstype, kun fra Mester-prøven. Den kan
  ikke komme fra kuben, lykkehjulet, monstre eller bossen. Præcis som ASEGÅRD kun
  kommer fra boss-sejr (se `Docs/nye-verdener-og-asgard.md`): uden eksklusivitet er der
  ingen grund til at gøre det svære.

## 3. Troféer — den nye genstandstype

`TROFE_ITEMS` følger `ASGARD_ITEMS`-mønsteret slavisk (det er den form der er prøvet):

- 6 items, én pr. gear-slot, alle med et angreb (navn + ikon + kraft).
- Egen raritet `trofe` (kraft ×25, mellem secret ×22-36 og asgard ×45-60).
  **Den lægges ikke i `RARITIES`** — `RARITIES` er "det man kan rulle", og troféer kan
  man ikke rulle. `rarityOf()` lærer at kende den, så udstyr/visning virker som før.
- Kan ikke forvandles i kuben (samme spærring som mythic/secret/asgard).
- Vises som fjerde gruppe på skatte-tavlen i helteskærmen:
  `🏆 TROFÆER — kun fra Mester-prøven`.

**Hvorfor ikke loot:** loot kommer fra tilfældighed (kuben, hjulet). Troféer skal være
et *bevis*: "jeg havde 5 ord jeg var dårlig til, og nu kan jeg dem." Det er den eneste
belønning i spillet der kan fortælles som en historie om barnet selv.

## 4. Hvor prøven kan ses (den skal være SYNLIG, ikke bare findes)

| Sted | Visning |
|---|---|
| Verdenskortet (`#screen-map`) | Fast panel: `🏆 Mester-prøven — 3 af 5 svære ord erobrede` + knap der starter prøven |
| Statistik (`?screen=stats`) | Samme panel + hvert ord med `~~svag~~ → ✓ stærk` og hvor mange rigtige i træk der mangler |
| Helteskærmen | Trofé-tavlen (fjerde gruppe) |

Uden en synlig indgang er belønningen usynlig — det er præcis fejlen XP-systemet havde.

## 5. XP og Mester-prøven er ÉT system

Det er ikke to features ved siden af hinanden:

- Bjælken gør **"næsten der"** synligt: *"4 ord til niveau 5"*.
- Mester-prøven giver **grunden** til at jagte det sidste stykke: de ord man undgår,
  er dem der står mellem en og belønningen.
- Erobret ord giver **+60 XP** — altså ca. 20 rigtige svar. Det er den største enkelt-post
  i spillet, og den kan kun tjenes ved at blive bedre. At erobre et ord kan derfor give
  et level-up midt i en prøve: bjælken fyldes, level-up-overlayet fylder skærmen, og
  troféen udleveres bagefter. Én oplevelse, tre bekræftelser.

## 6. Testen der BEVISER at man ikke kan snyde

`tests/ordj_mester.js` er bygget om spørgsmålet fra reglerne: *"fanger denne test at et
barn kan vinde uden at gøre arbejdet?"* Den simulerer snydet direkte:

| Test | Hvad den beviser |
|---|---|
| **SNYD 1: "ti bevidst forkerte svar i dag giver NUL fremgang"** | Et friskt spil. Barnet svarer bevidst forkert på 10 ord i dag. Derefter må `mesterKandidater()` **ikke** indeholde ét eneste af dem, `mesterProve()` må være tom, og `state.mester.erobret` skal være tom. Det er selve beviset: snyd koster tid og giver ingenting. |
| **SNYD 2: "et ord der blev svagt i går, men saboteres i dag, bliver ikke erobret"** | Ord med `weakDay = i går` er kandidat. Så svarer barnet forkert → rækken nulstilles, og selv efter mange forsøg er `erobret` tom. Sabotage kan kun gøre det langsommere. |
| **SNYD 3: "to rigtige i SAMME session er ikke en erobring"** | Kravet "på tværs af sessioner" kan ikke omgås ved at få ordet to gange i én runde. |
| **SNYD 4: "mesterFremgang rører aldrig et ord der ikke er kandidat"** | Ingen fremgang kan skabes uden for ordet — hverken ved at svare, ved at spille mange runder eller ved at kalde funktionen direkte med et fremmed ord. |
| **DEN RIGTIGE VEJ: "to rigtige i træk på to dage erobrer ordet"** | Beviset for at systemet også VIRKER — ellers er anti-snyd-testene bare en død knap. Erobringen giver XP og fører til trofé når hele prøven er klaret. |
| **"troféen kan ikke komme fra kuben, hjulet eller bossen"** | Eksklusiviteten: `trofe` har `weight 0`, `cubeAdd` afviser den, og ingen drop-funktion peger på `TROFE_ITEMS`. |
| **"barnet ser forvandlingen"** | Kræver at visningen indeholder både en streget (svag) og en fluebenet (stærk) form af samme ord. |
| **"Mester-prøven tæller ikke som verdens-fremgang"** | En prøve må ikke kunne bruges til at "klare" en verden — så ville belønningen ikke længere betyde noget. |

Testene 1–4 er de vigtige. De er ikke "findes funktionen"-tests: de kører hele
snydescenariet igennem og kræver at det **ikke virker**.

**Beviset er kørt:** med spærring 1 og 2 fjernet (en naiv implementering) fejler testen
5 gange — `SNYD 1: ingen af dem kan komme i Mester-prøven i dag :: 10`,
`SNYD 1: prøven er tom :: ["jeg"]`, `SNYD 3: samme session tæller kun ÉN gang :: 0` m.fl.
Med spærringerne på er alle 83 grønne. Testen fanger altså netop den fejlklasse den
blev skrevet for.