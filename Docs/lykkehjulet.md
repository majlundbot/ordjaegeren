# Lykkehjulet — hvorfor det ser billigt ud, og hvad der skal til

Kenneth: *"Du skal også lave lykkehjulet mere smart, det ser billigt ud."*

---

## Hvad der er der i dag

```css
.wheel.spinning { animation: wheelSpinAnim 4.2s cubic-bezier(.12,.8,.18,1) forwards; }
@keyframes wheelSpinAnim { from { transform: rotate(0deg); }
                           to   { transform: rotate(var(--wheel-deg, 1440deg)); } }
```

Ét rotations-animation af hele elementet. Det er hele mekanikken.

---

## De seks grunde til at det føles billigt

1. **Der er ingen viser.** Et hjul uden en fast nål i toppen har intet referencepunkt.
   Man kan ikke se *hvor* det stopper — kun at det drejer. **Det er den vigtigste enkeltfejl.**
2. **Intet klik.** Et rigtigt lykkehjul giver et lille hak hver gang et felt passerer nålen.
   Det er dén lyd der gør det spændende. Her er der kun ét langt whoosh.
3. **1440° = præcis fire omgange.** Et rundt tal. Så slutpositionen føles tilfældig,
   ikke som om hjulet *lander* et sted. Det skal lande på et felt, ikke på et tal.
4. **Ingen acceleration.** Bezier-kurven starter i høj fart. Et rigtigt hjul bliver først
   skubbet hurtigere op — og derefter langsommere i lang tid.
5. **Intet vinder-øjeblik.** Feltet der vinder lyser ikke op. Så resultatet kommer fra teksten
   under hjulet i stedet for fra hjulet selv.
6. **Ingen "settle".** Et rigtigt hjul vipper en anelse tilbage når det stopper. Uden det
   føles det som om det bliver *klippet* af, ikke som om det *stopper*.

---

## Sådan skal det være

### Fast viser + roterende skive
Nålen ligger UDEN om det roterende element, i toppen, pegende ned. Så er der altid et
referencepunkt, og feltet under nålen er svaret.

### Tre faser i stedet for én animation
1. **Opkørsel** (~0,5 s): langsom start, hurtigere og hurtigere
2. **Fri rotation** (~1,5 s): jævn høj fart
3. **Nedbremsning** (~2,5 s): lang, langsom, med et lille **tilbagesving** til sidst

Bygges som tre på hinanden følgende `animation`-led, eller som ét `requestAnimationFrame`-løb
hvor man selv regner vinklen. **rAF er at foretrække**, fordi vi så kan affyre klik-lyd i
præcis det øjeblik et felt passerer nålen — det kan CSS-animationer ikke.

### Klik pr. felt
Hver gang et felt passerer nålen: et kort `beep` + en lille rystelse af nålen. Frekvensen
skal falde med farten, så det lyder som et hjul der bremser. **Det er den lyd der gør hele
forskellen.**

### Vinder-feltet lyser op
Når hjulet stopper: feltet under nålen får et pulserende glow, og de øvrige felter dæmpes.
Så kommer resultatet *fra hjulet*, ikke fra en tekst under det.

### Matematikken SKAL passe
Feltets størrelse = den faktiske sandsynlighed (`wheelSegs()`: 25/25/50, akademi 10/20/20/50).
Præmien trækkes FØRST, og rotationen regnes derefter baglæns, så den lander **midt i**
det rigtige felt — ikke på kanten.

**Det er her et billigt hjul afslører sig:** det lander et tilfældigt sted, og så passer
teksten bare ikke med feltet under nålen. En 10-årig opdager det med det samme, og så
er hele belønningen utroværdig. Det må ikke kunne ske.

### Resultatet folder ud
Kortet kommer efter hjulet er stoppet — ikke samtidig. Først spænding, så svar.

---

## Faldgruber

- `wheelPending` holder den rullede præmie. **Den skal trækkes før rotationen beregnes**,
  ellers kan de to ikke bringes til at passe sammen.
- `--wheel-deg` skal regnes ud fra segmentets midtervinkel + antal hele omgange.
  Med `wheelSegs()` der kan ændre sig, må omgangstallet ikke være hardcodet til 4.
- Nålen må ikke ligge inde i det roterende element — så drejer den med, og hele pointen er væk.
- `overflow: hidden` på `.wheel` betyder at glow på et felt kan blive klippet. Tjek ved
  skærmbillede.
- **Test:** sandsynligheden skal stadig måles til 25/25/50 (og 10/20/20/50) — og der skal
  være en test der beviser at **vinderfeltet under nålen stemmer med den uddelte præmie**
  ved mange tilfældige træk. Det er den test der fanger "billigt hjul".
