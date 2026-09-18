// HINTSÆTNINGS-VAGT: sætningen barnet HØRER skal indeholde præcis det ord barnet skal skrive.
//
// Baggrund (Kenneth, 18. sep, skærmbillede fra "Fang ordet"):
//   "Fejl i denne. Du siger 'And' og så Anden svømmer i søen. Du siger sætningen i bøjet form."
//   Ordbogen havde  and:"Anden svømmer i søen."  — barnet hører "anden", men skal skrive "and".
//   Det er ikke en skønhedsfejl: hintsætningen pegede på det FORKERTE svar. 47 af 360 sætninger
//   havde samme fejl (Hunden, Katten, Solen, Månen, tavlen, køkkenet, hovedet, munden, sidder,
//   om natten ...). Se Docs/saetnings-regel.md.
//
// Denne pakke er den test der ville have fanget det med det samme.
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__fs = fs;
global.__dirname = __dirname;

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(){}, contains(){return false;} },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.window.__els = els;
global.window.__klip = [];
global.window.__audio = [];
global.Audio = function(u){ this.src = u; global.window.__klip.push(u); global.window.__audio.push(this); this.play = () => Promise.resolve(); };

// De 47 sætninger der stod bøjet 18. sep. De må ikke komme tilbage.
const GAMLE_BOEJEDE = [
  'Læreren skriver på tavlen.', 'Mor laver mad i køkkenet.', 'Vi ser fjernsyn i stuen.',
  'Luk døren, når du går ud.', 'Jeg kigger ud ad vinduet.', 'Bolden rullede hen ad gulvet.',
  'Der hænger en lampe i loftet.', 'Billedet hænger på væggen.', 'Hunden logrer med halen.',
  'Katten sover på sofaen.', 'Hesten løber hurtigt på marken.', 'Koen spiser græs.',
  'Grisen bor i stalden.', 'Ræven er snu og rød.', 'Anden svømmer i søen.',
  'Hønen lægger æg.', 'Kaninen elsker gulerødder.', 'Musen gemmer sig i hullet.',
  'Jeg sparker bolden i mål.', 'Min lillesøster leger med dukken.', 'Jeg bygger et tårn af klodser.',
  'Maden smager godt i dag.', 'Æblet er rødt og sprødt.', 'Bananen er gul og lang.',
  'Smørret smelter på panden.', 'Huen varmer om vinteren.', 'Bæltet holder bukserne oppe.',
  'Jeg har hår på hovedet.', 'Jeg åbner munden for at spise.', 'Solen skinner på himlen.',
  'Månen lyser om natten.', 'Regnen falder på taget.', 'Sneen er hvid og kold.',
  'Vinden blæser i træerne.', 'Træet har grønne blade.', 'Blomsten dufter godt.',
  'Græsset er vådt om morgenen.', 'Jeg sidder på stolen.', 'Vi bygger et slot af sand.',
  'Jeg maler et flot billede.', 'Vi synger en sang sammen.', 'Om natten sover vi.',
  'Godmorgen, sagde far om morgenen.', 'Om aftenen ser vi fjernsyn.',
  'Vi leger i skolegården hver dag.', 'Jeg låner bøger på biblioteket.',
  'Vi spiller kamp på fodboldbanen.'
];

const t = `
let F = 0;
const fs = global.__fs, __dirname = global.__dirname;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };
const keys = Object.keys(WORDS);
console.log('--- Hintsætninger: ' + keys.length + ' ord ---');

check('der er præcis 360 ord', keys.length === 360, keys.length);

/* 1) KERNEN: ordet skal stå SOM SELVSTÆNDIGT ORD i sin egen sætning.
   \\b er ikke bevidst om æøå i JavaScript, så vi bruger lookaround med \\p{L}.
   Det er denne kontrol der fanger "Anden" (bøjet form) og "hovedet". */
const lbl = "(?<![\\\\p{L}\\\\p{N}_])", rbl = "(?![\\\\p{L}\\\\p{N}_])";
const udenOrd = keys.filter(k => !new RegExp(lbl + k.replace(/[.*+?^\\\${}()|[\\]\\\\]/g, '\\\\$&') + rbl, 'iu').test(WORDS[k]));
check('alle 360 sætninger indeholder ordet som selvstændigt ord (ikke bøjet)',
  udenOrd.length === 0,
  JSON.stringify(udenOrd.map(k => k + ' -> ' + WORDS[k]).slice(0, 6)));

/* 2) Hullet skal stå PRÆCIS på ordet selv — ikke på en bøjning. Barnet ser ••• (ordets
   længde) og hører sætningen; hullet og lyden skal pege på samme form. */
const forkertHul = [];
keys.forEach(k => {
  const shown = blankInSentence(k, WORDS[k], '____');
  if (!shown.includes('____')) { forkertHul.push(k + ' (intet hul)'); return; }
  const i = shown.indexOf('____');
  const foer = shown.slice(0, i), efter = shown.slice(i + 4);
  const orig = WORDS[k];
  const token = orig.slice(foer.length, orig.length - efter.length);
  if (!orig.startsWith(foer) || !orig.endsWith(efter) || token.toLowerCase() !== k) {
    forkertHul.push(k + ' | hul over "' + token + '" i "' + orig + '"');
  }
});
check('hullet står på præcis ordet selv i alle 360 sætninger', forkertHul.length === 0,
  JSON.stringify(forkertHul.slice(0, 6)));

/* 3) Hvert ord skal have BEGGE lydfiler. Tekst og lyd kan ikke rettes hver for sig:
   retter man sætningen uden at generere lyden om, hører barnet den gamle form. */
const mangler = [];
keys.forEach(k => {
  ['words', 'sentences'].forEach(mappe => {
    const p = __dirname + '/../audio/v2/' + mappe + '/' + k + '.mp3';
    let ok = false;
    try { ok = fs.existsSync(p) && fs.statSync(p).size > 1000; } catch (e) { ok = false; }
    if (!ok) mangler.push(mappe + '/' + k);
  });
});
check('hvert ord har begge lydfiler (ord + sætning) og de er ikke tomme', mangler.length === 0,
  JSON.stringify(mangler.slice(0, 6)));

/* 4) Regression: ingen af de 47 bøjede sætninger må vende tilbage. */
const gamle = global.__GAMLE || [];
const tilbage = gamle.filter(s => Object.values(WORDS).some(x => x.trim() === s));
check('ingen af de 47 gamle bøjede sætninger er kommet tilbage', tilbage.length === 0,
  JSON.stringify(tilbage.slice(0, 4)));

/* 5) Barnet skal kunne læse sætningen: kort og uden sære tegn. */
const forLange = keys.filter(k => WORDS[k].length > 70);
check('ingen sætning er længere end 70 tegn (kan læses af et barn)', forLange.length === 0,
  JSON.stringify(forLange.map(k => k + ' (' + WORDS[k].length + ')')));

/* 6) De fire ord hvor fejlen var mest misvisende — de skal alle have grundformen nu. */
['and', 'hund', 'sol', 'nat'].forEach(w => {
  const ord = new RegExp(lbl + w + rbl, 'iu');
  check('"' + w + '"-sætningen indeholder selvstændigt "' + w + '"', ord.test(WORDS[w] || ''), WORDS[w]);
});

/* 7-9) BARNETS OPLEVELSE: det er ikke nok at strengen i ordbogen er rigtig — de to
   opgavetyper skal vise hullet på ordet, prikkerne skal passe, og den lyd der
   afspilles skal være den sætning vi viser. Det er her "Anden"-fejlen blev synlig. */
const E = window.__els, K = window.__klip;
const wi = WORLDS.findIndex(w => w.words.includes('and'));
cur = { world: wi, words: WORLDS[wi].words, idx: WORLDS[wi].words.indexOf('and'), answered: false, streak: 0 };

renderType();
const hint = E['typeHint'].innerHTML;
check('"Fang ordet" viser sætningen med hul og 3 prikker for "and" (••• = and)',
  hint.indexOf('En ___ svømmer i søen.') > 0 && hint.indexOf('•••') > 0 && hint.indexOf('3 bogstaver') > 0, hint);

speakSentence();
check('oplæsningen af sætningen er den fil der hører til ordet (sentences/and.mp3)',
  (K[K.length - 1] || '').endsWith('sentences/and.mp3'), K[K.length - 1]);

renderFill();
const fs2 = E['fillSentence'].innerHTML;
const knapper = E['fillChoices'].children.map(c => c.textContent);
check('sætnings-gåden viser hullet hvor "and" står, og facit er blandt knapperne',
  fs2.indexOf('En <span class="blank">____</span> svømmer i søen.') === 0 && knapper.includes('and'),
  fs2 + ' | ' + knapper.join(','));

/* 10-11) RÆKKEFØLGEN PÅ LYDEN (Kenneth 18. sep: "den siger 'Er, jeg elsker AT spise is'").
   De 2-bogstavs ord (at, er, i ...) er bare en kort vokal når de siges alene — barnet
   hørte "er". For dem skal SÆTNINGEN komme først; for længere ord som før: ordet først. */
function kæde(word) {
  K.length = 0; window.__audio.length = 0;
  playWordAndSentence(word, () => {});
  const første = K[K.length - 1];
  const inst = window.__audio[window.__audio.length - 1];
  if (inst && typeof inst.onended === 'function') inst.onended();   // spol til ende → næste klip
  const anden = K[K.length - 1];
  return [første, anden];
}
const kortKæde = kæde('at');
check('for "at" hører barnet SÆTNINGEN først (konteksten), derefter ordet alene',
  (kortKæde[0] || '').endsWith('sentences/at.mp3') && (kortKæde[1] || '').endsWith('words/at.mp3'),
  kortKæde.join(' -> '));
const langKæde = kæde('hund');
check('for "hund" (3+ bogstaver) hører barnet ordet først, som før',
  (langKæde[0] || '').endsWith('words/hund.mp3') && (langKæde[1] || '').endsWith('sentences/hund.mp3'),
  langKæde.join(' -> '));

console.log(F === 0 ? '\\\\nHINTSÆTNINGER OK' : '\\\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;

global.__GAMLE = GAMLE_BOEJEDE;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();