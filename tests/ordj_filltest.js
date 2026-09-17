// Autoritativ test: kør den faktiske blankInSentence-funktion på alle 260 ord
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const m = src.match(/const WORDS = (\{.*?\n\});/s);
const raw = m[1];
const pairs = [...raw.matchAll(/([a-zæøå]+):"([^"]+)"/g)].map(x => [x[1], x[2]]);
console.log('Antal ord:', pairs.length);

// Ekstraher blankInSentence direkte fra scriptet
const fnMatch = src.match(/function blankInSentence[\s\S]*?\n\}/);
if (!fnMatch) { console.log('FEJL: blankInSentence ikke fundet'); process.exit(1); }
const blankInSentence = new Function('return (' + fnMatch[0].replace('function blankInSentence', 'function') + ')')();

let fejl = [];
for (const [w, s] of pairs) {
  const shown = blankInSentence(w, s, '____');
  if (!shown.includes('____')) {
    fejl.push(w + ' → ' + s);
  }
}
if (fejl.length === 0) {
  console.log('OK   alle ' + pairs.length + ' ord får et hul i deres sætning');
} else {
  console.log('FEJL ' + fejl.length + ' ord får IKKE et hul');
  console.log(JSON.stringify(fejl, null, 1));
  process.exit(1);
}
if (pairs.length !== 260) { console.log('FEJL forventede 260 ord, fandt ' + pairs.length); process.exit(1); }
console.log('OK   ordlisten har præcis 260 skrevne nøgler');
