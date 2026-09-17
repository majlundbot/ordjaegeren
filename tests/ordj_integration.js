// INTEGRATION + FUZZ: hele spilforløb og alle 240 ord gennem alle mønstre/spil
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeEl = id => {
  const el = { id, classList:{add(){},remove(){},toggle(){},contains:()=>false}, textContent:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'', onclick:null };
  Object.defineProperty(el, 'innerHTML', { get(){ return this._ih || ''; }, set(v){ this._ih = v; this.children = []; } });
  return el;
};
const els = {};
global.__els = els;
global.document = {
  createElement: (t) => makeEl(t),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: () => [],
  querySelector: () => null
};
global.window = {}; const store = {};
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } };
global.speechSynthesis = { getVoices: () => [], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100; global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => Promise.resolve(); };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
let F = 0;
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }
function resetState() {
  state.worlds = {}; state.wrong = {}; state.seenPatterns = []; state.mastered = [];
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  state.bag = []; state.gear = {}; state.lootCount = 0; state.xp = 0; state.talents = {hp:0,power:0,crit:0};
}

// ===== FUZZ 1: alle 260 ord har en sætning og kan laves stavelser =====
const allW = Object.keys(WORDS);
check('260 ord i spillet', allW.length === 260, allW.length);
let noSent = allW.filter(w => !WORDS[w] || !WORDS[w].length);
check('alle ord har sætning', noSent.length === 0, JSON.stringify(noSent));
let noSyl = allW.filter(w => { const s = syllabify(w); return !s || !s.length || s.join('') !== w; });
check('stavelses-deling rekonstruerer ordet (alle 260)', noSyl.length === 0, JSON.stringify(noSyl.slice(0,5)));
let duplicateSent = {};
let dupes = [];
allW.forEach(w => { const s = WORDS[w]; if (duplicateSent[s]) dupes.push(w); duplicateSent[s] = 1; });
check('ingen ord deler samme sætning', dupes.length === 0, JSON.stringify(dupes.slice(0,5)));

// ===== FUZZ 2: alle 260 ord matcher mindst ét mønster (ellers kan de ikke læres adaptivt) =====
let unmatched = allW.filter(w => !SPELL_PATTERNS.some(p => p.test(w)));
check('alle 260 ord fanges af mindst ét mønster', unmatched.length === 0, JSON.stringify(unmatched));

// ===== FUZZ 3: hvert mønsters ord har bøjnings-matchbart hul i sætningen =====
let holeProblems = [];
SPELL_PATTERNS.forEach(p => {
  ALL_WORDS.filter(w => p.test(w)).slice(0, 20).forEach(w => {
    const sent = WORDS[w] || '';
    if (!sent) { holeProblems.push(w + ':ingen sætning'); return; }
    const lower = sent.toLowerCase();
    // Hullet skal matche ordet eller en bøjet form (stamme uden sidste bogstav)
    const stem = w.length > 3 ? w.slice(0, -1) : w;
    if (!lower.includes(w) && !lower.includes(stem)) holeProblems.push(w);
  });
});
check('mønster-ord har matchende sætning (stikprøve)', holeProblems.length === 0, JSON.stringify(holeProblems.slice(0,8)));

// ===== FUZZ 4: alle 26 verdener er komplette =====
check('26 verdener', WORLDS.length === 26, WORLDS.length);
check('26 drager', BOSSES.length === 26, BOSSES.length);
let badWorld = [];
WORLDS.forEach((w, i) => {
  if (!w.words || w.words.length !== 10) badWorld.push('V' + i + ':ord=' + (w.words||[]).length);
  if (!w.name || !w.emoji) badWorld.push('V' + i + ':navn');
  w.words.forEach(x => { if (!WORDS[x]) badWorld.push('V' + i + ':' + x + ' mangler'); });
  if (!BOSSES[i]) badWorld.push('V' + i + ':ingen drage');
});
check('alle 26 verdener har 10 gyldige ord + drage', badWorld.length === 0, JSON.stringify(badWorld.slice(0,6)));
check('260 ord i verdenerne til sammen', WORLDS.reduce((n, w) => n + w.words.length, 0) === 260, WORLDS.reduce((n, w) => n + w.words.length, 0));
let worldDupes = [];
WORLDS.forEach((w, i) => w.words.forEach(x => { if (allW.indexOf(x) !== allW.indexOf(x)) worldDupes.push(x); }));
const counted = {}; let overlaps = [];
WORLDS.forEach((w, i) => w.words.forEach(x => { if (counted[x] !== undefined) overlaps.push(x + ' i V' + counted[x] + ' og V' + i); counted[x] = i; }));
check('intet ord optræder i to verdener', overlaps.length === 0, JSON.stringify(overlaps.slice(0,5)));

// ===== INTEGRATION: spil en hel verden igennem (3 spil) og tjek fremskridt =====
resetState();
// Spil alle 3 spil i verden 0 perfekt
['hear','type','fill'].forEach(g => {
  cur = { world: 0, game: g, words: WORLDS[0].words.slice(0, 6), idx: 0, errors: 0, answered: false, wrongWords: [], drill: null };
  // simuler at alle besvares rigtigt
  cur.idx = cur.words.length;
  finishGame();
});
check('verden 0 har alle 3 spil registreret', state.worlds[0] && state.worlds[0].hear && state.worlds[0].type && state.worlds[0].fill,
  JSON.stringify(state.worlds[0]));
check('verden 0 har alle 3 spil med stjerner', state.worlds[0].hear > 0 && state.worlds[0].type > 0 && state.worlds[0].fill > 0, JSON.stringify(state.worlds[0]));
/* NY KONTRAKT (18. sep): verdenslåsen er fjernet — man vælger frit fra start.
   Progressionen findes stadig, men heder nu worldReached og styrer KUN
   visningen (status/stjerner på kortet), ikke om man må starte en mission. */
check('verden 1 kan vælges fra start (ingen lås)', canEnterWorld(1) === true, canEnterWorld(1));
check('verden 1 er endnu ikke NÅET i rejsen (progression vises stadig)', worldReached(1) === false, worldReached(1));
check('XP tildelt (3 missioner)', state.xp > 0, state.xp);
check('historik har 3 missioner', state.stats.history.length === 3, state.stats.history.length);

// ===== INTEGRATION: fejl → mønster → lektion → drill → forbedring =====
resetState();
// Robin fejler hv-ord 3 gange
['hvad','hvor','hvordan'].forEach(w => {
  cur = { world: 0, game: 'type', words: [w], idx: 1, errors: 1, answered: true, wrongWords: [w], drill: null };
  markWrong(w); markWrong(w); // 2 forsøg pr. ord → nok data til at vurdere mønstret
  finishGame();
});
check('fejl registreret i stats.words', Object.keys(state.stats.words).length >= 1, JSON.stringify(Object.keys(state.stats.words)));
check('hv-ord har fejl', state.stats.words['hvad'] && state.stats.words['hvad'].wrong >= 1);
check('hv-mønster opdaget', patternStats().some(p => p.key === 'hv'), JSON.stringify(patternStats().map(p=>p.key)));
check('hv-mønster er svagt', patternMastery('hv').level === 'weak', patternMastery('hv').level);
// Lektion startes
showLesson('hv');
check('lektion vist for hv', els['lessonTitle'].textContent.includes('HV'));
check('lektion tilføjet til seenPatterns', state.seenPatterns.includes('hv'));
// Drill køres
state.worlds = {};
startPatternDrill('hv');
check('drill ord er alle hv-ord', cur.words.length > 0 && cur.words.every(w => /^hv/.test(w)), JSON.stringify(cur.words));
check('drill markeret i cur', cur.drill === 'hv');
// Drill gennemføres perfekt → mønster bør blive bedre
cur.idx = cur.words.length; cur.errors = 0; cur.wrongWords = [];
finishGame();
check('drill tæller ikke som verdens-fremskridt', !(state.worlds[0] && state.worlds[0].type), JSON.stringify(state.worlds[0]));

// ===== INTEGRATION: helt + gear + boss-flyt =====
resetState();
check('helt starter på level 1', heroLevel() === 1, heroLevel());
check('helt har power >= 0', heroPower() >= 0, heroPower());
// Frisk helt har 50 HP; verden 0-dragen har 5*6=30 HP → vindbar
check('verden 0 bosskamp er vindbar', (50 + heroPower()*6) > (BOSSES[0].power*6));
const p0 = heroPower();
state.talents.power = 5;
check('talent øger power', heroPower() > p0, heroPower() + ' vs ' + p0);
state.gear = { weapon: 'w1' };
check('gear påvirker ikke krasher', typeof heroPower() === 'number');

// ===== INTEGRATION: alle 26 drager har gyldig styrke =====
let badBoss = [];
BOSSES.forEach((b, i) => { if (!b.name || !b.power || b.power < 5 || b.power > 200) badBoss.push(i + ':' + JSON.stringify(b).slice(0,40)); });
check('alle 26 drager har navn + rimelig styrke', badBoss.length === 0, JSON.stringify(badBoss.slice(0,4)));

// ===== INTEGRATION: verdens-valg + progression stemmer med 26 verdener =====
check('verden 0 kan altid vælges', canEnterWorld(0) === true);
resetState();
check('verden 23 kan vælges fra start (ingen lås)', canEnterWorld(23) === true, canEnterWorld(23));
check('verden 23 er ikke NÅET fra start', worldReached(23) === false, worldReached(23));
check('verden 25 kan vælges fra start (Den svære skov)', canEnterWorld(24) === true, canEnterWorld(24));
check('verden 26 kan vælges fra start (Mesterskabet)', canEnterWorld(25) === true, canEnterWorld(25));
check('verden 26 er ikke NÅET fra start', worldReached(25) === false, worldReached(25));
// Nå alle verdener progressivt: komplet verden i gennem 25 verdener
for (let i = 0; i < 25; i++) {
  state.worlds[i] = { hear: 3, type: 3, fill: 3, boss: true };
}
check('verden 23 er NÅET når drage i V22 er besejret', worldReached(23) === true, worldReached(23));
check('verden 26 er NÅET når drage i V25 er besejret', worldReached(25) === true, worldReached(25));

console.log(F === 0 ? '\\nALLE INTEGRATION+FUZZ-TESTS GRØNNE' : '\\n' + F + ' FEJL');
if (F) process.exit(1);
`;
try {
  new Function(patched + '\n' + tests)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}