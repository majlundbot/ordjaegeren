# Side B bliver «Den forbudte skov» — farlige skovvæsner

Kenneth, 18. sep (efter at have set den udsendte version):
> *"Galaksen og Mester Riget er fedt. Ord akademiet er svagt. Det skal være Den forbudte
> skov, men farlige skov væsner."*

Så: side A (🌌 Galaksen) og side C (🌑 Underverdenen / Mester-riget) står uændret.
Side B bygges helt om. Dette dokument er skrevet **før** koden.

---

## 1. Hvorfor den var svag — det kan peges på præcis

Side B var "Ord-akademiet": en *kategori* (let/svært), ikke et sted. Og dens 12 verdener var
**emne-labels**: "Bog-klassen", "Mad-markedet", "Tøj-kammeret", "Krop-værkstedet" — en liste
af skoleemner, ikke steder man kan gå ind i. Monstrene var den *samme* logik: en sok i
tøj-verdenen, en muskel i krop-verdenen, en ballon i lege-verdenen. Der er ingen fare, ingen
historie og ingen overraskelse — barnet ved alt før det åbner kortet. Det er derfor det føles
fladt. (Verden 14 var endda direkte forkert: navnet sagde skrive-værksted, ordene var hus-ord.)

## 2. Valget: én historie i stedet for 12 emner

**🌲 Den forbudte skov** — skoven man ikke må gå ind i, og de væsner der bor i den.
Hvert sted er nu et *sted i skoven*, og hvert monster er en **farlig skovskabning**. Ordene
i hver verden er uændrede — de er stadig skole-ord, hus-ord, dyre-ord osv. — men de bliver
nu lært på et farligt sted. Rammerne er: *Du går ind i skoven for at hente ordene tilbage.*

Side B er dermed også sværere i stemning end side A og bygger op til side C: **ud i rummet →
ind i den forbudte skov → ned i underverdenen**.

## 3. De 12 verdener og deres væsner

| # | Ordene handler om | Verden (nyt navn) | Ikon | Boss | Boss-ikon | Skabning |
|---|---|---|---|---|---|---|
| 13 | skole (`skole, bog, læse …`) | **Den glemte skole** | 📚 | Bogsnapperen *(uændret)* | 📚 | Bog-monster, der har spist skolens bøger |
| 14 | hus (`hus, køkken, stue …`) | **Den forladte hytte** | 🏠 | Hustrolden *(uændret)* | 🏠 | Hus-trold i den tomme hytte |
| 15 | familie (`familie, bror, søster …`) | **Troldebakken** | 👪 | Troldefamilien *(uændret)* | 👪 | Tre trolde — en *flok*, som en familie |
| 16 | dyr (`hund, kat, hest …`) | **Vilddyrenes sti** | 🦊 | Ræven *(uændret)* | 🦊 | En stor, sulten ræv på stien |
| 17 | leg (`bold, cykel, lege …`) | **Den glemte legeplads** | 🕷️ | **Spindelvæveren** | 🕷️ | Kæmpeedderkop, der har spundet legepladsen ind |
| 18 | mad (`mad, mælk, brød …`) | **Svampe-markedet** | 🐗 | **Vildsvinet** | 🐗 | Glubsk vildsvin ved skovens marked |
| 19 | tøj (`tøj, trøje, bukser …`) | **Tøj-hulen** | 🦋 | **Natsværmeren** | 🦋 | Kæmpe natsværmer, der spiser tøj om natten |
| 20 | krop (`krop, hoved, hår …`) | **Knogleskoven** | 👁️ | **Mangeøjet** | 👁️ | Væsen af øjne og knogler — ét for hver kropsdel |
| 21 | natur (`sol, måne, stjerne …`) | **Den vilde natur** | 🐸 | Frøen *(uændret)* | 🐸 | En kæmpefrø i skovens sump |
| 22 | udsagnsord (`spise, sove, bygge …`) | **Jagt-stien** | 🐆 | **Skyggeløberen** | 🐆 | Rovdyr der jager langs stien |
| 23 | tid (`dag, nat, morgen …`) | **Tidens træ** | ⏰ | Urmonstret *(uændret)* | ⏰ | Mosgroet træ-ur: et vækkeur der er groet fast i skoven |
| 24 | følelser (`glad, trist, bange …`) | **Følelses-skoven** *(uændret)* | 😊 | Følelsernes Kejser *(uændret)* | 😊 | Skovens sidste vogter — ét ansigt pr. følelse |

**7 bosser beholder navn og ikon** (deres navne passer i skoven), **5 er nye skabninger**
fordi de gamle slet ikke var skovvæsner: Ballonmonstret → Spindelvæveren, Madmonstret →
Vildsvinet, Sokkemonstret → Natsværmeren, Muskelmonstret → Mangeøjet, Hurtigløberen →
Skyggeløberen.

**7 verdensnavne er nye**; 4 var allerede på plads (Troldefamilien/Familiens hus er nu
"Troldebakken" — nej, se tabellen: `Vilddyrenes sti`, `Tøj-hulen`, `Den vilde natur` og
`Tidens træ` beholder de ord, der binder dem til deres tema, og `Følelses-skoven` er
uændret fordi navnet allerede ER en skov).

## 4. Bagrunden: skoven skal kunne SES

`pageBackdropMarkup("forbudtSkov")` tegner (faste tal, ingen tilfældighed): knitrende
træstammer i silhuet langs siderne, tågebånd mellem dem, rødder ved bunden, hængende
slyngplanter, et **brudt hegn/port** — og et par **lysende øjne i mørket** mellem stammerne.
Himlen: næsten sort med en kold grøn tone. Farvetone over terrænet: mørk grøn, så det gamle
terræn bliver en del af skoven.

## 5. Hvad det koster i aftaler (og hvorfor det er i orden)

Kenneths beslutning ændrer indhold, og 3 eksisterende testfiler peger på det gamle indhold.
Jeg opdaterer **kun de linjer der beskriver den gamle tekst** — ingen dækning fjernes:

| Fil | Linje | Før | Efter |
|---|---|---|---|
| `tests/ordj_maps.js` | 101 | titlen er "Ord-akademiet" | titlen er "Den forbudte skov" |
| `tests/ordj_maps.js` | 65 | kort B indeholder "Bog-klassen" | indeholder "Den glemte skole" |
| `tests/ordj_maps.js` | 72 | kort A har IKKE "Bog-klassen" | har IKKE "Den glemte skole" |
| `tests/ordj_monstre.js` | VENTET 16,17,18,19,21 | Ballon-, Mad-, Sokke-, Muskel-, Hurtigløber | Spindelvæveren, Vildsvinet, Natsværmeren, Mangeøjet, Skyggeløberen |
| `tests/ordj_monstre.js` | tema-række 18 | 'Sokkemonstret' | 'Natsværmeren' |
| `tests/ordj_v2smoke.js` | 26 | WORLDS[12] = 'Bog-klassen' | 'Den glemte skole' |

Alle andre kontrakter står urørt: 36 bosser, 36 unikke ikoner, 360 ord (10 pr. verden),
stigende kraft, kun én drage, tre kort-sider med 12 verdener hver.

## 6. Testene der skal fange det nye

`tests/ordj_verdener.js` udvides: side B's 12 skabninger skal være **skovvæsner**, og
hvert sted på siden skal være et sted i skoven (navnet må ikke være et skoleemne som
"Tøj-kammeret"). Der lægges en ny mutation ind: hvis et af de gamle skoleemne-navne
kommer tilbage, skal testen fejle.
