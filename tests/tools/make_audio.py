#!/usr/bin/env python3
"""Regenerer ALLE 480 lydfiler fra den ordliste spillet selv bruger.

BRUG: python3 tests/tools/make_audio.py
Kraever edge-tts (gratis): python3 -m venv /tmp/ttsvenv && /tmp/ttsvenv/bin/pip install edge-tts

HVORFOR DENNE FIL FINDES
Kenneth meldte at "lydfilen siger AT men svaret er DER" i Hoer & Slaa. Vi kan
ikke hoere 480 filer efter, og whisper er upaalidelig paa enkelte danske ord.
Derfor er lyden ALTID genereret af dette script ud fra spillets egen ordliste —
saa kan en fil ikke indeholde et andet ord end filnavnet. Er der tvivl: koer
scriptet igen, saa er lyden per definition i sync med ordlisten."""
import os, json, subprocess, sys, hashlib

D = "/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren"
TTS = "/tmp/ttsvenv/bin/edge-tts"
VOICE = "da-DK-JeppeNeural"

if not os.path.exists(TTS):
    print("FEJL: edge-tts findes ikke"); sys.exit(1)

import re
_html = open(os.path.join(D, "index.html"), encoding="utf-8").read()
_i = _html.index("const WORDS = {")
_j = _html.index("\n};", _i)
_lit = _html[_i + len("const WORDS = "):_j + 2]
WORDS = json.loads(_lit) if _lit.strip().startswith("{") else None
if WORDS is None:
    import subprocess as _sp
    _sp.run(["node", "-e", "const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf-8');"
             "const i=h.indexOf('const WORDS = {');const j=h.indexOf('\\n};',i);"
             "fs.writeFileSync('/tmp/words.json',JSON.stringify(eval('('+h.slice(i+14,j+2)+')'),null,1));",
             os.path.join(D, "index.html")], check=True)
    WORDS = json.load(open("/tmp/words.json", encoding="utf-8"))
print(f"ord fra spillets egen liste: {len(WORDS)}", flush=True)

def gen(text, out):
    subprocess.run([TTS, "--voice", VOICE, "--text", text, "--write-media", out],
                   capture_output=True, timeout=90)

for m in ["audio/words", "audio/sentences"]:
    os.makedirs(os.path.join(D, m), exist_ok=True)

ok_w = ok_s = fejl = 0
gamle = {}
for n, (w, saetning) in enumerate(sorted(WORDS.items()), 1):
    for mappe, tekst, taeller in (("audio/words", w, "w"), ("audio/sentences", saetning, "s")):
        fp = os.path.join(D, mappe, w + ".mp3")
        if os.path.exists(fp):
            gamle[fp] = os.path.getsize(fp)
        try:
            gen(tekst, fp)
            st = os.path.getsize(fp)
            if st > 500:
                if taeller == "w": ok_w += 1
                else: ok_s += 1
            else:
                fejl += 1; print(f"  TOM ({mappe}): {w}", flush=True)
        except Exception as e:
            fejl += 1; print(f"  FEJL ({mappe}) {w}: {e}", flush=True)
    if n % 40 == 0:
        print(f"  ... {n}/{len(WORDS)}  (ord OK {ok_w}, saetninger OK {ok_s})", flush=True)

print(f"\nFAERDIG: {ok_w} ord + {ok_s} saetninger, {fejl} fejl", flush=True)

# Kontrol: er 'der' og 'at' nu forskellige?
a = hashlib.md5(open(os.path.join(D, "audio/words/der.mp3"), "rb").read()).hexdigest()
b = hashlib.md5(open(os.path.join(D, "audio/words/at.mp3"), "rb").read()).hexdigest()
print(f"der.mp3 {os.path.getsize(os.path.join(D,'audio/words/der.mp3'))} b")
print(f"at.mp3  {os.path.getsize(os.path.join(D,'audio/words/at.mp3'))} b")
print("IDENTISKE — STADIG ET PROBLEM" if a == b else "forskellige indhold OK")
