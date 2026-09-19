# Kortere missioner (5 opgaver) og krav om rigtigt svar

Kenneth, 18. september 2026, efter at have set Robin spille:

> *"Robin sidder bare og svarer fejl for hurtigere at komme til bossen. Jeg skal tror vi skal
> have lavet lidt ændringer. I stedet for 10 opgave skal det være 5 så man hurtigere kommer
> til bossen. Og man skal trykke eller skrive det rigtige ord så man ikke kan snyde."*

Det er to forskellige problemer i én sætning — og kun det ene var det barnet selv gjorde.

## 0. RETTELSE: ALLE FIRE MISSIONER ER 5 — OGSÅ LÆS (Kenneth, senere samme aften)

> *"Opgaverne skal være 5 alle 4. Også læs og står. Robin siger nogle er 7 nu."*

Robin så 7, og det var en fejl jeg selv havde lavet: `adaptiveWordCount` lagde **+2** på når det
gik godt. Antallet er nu **fast 5** i alle fire missioner:

- `adaptiveWordCount` er **fjernet helt** (den styrerede kun antallet).
- Hør & Slå / Fang ordet / Sætnings-gåden: `buildWordList(worldIdx, TASKS_PER_MISSION)`.
- **Forstå det!** havde kun **3** læse-opgaver pr. verden — så den runde var 3, ikke 7. For at
  gøre den til 5 er der skrevet **2 nye læse-opgaver pr. verden = 72 nye opgaver**, nu i alt
  **180** (36 × 5). Hver ny opgave er enten `find` eller `forstaa` (ingen nye `vurder`), bruger
  to ord fra verdens egen ordliste der ikke var brugt før, og overholder alle de gamle krav:
  1-2 sætninger · bevis-ordet står i både teksten og svaret · distraktorerne bærer ikke beviset
  og har mindst ét ord teksten ikke nævner.

Den adaptive tilpasning lever stadig — den bestemmer nu bare **hvilke ord** der kommer med
(svage ord og mønstre), ikke hvor mange. Noten under resultatet sagde *"derfor får du flere
ord"* (en løgn efter ændringen) og siger nu hvad der faktisk sker:
*"🔁 Dine svære ord kommer igen i næste runde: …"*.

Tests: kontrakterne i `ordj_forstaa.js` er opdateret fra 3 → 5 opgaver pr. verden (108 → 180) —
inklusive den vigtigste: 200 tilfældige træk pr. opgave skal stadig vise at svaret kan udledes
af teksten OG at ingen distraktor kan. `ordj_adaptiv2.js` og `ordj_selv3.js` tester nu det nye
løfte (fast 5 ved både fremgang og problemer) i stedet for det gamle (+2/-2).

## 1. Problemet bag problemet

Robins adfærd var ikke et tegn på at opgaverne var svære. Den var et **svar på incitamentet**:
bossen er det sjove, opgaverne stod i vejen, og spillet **lod ham slippe**. Runden sprang
automatisk videre ~1,1 sekund efter et forkert svar (`setTimeout(nextHear, 1100)`), så det
hurtigste svar var altid et forkert et — man behøvede ikke læse ordet, ikke lytte, ikke tænke.
Et barn der optimerer, finder den slags på under en runde.

Derfor skal ændringen ikke bare gøre runden kortere. Den skal fjerne **både** omvejen (længden)
**og** smutvejen (at svare forkert for at komme videre). Gør man kun det første, svarer barnet
forkert endnu hurtigere.

## 2. Kortere missioner

- `TASKS_PER_MISSION = 5` — ét sted at ændre tallet, læst af `startGame`.
- Før: Hør & Slå 8 ord, Fang ordet og Sætnings-gåden 6 ord (og op til +2 med den adaptive
  tilpasning).
- Nu: 5 ord i alle tre, 4-7 efter hvor godt det går (`adaptiveWordCount` er uændret — den
  tager bare et mindre tal ind). Forstå det! er urørt: den bruger verdens egne læse-opgaver.
- Barnet ser stadig "Ord 1 af 5" i fremgangsbaren, og missionen kan fortsat afsluttes.

## 3. Kravet om rigtigt svar

Et forkert svar **låser runden**. Det rigtige svar vises (barnet må ikke gå i stå), men barnet
skal selv give det for at komme videre:

| Mission | Forkert svar | Vejen videre |
|---|---|---|
| Hør & Slå | valget markeres rødt, det rigtige gløder | tryk på det rigtige ord |
| Fang ordet | feltet ryddes, ordet vises + stavelser | **skriv** ordet selv |
| Sætnings-gåden | valget markeres rødt, det rigtige gløder | tryk på det rigtige ord |
| Forstå det! | svaret markeres rødt + forklaringen vises | tryk på det rigtige svar |

Fire regler der holder det ærligt og tåleligt:

1. **Ingen auto-spring.** `setTimeout(nextHear, …)` på den forkerte gren er væk.
2. **Låsen ligger i `next*`-funktionen**, ikke kun i svar-funktionen
   (`if (cur.fix && !cur.answered) return;`). Selv en gammel timer eller et dobbeltkald kan
   ikke springe et ubesvaret ord over.
3. **XP kun for første forsøg.** Retter man sit svar, står der "✔️ Nu var det rigtigt" — men
   ingen XP flyver. Man kan ikke svare forkert for at se svaret og så høste belønningen.
4. **Fejlen tælles én gang pr. ord.** Hamrer man på forkerte svar, står der stadig 1 fejl i
   statistikken. Barnet kan ikke puste sin egen fejlstatistik op — men dets ægte fejl på ordet
   kommer stadig i "svageste ord" og i Mester-prøven.

## 4. Kravet skal kunne SES

Første version lagde krav-linjen *under* stavelses-hjælpen. Målt i browser på 390×844:
linjen landede på **y=966 i et vindue på 844** — altså under skærmkanten. Barnet ville se et
rødt ord og en låst skærm uden at vide hvorfor.

Nu står kravet **øverst** i statuslinjen:

```
👆 Tryk på det rigtige ord for at komme videre
Det rigtige ord var: en
Del ordet op i stavelser: …
```

Målt i headless Chrome på 820×1180 og 390×844: `kanSes = true` begge steder.

## 5. Testene

Ny pakke `tests/ordj_kraev.js` (33 kontroller): missionen er 5 ord og barnet ser "Ord 1 af 5" ·
et forkert svar flytter ikke runden · runden står stadig åben · krav-teksten findes · det
rigtige ord vises · fejlen tælles én gang · spam tæller stadig kun én · et **direkte kald** til
`nextHear`/`nextType` kan ikke springe ordet over · det rigtige tryk lukker runden · teksten
viser at det var andet forsøg (ingen XP) · første forsøg er den belønnede vej · Fang ordet:
knappen bliver "Tjek svar" og feltet ryddes · nyt ord nulstiller knappen · Sætnings-gåden og
Forstå det! opfører sig ens · svaret afsløres først EFTER man har svaret (kravet fra PISA-arbejdet).

Tre browser-målinger i `tests/ordj_hudplads.js`: kravet findes og har en tekst · kravet kan SES
uden at scrolle på to skærmstørrelser · runden kan ikke springes over.

**Mutationer bevist fanget:** missionen tilbage til 8 · auto-spring genindført (med og uden
låsen) · fejl talt op ved spam · "Næste"-knappen tilbage efter forkert svar · kravet flyttet
ned under stavelses-hjælpen.

## 6. En bivirkning der er værd at kende

Missionen er kortere, så der deles **færre XP ud pr. mission** (XP gives pr. ord). Til gengæld
skal man svare rigtigt for at komme igennem, så et barn der laver fejl bruger flere forsøg pr.
ord. Nettotallet for et fejlende barn er næsten uændret; for et barn der svarer rigtigt hele
tiden, tager levels nu ~1,6× så mange missioner. Vil Kenneth have level-tempoet holdt, skal
`XP_PER_ANSWER` op — men det rører ved XP-tallene, og det er hans beslutning.
