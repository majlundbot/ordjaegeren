# XP og levels på skærmen — "man kan ikke sigte efter et mål man ikke kan se"

## 0. Udgangspunktet (verificeret i koden, før noget blev ændret)

XP-systemet **findes og virker**:

- `XP_PER_LEVEL = 120` (index.html ~1847)
- `heroLevel() = 1 + floor(xp / 120)` (~1848)
- `levelPower() = level − 1` → +1 kraft pr. level (~1849)
- `state.xp` tildeles i `finishGame()`: `stars*10 + 5 + (0 fejl ? 10 : 0)` (~5298)
- Level-up giver 1 talent-point til talent-træet (~5324)
- Level-up vises som **én tekstlinje** i `#resultXp` (~5326)

**Problemet er ikke systemet. Det er at barnet ikke kan se det.** XP blev vist præcis
ét sted: på resultat-skærmen efter missionen, i én linje. Undervejs — mens man spiller —
var der intet. `Niveau 3` stod på helteskærmen uden at sige om næste level var 2 ord
eller 2 uger væk. Et mål man ikke kan se, styrer man ikke efter.

## 1. Kontrakten

1. **XP-bjælken er ALTID synlig øverst mens man spiller** — ikke kun efter missionen.
   Incitamentet skal virke i selve spillet, ikke bagefter.
2. **Bjælken for øjet, linjen for forståelsen.** `78/120` siger en på 7 ingenting.
   *"4 ord til niveau 4"* siger alt. Begge dele vises samtidigt.
3. **Vis hvad næste level GIVER**: `⚔️ +1 kraft · ⭐ +1 talent-point`. Ellers er level'et
   et tal uden betydning.
4. **XP flyver op når det tjenes.** `+3 XP` stiger synligt fra ordet ved rigtigt svar,
   så koblingen "jeg svarede rigtigt → jeg tjente noget" ses med det samme.
5. **Level-up fylder skærmen i et par sekunder** — ikke en tekstlinje. Det er her
   lønnen udbetales.
6. **`HERO_SKIN` bindes til level**, så level også betyder synlig fremgang i verdenen:
   Ordjægeren → Ordkrigeren → Mesterjægeren → Ordhelten.

## 2. Hvor bjælken sidder

Inde i `#hud`, som en **anden række** under Hjem/progress/lyd/Helt:

```
🏠 Hjem     3 / 10 · Verden 1        🔊   ⚔️ Helt
┌──────────────────────────────────────────────────┐
│ Niveau 3   ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  78/120 XP    │
│ 4 ord til niveau 4 · ⚔️ +1 kraft · ⭐ +1 talent   │
└──────────────────────────────────────────────────┘
```

`#hud` bliver `flex-direction: column`, og den nye `.hud-row` holder den gamle række.
Fordelen ved at ligge inde i `#hud`: bjælken arver HUD'ens synlighed, så den er der
automatisk på kort, i spil, på statistik og på helteskærmen — og væk på startskærmen,
hvor man ikke spiller. Ingen ekstra vis/skjul-logik der kan gå i utakt.

**Placering (til rapporten):** `#hud` → `#xpStrip`, fast øverst, `top: 62px` under
den første HUD-række, fuld bredde, højde ~46 px. Bjælken fyldes fra venstre med en
guld→grøn gradient; niveauet står i midten af bjælken.

## 3. XP pr. rigtigt svar (og hvorfor balancen holdes nogenlunde)

Før fik man XP **kun** når missionen sluttede. For at kunne lade XP flyve op fra ordet
skal XP tildeles **når svaret er rigtigt**:

- rigtigt svar: `+3 XP` (i `markRight`)
- mission-slut: **uændret** formel `stars*10 + 5 + (0 fejl ? 10 : 0)`
- erobret ord i Mester-prøven: `+60 XP` (se `Docs/mester-proeven.md`)

En perfekt 10-ords mission giver ca. `3*10 + 35 = 65 XP` mod før 35. Det er en
fordobling — bevidst: level'et skal kunne nås inden for en spille-session, ellers virker
bjælken ikke motiverende. `XP_PER_LEVEL` er **ikke** ændret (120), så alle eksisterende
level-beregninger og bedrifter (`level5`, `level10`) står uændret.

**"4 ord til niveau 4" regnes ærligt:** spillet måler sit eget gennemsnit i
`state.xpStats = { answers, answerXp }` — altså hvor mange XP et rigtigt svar faktisk
har givet. Er der ingen data endnu, bruges `XP_PER_ANSWER` (3) som startværdi.
Vi skriver ikke et tal vi ikke kan stå ved.

## 4. Level-up der fylder skærmen

`#levelUp` er et fuldskærms-overlay (samme mønster som `#cubeOverlay`):

```
        ⭐ LEVEL 4 ⭐
   Du er nu ORDKRIGEREN          ← HERO_SKIN[level]
   ⚔️ +1 kraft   ⭐ +1 talent-point
   [ fortsæt ]
```

Den vises i ~2,8 sekunder eller til man trykker. `fxConfetti()` kører samtidig.
Den gamle tekstlinje i `#resultXp` **beholdes** som kort kvittering — testen
`ordj_integration` og forældre-læsningen skal stadig kunne se tallet.

## 5. HERO_SKIN bundet til level

Før: `state.skin = min(floor(besejrede_monstre / 3), 3)` (boss-sejr, linje ~4343).
Efter: skin udledes af **level** — den ting barnet ser vokse hele tiden:

| Level | Skin |
|---|---|
| 1–3 | Ordjægeren |
| 4–7 | Ordkrigeren |
| 8–12 | Mesterjægeren |
| 13+ | Ordhelten |

`heroSkinIndex()` er den eneste sandhed; `state.skin` opdateres som spejl for gamle
saves og gamle kald, men læses ikke længere for at bestemme navnet. `heroSkinName()`
bruges både på helteskærmen, i level-up-overlayet og i bosskampen.

## 6. Testene der fanger FORMÅLET

`tests/ordj_xp.js` spørger ikke "findes `#xpStrip`". Den spørger:

| Test | Hvad den fanger |
|---|---|
| **"XP-tilvækst er synlig uden at åbne resultat-skærmen"** | Kernen i klagen: systemet fandtes, men var usynligt. Testen kræver at bjælken er i HUD'en (den der er synlig under spil), og at `renderXpBar()` skriver tal i `#xpFill`/`#xpText` ved spilstart — før nogen mission er færdig. |
| **"bjælken viser AFSTAND, ikke kun tal"** | Kræver at `#xpToNext` indeholder antal ord/runder til næste level (et rent `78/120` er rødt). |
| **"næste level viser hvad det giver"** | Kræver både kraft og talent-point i teksten. |
| **"XP flyver ved rigtigt svar"** | Kalder `markRight` og kræver at der oprettes et `.fx-xp`-element — ikke bare at funktionen findes. |
| **"level-up fylder skærmen"** | Kræver at `#levelUp` mister `hidden` ved level-op, og at den viser det nye skin-navn. |
| **"skin følger level"** | `heroSkinIndex()` ved level 1/4/8/13 skal give 0/1/2/3 — altså at `HERO_SKIN` faktisk er bundet til level og ikke til noget andet. |
| **"bjælken lyver ikke"** | Samme XP → samme ord-til-næste som XP-bjælkens procentdel. Hvis de to tal ikke stemmer, er linjen vildledende. |
