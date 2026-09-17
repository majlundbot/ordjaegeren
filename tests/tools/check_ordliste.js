#!/usr/bin/env node
/* BEVIS-PROGRAM: er ordlisten i index.html konsistent?
 *
 * Kør:  node tests/tools/check_ordliste.js
 *
 * Hvad den kontrollerer (og HVORFOR det er nødvendigt):
 *   1) Antallet af SKREVNE nøgler i WORDS-litteralen. Skrives samme nøgle to gange,
 *      forsvinder den første sporløst i JavaScript — den slags dublet har vi haft
 *      én gang ("over"), og den var usynlig i filen.
 *   2) Antallet af UNIKKE nøgler (Object.keys) og at de to tal er ens.
 *   3) At hver verden har 10 ord, at ORDENE i verdenerne tilsammen er præcis lige så
 *      mange som WORDS (260 = 260), og at intet ord optræder to steder.
 *   4) At hvert ord har BÅDE en ord-lydfil og en sætnings-lydfil i audio/v2/.
 *
 * Exit-kode 0 = alt konsistent, 1 = fejl (så den kan bruges som port i CI).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');

// --- 1) WORDS-litteralen: tæl de SKREVNE nøgler ---------------------------
const wStart = html.indexOf('const WORDS = {');
const wEnd = html.indexOf('const ALL_WORDS');
if (wStart < 0 || wEnd < 0) { console.error('FEJL: kunne ikke finde WORDS-blokken'); process.exit(1); }
const wBlock = html.slice(wStart, wEnd);
const alfabet = 'abcdefghijklmnopqrstuvwxyzæøå0123456789';
const skrevne = [];
let pos = 0;
while ((pos = wBlock.indexOf(':"', pos)) >= 0) {         // hver nøgle står som  noegle:"..."
  let j = pos - 1, k = '';
  while (j >= 0 && alfabet.includes(wBlock[j])) { k = wBlock[j] + k; j--; }
  skrevne.push(k);
  pos += 2;
}
const dubletterSkrevet = skrevne.filter((k, i) => skrevne.indexOf(k) !== i);

// --- 2) De faktiske (unikke) nøgler, som spillet ser dem -----------------
const WORDS = new Function(wBlock.trim().replace(/;$/, '') + '; return WORDS;')();
const unikke = Object.keys(WORDS);

// --- 3) WORLDS: ord pr. verden, dubletter og dækning ---------------------
const lStart = html.indexOf('const WORLDS = [');
const lEnd = html.indexOf('const PROFILES_KEY');
const WORLDS = new Function(html.slice(lStart, lEnd)
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  .trim().replace(/;$/, '') + '; return WORLDS;')();
const verdensord = WORLDS.flatMap(w => w.words || []);
const dubletterVerdener = verdensord.filter((w, i) => verdensord.indexOf(w) !== i);
const manglerIWords = [...new Set(verdensord.filter(w => !(w in WORDS)))];
const ubenyttet = unikke.filter(w => !verdensord.includes(w));
const forkerteStoerrelser = WORLDS.map((w, i) => ((w.words || []).length === 10 ? null : `V${i + 1}:${(w.words || []).length}`)).filter(Boolean);

// --- 4) Lydfilerne ------------------------------------------------------
const mangleLyd = [];
for (const w of unikke) {
  for (const dir of ['words', 'sentences']) {
    const p = path.join(root, 'audio', 'v2', dir, w + '.mp3');
    if (!fs.existsSync(p)) mangleLyd.push(`${dir}/${w}.mp3`);
  }
}

// --- RAPPORT ------------------------------------------------------------
const fejl = [];
if (skrevne.length !== unikke.length) fejl.push(`SKREVNE nøgler (${skrevne.length}) != UNIKKE ord (${unikke.length}) — en nøgle er skrevet to gange`);
if (dubletterSkrevet.length) fejl.push('dubletter i kildekoden: ' + JSON.stringify([...new Set(dubletterSkrevet)]));
if (verdensord.length !== unikke.length) fejl.push(`ord i verdenerne (${verdensord.length}) != ord i WORDS (${unikke.length})`);
if (dubletterVerdener.length) fejl.push('dubletter i verdenerne: ' + JSON.stringify([...new Set(dubletterVerdener)]));
if (manglerIWords.length) fejl.push('ord i en verden men ikke i WORDS: ' + JSON.stringify(manglerIWords));
if (ubenyttet.length) fejl.push('ord i WORDS men ikke i nogen verden: ' + JSON.stringify(ubenyttet));
if (forkerteStoerrelser.length) fejl.push('verdener uden præcis 10 ord: ' + JSON.stringify(forkerteStoerrelser));
if (mangleLyd.length) fejl.push(`lydfiler der mangler (${mangleLyd.length}): ` + JSON.stringify(mangleLyd.slice(0, 10)));

console.log(JSON.stringify({
  skrevne_noegler_i_kildekoden: skrevne.length,
  unikke_ord_i_WORDS: unikke.length,
  dubletter: dubletterSkrevet.length,
  ord_i_verdenerne: verdensord.length,
  antal_verdener: WORLDS.length,
  ord_pr_verden: [...new Set(WORLDS.map(w => (w.words || []).length))],
  ord_uden_lyd: mangleLyd.length,
  konklusion: fejl.length === 0 ? 'KONSISTENT: 260 unikke ord, ingen dubletter' : 'FEJL'
}, null, 2));
if (fejl.length) { fejl.forEach(f => console.error('FEJL: ' + f)); process.exit(1); }
