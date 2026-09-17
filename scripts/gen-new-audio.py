# -*- coding: utf-8 -*-
"""Genererer de 200 nye lydfiler (100 ord + 100 sætninger) for verden 27-36.
Kør:  python3 scripts/gen-new-audio.py
Kilden er index.html selv, så lyd og ordliste ikke kan komme ud af trit.
"""
import json, os, re, subprocess, sys

ROOT = "/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren"
TTS = "/tmp/ttsvenv/bin/edge-tts"

html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
start = html.index("const WORDS = {")
end = html.index("const ALL_WORDS")
block = html[start:end]
block = re.sub(r"/\*[\s\S]*?\*/", "", block)          # fjern kommentarer
par = re.findall(r'([a-zæøå]+):"([^"]*)"', block)
ORD = dict(par)
assert len(ORD) == len(par), "dubletter i WORDS"

# kun de nye verdener (27-36) skal have lyd nu
wstart = html.index("const WORLDS = [")
wend = html.index("const PROFILES_KEY")
wl = re.sub(r"/\*[\s\S]*?\*/", "", html[wstart:wend])
verdener = re.findall(r'name:"([^"]+)"[\s\S]*?words:\[([^\]]*)\]', wl)
nye = []
for name, words in verdener[26:36]:
    nye += [w.strip().strip('"') for w in words.split(",")]
assert len(nye) == 100, len(nye)

fejl = []
for i, ord in enumerate(nye, 1):
    for mappe, tekst in (("words", ord), ("sentences", ORD[ord])):
        ud = os.path.join(ROOT, "audio/v2", mappe, ord + ".mp3")
        if os.path.exists(ud) and os.path.getsize(ud) > 0:
            continue
        r = subprocess.run([TTS, "--voice", "da-DK-JeppeNeural", "--text", tekst,
                            "--write-media", ud], capture_output=True, timeout=120)
        if r.returncode != 0 or not os.path.exists(ud):
            fejl.append(ord + "/" + mappe + " :: " + r.stderr.decode()[:120])
    print("%3d/100 %s" % (i, ord), flush=True)

print("FEJL:" if fejl else "ALLE 200 LYDFILER OK")
for f in fejl:
    print("  " + f)
sys.exit(1 if fejl else 0)
