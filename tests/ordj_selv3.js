// Selvforbedring v3: fremgangs-tracking, midt-i-mission-nudge, adaptiv drill
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ classList:{add(){},remove(){},contains:()=>false}, children:[], appendChild(c){this.children.push(c);return c;}, addEventListener(){}, style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }, value:'', textContent:'', remove(){}, focus(){}, blur(){}, setSelectionRange(){}, querySelectorAll:()=>[], scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0, set innerHTML(v){this._h=v;}, get innerHTML(){return this._h||'';} });
const els = {};
global.document = { createElement: mk, getElementById: (id) => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null };
global.window = {}; const st = {};
global.localStorage = { getItem:(k)=>st[k]||null, setItem:(k,v)=>{st[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=100; global.innerHeight=100; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
let toasts = [];
global.__toasts = toasts;
const p = src.replace('const cv = document.getElementById("bg")','var cv = fakeCanvas');
const t = `
const els = global.__els || {};
let F = 0;
function check(l, c, e) { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e && !c ? ' :: ' + e : '')); }
function reset() {
  state.worlds={}; state.wrong={}; state.seenPatterns=[]; state.mastered=[]; state.patternSnapshots={};
  state.stats={words:{},games:{},days:{},history:[]}; state.bag=[]; state.gear={}; state.lootCount=0; state.xp=0;
}

// ===== 1) FREMGANGS-TRACKING =====
reset();
check('ingen snapshots fra start', Object.keys(state.patternSnapshots).length === 0);
// Første måling: mange fejl i hv
state.stats.words['hvad']={tries:5,wrong:4}; state.stats.words['hvor']={tries:5,wrong:4};
updatePatternSnapshots();
const s1 = state.patternSnapshots['hv'];
check('snapshot oprettet for hv', !!s1, JSON.stringify(state.patternSnapshots));
check('første fejlrate registreret (~80%)', Math.abs(s1.first - 0.8) < 0.01, s1.first);
let imp = patternImprovement('hv');
check('ingen fremgang første gang', imp && Math.abs(imp.delta) < 0.01, JSON.stringify(imp));
// Anden måling: han er blevet bedre (fejlrate falder)
state.stats.words['hvad']={tries:20,wrong:4}; state.stats.words['hvor']={tries:20,wrong:4};
updatePatternSnapshots();
imp = patternImprovement('hv');
check('fremgang registreret', imp.delta > 0.5, JSON.stringify(imp));
check('første rate bevaret', Math.abs(imp.first - 0.8) < 0.01, imp.first);
check('ny rate ~20%', Math.abs(imp.last - 0.2) < 0.01, imp.last);
check('bedste rate opdateret', Math.abs(imp.best - 0.2) < 0.01, imp.best);
check('ingen fremgang for ukendt mønster', patternImprovement('nope') === null);
// Snapshot ignoreres når der ikke er nok data
reset();
state.stats.words['hvad']={tries:1,wrong:1};
updatePatternSnapshots();
check('for lidt data → intet snapshot', !state.patternSnapshots['hv']);

// ===== 2) MIDT-I-MISSION-NUDGE =====
reset();
cur = { world:0, game:'type', words:['hvad','hvor','hvordan'], idx:0, errors:0, answered:false, wrongWords:[], drill:null, patternMisses:{} };
markWrong('hvad'); markWrong('hvor');
check('2 fejl → ingen nudge endnu', cur.patternMisses['hv'] === 2);
markWrong('hvordan');
check('3 fejl i samme mønster tælles', cur.patternMisses['hv'] === 3);
check('fejl registreret for alle 3 ord', Object.keys(state.stats.words).length === 3, JSON.stringify(Object.keys(state.stats.words)));
check('state.wrong opdateret', state.wrong['hvad'] === 1);
// Spiller han et ord uden mønster, crasher det ikke
markWrong('hus');
check('markWrong uden mønster crasher ikke', true);

// ===== 3) ADAPTIV DRILL: svagere mønster → flere ord =====
reset();
state.stats.words['hvad']={tries:10,wrong:8}; state.stats.words['hvor']={tries:10,wrong:8};
state.stats.words['hvordan']={tries:10,wrong:8}; state.stats.words['hvem']={tries:10,wrong:8}; state.stats.words['hvis']={tries:10,wrong:8};
const rateSvg = patternMastery('hv').rate;
check('meget svagt mønster (>=50%)', rateSvg >= 0.5, rateSvg);
startPatternDrill('hv');
check('drill giver alle 6 hv-ord ved meget svagt mønster (max muligt)', cur.words.length === 6, cur.words.length);
check('drill starter med mønster-ord', cur.words.slice(0,6).every(w => /^hv/.test(w)), JSON.stringify(cur.words));
check('drill fylder op med andre øve-ord', cur.words.filter(w => /^hv/.test(w)).length === 6, JSON.stringify(cur.words));
// Mildere svaghed → færre ord
reset();
state.stats.words['hvad']={tries:20,wrong:9}; state.stats.words['hvor']={tries:20,wrong:9};
check('middel svag (25-50%)', patternMastery('hv').rate >= 0.25 && patternMastery('hv').rate < 0.5, patternMastery('hv').rate);
startPatternDrill('hv');
check('drill giver alle 6 hv-ord ved middel svaghed', cur.words.length === 6, cur.words.length);
// Med andre svage ord i puljen fyldes drillen op til adaptiv længde
reset();
state.stats.words['hvad']={tries:20,wrong:9}; state.stats.words['hvor']={tries:20,wrong:9};
state.wrong['kanin']=3; state.wrong['cykel']=3; state.wrong['morgen']=3; state.wrong['aften']=3;
state.stats.words['kanin']={tries:5,wrong:4}; state.stats.words['cykel']={tries:5,wrong:4};
state.stats.words['morgen']={tries:5,wrong:4}; state.stats.words['aften']={tries:5,wrong:4};
startPatternDrill('hv');
check('drill fyldes op til adaptiv længde med andre svage ord', cur.words.length === 8, cur.words.length + ':' + JSON.stringify(cur.words));
// Næsten stærk → 6 ord
reset();
state.stats.words['hvad']={tries:20,wrong:3}; state.stats.words['hvor']={tries:20,wrong:3};
startPatternDrill('hv');
check('drill med 6 ord ved let svaghed', cur.words.length === 6, cur.words.length);
check('drill nulstiller patternMisses', cur.patternMisses && Object.keys(cur.patternMisses).length === 0);

// ===== 4) ADAPTIV SVÆRHEDSGRAD i startGame =====
reset();
check('basis 8 ved ingen data', adaptiveWordCount(8) === 8);
state.stats.history=[{stars:3,wrong:[],total:8},{stars:3,wrong:[],total:8},{stars:3,wrong:[],total:8}];
check('+2 ved fremgang', adaptiveWordCount(8) === 10);
state.stats.history=[{stars:1,wrong:['a','b','c','d'],total:8},{stars:1,wrong:['a','b','c'],total:8}];
check('-2 ved problemer', adaptiveWordCount(8) === 6);

// ===== 5) ALLE MØNSTRE ER BRUGBARE =====
reset();
let unplayable = [];
SPELL_PATTERNS.forEach(p => {
  const n = patternWords(p.key).length;
  if (n < 2) unplayable.push(p.key + ':' + n);
});
check('alle 12 mønstre har >= 2 øvbare ord', unplayable.length === 0, JSON.stringify(unplayable));
// Alle 12 mønstre kan starte en drill uden crash
let crash = [];
SPELL_PATTERNS.forEach(p => {
  try { startPatternDrill(p.key); if (!cur.words.length) crash.push(p.key + ':tom'); }
  catch (e) { crash.push(p.key + ':' + e.message); }
});
check('alle 12 mønstre kan startes som drill', crash.length === 0, JSON.stringify(crash));

console.log(F === 0 ? '\\nALLE SELVFORBEDRING-V3-TESTS GRØNNE' : '\\n' + F + ' FEJL');
if (F) process.exit(1);
`;
try { new Function(p + '\n' + t)(); } catch(e) { console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1]||'')); process.exit(1); }
