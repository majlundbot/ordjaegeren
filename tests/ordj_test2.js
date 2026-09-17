// Kombinerer spil-scriptet + tests i samme scope
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0 }), width:0, height:0 };
const stubEl = () => ({ classList:{add(){},remove(){},toggle(){},contains:()=>false}, textContent:'', innerHTML:'', appendChild(){}, addEventListener(){}, focus(){}, style:{}, value:'' });
global.document = { getElementById: () => stubEl(), querySelectorAll: () => [], querySelector: () => stubEl() };
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
// ==== TESTS ====
function check(label, cond, extra) { console.log((cond ? 'OK  ' : 'FEJL') + ' ' + label + (extra && !cond ? ' :: ' + extra : '')); }

check('260 ord i WORDS', Object.keys(WORDS).length === 260, Object.keys(WORDS).length);
const inWorlds = WORLDS.flatMap(w => w.words);
check('260 ord i verdener, ingen dubletter', inWorlds.length === 260 && new Set(inWorlds).size === 260, inWorlds.length + '/' + new Set(inWorlds).size);
/* Kontrakten (justeret 17. sep for verden 25): sætningen skal indeholde ordet —
   eller intetkøns-formen uden -t ("dejligt" står som "dejlig" i "Det har været en
   dejlig dag."). Lydfilen læser ordet som barnet kender det; vi skriver ikke
   sætningen om, fordi den er indtalt. */
const missing = Object.entries(WORDS).filter(([w,s]) => {
  const low = s.toLowerCase(), k = w.toLowerCase();
  return !low.includes(k) && !(/t$/.test(k) && k.length >= 4 && low.includes(k.slice(0, -1)));
}).map(([w,s]) => w + '→' + s);
check('alle sætninger indeholder ordet (eller intetkøns-formen)', missing.length === 0, JSON.stringify(missing.slice(0,5)));
const subst = blankInSentence('jeg', WORDS['jeg'], '____');
check('sætnings-substitution', subst === '____ kan godt lide at spille fodbold.', subst);
check('stjerner 0 fejl = 3', starsFor(0,8) === 3);
check('stjerner 2/8 = 2', starsFor(2,8) === 2);
check('stjerner 7/8 = 1', starsFor(7,8) === 1);
const d = distractors('jeg', 3);
check('4 unikke distraktorer inkl. ordet', d.length === 4 && new Set(d).size === 4 && d.includes('jeg'), JSON.stringify(d));
/* NY KONTRAKT (18. sep): alle 26 verdener kan vælges fra start. */
check('verden 0 kan vælges', canEnterWorld(0) === true);
check('verden 1 kan vælges fra start (ingen lås)', canEnterWorld(1) === true);
check('verden 1 er ikke nået endnu i rejsen', worldReached(1) === false);
const wl = buildWordList(0, 8);
check('wordlist 8 unikke', wl.length === 8 && new Set(wl).size === 8, JSON.stringify(wl));
check('26 unikke verdensnavne', new Set(WORLDS.map(w=>w.name)).size === 26);
// tilfældig stikprøve af sætninger der skal vise ____ korrekt
const randWords = ['hvem','hvordan','tilbage','aldrig','sådan'];
randWords.forEach(w => {
  const shown = WORDS[w].replace(new RegExp('\\\\b' + w + '\\\\b', 'i'), '____');
  check('sætning for "'+w+'" har hul', shown.includes('____'), shown);
});
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
