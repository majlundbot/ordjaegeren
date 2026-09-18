# "Næste skridt" — én ting barnet skal gøre nu

Læst: r/rpg-tråden *"Why do people choose to play D&D?"* (52 topkommentarer, arkiveret
snapshot 26. marts 2025). Kenneth: *"hvis du kan trække nogle gode ideer ud, så må du gerne."*

## 0. Hvad tråden faktisk siger (kort)

Den mest citerede grund til at blive i D&D er ikke reglerne, men **paradigmet**:
*"D&D has a very strong adventuring paradigm. You always know what you're supposed to be
doing, and how to move forward."* (Mars_Alter, 22 point). Og: *"der er meget lidt der
hjælper folk mere ind i et spil end klare arketyper og klare paradigmer"*
(An_username_is_hard).

De øvrige grunde: D&D *er* hobbyen for de fleste (navnet = kategorien) · første møde bliver
standarden · klasse-fantasi + niche-beskyttelse ("alle får deres øjeblik") · karakteropbygning
som bilkøb frem for bilbygning · "god nok til at ligne det den skal ligne" · troperne er
forudindlæst · nat-20-øjeblikket.

## 1. Hvad Ordjægeren mangler — målt mod tråden

| Trådens pointe | Har vi det? |
|---|---|
| Klare arketyper (klasse, udstyr, kraft) | ✅ klasse, gear, talenter |
| Se hvad man kan se frem til | ✅ XP-bjælken viser "40 ord til niveau 2 · ⚔️ +1 kraft · ⭐ +1 talent-point" |
| Det umulige kan ske (nat-20) | ✅ lykkehjulet |
| **"Man ved altid hvad man skal gøre nu"** | ❌ **nej** |

Kortet viser 36 verdener og tre sider. Et barn der kommer tilbage efter en uge (eller Max,
der åbner spillet for første gang) skal **selv** regne ud hvad det skal lave. "Start her"
markerer kun verden 1. Det er præcis den frihed, tråden peger på som den største barriere.

## 2. Løsningen: ét banner, én handling

På kortet, lige under titlen, står der nu **én** ting barnet kan gøre — og den kan trykkes:

```
👉  Start Start-planeten                    →
    Verden 1 · monsteret venter
```

Prioriteringen (første der passer vinder):

1. **Ubrugte talent-point** → "Brug dit talent-point ⭐" → helteskærmen.
   (Point man ikke ved man har, bliver ikke brugt — samme logik som `Docs/helteskaerm-efter-sejr.md`.)
2. **Mester-prøven har ord klar** → "Prøv Mester-prøven 🏆" → starter den.
   (Belønningen for at øve sine svære ord skal ikke findes selv.)
3. **Første verden uden besejret monster** → "Start *<verden>*" (eller "Færdiggør *<verden>*"
   hvis der er scoret noget) → rejser ind i den verden.
4. **Alle 36 besejret** → "Alle monstre er besejret! 👑" → Mester-prøven.

Regler:
- Banneret er en **knap** (kan trykkes) — ikke en påmindelse. Kennets regel: ingen døde elementer.
- Teksten er en **handling**, ikke et statusfelt: "Start Start-planeten", ikke "Du mangler
  verden 1".
- **Undertitlen forklarer hvorfor** i én linje ("Verden 1 · monsteret venter") — trådens
  pointe er at paradigmet skal være *klart*, ikke bare til stede.
- Verden 1 hedder "Start-planeten", så teksten bliver "Start Start-planeten". Det ser fjollet
  ud, men er **rigtigt**: barnet skal vide at det er den verden. Alternativet ("Begynd forfra")
  skjuler hvilken verden der venter.

## 3. Testene

Ni nye kontroller i `tests/ordj_maps.js`:

1. Ny profil → banneret peger på verden 1 og siger "Start Start-planeten"
2. Banneret er en knap med `onclick` (kan trykkes — ikke død tekst)
3. Tryk rejser ind i den verden banneret pegede på (`state.mapAt` sættes)
4. Er verden 1's monster besejret, peger banneret på verden 2
5. Er der scoret (men ikke besejret) i en verden, står der "Færdiggør …"
6. Ubrugte talent-point vinder over alt andet → peger på helteskærmen
7. Mester-prøven med ord klar peger på prøven
8. Alle 36 besejret → "Alle monstre er besejret!"
9. Prioriteringen er stabil: talent-point slår verden, verden slår "alt færdigt"