#!/usr/bin/env python3
"""Er lydfilen for 'at' i virkeligheden ordet 'er'?

Kenneth: "Hør og slå. Den siger ER og det rigtige svar er AT."
Hypotese: de forudgenererede MP3'er blev lavet i bulk, og to nabostammer
kan vaere byttet om. 'er' og 'at' ligger begge i verden 1.
"""
import os, subprocess, glob

D = "/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren"
TTS = "/tmp/ttsvenv/bin/edge-tts"
OUT = "/tmp/tts_check"
os.makedirs(OUT, exist_ok=True)

def dur(p):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", p], capture_output=True, text=True, timeout=25)
        return round(float(r.stdout.strip()), 2)
    except Exception:
        return None

# --- 1) Hvad ligger der i de smaa funktionsord fra verden 1? ---
print("=== lagrede lydfiler (verden 1: jeg det er du ikke at i en og har) ===")
for w in ["jeg", "det", "er", "du", "ikke", "at", "i", "en", "og", "har"]:
    p = os.path.join(D, "audio/words", w + ".mp3")
    if os.path.exists(p):
        print(f"   {w:6s} {os.path.getsize(p):6d} b   {dur(p)} s")
    else:
        print(f"   {w:6s} MANGLER")

# --- 2) Generer friske udtaler af de samme ord og sammenlign ---
print("\n=== friske udtaler (edge-tts da-DK-JeppeNeural) ===")
if not os.path.exists(TTS):
    print("   ttsvenv findes ikke — kan ikke sammenligne")
else:
    for w in ["er", "at", "der", "det"]:
        out = os.path.join(OUT, w + ".mp3")
        try:
            subprocess.run([TTS, "--voice", "da-DK-JeppeNeural", "--text", w,
                            "--write-media", out], capture_output=True, timeout=60)
        except Exception as e:
            print(f"   {w}: fejl {e}")
            continue
        lagret = os.path.join(D, "audio/words", w + ".mp3")
        print(f"   {w:6s} frisk: {os.path.getsize(out):6d} b  {dur(out)} s    |  "
              f"lagret: {os.path.getsize(lagret):6d} b  {dur(lagret)} s" if os.path.exists(lagret)
              else f"   {w:6s} frisk: {dur(out)} s")

# --- 3) Sammenlign BYTE for byte: er 'at' identisk med en frisk 'er'? ---
print("\n=== kryds-tjek: hvilken frisk fil ligner den lagrede 'at' mest? ===")
lagret_at = os.path.join(D, "audio/words/at.mp3")
if os.path.exists(lagret_at):
    import hashlib
    h_at = hashlib.md5(open(lagret_at, "rb").read()).hexdigest()
    for w in ["er", "at", "der", "det"]:
        f = os.path.join(OUT, w + ".mp3")
        if os.path.exists(f):
            h = hashlib.md5(open(f, "rb").read()).hexdigest()
            print(f"   frisk '{w}': {h[:12]}   {'<-- IDENTISK med lagret at' if h == h_at else ''}")
    print(f"   lagret 'at': {h_at[:12]}")
    print(f"   lagret 'at' stoerrelse: {os.path.getsize(lagret_at)} b")
