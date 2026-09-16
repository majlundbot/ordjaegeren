// TRAPPESTIGEN: svaerheds-målet og gentagelsen.
// Kontrakten med Kenneth: "De ord der er flest fejl i skal blive gentaget flere
// gange i naeste level" — men uden at det tager lysten fra barnet.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };

const t = `
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

function nulstil() {
  state.stats.words = {};
  state.wrong = {};
  if (state.seenPatterns) state.seenPatterns = {};
  state.patternSnapshots = {};
}

console.log('--- 1. Svaerheds-målet (fejl ud af forsoeg) ---');
nulstil();
check('ord uden data er ikke svagt', wordWeakness('hvad') === 0, wordWeakness('hvad'));
state.stats.words['hvad'] = { tries: 5, wrong: 1 };
check('1 fejl af 5 er IKKE nok (ét sjus maa ikke forfoelge)', wordWeakness('hvad') === 0, wordWeakness('hvad'));
state.stats.words['hvad'] = { tries: 5, wrong: 2 };
check('2 fejl af 5 giver 0.4', Math.abs(wordWeakness('hvad') - 0.4) < 1e-9, wordWeakness('hvad'));
state.stats.words['hvad'] = { tries: 3, wrong: 3 };
check('3 fejl af 3 giver 1.0 (fejlet hver gang)', wordWeakness('hvad') === 1, wordWeakness('hvad'));
state.stats.words['hvad'] = { tries: 10, wrong: 0 };
check('et laert ord (0 fejl) er ikke svagt', wordWeakness('hvad') === 0);
state.stats.words['hvad'] = { tries: 10, wrong: 8 };
check('8 af 10 giver 0.8', Math.abs(wordWeakness('hvad') - 0.8) < 1e-9, wordWeakness('hvad'));

console.log('--- 2. Rangeringen ---');
nulstil();
state.stats.words['hvad'] = { tries: 3, wrong: 3 };   // 1.00
state.stats.words['hvor'] = { tries: 5, wrong: 4 };   // 0.80
state.stats.words['hvem'] = { tries: 10, wrong: 2 };  // 0.20
state.stats.words['jeg']  = { tries: 4, wrong: 1 };   // ignoreres (kun 1 fejl)
const r = rankedWeakWords(10);
check('kun ord med reelt svaerheds-mål kommer med', r.map(x => x.w).join(',') === 'hvad,hvor,hvem', r.map(x => x.w).join(','));
check('sorteret efter andel fejl', r[0].score >= r[1].score && r[1].score >= r[2].score);
check('ordet med 1 fejl er sorteret fra', !r.some(x => x.w === 'jeg'));

console.log('--- 3. Trappestigen: gentagelse i samme runde ---');
nulstil();
// 'hvad' ligger i verden 1 — vi bygger en liste for verden 0, saa det KUN kan
// komme med via genoevning (ellers kunne det komme med som "nyt ord").
state.stats.words['hvad'] = { tries: 3, wrong: 3 };   // fejlet hver gang
const wl = buildWordList(0, 8);
const antalHvad = wl.filter(w => w === 'hvad').length;
check('det meget svage ord kommer med', antalHvad >= 1, antalHvad);
check('og det kommer med TO gange', antalHvad === 2, antalHvad);
check('listen har stadig 8 ord', wl.length === 8, wl.length);

console.log('--- 4. Men ikke for ethvert ord ---');
nulstil();
state.stats.words['hvad'] = { tries: 9, wrong: 2 };    // 0.22 — svagt, men ikke slemt
const wl2 = buildWordList(0, 8);
check('et let svagt ord kommer med én gang', wl2.filter(w => w === 'hvad').length === 1,
  wl2.filter(w => w === 'hvad').length);
nulstil();
state.stats.words['hvad'] = { tries: 5, wrong: 1 };
const wl3 = buildWordList(0, 8);
check('et ord med 1 fejl kommer slet ikke med', !wl3.includes('hvad'), JSON.stringify(wl3));

console.log('--- 5. Genoevning maa ikke spise hele runden ---');
nulstil();
// ALLE ord fejlet haardt — det værste tilfælde
ALL_WORDS.forEach(w => { state.stats.words[w] = { tries: 3, wrong: 3 }; });
[6, 8, 10, 12].forEach(n => {
  const w = buildWordList(0, n);
  const unikke = new Set(w).size;
  check('ved ' + n + ' ord: listen er praecis ' + n, w.length === n, w.length);
  check('ved ' + n + ' ord: mindst halvdelen er NYE ord', unikke >= Math.ceil(n / 2), unikke + ' unikke af ' + n);
  check('ved ' + n + ' ord: ingen ord mere end 2 gange',
    [...new Set(w)].every(x => w.filter(y => y === x).length <= 2));
});

console.log('--- 6. Et mestret ord forfoelger ikke ---');
nulstil();
state.stats.words['hvad'] = { tries: 20, wrong: 0 };
state.stats.words['hvor'] = { tries: 3, wrong: 3 };
const wl4 = buildWordList(0, 8);
check('det laerte ord kommer ikke med', !wl4.includes('hvad'), JSON.stringify(wl4));
check('det svaere kommer med', wl4.includes('hvor'));

console.log('--- 7. Listen har altid den rigtige laengde ---');
nulstil();
// En verden har 10 ord, saa en runde kan ikke blive laengere end det —
// medmindre der er svage ord fra andre verdener at genoeve. Det er korrekt:
// man kan ikke spoerge om flere ord end der findes.
const VERDENS_ORD = WORLDS[0].words.length;   // 10
[1, 2, 5, 6, 8, 10, 20].forEach(n => {
  const w = buildWordList(0, n);
  const forventet = Math.min(n, VERDENS_ORD);
  check('buildWordList(0, ' + n + ') giver ' + forventet + ' ord', w.length === forventet, w.length);
});

console.log(F === 0 ? '\\nTRAPPESTIGEN OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
