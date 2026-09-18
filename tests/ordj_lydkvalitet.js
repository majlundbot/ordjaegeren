// LYDKVALITET: hvert klip skal kunne HØRES — ikke bare findes.
//
// BAGGRUND (Kenneth 18. sep, "Fang ordet"): spillet sagde "Er", da svaret var "at".
// Filen fandtes, var ikke tom og var ikke en dublet — den var AFKLIPPET: edge-tts leverer
// ind imellem et ødelagt klip for korte tekster (samme tekst gav 0,82 s med fuld lyd den
// ene gang og 1,87 s med kun et 0,14 s spike den anden). Ingen gammel kontrol fangede det,
// fordi de målte om filen FANDTES, ikke om der var lyd i den.
//
// MÅLET er TALE-TID: klipets længde minus stilhed, målt med ffmpeg silencedetect
// (-35 dB, huller over 0,15 s). Det er en standard-måling og slår ikke ud på en enkelt
// lukkelyd, sådan som en peak-normaliseret RMS gør.
//
// HVAD TESTEN KAN — OG IKKE KAN (ærligt):
//   Sætninger: de skal have mindst 0,35 s tale (median 1,3 s). Grænsen er reel: en
//     afklippet sætning bliver fanget — se mutationen i commit-beskeden.
//   Ord: tærsklen er 0,08 s — altså et sikkerhedsnet mod tavse/brudte filer. Den kan IKKE
//     afgøre om et isoleret "at" lyder som "at": den fil barnet hørte, havde 0,149 s tale,
//     den nuværende har 0,176 s. Talt alene ER et dansk funktionsord bare en kort vokal.
//     Den ægte beskyttelse mod forvekslingen er RÆKKEFØLGEN — for ord på højst 2 bogstaver
//     spilles sætningen først (se tests/ordj_saetninger.js) — plus at små ord tales
//     langsommere (scripts/gen-audio-med-kontrol.py, --rate=-15%).
//   Denne test er sikkerhedsnettet, ikke helten. Den skriver også de målte tal ud, så man
//   kan se udviklingen uden at gætte.
//
// Kræver ffmpeg. Findes den ikke, springes målingen over med en ærlig linje.
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ord = {};
const keys = [];
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  const blok = html.slice(html.indexOf('const WORDS = {'), html.indexOf('const ALL_WORDS'));
  const re = /([a-zæøå]+):"([^"]*)"/g;
  let m;
  while ((m = re.exec(blok))) { ord[m[1]] = m[2]; keys.push(m[1]); }
}

let fejl = 0;
const linje = (ok, tekst, detalje) => {
  if (!ok) fejl++;
  console.log((ok ? 'OK   ' : 'FEJL ') + tekst + (!ok && detalje !== undefined ? ' :: ' + detalje : ''));
};

console.log('--- Lydkvalitet: ' + keys.length + ' ord ---');
linje(keys.length === 360, 'ordbogen har 360 ord', keys.length);

function harFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
}
if (!harFfmpeg()) {
  linje(true, 'lydkvalitet: SPRUNGET OVER — ffmpeg findes ikke på maskinen');
  console.log('\nLYDKVALITET (sprunget over)');
  process.exit(0);
}

// Tale-tid = varighed minus stilhed (ffmpeg silencedetect, -35 dB, huller > 0,15 s)
function taletid(fil) {
  // ffmpeg skriver sine målinger til STDERR — derfor spawnSync og res.stderr
  const res = spawnSync('ffmpeg', ['-v', 'info', '-i', fil, '-af', 'silencedetect=noise=-35dB:d=0.15', '-f', 'null', '-'],
    { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
  const ud = res.stderr || '';
  const m = ud.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) return 0;
  const dur = parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
  let tavs = 0;
  const re = /silence_duration: ([\d.]+)/g;
  let t;
  while ((t = re.exec(ud))) tavs += parseFloat(t[1]);
  return Math.max(0, dur - tavs);
}

const svageOrd = [];
const maalte = [];
keys.forEach(k => {
  const fil = path.join(ROOT, 'audio/v2/words', k + '.mp3');
  if (!fs.existsSync(fil)) { svageOrd.push(k + ' (mangler)'); return; }
  const t = taletid(fil);
  maalte.push([t, k]);
  if (t < 0.08) svageOrd.push(k + ' ' + t.toFixed(3) + 's');
});
maalte.sort((a, b) => a[0] - b[0]);
linje(svageOrd.length === 0, 'alle 360 ord-klip har hørbar lyd (ingen tavse/brudte filer)', svageOrd.slice(0, 8).join(' · '));
console.log('     mindste tale-tid i et ord-klip: ' + maalte[0][0].toFixed(3) + ' s (' + maalte[0][1] + ')' +
            ' · median ' + maalte[Math.floor(maalte.length / 2)][0].toFixed(3) + ' s');

const svageSaet = [];
const maalteS = [];
keys.forEach(k => {
  const fil = path.join(ROOT, 'audio/v2/sentences', k + '.mp3');
  if (!fs.existsSync(fil)) { svageSaet.push(k + ' (mangler)'); return; }
  const t = taletid(fil);
  maalteS.push([t, k]);
  if (t < 0.35) svageSaet.push(k + ' ' + t.toFixed(3) + 's');
});
maalteS.sort((a, b) => a[0] - b[0]);
linje(svageSaet.length === 0, 'alle 360 sætnings-klip har mindst 0,35 s tale', svageSaet.slice(0, 8).join(' · '));
console.log('     mindste tale-tid i en sætning: ' + maalteS[0][0].toFixed(3) + ' s (' + maalteS[0][1] + ')');

// Rækkefølgen testes i tests/ordj_saetninger.js — her mindes vi kun om den.
linje(true, 'rækkefølgen for de korteste ord (sætning først) testes i tests/ordj_saetninger.js');

console.log(fejl === 0 ? '\nLYDKVALITET OK' : '\n' + fejl + ' FEJL');
process.exit(fejl ? 1 : 0);
