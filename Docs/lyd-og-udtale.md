# Lyden skal kunne HØRES — og små ord skal siges i sammenhæng

Kenneth (18. sep), med skærmbillede fra "Fang ordet" hvor svaret var `at` og barnet skrev `er`:
> *"Denne laver fejl. den siger 'Er, jeg elsker AT spise is'."*

*(Dokumentet er skrevet efter de første målinger og før den endelige løsning blev låst —
så reglerne herunder bygger på tal, ikke på en fornemmelse.)*

## 0. Det målte

"Fang ordet" spiller **ordet alene**, derefter sætningen. For `at` (verden 1) hørtes:

```
ord-klip  : audio/v2/words/at.mp3      -> whisper: "Ja?"      0,137 s lyd (ét spike)
sætningen : audio/v2/sentences/at.mp3  -> whisper: "Jeg elsker at spise is."   ✔
```

Filen fandtes, var ikke tom, var ikke en dublet af en anden fil — og alligevel var den
ubrugelig. Den var **afklippet**: der var kun en kort vokal tilbage. Et *helt* klip af
samme ord (genereret forfra) blev hørt som "at" af whisper.

Årsagen ligger hos edge-tts: samme tekst gav 0,82 s med fuld lyd den ene gang og 1,87 s
med et 0,14 s spike den anden. Alle 360 ord-klip var i første omgang genereret i én
buld, så en tilfældig dårlig udgave kunne ende i spillet.

**Derfor kunne ingen af de gamle kontroller fange den:** de tjekkede at filen *fandtes*
og var *ikke-tom* — ikke at der var *lyd* i den.

## 1. Reglerne

**Regel 1 — et klip skal kunne høres.** Ved generering måles hvor mange sekunder der er
lyd i klippet (vinduer over 15 % af klippets top). Er der for lidt, prøver generatoren
igen (op til 6 gange) og gemmer det forsøg med mest lyd.

| Klip | Krav til lyd i klippet |
|---|---|
| ord på 1-3 bogstaver | 0,20 s |
| ord på 4+ bogstaver | 0,24 s |
| sætning | max(0,55 s; 0,03 s pr. tegn) |

**Regel 2 — små ord siges langsommere.** Ord på højst 3 bogstaver er funktionsord
(`at, er, i, på, og` …). Talt alene er de én kort vokal. Med `--rate=-15%` bliver vokalen
mærkbart længere: målt på `at` gik lyden fra 0,14 s til **0,26 s**, og whisper hørte
"At." i stedet for "Ja?". Længere ord tales i normalt tempo — ellers lyder spillet slæbende.

**Regel 3 — de korteste ord høres i sammenhæng først.** Ord på højst 2 bogstaver
(`at, er, i, en, og, du, vi, på` …) er ikke til at skelne alene, uanset hvor fin filen er:
det er én vokal. For dem spilles **sætningen først** ("jeg elsker at spise is" — ordet
står tydeligt i konteksten), og bagefter ordet alene som bekræftelse. Ord på 3+ bogstaver
har en tydelig konsonantramme (`kat`, `sol`, `mor`) og kører som før: ordet først, så
sætningen. Grænsen ligger i koden som `LYD_KORT_ORD = 2`.

## 2. Sådan retter man lyden (værktøjet)

```
python3 scripts/gen-audio-med-kontrol.py alt      # alle 720 filer
python3 scripts/gen-audio-med-kontrol.py svage    # kun dem der er for tynde i dag
python3 scripts/gen-audio-med-kontrol.py words    # kun ord-klip
```
Kilden er `index.html` selv, så lyd og ordliste ikke kan komme ud af trit. Rapport skrives
til `/tmp/lydfix_rapport.txt` (hvor mange forsøg hver fil krævede).

**Vigtigt:** tekst og lyd er ÉN ting. Retter man en sætning i `WORDS`, skal lydfilen
genereres om — ellers siger teksten ét og stemmen noget andet (se `Docs/saetnings-regel.md`).

## 3. Testene der holder det fast

`tests/ordj_lydkvalitet.js` måler **lyden** i alle 720 filer: mindst 0,08 s lyd i hvert
ord-klip og 0,45 s i hver sætning.

**Hvad testen kan — og ikke kan (ærligt):** den fanger filer der er tavse eller næsten
tavse, altså direkte brudte filer. Den kan *ikke* afgøre om et isoleret "at" lyder som
"at": den fil Kenneth hørte, havde 0,131 s lyd, den nuværende har 0,168 s — talmæssigt tæt
på, mens whisper hørte "Ja?" i den ene. **Den ægte beskyttelse er rækkefølgen** (regel 3),
og den testes separat og binært. Lydmålingen er sikkerhedsnettet, ikke helten.

`tests/ordj_saetninger.js` måler **rækkefølgen** barnet hører:
- for `at`: `sentences/at.mp3` → `words/at.mp3` (kontekst først)
- for `hund`: `words/hund.mp3` → `sentences/hund.mp3` (som før)

Bevis: mutationer i begge pakker (bytter man rækkefølgen tilbage, fejler saetninger-pakken).
