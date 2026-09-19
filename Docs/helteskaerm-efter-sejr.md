# Helteskærmen efter sejr + "+" på bjælken for ubrugte talent-point

Kenneth (18. sep, med skærmbillede):
> *"Dette skærmbillede skal komme op når man har vundet over bossen, så man ved at det
> eksisterer. Og når man har ubrugte talent-point skal det være en Plus på bjælken eller
> sådan noget så man ved der er ubrugte point."*

Bekræftet i chatten: det er **helteskærmen** (talent-træet), og den skal komme **automatisk
i sejrs-flowet**, ikke gemmes bag en knap.

## 0. Fejlen, målt i koden (ikke i hovedet)

Talent-træet er spillets dybeste belønning: **hvert niveau giver ⭐ 1 talent-point**, og
pointene gør helten stærkere i tre grene (❤️ Liv · ⚔️ Kraft · 💥 Kritisk). Men:

1. **Skærmen skal findes.** Den eneste vej til `screen-hero` er knappen `⚔️ Helt` i HUD'en
   (eller `?screen=hero`-debug-hooket). Der er ingen invitation, ingen henvisning efter en
   sejr, ingen forklaring på hvad der venter derinde.
2. **Et ubrugt point kan ikke ses.** `state.talentPoints` blev kun vist ÉT sted i hele
   spillet: inde på helteskærmen, i parentes efter "Talent-træ" (linje 3309). Stod man på
   kortet eller i en kamp, var der intet tegn — heller ikke på XP-bjælken, hvor pointene
   bliver givet.

Konsekvensen er den Kenneth beskriver: pointene hober sig op, fordi barnet ikke ved at de
findes. Reglen der er brudt, er hans egen: **belønninger skal kunne SES** (se
`Docs/verdener-tema-og-qol.md`).

## 1. Beslutninger

| # | Beslutning | Hvorfor |
|---|---|---|
| 1 | Helteskærmen åbnes **automatisk som sidste trin i sejrs-flowet**: konfetti + belønningskort → lykkehjulet → "👍 Fedt!" → helteskærmen med banner. | Hjulet ER den belønning barnet lige har vundet. Lå helteskærmen oven på hjulet, ville barnet miste sit loot — og lykkehjuls-løkken er dækket af 36 testpakker. Rækkefølgen giver historien: **du vandt → du fik loot → nu bruger du dit point.** |
| 2 | "+"-mærket sidder **på XP-bjælken** (pille: `⭐ +1`) **og** som lille `+` på `⚔️ Helt`-knappen. | Kenneth sagde "på bjælken". Bjælken er dér pointene bliver givet (level-up), og Helt-knappen er dér man bruger dem. |
| 3 | Begge mærker er **klikbare** og åbner helteskærmen. | Kennets regel: ingen døde knapper. Et mærke der ikke kan trykkes, ser ud som skærmens vigtigste handling uden at være det. |
| 4 | Mærkerne vises **kun når der ER ubrugte point** (`state.talentPoints > 0`) og forsvinder i samme øjeblik det sidste point bruges. | Et permanent "+" ville blive baggrundsstøj — og så ser barnet det ikke når det betyder noget. |
| 5 | Gløden omkring pilla ligger bag `@media (prefers-reduced-motion: no-preference)`. | `prefers-reduced-motion` skal respekteres i ALT nyt (aftalen i spillet). |
| 6 | Banneret på helteskærmen forklarer **hvorfor** man står der: "🏆 Sejr! Du har ⭐ N talent-point — tryk på en gren nedenfor". Har man 0 point, står der at man får ét for hvert niveau. | Et skærmspring uden forklaring er en blindgyde for et barn på 7. Med 0 point skal skærmen stadig give mening. |
| 7 | Ingen nye navne, ingen nye tal, ingen ændret XP- eller loot-logik. | Belønningerne er aftalt og testet; dette er kun synlighed. |

## 2. Flowet efter en vundet kamp

```
boss besejret
   └─ konfetti + belønningskort (0,4 s)          [uændret]
        └─ 🎰 lykkehjulet                        [uændret]
             └─ "👍 Fedt!"
                  └─ ⚔️ helteskærmen MED banner   [NYT]
                       └─ ⭐ talent-træet: tryk på en gren og brug pointet   [uændret skærm]
```

Undervejs (og senere, når man spiller videre) står der `⭐ +N` på XP-bjælken så længe der
er ubrugte point. Trykker man på den, kommer man til samme skærm — uden banner.

## 3. Testene der holder det fast

Ny pakke `tests/ordj_helteflow.js`:

1. Med 2 point: pilla er synlig og viser "2", og `+`-mærket på Helt-knappen er synligt.
2. Med 0 point: begge er skjult (ingen støj).
3. Pilla åbner helteskærmen (skærmen bliver `active`).
4. Bruger man sit sidste point, forsvinder mærkerne med det samme.
5. Efter en vundet kamp + lukket lykkehjul står barnet **på helteskærmen**, og banneret
   nævner hvor mange point man har.
6. Åbner man helteskærmen normalt (uden sejr), er banneret skjult — det må ikke hænge ved.
7. CSS'en indeholder reduced-motion-guarden for den nye glød.

Alle syv efterprøves med mutationer (bryd koden, se testen fejle, genskab).

## 4. GENVEJ TIL VERDENERNE (Kenneth 18. sep, efter Robins spil)

Kenneth: *"Når Robin har været i helte skærmen går han helt ude i hovede menuen og derved ind
i verden igen. Der skal være en genvej fra Helteskærm og tilbage til verdernerne."*

**Hvad der faktisk skete.** Der VAR en udgang — `← Tilbage til kortet` — men den står i
BUNDEN af helteskærmen, og skærmen er lang (helt, kube, gear, rygsæk, skatte-tavle,
talent-træ, bedrifter). Robin fandt den ikke, brugte i stedet **🏠 Hjem** i HUD'en (som findes
på alle skærme) og landede i hovedmenuen — hvorfra han måtte vælge verden forfra. Udgangen var
altså ikke væk; den var **gemt under indholdet**.

**Løsningen.** En genvej i **toppen** af helteskærmen, lige under overskriften, hvor den er
synlig uden at scrolle:

```
⚔️ Din ordjæger-helt
[ 🗺️ Til verdenerne ]
```

Den fører til **den verden man kom fra** (`showWorld(cur.world)`), hvis man kom fra en verden
eller en mission — ellers til verdenskortet. Helteskærmen husker hvor den blev åbnet
(`heroFra`), samme mønster som statistik-skærmen: "tilbage" betyder *tilbage til der hvor du
var*, aldrig "ud i hovedmenuen igen". Den gamle `← Tilbage til kortet` i bunden står uændret.

**Testene.** 6 kontroller i `tests/ordj_helteflow.js`: genvejen findes · den står FØR det
lange indhold i markup (ellers er den lige så gemt som den gamle) · kom man fra en verden,
fører den til DEN verden (spion på `showWorld`: rigtigt indeks) · kom man fra
startskærmen/kortet, fører den til kortet · uden kendt oprindelse går den til kortet ·
etiketten er kort nok til et barn.
Mutationer bevist fanget: genvejen fjernet · genvejen flyttet ned under indholdet · den går
altid til kortet · den går altid til `showWorld(0)`.
