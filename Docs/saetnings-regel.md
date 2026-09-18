# Hintsætningen skal indeholde PRÆCIS det ord barnet skal skrive

Kenneth (18. sep), med skærmbillede fra "Fang ordet":
> *"Fejl i denne. Du siger 'And' og så 'Anden svømmer i søen'. Du siger sætningen i
> [bøjet form]."*

## 0. Fejlen, målt

"Fang ordet" (og "Sætnings-gåden") viser sætningen fra `WORDS[ord]` med ordet som et hul,
og **oplæsningen siger den samme sætning**. For ordet `and` stod der:

```
and:"Anden svømmer i søen."
```

Barnet hører altså **"Anden"** — en bøjet form, som endda er et andet dansk ord ("anden" =
"den anden") — mens opgaven er at skrive `and` (3 bogstaver, vist som •••). Skriver barnet
det ord det hører, bliver det dømt forkert. Hintsætningen peger på det **forkerte svar**.

**Omfang:** 47 af 360 sætninger havde fejlen. Alle 47 brugte bestemt form eller bøjning:
`Hunden`, `Katten`, `Solen`, `Månen`, `Regnen`, `Sneen`, `Vinden`, `Træet`, `Blomsten`,
`Græsset`, `Maden`, `Æblet`, `Bananen`, `Smørret`, `Huen`, `Bæltet`, `hovedet`, `munden`,
`tavlen`, `køkkenet`, `stuen`, `døren`, `vinduet`, `gulvet`, `loftet`, `væggen`, `bolden`,
`dukken`, `klodser`, `skolegården`, `biblioteket`, `fodboldbanen`, `sidder`, `bygger`,
`maler`, `synger`, `om natten`, `om morgenen`, `om aftenen` — og `Anden`.

Koden havde endda en kommentar om det: *"Lydfilen læser ordet som barnet kender det, så VI
SKRIVER IKKE SÆTNINGEN OM"*. Det var en bevidst genvej — og den er forkert for et barn der
lytter efter svaret.

## 1. Reglen

> **Hintsætningen skal indeholde præcis det ord, barnet skal skrive, i samme form.**

Ikke som bøjning, ikke som bestemt form, ikke som en del af et andet ord. Barnet skal kunne
**finde svaret i det det hører**. Det gælder både oplæsningen og hullet i teksten.

## 2. Rettelsen

Alle 47 sætninger er skrevet om, så grundformen står som selvstændigt ord — fx:

| Ord | Før (forkert svar) | Efter (svaret kan høres) |
|---|---|---|
| and | Anden svømmer i søen. | **En and svømmer i søen.** |
| hund | Hunden logrer med halen. | **En hund logrer med halen.** |
| sol | Solen skinner på himlen. | **Om dagen er der sol på himlen.** |
| nat | Om natten sover vi. | **Vi sover, når det er nat.** |
| hoved | Jeg har hår på hovedet. | **Jeg har et hoved med hår.** |
| sidde | Jeg sidder på stolen. | **Jeg vil sidde på stolen.** |
| morgen | Godmorgen, sagde far om morgenen. | **Far siger god morgen til mig.** |

**Lyden skal med**: `audio/v2/sentences/<ord>.mp3` er genereret ud fra sætningen, så de 47
filer er genereret igen med samme stemme (`da-DK-JeppeNeural`). Ellers ville teksten sige
"En and" og stemmen stadig sige "Anden".

Reserverne i `blankInSentence` (bøjnings-fallbacken) bliver ikke længere brugt af nogen
sætning, men de bliver stående: de er en sikkerhedsnet hvis en sætning en dag bliver skrevet
om. Kommentaren er rettet, så den ikke længere siger "vi skriver ikke sætningen om".

## 3. Testen der fanger det næste gang

Ny pakke `tests/ordj_saetninger.js`:

1. **Alle 360 sætninger indeholder ordet som selvstændigt ord** (Unicode-sikker ordgrænse,
   så æøå tæller med). Det er den test der ville have fanget "Anden" med det samme.
2. `blankInSentence` skal give et hul for alle 360 (så hullet aldrig forsvinder).
3. **Hvert ord skal have BEGGE lydfiler** (`words/<ord>.mp3` og `sentences/<ord>.mp3`) og
   de må ikke være tomme — så en rettelse i teksten ikke kan glemme lyden.
4. Ingen sætning må være identisk med før-rettelsens bøjede form for de 47 ord (regression).