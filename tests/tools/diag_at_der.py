#!/usr/bin/env python3
"""Diagnose: at/der-problemet i Ordjægeren.

Tre spor der kan forklare at barnet hører/ser det forkerte ord:
  1) Sætninger der indeholder BAADE "at" og "der" -> hullet kan blive tvetydigt
  2) Ord hvis saetning indeholder "at"/"der" uden at vaere det ord
  3) Lydfiler: passer filen til den tekst den skulle laeses fra?
"""
import re, io, os, subprocess, glob

D = "/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren"
h = io.open(os.path.join(D, "index.html"), encoding="utf-8").read()
pairs = re.findall(r'([a-zæøå]+):"([^"]*)"',
                   re.search(r"const WORDS = \{(.*?)\n\};", h, re.S).group(1))
WORDS = dict(pairs)
print(f"ord i listen: {len(WORDS)}")

# --- 1) Saetninger med baade "at" og "der" ---
both = [(w, s) for w, s in WORDS.items()
        if re.search(r"(?:^|[^a-zæøå])at(?:[^a-zæøå]|$)", s, re.I)
        and re.search(r"(?:^|[^a-zæøå])der(?:[^a-zæøå]|$)", s, re.I)]
print(f"\n=== 1. Saetninger med BAADE 'at' og 'der' : {len(both)} ===")
for w, s in both:
    print(f"   {w:9s} \"{s}\"")

# --- 2) Hvilke ord har at/der i deres saetning ---
def has(s, word):
    return bool(re.search(r"(?:^|[^a-zæøå])" + word + r"(?:[^a-zæøå]|$)", s, re.I))
with_at = [(w, s) for w, s in WORDS.items() if has(s, "at")]
with_der = [(w, s) for w, s in WORDS.items() if has(s, "der")]
print(f"\n=== 2. Saetninger der indeholder 'at' : {len(with_at)} ===")
for w, s in with_at: print(f"   {w:9s} \"{s}\"")
print(f"\n     Saetninger der indeholder 'der' : {len(with_der)} ===")
for w, s in with_der: print(f"   {w:9s} \"{s}\"")

# --- 3) Er ordene overhovedet med i ordlisten som selvstaendige ord? ---
print("\n=== 3. findes 'at' og 'der' som egne ord? ===")
for w in ("at", "der"):
    print(f"   {w}: {'JA' if w in WORDS else 'NEJ'}  -> saetning: \"{WORDS.get(w, '(mangler)')}\"")

# --- 4) Lydfiler: findes de, og hvor lange er de? ---
def dur(p):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", p], capture_output=True, text=True, timeout=20)
        return float(r.stdout.strip())
    except Exception:
        return None

print("\n=== 4. lydfiler for at/der ===")
for w in ("at", "der"):
    for kind in ("words", "sentences"):
        p = os.path.join(D, "audio", kind, w + ".mp3")
        ex = os.path.exists(p)
        d = dur(p) if ex else None
        sz = os.path.getsize(p) if ex else 0
        txt = WORDS.get(w, "") if kind == "sentences" else w
        print(f"   {kind}/{w}.mp3: {'findes' if ex else 'MANGLER'}  {sz:6d} b  {('%5.2f s' % d) if d else '  -  '}  skal sige: \"{txt}\"")

# --- 5) Alle ord: mangler deres lydfil? ---
missing = []
for w in WORDS:
    for kind in ("words", "sentences"):
        if not os.path.exists(os.path.join(D, "audio", kind, w + ".mp3")):
            missing.append(kind + "/" + w)
print(f"\n=== 5. ord uden lydfil: {len(missing)} ===")
print("   " + (", ".join(missing[:20]) if missing else "ingen"))