// STRESS + hostile timing: jagter fejl hvor en udskudt timer læser tilstand der er ryddet/nulstillet.
// Det var præcis den slags fejl der crashede kampen ("Cannot read properties of null (reading 'name')").
// Kører også alle 26 drager igennem en hel kamp med tilfældige handlinger.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => {
  const el = { style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){return '';}, display:'', width:'', transition:'' },
    classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
                toggle(c,f){ const h=this._s.has(c); const on=(f===undefined)?!h:!!f; if(on)this._s.add(c); else this._s.delete(c); return on; },
                contains(c){ return this._s.has(c); } },
    children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, blur(){}, setSelectionRange(){},
    value:'', textContent:'', disabled:false, title:'', onclick:null, querySelectorAll:()=>[], querySelector:()=>mk(),
    scrollTo(){}, getAnimations:()=>[], animate(){}, remove(){}, offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0,
    getBoundingClientRect: () => ({ left:100, top:100, width:120, height:140 }) };
  Object.defineProperty(el, 'innerHTML', { get(){ return el._h||''; }, set(v){ el._h=String(v); el.children=[]; } });
  return el;
};
const els = {}; global.__els = els;
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()),
  querySelectorAll: () => [], querySelector: () => null, body: mk(), title:'' };
global.window = {}; const store = {};
global.localStorage = { getItem:k => store[k]||null, setItem:(k,v)=>{ store[k]=v; } };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.location = { search: '' };

// FANG ALLE FEJL — også dem der sker inde i en setTimeout (ellers dræber de processen)
const errors = [];
process.on('uncaughtException', e => { errors.push('uncaught: ' + e.message); });
process.on('unhandledRejection', e => { errors.push('rejection: ' + (e && e.message)); });

const p = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const t = `
const els = global.__els;
let F = 0;
function check(l, c, e) { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); }
const wait = ms => new Promise(r => setTimeout(r, ms));
let queue = Promise.resolve();
function step(label, fn) { queue = queue.then(async () => { try { await fn(); } catch(err) { F++; console.log('FEJL ' + label + ' :: ' + err.message); } }); }
function reset(cls) {
  state.worlds={}; state.wrong={}; state.seenPatterns=[]; state.mastered=[]; state.patternSnapshots={};
  state.stats={words:{},games:{},days:{},history:[]}; state.bag=[]; state.gear={}; state.lootCount=0; state.xp=0;
  state.heroClass=cls||'kriger'; state.talents={hp:0,power:0,crit:0}; state.achievements=[]; state.potions=3; state.skin=0;
}
const inv = () => {
  const b = bossState;
  if (!b) return 'ingen bossState';
  if (b.playerHp < 0) return 'spiller-HP negativ: ' + b.playerHp;
  if (b.dragonHp < 0) return 'drage-HP negativ: ' + b.dragonHp;
  if (b.playerHp > b.playerMax) return 'spiller-HP over max: ' + b.playerHp + '/' + b.playerMax;
  if (b.dragonHp > b.dragonMax) return 'drage-HP over max: ' + b.dragonHp + '/' + b.dragonMax;
  if (b.energy < 0 || b.energy > 100) return 'energi udenfor 0-100: ' + b.energy;
  if (b.combo < 0) return 'combo negativ: ' + b.combo;
  if (!Number.isFinite(b.round)) return 'runde ikke et tal: ' + b.round;
  if (b.el === undefined || b.el === null) return 'element mangler';
  return null;
};

/* ===== 1) HOSTILE TIMING: opladning ryddet mens banneret venter ===== */
console.log('--- Hostile timing ---');
step('opladning → forsvar med det samme (timer venter på ryddet tilstand)', async () => {
  reset(); cur.world = 0; startBoss(0);
  const orig = Math.random; Math.random = () => 0.01;    // tving opladning
  bossRoundEnd(true);
  Math.random = orig;
  check('opladning sat', !!bossState.charge);
  bossState.busy = false;
  bossDefend();                                          // rydder opladningen straks
  check('opladning ryddet straks', bossState.charge === null);
  await wait(900);                                       // banner-timeren fra bossRoundEnd fyrer nu
  check('ingen crash efter banner-timer', inv() === null, inv());
  check('runde fortsatte', bossState.round >= 2, bossState.round);
});
step('opladning → signaturangreb (drage dør mens timer venter)', async () => {
  reset(); cur.world = 0; startBoss(0);
  Math.random = () => 0.01; bossRoundEnd(true); Math.random = Math.random;
  bossState.busy = false;
  bossState.energy = 100;
  bossState.dragonHp = 3;                                // signatur dræber dragen
  bossSignature();
  await wait(1800);
  check('kampen sluttede uden crash', bossState.over === true, 'over=' + bossState.over);
  check('invariants holdt', inv() === null, inv());
});
step('opladning → tab (spiller dør mens timer venter)', async () => {
  reset(); cur.world = 0; startBoss(0);
  Math.random = () => 0.01; bossRoundEnd(true); Math.random = Math.random;
  bossState.busy = false;
  bossState.playerHp = 1;                                // næste hit dræber
  bossState.charge = { name: 'Ildpust', color: '#f97316' };
  bossAttack(ATTACKS[0]);
  await wait(2600);
  check('spilleren døde uden crash', bossState.over === true, 'over=' + bossState.over + ' hp=' + bossState.playerHp);
  check('invariants holdt efter tab', inv() === null, inv());
});
step('lyn-hurtige handlinger oveni hinanden (skal ignoreres, ikke crashe)', async () => {
  reset(); cur.world = 3; startBoss(3);
  for (let i = 0; i < 12; i++) { bossAttack(ATTACKS[i % ATTACKS.length]); bossDefend(); bossSignature(); }
  await wait(2600);
  check('blokerede dobbelt-handlinger uden crash', inv() === null, inv());
  check('kun ét angreb blev gennemført', bossState.round <= 4, bossState.round);
});

/* ===== 2) ALLE 26 DRAGER: hel kamp med tilfældige handlinger ===== */
console.log('--- Alle 26 drager: fuld kamp ---');
step('26 kampe spilles til ende uden crash og med holdbare invariants', async () => {
  let rounds = [], problems = [], wins = 0;
  for (let w = 0; w < WORLDS.length; w++) {
    reset(['kriger','troldmand','jæger','paladin'][w % 4]);
    cur.world = w;
    startBoss(w);
    let guard = 0;
    while (!bossState.over && guard++ < 70) {
      bossState.busy = false;
      const r = Math.random();
      if (bossState.energy >= 100) bossSignature();
      else if (bossState.charge && r < 0.6) bossDefend();
      else if (r < 0.08) bossDefend();
      else bossAttack(ATTACKS[Math.floor(Math.random() * ATTACKS.length)]);
      const bad = inv();
      if (bad) { problems.push('V' + w + ' runde ' + bossState.round + ': ' + bad); break; }
      await wait(1400);
    }
    rounds.push(bossState.round);
    if (bossState.dragonHp <= 0) wins++;
    if (!bossState.over) problems.push('V' + w + ': kampen sluttede aldrig (guard=' + guard + ')');
    const bad2 = inv();
    if (bad2) problems.push('V' + w + ' slut: ' + bad2);
  }
  check('alle 26 kampe sluttede', problems.length === 0, JSON.stringify(problems.slice(0, 5)));
  const maxR = Math.max(...rounds), avg = (rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(1);
  console.log('     gennemsnitlige runder: ' + avg + ' · flest: ' + maxR + ' · vundet: ' + wins + '/' + WORLDS.length);
  check('ingen kamp tog over 60 runder', maxR < 60, maxR);
  check('kampene varer ikke for evigt (gennemsnit < 45)', Number(avg) < 45, avg);
  check('mindst nogle kampe vindes (mekanikken virker)', wins >= 3, wins + '/' + WORLDS.length);
});
step('opladet angreb kan ALDRIG dræbe på én gang — heller ikke fra den stærkeste drage', async () => {
  const problems = [];
  // tjek alle 26 drager med en basis-helt UDEN gear (værste tilfælde)
  for (let w = 0; w < WORLDS.length; w++) {
    reset('kriger'); cur.world = w; startBoss(w);
    const b = bossState;
    const full = chargedDamage();
    if (full >= b.playerMax) problems.push('V' + w + ': ' + full + ' >= ' + b.playerMax);
    if (full < 6) problems.push('V' + w + ': for lille (' + full + ')');
    // og den blokerede version skal være markant mildere
    const blocked = Math.max(1, Math.round(full * 0.4));
    if (blocked >= full) problems.push('V' + w + ': blokering hjælper ikke');
  }
  check('opladet angreb er under spillerens max-liv i alle 26 verdener', problems.length === 0, JSON.stringify(problems.slice(0,4)));
  // og med fuldt gear (højt max-liv) skal det stadig være en bid af livet, ikke en prik
  reset('kriger'); state.gear = {}; cur.world = 23; startBoss(23);
  bossState.playerMax = 500; bossState.playerHp = 500;
  const f = chargedDamage();
  check('opladet angreb skalerer med spillerens liv (25-30%)', f >= 120 && f <= 150, f);
  check('spilleren overlever mindst 3 opladede slag', Math.floor(500 / f) >= 3, Math.floor(500 / f));
});

/* ===== 3) ELEMENT-SKIFTE: alle 5 elementer i kamp ===== */
console.log('--- Alle 5 elementer ---');
step('alle 5 elementer kan bruges i en kamp uden crash', async () => {
  const seen = new Set();
  const problems = [];
  for (const w of [0, 1, 2, 3, 4]) {
    reset(); cur.world = w; startBoss(w);
    seen.add(bossState.el.key);
    bossState.charge = { name: bossState.el.moves[0], color: bossState.el.color };
    renderChargeWarn();
    bossDefend();
    await wait(900);
    const bad = inv();
    if (bad) problems.push('element ' + bossState.el.key + ': ' + bad);
  }
  check('alle 5 elementer testet', seen.size === 5, [...seen].join(','));
  check('ingen problemer på tværs af elementer', problems.length === 0, JSON.stringify(problems));
});

queue.then(() => {
  const total = F + errors.length;
  if (errors.length) { console.log('\\nTIMER-FEJL FANGET:'); errors.slice(0, 8).forEach(e => console.log('  ' + e)); }
  console.log(total === 0 ? '\\nALLE STRESS-TESTS GRØNNE' : '\\n' + F + ' FEJL + ' + errors.length + ' timer-fejl');
  process.exit(total ? 1 : 0);
});
`;
try { new Function(p + '\n' + t)(); } catch(e) { console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1]||'')); process.exit(1); }