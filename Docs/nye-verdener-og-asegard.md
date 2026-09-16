# Nyt item-niveau over SECRET + 2 nye verdener

Kenneth: *"Lige som vi gik fra mythic til secret, så find på nogle nye items også, så det
giver mening for en på 10 at lave de opgaver."*

Det er kernen i opgaven: **det nye niveau skal være grunden til at en 10-årig gider de
svære opgaver.** Ikke bare "endnu en farve". Belønningen skal føles som noget man har
fortjent ved at gøre noget svært.

---

## 1. Det nye niveau: ASEGÅRD 🏔️

**Hvorfor ikke bare "endnu en sjældenhed":** mythic → secret var en farve mere. Det virkede
fordi barnet ikke havde set secret endnu. Men et niveau *over* secret skal have en historie,
ellers er det bare et tal der er større.

**Historien:** Det er **gudernes eget udstyr**. I nordisk mytologi har hver gud sit
særlige våben — og det er udstyr ingen smed kan lave, kun guderne selv. Det passer perfekt
til et dansk barn på 10: **det er rigtige navne fra vores egen mytologi**, ikke opdigtede
engelsk-agtige ord. Det giver noget at fortælle i skolegården.

**Seks items — én til hver slot, alle rigtige mytologiske genstande:**

| Slot | Item | Hvad det er |
|---|---|---|
| 🪖 Hjelm | **Ægishjálmr** | Skræmmens hjelm — gjorde modstanderen bange |
| ⚔️ Våben | **Mjölnir** | Thors hammer — kom altid tilbage til hånden |
| 🛡️ Skjold | **Svalin** | Skjoldet der står foran solen og skygger for den |
| 🥋 Rustning | **Megingjörð** | Thors styrkebælte — fordoblede hans kræfter |
| 👢 Støvler | **Vidars jernsko** | Jernskoen der fældede Fenrisulven |
| 📿 Amulet | **Draupnir** | Odins ring — hver niende nat blev den til otte |

**Kraft:** over secret (×22-36) → **×45-60**. Og med **lille styrke-spænd (5 %)**, fordi
guderne ikke ruller dårligt — det er hele pointen med dem.

**Farve:** guld-hvid med svag flimren, ikke en ny mættet farve. Det skal se *anderledes*
ud, ikke bare kraftigere. De øvrige niveauer er farvede; dette er **lysende**.

---

## 2. Hvordan man får dem — og hvorfor det giver mening for en på 10

**Nøglen: de to nye verdener giver dem.** Ikke kuben, ikke lykkehjulet.

- **Verden 25 "Den svære skov"** — besejr bossen → første ASEGÅRD-item
- **Verden 26 "Mesterskabet"** — besejr bossen → resten, ét ad gangen

**Hvorfor det er den rigtige kobling:** barnet får *ikke* guderne for at trykke på en knap.
Det får dem ved at klare de opgaver der er svære. **Sammenhængen mellem "jeg gjorde noget
svært" og "jeg fik noget der er noget værd" er hele grunden til at en 10-årig bliver ved.**
Det er også derfor de skal være sværere end kuben at komme til — kuben kan man gentage.

**Ekstra spænding (valgfrit, beslut senere):** vis de 6 ASEGÅRD-items som **silhuetter** i
helteskærmen fra starten, med navn og hvad de gør, men ikke hvordan man får dem. Så ved
barnet hvad det jagter.

---

## 3. De 2 nye verdener — og hvorfor navnene betyder noget

Spillet hedder "Fang de 240 vigtigste ord i dansk". Med 2 nye verdener bliver det **260 ord**.
Det skal opdateres i titel og fortælling, ellers lyver spillet.

**Verden 25 — "Den svære skov"** (10 ord)
Sværhedsgraden kommer fra ord der **staves anderledes end de lyder**, og ord med stumme
bogstaver. Det er dér dansk gør ondt, selv for en der læser godt:
`meget`, `skønt`, `specielt`, `sikkert`, `ellers`, `næsten`, `sjovt`, `farligt`, `rigtigt`, `færdig`

**Verden 26 — "Mesterskabet"** (10 ord)
Længere sammensatte ord, hvor man skal kunne dele dem for at stave dem:
`sommerfugl`, `fødselsdag`, `jordbær`, `skolegård`, `bibliotek`, `hjemmeve`, `computer`,
`telefon`, `fodboldbane`, `aftensmad`

**Nye monstre (matcher verdenerne):** 25 = 🌲 **Stavelses-trolden** · 26 = 🐉 **Mester-dragen**
(dragen vender tilbage som den sidste — men nu som *final boss*, ikke som alle de andre)

**Lyd:** 20 nye ord × 2 filer = **40 nye lydfiler**. Lægges i `audio/v2/`.

---

## 4. Faldgruber

- **Tempus:** "240 ord" står i titel, fortælling og tests. Skal til 260 — find ALLE steder.
- **Kortet:** `worldMapA`(0-11) + `worldMapB`(12-23). To nye verdener kræver enten en
  **tredje kort-side** eller at de lægges på B-kortet. Kenneth har tidligere insisteret på
  at de to kort skal være **identiske i layout** — så en tredje side bør følge samme mønster.
- **`MAP_POS`** skal have 2 nye positioner, ellers placeres verdenerne oveni hinanden.
- **`SMAAORD` / `SPELL_PATTERNS`:** de nye ord skal ramme de rigtige stave-mønstre
  (fx `meget` → stumt d? `skønt` → stumt t?). Tjek med `patternHintFor()`.
- **Tests:** `ordj_maps.js`, `ordj_monstre.js`, `ordj_data.js`, `ordj_smoke_all.js` og
  `ordj_trappestige.js` har alle antagelser om tallet 24 og 240. De skal opdateres —
  **ikke slettes**.
- **Udtale:** `meget` udtales "majet" — barnet hører noget andet end det staver. Det er
  *meningen* med verden 25, men sætningen skal bære ordet så det kan forstås i kontekst.
