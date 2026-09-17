# Stavelses-visningen i fejl-tilbagemeldingen

Kenneth: *"jeg fangede næsten ikke at du havde skrevet ord i stavelser hvilket er rigtig godt"*

Det er den vigtigste sætning i hele denne opgave. Funktionen fandtes, virkede — og blev
ikke set. En pædagogisk funktion man ikke ser, findes ikke.

---

## 1. Hvad der var galt (målt i koden, ikke gættet)

Fejl-tilbagemeldingen blev bygget som én tekstlinje, fx i Hør & Slå:

```html
Det rigtige ord var: <span class='big-red'>dejlig</span> <span class='syllables'>dej-lig</span>
```

- `.big-red` (linje 459): `font-size: 1.5em; font-weight: 900` — **ordet**
- `.syllables` (linje 461): `font-size: 1.35em; margin-left: 6px` — **opdelingen**

To ting gik galt samtidigt:

1. **Opdelingen var MINDRE end ordet** (1.35em mod 1.5em). Det undervisende element var
   det mindste element. Øjet lander på "ordet er forkert" — og dommen er ikke undervisning.
2. **Den stod på samme linje, klemt ind ved siden af** ordet, adskilt med ét mellemrum.
   Hjernen læser "dejlig dej-lig" som én gentagelse, ikke som en opdeling.

Dertil: der var **ingen forklaring**. Barnet fik `dej-lig` uden at vide hvad det skulle
bruge det til. En bindestreg er en tegnsætnings-regel, ikke en læse-strategi.

## 2. Kontrakten (hvad der skal være sandt bagefter)

1. **Opdelingen er det STØRSTE element i fejl-tilbagemeldingen.** Større end det røde ord.
   Ordet er dommen; opdelingen er undervisningen. Det er dér blikket skal lande.
2. **Hver stavelse i sin egen kasse** med tydelig luft imellem — ikke bindestreger i en
   tekstlinje. Kasser kan man tælle, klappe og pege på. En bindestreg kan man overse.
3. **En linje der forklarer hvad man skal bruge det til**: *"Del ordet op: dej · lig"*.
   Uden den er kasserne bare en sjov form.
4. **Stavelserne kommer i rækkefølge** og læses som ordet: `dej · lig` = "dejlig".
5. Det skal se godt ud på en iPad (820 px bred, høj DPI) — ikke kun i et desktop-vindue.
6. **Den gamle lineære form `dej-lig` bevares som usynlig tekst for skærmlæsere.**
   En skærmlæser kan ikke læse to kasser ved siden af hinanden; den skal have ordet
   skrevet ud i én streng. Se kommentaren i `syllableFeedbackHtml`.

## 3. Hvor det skal ske

Fejl-tilbagemeldingen findes tre steder (og kun tre — `Forstå det!` har ingen stavelse):

| Sted | Element | Før |
|---|---|---|
| 👂 Hør & Slå | `#hearStatus` | "Det rigtige ord var: …" |
| ⌨️ Fang ordet | `#typeStatus` + `#typeHint` | "Ordet staves i stavelser: …" |
| 🧩 Sætnings-gåden | `#fillStatus` | "Rigtige ord: …" |

Alle tre skal skifte til den nye blok. Det gør de gennem **én** funktion,
`syllableFeedbackHtml(word)`, så formen ikke kan drive fra hinanden igen.

## 4. Formen

```
Del ordet op:
┌───────┐   ┌───────┐
│  dej  │ · │  lig  │
└───────┘   └───────┘
Klap ordet mens du siger det 👏
```

- Kasserne: `font-size: clamp(34px, 9.5vw, 58px)` — i praksis 2-3× større end
  `.big-red` (1.5em ≈ 24 px i panelet). Kravet "størst" måles direkte i testen ved at
  læse de to `font-size`-værdier og kræve at kassernes `clamp`-minimum er større end
  ordets maksimum, når begge gøres til px.
- Farveskift guld/rød pr. stavelse (genbrugt fra `syllableHtml`): grænsen bliver synlig
  uden at man skal læse bindestregen.
- Kassen har sin egen baggrund, ramme og skygge, så den ikke smelter sammen med panelet.

## 5. Testen der fanger FORMÅLET

`tests/ordj_stavelser.js` måler ikke "findes elementet". Den måler det der gik galt:

| Test | Hvad den fanger |
|---|---|
| **"stavelserne er STØRRE end det røde ord"** | Fejlen fra i dag: elementet fandtes, men var mindre end ordet. Testen udregner px fra begge `font-size`-regler og kræver `syl > word`. Den er rød på den gamle kode. |
| **"hver stavelse har sin egen kasse"** | Kræver én `.syl-box` pr. stavelse — ikke én span med bindestreger. Antallet af kasser skal være lig `syllabify(word).length`. |
| **"der er en forklarende linje"** | Kræver teksten "Del ordet op" i fejl-markup. Uden forklaring er kasserne dekoration. |
| **"blokken er ikke på samme linje som ordet"** | Kræver at markup indeholder et blok-element (`div`/`p`) mellem ordet og kasserne — den gamle fejl var netop "klemt ind ved siden af". |
| **"kasserne står i rækkefølge"** | `syl-box`-teksterne sat sammen i rækkefølge skal give ordet. Ellers kan en stavelse byttes om uden at testen opdager det. |
| **"skærmlæser-formen bevares"** | `dej-lig` findes som usynlig tekst, så den lineære læsning ikke går tabt. |

Spørgsmålet fra reglerne — *"kan et barn vinde uden at gøre arbejdet?"* — har her en
anden form: **kan et barn svare forkert uden at få undervisningen?** Ja, hvis opdelingen
er mindre end ordet. Det er præcis hvad test 1 måler.
