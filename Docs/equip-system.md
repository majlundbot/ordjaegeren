# Equip-system — nyt design

**Baggrund:** Kenneth: *"Måden nu er ikke så god, og man kan ikke tage ting af igen."*
Den anden del er en **ægte funktionel mangel**: når først et item er udrustet, kan det
aldrig komme af og tilbage i tasken. Det betyder at barnet kan låse sig selv fast i
dårligt udstyr — og at et godt item man finder senere ikke kan erstatte det gamle.
Det er den slags der gør lootingen meningsløs i praksis.

Målet er **app-kvalitet**: spillet skal kunne udgives, så det skal være gennemtænkt,
ikke et quick fix.

---

## 1. Nuværende tilstand (det der skal ændres)

- `state.gear` = `{ helm: "rare", weapon: "epic", ... }` — **kun sjældenheden**, ikke itemet
- `state.gearRoll` = `{ helm: 18, ... }` — styrken i procent (tilføjet i dag)
- `equipItem(item)` — udruster og lægger det gamle item i tasken. **Ingen vej tilbage.**
- Tasken (`state.bag`) vises i helteskærmen; udrustning sker ved at trykke på et item

**Problem:** en tasken-visning hvor man trykker på et item er en *skrivehandling uden
fortrydelse*. Der mangler en **slot-visning** — "hvad har jeg på, og hvad kan jeg vælge
i stedet" — og en **tag af**-handling.

---

## 2. Designet: slot-panel

Tryk på en af de 6 slot-pladser i helteskærmen → et panel åbner med tre ting:

### Øverst: hvad er udrustet lige nu
```
🪖 Hjelm — Krystalhornhjelm
   💫 PERFEKT — styrke +29 % ⭐⭐⭐
   Kraft 5,2
   [ Tag af ]        ← DEN MANGLENDE HANDLING
```

### Dernæst: hvad der er i tasken til DENNE slot
Sorteret efter kraft, stærkest først, med forskellen tydeligt vist:
```
🪖 Vikingehjelm      +4 %     4,1 kraft     ▼ 1,1 svagere
🪖 Jernmaskehjelm    +22 %    4,9 kraft     ▼ 0,3 svagere
🪖 Sølvhjelm         +31 %    5,5 kraft     ▲ 0,3 stærkere   ← anbefalet
```
**Farvekode:** grøn op-pil = bedre end det man har på, rød ned-pil = dårligere.
Det gør valget nemt for et barn uden at læse tal.

### Nederst: en tydelig handling pr. item
`[ Udrust ]` på hvert item. Det man havde på, ryger automatisk tilbage i tasken.

---

## 3. Regler der skal holde

1. **Tag af** lægger itemet tilbage i tasken med sin styrke bevaret (`roll`)
2. Udruster man et nyt, kommer det gamle **altid** tilbage i tasken — intet forsvinder
3. Tasken kan vise "ingen items til denne slot" med en venlig besked
4. Kraft-beregningen (`heroPower`) skal opdatere **straks** — også efter "tag af"
5. `state.gearRoll` skal ryddes for slotten når man tager af (ellers tæller en
   forældreløs styrke stadig med i kraften — **det er en sandsynlig fejl i dag**)
6. Alt skal kunne fortrydes: efter "tag af" kan man udruste det igen med ét tryk

---

## 4. Faldgruber fundet i forvejen

- **`state.gear[slot]` er en streng (sjældenhed), ikke et item.** Kraft og navn kommer
  fra `rarityOf(rk)` + `state.gearRoll`. Tag af skal derfor rydde BEGGE.
- **Itemet i `state.gear` har intet navn.** Navnet på det udrustede item kan derfor ikke
  vises i dag. Det skal løses ved at gemme itemet — fx en ny `state.gearItem[slot]` —
  eller ved at udvide `state.gear` til at holde objektet. **Vælg det der bryder færrest
  tests:** en parallel `state.gearItem` er sikrest, fordi alle eksisterende
  sammenligninger (`state.gear[x] === "mythic"`) så virker uændret.
- **Migration:** eksisterende gemte spil har `state.gear` uden `gearItem`. Koden skal
  kunne håndtere `gearItem[slot] === undefined` uden at gå ned (og gerne vise sjældenheden
  som navn i det tilfælde).
- **Tests der rører `equipItem`:** `ordj_gear.js` forventer i dag at udrustning giver
  mellem 4 og 5 kraft. Det skal stadig holde.
- **Ingen `classList.toggle`-antagelser:** en test-stub har den ikke. Vær defensiv.

---

## 5. Definition of done

- [ ] Man kan tage et item af, og det ligger i tasken bagefter med sin styrke
- [ ] Kraften falder korrekt når man tager af (og stiger når man udruster)
- [ ] Slot-panelet viser det udrustede item med navn, grad og styrke
- [ ] Tasken til slotten er sorteret efter kraft med op/ned-pile
- [ ] Intet item kan forsvinde — alt havner i tasken
- [ ] Gamle gemte spil virker stadig
- [ ] **Hele testsuiten grøn** (den er porten: er den ikke grøn, pushes intet)
- [ ] Nye tests dækker: tag af, kraft falder, intet forsvinder, gammel profil
- [ ] Verificeret med **skærmbillede i iPad-størrelse** — testene kan ikke se skæve knapper
