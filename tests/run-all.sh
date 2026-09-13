#!/bin/bash
# Kør ALLE Ordjægeren-tests. Bruges så vi altid kan verificere at spillet spiller uden fejl.
# Kør:  bash tests/run-all.sh
cd "$(dirname "$0")/.." || exit 1

# 1) Uddrag JS fra index.html (testene kører mod den ekstraherede kildekode)
python3 -c "
import re
html = open('index.html', encoding='utf-8').read()
js = re.search(r'<script>(.*?)</script>', html, re.S).group(1)
open('/tmp/ordj_script.js','w',encoding='utf-8').write(js)
"
if ! node --check /tmp/ordj_script.js 2>/dev/null; then
  echo "❌ JS SYNTAX-FEJL i index.html"; exit 1
fi
python3 -c "
import re
css = re.search(r'<style>(.*?)</style>', open('index.html',encoding='utf-8').read(), re.S).group(1)
print('CSS: ' + ('OK' if css.count('{')==css.count('}') else 'FEJL'))
"

total=0; bad=""
for f in tests/ordj_*.js; do
  r=$(node "$f" 2>&1)
  n=$(echo "$r" | grep -cE "^OK")
  total=$((total+n))
  if echo "$r" | grep -qE "^FEJL|RUNTIME FEJL|is not defined|is not a function"; then
    bad="$bad $(basename $f)"
    printf "%-26s ❌\n" "$(basename $f)"
    echo "$r" | grep -E "^FEJL|RUNTIME" | head -3
  else
    printf "%-26s ✅ %s tests\n" "$(basename $f)" "$n"
  fi
done
echo "════════════════════════════════════"
echo "I ALT: $total tests"
if [ -n "$bad" ]; then echo "❌ FEJL I:$bad"; exit 1; else echo "✅ ALLE PAKKER GRØNNE"; fi