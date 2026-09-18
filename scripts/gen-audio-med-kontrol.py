# -*- coding: utf-8 -*-
"""Regenererer lydfiler med KVALITETS-KONTROL — og langsommere tempo på de små ord.

BAGGRUND (Kenneth 18. sep): spillet sagde "Er", da svaret var "at". Filen fandtes, var
ikke tom og var ikke en dublet — den var AFKLIPPET. edge-tts kan levere et ødelagt klip
for korte tekster: målt på samme tekst gav den 0,82 s med fuld lyd den ene gang og
1,87 s med kun et 0,14 s spike den anden. Tilbage var en kort vokal uden slutkonsonant,
og whisper hørte "Ja?" i stedet for "at".

MÅLET: hvor mange sekunder der er LYDT i klippet (vinduer over 15 % af klipets top).
Det er bedre end "længste sammenhængende lyd", fordi danske ord med lukkelyd (kat, hund)
falder under tærsklen mellem stavelserne.

TEMPO: ord på højst 3 bogstaver er funktionsord (at, er, i, på, og ...). Talt alene er de
en kort vokal, og barnet kan ikke høre hvilket ord det er. Med --rate=-15% bliver vokalen
mærkbart længere (målt på "at": 0,14 s → 0,26 s lyd, og whisper hører "At." i stedet for
"Ia?"). Længere ord tales i normalt tempo — ellers lyder spillet slæbende.

KØR:
  python3 scripts/gen-audio-med-kontrol.py alt            # alle 720 filer
  python3 scripts/gen-audio-med-kontrol.py svage          # kun dem der er for tynde i dag
  python3 scripts/gen-audio-med-kontrol.py words           # kun ord-klip (alle)
"""
import array, os, re, subprocess, sys

ROOT = "/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren"
TTS = "/Users/kennethmajlund/.hermes/hermes-agent/venv/bin/edge-tts"
VOICE = "da-DK-JeppeNeural"
MAX_FORSOEG = 6
LANGSOM_TEKST = 3        # ord på højst 3 bogstaver tales langsommere
LANGSOM_RATE = "-15%"

def lydtid(f, n=100):
    """(varighed, sekunder med lyd) for en lydfil."""
    pcm = subprocess.run(["ffmpeg", "-v", "quiet", "-i", f, "-f", "s16le", "-ac", "1",
                          "-ar", "16000", "-"], capture_output=True).stdout
    a = array.array('h'); a.frombytes(pcm[:len(pcm) // 2 * 2])
    if len(a) == 0:
        return (0.0, 0.0)
    dur = len(a) / 16000.0
    w = max(1, len(a) // n)
    rms = [sum(float(x) * x for x in a[i * w:(i + 1) * w]) / w for i in range(n)]
    m = max(rms) or 1
    rel = [(x / m) ** .5 for x in rms]
    aktive = sum(1 for x in rel if x > 0.15)
    return (round(dur, 3), round(aktive * dur / n, 3))

def krav_ord(ord_):
    # korte funktionsord skal have mere lyd: de er dem der forveksles
    return 0.20 if len(ord_) <= LANGSOM_TEKST else 0.24

def krav_saetning(s):
    return max(0.55, 0.030 * len(s))

def krav_for(navn, mappe):
    return krav_ord(navn) if mappe == "words" else krav_saetning(navn)

def er_svag(navn, mappe):
    """Til 'svage'-kørslen: hvilke filer fortjener en ny generering?
    - ord på højst 3 bogstaver under 0,20 s lyd (dem barnet forveksler)
    - længere ord under 0,10 s lyd (så tynde at de er brudte)
    - sætninger under 0,55 s lyd (kan ikke høres)
    - filer der slet ikke findes"""
    f = os.path.join(ROOT, "audio/v2", mappe, navn + ".mp3")
    if not os.path.exists(f):
        return True
    t = lydtid(f)[1]
    if mappe == "words":
        return t < (0.20 if len(navn) <= LANGSOM_TEKST else 0.10)
    return t < 0.55

def generer(tekst, udfil, krav, navn, rapport, langsom):
    forsoeg = 0
    bedste = None
    if os.path.exists(udfil):
        d, t = lydtid(udfil)
        bedste = (udfil, t, d)
    for forsoeg in range(1, MAX_FORSOEG + 1):
        tmp = "/tmp/_tts_kandidat.mp3"
        cmd = [TTS, "--voice", VOICE]
        if langsom:
            cmd += ["--rate=" + LANGSOM_RATE]
        cmd += ["--text", tekst, "--write-media", tmp]
        r = subprocess.run(cmd, capture_output=True, timeout=120)
        if r.returncode != 0 or not os.path.exists(tmp):
            continue
        dur, t = lydtid(tmp)
        if t > bedste[1]:
            subprocess.run(["cp", tmp, udfil])
            bedste = (tmp, t, dur)
        if bedste[1] >= krav:
            break
    ok = bedste[1] >= krav
    rapport.append((navn, forsoeg, bedste[1], krav, "OK" if ok else "TYND", langsom))
    return ok

def main():
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    start = html.index("const WORDS = {")
    end = html.index("const ALL_WORDS")
    block = re.sub(r"/\*[\s\S]*?\*/", "", html[start:end])
    ORD = dict(re.findall(r'([a-zæøå]+):"([^"]*)"', block))
    hvad = sys.argv[1] if len(sys.argv) > 1 else "alt"
    rapport = []

    def skal_med(mappe, navn):
        if hvad == "words" and mappe != "words":
            return False
        if hvad == "sentences" and mappe != "sentences":
            return False
        if hvad == "svage":
            return er_svag(navn, mappe)
        return True

    for i, (o, saetning) in enumerate(sorted(ORD.items()), 1):
        if skal_med("words", o):
            generer(o, os.path.join(ROOT, "audio/v2/words", o + ".mp3"), krav_ord(o),
                    "words/" + o, rapport, len(o) <= LANGSOM_TEKST)
        if skal_med("sentences", o):
            generer(saetning, os.path.join(ROOT, "audio/v2/sentences", o + ".mp3"),
                    krav_saetning(saetning), "sentences/" + o, rapport, False)
        if i % 40 == 0:
            print("%3d/%d" % (i, len(ORD)), flush=True)
    svage = [r for r in rapport if r[4] == "TYND"]
    with open("/tmp/lydfix_rapport.txt", "w", encoding="utf-8") as f:
        f.write("FILER: %d · prøvet mere end én gang: %d · stadig tynde: %d · talt langsomt: %d\n\n"
                % (len(rapport), len([r for r in rapport if r[1] > 1]), len(svage),
                   len([r for r in rapport if r[5]])))
        for r in sorted(svage, key=lambda x: x[2]):
            f.write("  TYND  %-20s lyd=%.3f krav=%.3f%s\n" % (r[0], r[2], r[3], "  (langsom)" if r[5] else ""))
        f.write("\nALLE (navn, forsøg, lyd-sekunder, krav, status, langsom):\n")
        for r in rapport:
            f.write("  %-24s %d  %.3f  %.3f  %-4s %s\n" % (r[0], r[1], r[2], r[3], r[4], "langsom" if r[5] else ""))
    print("FILER: %d · gentagne forsøg: %d · stadig tynde: %d" % (len(rapport), len([r for r in rapport if r[1] > 1]), len(svage)))
    print("Rapport: /tmp/lydfix_rapport.txt")

if __name__ == "__main__":
    main()
