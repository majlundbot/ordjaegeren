// VAGT: staar hvert ord i sin EGEN saetning?
// Fejlen Kenneth fandt: ordet 'dejligt' stod som 'dejlig' i saetningen, saa hullet
// gav "Det har vaeret en dejligt dag" — forkert dansk. Spillet underviste i en fejl.
const fs = require('fs');
const D = '/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/';
const html = fs.readFileSync(D + 'index.html', 'utf-8');
const wm = html.match(/const WORDS = \{[\s\S]*?\n\};/)[0];

// Noeglerne er uciterede:  ord:"Saetning.",
const par = [];
for (const m of wm.matchAll(/(?:^|[{,]\s*)([a-zæøå]+):"([^"]*)"/gm)) {
  par.push([m[1], m[2]]);
}
console.log('ord i WORDS: ' + par.length);
console.log('');

// Danske boejninger vi accepterer som "ordet staar i saetningen"
function forekomster(ord, saetning) {
  const s = saetning.toLowerCase();
  const o = ord.toLowerCase();
  const kandidater = new Set([o]);
  // regelret boejning: -t, -e, -er, -et, -en, -n
  [o + 't', o + 'e', o + 'er', o + 'et', o + 'en', o + 'n'].forEach(f => kandidater.add(f));
  // og afkortning af -t (dejligt -> dejlig) og -e
  if (o.endsWith('t')) kandidater.add(o.slice(0, -1));
  if (o.endsWith('e')) kandidater.add(o.slice(0, -1));
  if (o.endsWith('er')) kandidater.add(o.slice(0, -2));
  for (const k of kandidater) {
    // ordgraense der ogsaa virker med ae/oe/aa
    const re = new RegExp('(^|[^a-zæøå])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-zæøå]|$)', 'i');
    if (re.test(s)) return k;
  }
  return null;
}

let ok = 0;
const mistanke = [];
for (const [ord, saetning] of par) {
  const f = forekomster(ord, saetning);
  if (!f) { mistanke.push([ord, saetning]); continue; }
  // Er den form der stod i saetningen PRAECIS ordet? Ellers er der en boejnings-forskel
  if (f !== ord) mistanke.push([ord, saetning, f]);
  else ok += 1;
}
console.log('ord der staar ORDRET i egen saetning : ' + ok);
console.log('ord hvor formen AFVIGER               : ' + mistanke.length);
console.log('');
if (mistanke.length) {
  console.log('=== AFVIGELSER (tjek om resultatet bliver korrekt dansk) ===');
  for (const [ord, s, f] of mistanke) {
    console.log('  ord: ' + ord.padEnd(13) + ' form i saetningen: ' + String(f).padEnd(13) + ' -> "' + s + '"');
  }
}
