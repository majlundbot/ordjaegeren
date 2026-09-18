# Klasse-fantasi på valgskærmen + én sætning et barn kan gentage

Kenneth: *"yes lav det hele"* — de to ting fra r/rpg-tråden jeg havde efterladt som valg.

## 0. Hvad tråden sagde, og hvad der manglede

Tråden (52 topkommentarer): *"A lot of people love the **class fantasy**. What does it mean
to be a barbarian? ... It also offers a lot of **niche protection**. If I'm the rogue, I'm
the best at rogue things. I'll always have my chance to shine."* Og om D&D's største aktiv:
navnet *er* kategorien — man siger "vi spiller D&D", ikke "et tabletop-rollespil".

Målt i spillet:

| Trådens pointe | Status |
|---|---|
| Hver klasse har sit eget ultimative angreb (niche-beskyttelse) | ✅ **findes allerede**: `SIGNATURES` med RASERI (kriger, 3 slag), METEORSTORM (troldmand), PRÆCISIONSSKUD (jæger), HELLIGT SLAG (paladin, healer) |
| ... men kan man SE det når man vælger? | ❌ **nej** — valgskærmen viste kun "Mere liv i monsterkampe", "Starter med Ildkugle", "Gear giver ekstra kraft", "Kraft fra stjerner". Det sjoveste ved klassen var usynligt indtil man stod i kamp med fuld energimåler. |
| Én sætning et barn kan sige til et andet barn | ❌ nej — startskærmen sagde "Fang de 360 vigtigste ord i dansk — 36 verdener, 144 missioner!" (en voksen-linje) |

## 1. Løsningen

**A. Klasse-fantasi på valgskærmen.** Hvert klasse-kort viser nu sit **ultimative angreb**
med navn og en linje et barn forstår, taget direkte fra `SIGNATURES` (én kilde til sandheden,
så skærm og kamp ikke kan komme ud af trit):

```
🧙  Troldmand
    Starter med Ildkugle
    ☄️ METEORSTORM — Himlen står i flammer!
```

Introen øverst siger nu hvad der faktisk adskiller klasserne: *"hver klasse har sit eget
ultimative angreb!"* — ikke bare "forskellige kræfter".

**B. Én sætning (startskærmen).** Under titlen står der nu tre verber i én linje:

> **Fang ordet · slå monsteret · bliv stærkere**

Det er spillets loop i den rækkefølge barnet oplever det, og det er meningen at det kan
**siges højt af et barn til et andet barn**. Den gamle linje med 360 ord og 36 verdener står
under den — den er til den voksne, ikke til barnet.

## 2. Testene

Nye kontroller (i `tests/ordj_class.js` + `tests/ordj_start.js` hvis den findes):
1. Alle fire klasse-kort viser deres signatur-navn (fx "RASERI")
2. De viser også signaturens forklaring ("Tre slag i træk!")
3. Signaturen kommer fra `SIGNATURES` (ændrer man der, ændrer skærmen sig — ingen kopi)
4. Valgskærmens intro nævner det ultimative angreb
5. Startskærmen har én-linjen, den er under 60 tegn
6. Og den indeholder alle tre verber: fang · slå · bliv

## 3. Startskærmen får adgang til statistik (Kenneth, 18. sep)

Kenneth: *"Jeg vil gerne have adgang til statestik i startskærmen også"* — statistikken kunne
kun nås fra verdenskortet.

**A. Knappen.** De to sekundære valg står nu side om side under "Start eventyret":

```
[ 👥 Skift spiller ]   [ 📊 Statistik ]
```

Den primære handling står stadig alene og tydelig — statistik er noget man *kigger på*, ikke
noget man starter med. Målt i headless Chrome i tre størrelser (390×844, 820×1180, 1280×800):
174 px brede, 10 px luft, 50 px høje, samme linje, intet uden for skærmen.

**B. "Tilbage" var en død-ende.** Statistik-skærmens tilbage-knap gik ALTID til verdenskortet.
Åbnede man statistikken fra startskærmen, landede man altså på kortet — et sted man ikke kom
fra. Nu husker `showStats(fra)` hvor den blev åbnet, og `lukStats()` fører tilbage dertil.
Oprindelsen gives **eksplicit** (`showStats('start')`) frem for at snuse til DOM'en: enklere
at læse, og til at teste.

**C. Testene.** 4 kontroller i `tests/ordj_profiles.js` (bl.a. med spioner på begge
destinationer: fra startskærmen må den IKKE lande på kortet, og omvendt) og 3 browser-målinger
i `tests/ordj_hudplads.js`. Mutationer bevist fanget: knappen fjernet · tilbage-knappen går
direkte til kortet · `showStats` ignorerer oprindelsen · knapperne oven på hinanden · knapperne
for små at ramme.