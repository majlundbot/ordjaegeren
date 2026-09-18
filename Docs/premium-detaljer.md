# Premium-detaljer: intet må ligge bag HUD'en, og navne skal kunne læses

Kenneth (18. sep, på computeren):
> *"Det er jo ikke ordentligt, toppen går igennem skriften Den forbudte skov. Det her skal
> være et premium produkt så detaljer betyder meget."*
> og: *"Bare fix det hele."*

## 0. Målt før noget blev rettet

Jeg kunne ikke se fejlen på iPad'en og ikke i mine egne skærmbilleder — så jeg målte
geometrien i en rigtig browser i stedet for at gætte (headless Chrome + en probe der
lægger målingerne i DOM'en som JSON).

**Fejl 1 — HUD'en dækkede overskrifter.** HUD'en ligger fast i toppen
(`position: fixed; top: 12px; z-index: 5`) og er 106 px høj, så dens underkant er i 118 px.
Skærmene starter i samme højde (`padding: 16px`), så det øverste indhold forsvandt bag den:

| Skærm | Element | Dækket |
|---|---|---|
| Kortet | titlen "🌲 Den forbudte skov" | **hele titlen (481×58 px)** |
| Kortet | temalinjen under titlen | **hele linjen (331×38 px)** |
| Kamp | "👾 Monsterkamp!" | 39 px |
| Helten | "⚔️ Din ordjæger-helt" | 39 px |
| Statistik | "📊 Statistik" | 39 px |
| Bedrifter | "🏆 Bedrifter" | 39 px |

På iPad'en ser det ikke forkert ud, fordi panelet dér er højt nok til at blive centreret
nedad — men på en computer med et lavt vindue starter indholdet i toppen, og så ligger det
bag bjælken. Derfor troede vi det var et computer-problem: det er et **højde**-problem.

**Fejl 2 — navne i rygsækken var klippet af.** Rygsæk-panelet er 400 px bredt med to
kolonner, så hvert kort er 198 px. Navnet delte linje med grad (procent + stjerner) og
kraft, og blev klemt ned til **23 px**. Målt: **16 af 22 navne var klippet** — fx
"Kronen af Ord" viste 9 px af 81 px, og "Ordets Forbandede Sværd" 9 px af 153 px.

## 1. Løsningen

**HUD'ens plads:** `syncHudHeight()` måler HUD'ens underkant og lægger den i CSS-variablen
`--hud-h` (0 px når HUD'en er skjult). Skærmene lægger den oveni deres top-padding:

```css
.screen           { padding-top: calc(var(--hud-h, 0px) + 16px); }
.screen.tall.active { padding-top: calc(var(--hud-h, 0px) + 18px); }
```

Variablen opdateres når HUD'en vises/skjules (MutationObserver på `class`), når XP-bjælken
eller talent-mærket ændrer højde, og når vinduet skifter størrelse. Den er 0 på
start-skærmen, så der ikke kommer tom plads hvor HUD'en ikke er.

**Læsbare navne:** navnet får sin **egen linje** i rygsæk-kortet, og grad + kraft står
under. Målt efter: **0 af 22 navne klippet** — på både 1280×617 og 820×1180.

## 2. Testen der holder det

`tests/ordj_hudplads.js` — otte kontroller i to dele:

- **Kilde:** CSS'en og JS'en hænger sammen (`--hud-h` i begge `.screen`-regler; funktionen
  sætter 118px når HUD'en er synlig og 0px når den er skjult; navnet har sin egen boks).
- **Rigtig browser:** målte geometri på kort, helt og kamp ved 1280×617 — HUD'en må ikke
  dække noget, og ingen navne må være klippet (rygsækken fyldes med 16 items før målingen).
  Springes ærligt over hvis headless Chrome ikke findes.

Det er den første test i projektet der måler **layout** i stedet for data — fordi begge de
her fejl var usynlige for hver eneste af de 1200+ datakontroller.

Bevis: tre mutationer (fjern `--hud-h` fra CSS'en · sæt navnet tilbage på samme linje ·
lad JS rapportere 0 i højde) — alle fanget, også af browser-målingen.
