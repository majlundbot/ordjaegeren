// SMOKE: alle 36 verdener x 3 spil, alle 36 drager, alle 12 lektioner/drills — intet må crashe
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ classList:{add(){},remove(){},toggle(){},contains:()=>false}, children:[], appendChild(c){this.children.push(c);return c;}, addEventListener(){}, style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }, value:'', textContent:'', remove(){}, focus(){}, blur(){}, setSelectionRange(){}, querySelectorAll:()=>[], scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0, set innerHTML(v){this._h=v;}, get innerHTML(){return this._h||'';} });
const els = {};
global.document = { createElement: mk, getElementById: (id) => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null };
global.window = {}; const st = {};
global.localStorage = { getItem:(k)=>st[k]||null, setItem:(k,v)=>{st[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=100; global.innerHeight=100; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
const p = src.replace('const cv = document.getElementById("bg")','var cv = fakeCanvas');
const t = `
let F = 0;
function check(l, c, e) { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e && !c ? ' :: ' + e : '')); }
function reset() {
  state.worlds={}; state.wrong={}; state.seenPatterns=[]; state.mastered=[]; state.patternSnapshots={};
  state.stats={words:{},games:{},days:{},history:[]}; state.bag=[]; state.gear={}; state.lootCount=0; state.xp=0;
  state.heroClass='kriger'; state.talents={hp:0,power:0,crit:0}; state.achievements=[]; state.profiles=[]; state.skin=null;
  state.worlds = {}; state.curWorld = 0;
}
reset();

// ===== 1) ALLE 36 VERDENER x 3 SPIL KAN STARTES UDEN CRASH =====
const games = ['hear','type','fill'];
let crashes = [];
for (let w = 0; w < WORLDS.length; w++) {
  for (const g of games) {
    try {
      startGame(w, g);
      if (!cur.words || cur.words.length < 4) crashes.push('V'+w+'/'+g+':faa ord='+(cur.words?cur.words.length:0));
      // Alle ord i runden skal være gyldige
      (cur.words||[]).forEach(x => { if (!WORDS[x]) crashes.push('V'+w+'/'+g+':ugyldigt ord '+x); });
      // Rendér-funktionerne må ikke crashe
      if (g === 'hear') renderHear();
      if (g === 'type') renderType();
      if (g === 'fill') renderFill();
    } catch(e) { crashes.push('V'+w+'/'+g+':'+e.message); }
  }
}
check('alle 36 verdener x 3 spil starter + render uden crash', crashes.length === 0, JSON.stringify(crashes.slice(0,6)));

// ===== 2) ALLE 36 DRAGEKAMPE KAN STARTES =====
reset();
crashes = [];
for (let w = 0; w < BOSSES.length; w++) {
  try {
    cur.world = w;
    startBoss(w);
    if (!bossState || !bossState.playerHp || !bossState.dragonHp) crashes.push('V'+w+':ingen HP');
    if (bossState.dragonMax !== BOSSES[w].power * 6) crashes.push('V'+w+':drage-HP forkert');
  } catch(e) { crashes.push('V'+w+':'+e.message); }
}
check('alle 36 dragekampe starter uden crash', crashes.length === 0, JSON.stringify(crashes.slice(0,6)));
check('spiller-HP > drage-HP i verden 0 (vindbar)', (50 + heroPower()*6) > BOSSES[0].power*6);

// ===== 3) ALLE 12 MØNSTRE: lektion + drill =====
reset();
crashes = [];
SPELL_PATTERNS.forEach(p => {
  try {
    showLesson(p.key);
    startPatternDrill(p.key);
    if (!cur.words.length) crashes.push(p.key+':ingen ord');
    if ((cur.words||[]).some(x => !WORDS[x])) crashes.push(p.key+':ugyldigt ord');
  } catch(e) { crashes.push(p.key+':'+e.message); }
});
check('alle 12 mønstre: lektion + drill uden crash', crashes.length === 0, JSON.stringify(crashes.slice(0,6)));

// ===== 4) STATISTIK-SKÆRM I ALLE TILSTANDE =====
reset();
crashes = [];
try { showStats(); } catch(e) { crashes.push('tom:'+e.message); }
// Med data
state.stats.words = {}; Object.keys(WORDS).slice(0,60).forEach((w,i) => state.stats.words[w] = { tries: 5+i%5, wrong: i%4 });
state.stats.history = Array.from({length:12}, (_,i) => ({ game:'type', stars: 1+i%3, wrong: ['hvad'], total: 8, day: '2026-09-14', world: i%24 }));
state.mastered = ['hv','ae'];
state.patternSnapshots = { hv: { first: .8, best: .2, last: .2, at: Date.now() } };
try { showStats(); } catch(e) { crashes.push('fuld:'+e.message); }
check('statistik-skærm virker med tom OG fuld data', crashes.length === 0, JSON.stringify(crashes));

// ===== 5) ALLE SKÆRME KAN VISES =====
reset();
crashes = [];
const shows = [
  ['klasse-valg', () => showClassSelect()],
  ['kort', () => showWorldMap()],
  ['verden', () => showWorld(0)],
  ['helt', () => showHero()],
  ['statistik', () => showStats()],
  ['bedrifter', () => showAchievements()],
  ['profiler', () => showProfiles()],
];
shows.forEach(([name, fn]) => { try { fn(); } catch(e) { crashes.push(name+':'+e.message); } });
check('alle hovedskærme kan vises uden crash', crashes.length === 0, JSON.stringify(crashes));

// ===== 6) KUBEN + LYKKEHJULET =====
reset();
crashes = [];
try {
  state.bag = ['hvad', 'hvor'];
  bagToCube(0); bagToCube(1);
  cubeTransmute();
} catch(e) { crashes.push('kube:'+e.message); }
try { showLootWheel(); spinLootWheel(); closeLootWheel(); } catch(e) { crashes.push('hjul:'+e.message); }
check('kube + lykkehjul uden crash', crashes.length === 0, JSON.stringify(crashes));

// ===== 7) PROFILER =====
reset();
crashes = [];
try { if (typeof newProfile === 'function') { newProfile('Joey'); } } catch(e) { crashes.push('ny:'+e.message); }
check('profil-systemet uden crash', crashes.length === 0, JSON.stringify(crashes));

console.log(F === 0 ? '\\nALLE SMOKE-TESTS GRØNNE' : '\\n' + F + ' FEJL');
if (F) process.exit(1);
`;
try { new Function(p + '\n' + t)(); } catch(e) { console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1]||'')); process.exit(1); }
