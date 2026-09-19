# Kubens chancer — mytiske items bestemmer opgraderingen

Kenneth, 18. september 2026:

> *"Når man putter 1 mythic ind i cupen, så skal mane 10% chance for upgrade. Putter man 2
> mytchin in skal man have 20% 3 = 50 %"*

## Reglen

Antallet af **mytiske** items i kuben bestemmer chancen for en opgradering:

| Mytiske i kuben | Chance for opgradering |
|---|---|
| 1 | **10 %** |
| 2 | **20 %** |
| 3 | **50 %** |
| 0 | – (den gamle regel gælder uændret) |

**Rammer man:** resultatet er ét trin OVER det bedste item i kuben. Er der et mytisk item med,
betyder det **MYTISK → HEMMELIG** (hemmelig er niveauet over mytisk; ASEGÅRD er stadig forbeholdt
bossene i verden 25/26 og kan ikke komme ud af kuben).

**Rammer man ikke:** man får **sit mytiske item igen** i samme sjældenhed og samme plads. Man
taber altså ikke sin mytiske genstand — man har brugt de to andre items på et forsøg og kan
prøve igen. Det er med vilje: en 50 %-chance der kostede tre mytiske items ved et nederlag
ville være for hård for et barn.

**Uden mytiske items** i kuben er fordelingen **uændret** (Kenneths tidligere aftale):
7 % mytisk, 3 % hemmelig, 90 % ét trin op i sjældenhed. Den regel er der ikke rørt ved.

## Chancen skal kunne SES

Kuben viser nu chancen direkte under de tre pladser, mens man lægger items i:

- 0 mytiske: *"Put et mytisk item i kuben — så stiger chancen: 1 → 10 %, 2 → 20 %, 3 → 50 %"*
- 2 mytiske: *"🔮 2 mytiske i kuben → 20 % chance for en opgradering"*

Og resultatet siger hvad der skete, ikke bare hvad man fik:
*"🔮 Opgradering! (20 % chance med 2 mytisk i kuben)"* eller
*"Mytisk igen — 20 % chance blev ikke ramt. Prøv igen med flere mytiske!"*

Begrundelse: et barn der lægger tre mytiske items i kuben og får et mytisk item igen, skal
kunne se at det var et **forsøg** og ikke en fejl. Ellers føles spillet som om det snyder.

## Testene

Ny pakke `tests/ordj_kube.js`. `Math.random` stubbes, så grænserne kan måles præcist
(præcis under og præcis over chancen for 1, 2 og 3 mytiske):

1. Tabellen er præcis 10 / 20 / 50 % for 1 / 2 / 3 mytiske (og 0 for 0).
2. 1 mytisk: `r = 0.09` → opgradering · `r = 0.11` → ikke.
3. 2 mytiske: `r = 0.19` → opgradering · `r = 0.21` → ikke.
4. 3 mytiske: `r = 0.49` → opgradering · `r = 0.51` → ikke.
5. En opgradering med et mytisk item i kuben giver **hemmelig** (aldrig asgård).
6. Et mislykket forsøg giver et **mytisk** item igen — samme plads som det man lagde ind.
7. Uden mytiske items i kuben er fordelingen uændret (7 % / 3 % / 90 %): målt på grænserne
   0.06 · 0.08 · 0.5.
8. Kuben kan ikke bruges med færre end tre items (uændret), og items kan tages tilbage (uændret).
9. Chancen står i kuben mens man lægger items i (1, 2 og 3 mytiske).
10. Resultatet fortæller om det var en opgradering eller et mislykket forsøg.
