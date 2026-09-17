// ASEGÅRD: niveauet OVER secret — gudernes eget udstyr.
// Kontrakten (Docs/nye-verdener-og-asegard.md):
//   1) ASEGÅRD er den STÆRKESTE raritet, kraft ×45-60, lille styrke-spænd (5 %).
//   2) 6 items, én pr. slot, alle rigtige nordiske mytologi-genstande.
//   3) Man får dem KUN ved at besejre bossen i verden 25 og 26 — ikke fra kuben,
//      ikke fra lykkehjulet. Det er hele pointen: belønningen kommer fra noget SVÆRT.
//   4) JÆVN fordeling: verden 25 giver ét item, verden 26 giver resten, ét ad gangen.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeClassList = () => {
  const set = new Set();
  return {
    add(...c) { c.forEach(x => set.add(x)); },
    remove(...c) { c.forEach(x => set.delete(x)); },
    toggle(c, force) { const on = force === undefined ? !set.has(c) : !!force; if (on) set.add(c); else set.delete(c); return on; },
    contains(c) { return set.has(c); }
  };
};
const makeEl = id => {
  const el = { id, classList: makeClassList(), textContent:'', innerHTML:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'', onclick:null };
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
global.__els = els;
global.__fs = fs;
global.__dirname = __dirname;
global.document = {
  createElement: (t) => makeEl(t),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return [];
    if (sel.includes('.world-card')) return ['worldMapA','worldMapB','worldMapC'].flatMap(id => (els[id] || makeEl(id)).children);
    return [];
  },
  querySelector: () => null,
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
const store = {};
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = String(v); } };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => Promise.resolve(); };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
const fs = global.__fs;
const __dirname = global.__dirname;
let F = 0;
let queue = Promise.resolve();
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); }
function t(label, fn) { queue = queue.then(() => Promise.resolve().then(fn).then(
  () => console.log('OK   ' + label),
  (e) => { F++; console.log('FEJL ' + label + ' :: ' + e.message); }
)); }
const wait = ms => new Promise(r => setTimeout(r, ms));
function reset() {
  state.bag = []; state.gear = {}; state.gearRoll = {}; state.gearItem = {}; state.worlds = {};
  state.achievements = []; state.wrong = {}; state.stats = { words:{}, games:{}, days:{}, history:[] };
  state.lootCount = 0; state.xp = 0; state.heroClass = 'kriger'; state.skin = 0;
}

console.log('--- 1. Rariteten ASEGÅRD ---');
check('ASEGÅRD findes i RARITIES', !!RARITIES.find(r => r.key === 'asgard'));
check('ASEGÅRD er det SIDSTE (stærkeste) niveau', RARITIES[RARITIES.length - 1].key === 'asgard', RARITIES.map(r => r.key).join(','));
check('ASEGÅRD ligger over secret i kraft', RARITIES.find(r => r.key === 'asgard').power > RARITIES.find(r => r.key === 'secret').power,
  RARITIES.find(r => r.key === 'asgard').power + ' vs ' + RARITIES.find(r => r.key === 'secret').power);
check('ASEGÅRD kan ikke rulles tilfældigt (weight 0)', RARITIES.find(r => r.key === 'asgard').weight === 0);
check('ASEGÅRD-farven er lysende guld-HVID (ikke en ny mættet farve)', RARITIES.find(r => r.key === 'asgard').color.toLowerCase() === '#fffbe8');
check('ASEGÅRD-gløden bruger asgardGlow', RARITIES.find(r => r.key === 'asgard').glow.includes('asgardGlow'));
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
check('CSS har .rarity-asgard', html.includes('.rarity-asgard'));
check('CSS har @keyframes asgardGlow', html.includes('@keyframes asgardGlow'));
check('CSS har .mythic-slot.asgard (silhuetterne i skatte-tavlen)', html.includes('.mythic-slot.asgard'));

console.log('--- 2. De 6 mytologiske items ---');
check('6 ASEGÅRD-items', ASGARD_ITEMS.length === 6, ASGARD_ITEMS.length);
check('én pr. slot (og alle 6 slots)', new Set(ASGARD_ITEMS.map(m => m.slot)).size === 6 &&
  GEAR_SLOTS.every(s => ASGARD_ITEMS.some(m => m.slot === s.key)), ASGARD_ITEMS.map(m => m.slot).join(','));
check('unikke navne', new Set(ASGARD_ITEMS.map(m => m.name)).size === 6);
check('navnene er de rigtige nordiske genstande',
  ['Ægishjálmr','Mjölnir','Svalin','Megingjörð','Vidars jernsko','Draupnir'].every(n => ASGARD_ITEMS.some(m => m.name === n)),
  ASGARD_ITEMS.map(m => m.name).join(','));
const mults = ASGARD_ITEMS.map(m => m.attack.mult);
check('hvert item har et unikt angreb med navn + icon', ASGARD_ITEMS.every(m => m.attack && m.attack.name && m.attack.icon && m.attack.key));
check('kraften er ×45-60', mults.every(m => m >= 45 && m <= 60), JSON.stringify(mults));
check('ALLE ASEGÅRD-angreb er stærkere end det stærkeste secret-angreb (×36)',
  Math.min(...mults) > Math.max(...SECRET_ITEMS.map(m => m.attack.mult)),
  Math.min(...mults) + ' vs ' + Math.max(...SECRET_ITEMS.map(m => m.attack.mult)));
check('kraften stiger fra item til item', mults.every((m, i) => i === 0 || m > mults[i - 1]), JSON.stringify(mults));
check('asgardForSlot virker for alle slots', GEAR_SLOTS.every(s => (asgardForSlot(s.key) || {}).slot === s.key));

console.log('--- 3. Styrke-spændet er lille (guderne ruller ikke dårligt) ---');
check('STRENGTH_SPAN.asgard = 5', STRENGTH_SPAN.asgard === 5, STRENGTH_SPAN.asgard);
check('asgard-spændet er det MINDSTE i spillet',
  Object.keys(STRENGTH_SPAN).every(k => STRENGTH_SPAN[k] >= STRENGTH_SPAN.asgard) && STRENGTH_SPAN.asgard < STRENGTH_SPAN.secret,
  JSON.stringify(STRENGTH_SPAN));
let maksRoll = 0;
for (let i = 0; i < 500; i++) maksRoll = Math.max(maksRoll, rollItemStrength('asgard'));
check('500 rul giver aldrig mere end 5 %', maksRoll === 5, maksRoll);
const asgIt = makeItem('helm', 'asgard');
check('makeItem giver itemet det rigtige navn', asgIt.name === 'Ægishjálmr' && asgIt.rarity === 'asgard' && asgIt.asgard === true, JSON.stringify(asgIt));
check('itemPower for ASEGÅRD er >= 45', itemPower(asgIt) >= 45, itemPower(asgIt));
check('itemPower(ASEGÅRD) > itemPower(secret)',
  itemPower(asgIt) > itemPower(makeItem('helm', 'secret')), itemPower(asgIt));

console.log('--- 4. JÆVN fordeling: verden 25 giver 1, verden 26 giver 5 ---');
check('verden 25 (indeks 24) giver ét item', asgardForWorld(24).length === 1, asgardForWorld(24).length);
check('verden 26 (indeks 25) giver de resterende 5', asgardForWorld(25).length === 5, asgardForWorld(25).length);
check('1 + 5 = alle 6 items', asgardForWorld(24).length + asgardForWorld(25).length === 6);
check('de to lister deler ingen items', !asgardForWorld(24).some(a => asgardForWorld(25).some(b => b.slot === a.slot)));
check('andre verdener giver INGEN ASEGÅRD', [0, 11, 12, 23].every(i => asgardForWorld(i).length === 0));

console.log('--- 5. Man får dem ÉT AD GANGEN — og kun fra de to bosser ---');
reset();
check('første sejr i verden 25 giver Ægishjálmr', (asgardDropForWorld(24) || {}).name === 'Ægishjálmr', JSON.stringify(asgardDropForWorld(24)));
check('verden 26 giver IKKE hjelmen (den har verden 25)', (asgardDropForWorld(25) || {}).slot !== 'helm', JSON.stringify(asgardDropForWorld(25)));
const faaet = [];
for (let i = 0; i < 8; i++) {
  const d = asgardDropForWorld(25);
  if (!d) break;
  faaet.push(d.name);
  state.bag.push(makeItem(d.slot, 'asgard'));
  if (asgardDropForWorld(25) === d) throw new Error('samme item uddeles igen');
}
check('verden 26 giver 5 forskellige items, ét ad gangen', faaet.length === 5 && new Set(faaet).size === 5, JSON.stringify(faaet));
check('til sidst er der ikke flere i verden 26', asgardDropForWorld(25) === null);
state.bag.push(makeItem('helm', 'asgard'));   // hjelmen er vundet i verden 25
check('og verden 25 giver heller ikke noget mere når man har den', asgardDropForWorld(24) === null);
check('tilsammen giver de to verdener alle 6 items',
  new Set(state.bag.filter(b => b.rarity === 'asgard').map(b => b.name)).size === 6,
  JSON.stringify(state.bag.filter(b => b.rarity === 'asgard').map(b => b.name)));

console.log('--- 6. IKKE fra kuben og IKKE fra lykkehjulet ---');
reset();
const fakeAsg = makeItem('helm', 'asgard');
check('kuben afviser ASEGÅRD (cubeAdd)', (() => { const before = CUBE_SLOTS.filter(Boolean).length; cubeAdd(fakeAsg); return CUBE_SLOTS.filter(Boolean).length === before; })());
check('kuben afviser ASEGÅRD (bagToCube)', (() => { const before = CUBE_SLOTS.filter(Boolean).length; const r = bagToCube(fakeAsg); return r === false && CUBE_SLOTS.filter(Boolean).length === before; })());
let wheelAsgard = 0;
for (let w = 0; w < WORLDS.length; w++) { cur.world = w; if (wheelSegs().some(s => s.key === 'asgard')) wheelAsgard++; }
check('INTET lykkehjul har et ASEGÅRD-segment', wheelAsgard === 0, wheelAsgard);
cur.world = 25;
showLootWheel();
check('lykkehjulet i verden 26 giver aldrig ASEGÅRD', wheelPending && wheelPending.rk !== 'asgard', wheelPending && wheelPending.rk);
cur.world = 0;

console.log('--- 7. Bossen i de to nye verdener uddeler dem (bossWin) ---');
t('boss-sejr i verden 25 lægger et ASEGÅRD-item i tasken', async () => {
  reset();
  state.worlds[24] = { hear:3, type:3, fill:3, done:[true,true,true] };
  cur.world = 24;
  startBoss(24);
  bossWin();
  await wait(600);            // bossWin uddeler efter 400 ms animation
  const got = state.bag.filter(b => b.rarity === 'asgard');
  if (got.length !== 1) throw new Error('forventede 1 asgard-item, fik ' + got.length + ' (' + JSON.stringify(state.bag.map(b => b.rarity)) + ')');
  if (got[0].name !== 'Ægishjálmr') throw new Error('forkert item: ' + got[0].name);
  if (!state.worlds[24].boss) throw new Error('bossen skulle være besejret');
});
t('boss-sejr i verden 26 uddeler den NÆSTE man mangler', async () => {
  reset();
  state.bag.push(makeItem('helm', 'asgard'));   // hjelmen er allerede vundet
  state.worlds[25] = { hear:3, type:3, fill:3, done:[true,true,true] };
  cur.world = 25;
  startBoss(25);
  bossWin();
  await wait(600);
  const ny = state.bag.filter(b => b.rarity === 'asgard' && b.name !== 'Ægishjálmr');
  if (ny.length !== 1) throw new Error('forventede 1 nyt asgard-item, fik ' + ny.length);
  if (ny[0].name !== 'Mjölnir') throw new Error('forventede Mjölnir som nr. 2, fik ' + ny[0].name);
});
t('boss-sejr i en gammel verden giver IKKE ASEGÅRD', async () => {
  reset();
  cur.world = 0;
  startBoss(0);
  bossWin();
  await wait(600);
  if (state.bag.some(b => b.rarity === 'asgard')) throw new Error('verden 1 må ikke give ASEGÅRD: ' + JSON.stringify(state.bag.map(b => b.name)));
});

console.log('--- 8. Udstyr, angreb, aura og bedrifter ---');
reset();
const it = makeItem('weapon', 'asgard');
state.bag.push(it);
equipItem(it);
check('itemet kan udstyres (rariteten gemmes som "asgard")', state.gear.weapon === 'asgard', state.gear.weapon);
check('det udstyrede item viser det rigtige navn', (gearItemFor('weapon') || {}).name === 'Mjölnir', JSON.stringify(gearItemFor('weapon')));
check('countAsgardEquipped tæller 1', countAsgardEquipped() === 1, countAsgardEquipped());
check('heltens kraft stiger markant af ASEGÅRD-gear', heroPower() >= 45, heroPower());
renderAttacks();
const asgBtns = els['attackBar'].children.filter(b => (b.className || '').includes('asgard'));
check('ASEGÅRD-angrebet står i angrebslinjen med klasse asgard', asgBtns.length === 1, asgBtns.length);
check('angrebsknappen viser navn + ×48', asgBtns[0] && asgBtns[0].innerHTML.includes('×48'), asgBtns[0] && asgBtns[0].innerHTML);
check('auraen tændes af udstyret ASEGÅRD-gear', asgardAuraMarkup().includes('asgAura'));
check('ingen aura uden ASEGÅRD-gear', (() => { const g = state.gear; state.gear = {}; const out = asgardAuraMarkup() === ''; state.gear = g; return out; })());
renderHero();
const slots = els['mythicTrack'].children;
check('skatte-tavlen viser 18 pladser (6 mythic + 6 secret + 6 asgard)', slots.length === 18, slots.length);
check('de 6 ASEGÅRD-pladser har klassen asgard', slots.filter(c => (c.className || '').includes('mythic-slot asgard')).length === 6);
check('den udstyrede ASEGÅRD-plads vises som ejet', slots.filter(c => (c.className || '').includes('mythic-slot asgard owned')).length === 1);
check('tælleren viser 1 af 18', els['mythicCount'].textContent === '1/18', els['mythicCount'].textContent);
state.bag.push(makeItem('helm', 'asgard'));
state.bag.push(makeItem('shield', 'asgard'));
check('achievemement "first_asgard" låses op når man har et item', (() => { checkAchievements(); return state.achievements.includes('first_asgard'); })());
check('"full_asgard" kræver alle 6', !state.achievements.includes('full_asgard'));
for (const s of ['armor','boots','amulet']) state.bag.push(makeItem(s, 'asgard'));
check('"full_asgard" låses op med alle 6', (() => { checkAchievements(); return state.achievements.includes('full_asgard'); })());

console.log('--- 9. Verdenerne og deres bosser findes ---');
check('verden 25 hedder Den svære skov', WORLDS[24].name === 'Den svære skov', WORLDS[24].name);
check('verden 26 hedder Mesterskabet', WORLDS[25].name === 'Mesterskabet', WORLDS[25].name);
check('bossen i verden 25 er Stavelses-trolden', BOSSES[24].name === 'Stavelses-trolden', BOSSES[24].name);
/* Mester-dragen er ikke længere stærkest i TAL — de 10 nye verdener (27-36) fortsætter
   kurven opad. Den er stadig den eneste drage og den eneste vej til ASEGÅRD. */
check('bossen i verden 26 er Mester-dragen (den stærkeste drage + ASEGÅRD-porten)',
  BOSSES[25].name === 'Mester-dragen' && BOSSES[25].power > BOSSES[24].power, BOSSES[25].power);
check('de 10 nye verdener giver IKKE ASEGÅRD (kun 25 og 26 gør)',
  Array.from({ length: 10 }, (_, k) => asgardForWorld(26 + k).length).every(n => n === 0),
  JSON.stringify(Array.from({ length: 10 }, (_, k) => asgardForWorld(26 + k).length)));
check('de to ASEGÅRD-verdener har deres egne ord med i WORDS',
  WORLDS[24].words.concat(WORLDS[25].words).every(w => WORDS[w]),
  JSON.stringify(WORLDS[24].words.concat(WORLDS[25].words).filter(w => !WORDS[w])));
check('også de 10 nye verdener har deres ord med i WORDS',
  WORLDS.slice(26, 36).every(w => w.words.every(x => WORDS[x])),
  JSON.stringify(WORLDS.slice(26, 36).flatMap(w => w.words).filter(x => !WORDS[x])));
check('HTML har den tredje kort-side (worldMapC)', html.includes('id="worldMapC"'));

queue.then(() => {
  console.log(F === 0 ? '\\nASEGARD OK' : '\\n' + F + ' FEJL');
  if (F) process.exit(1);
});
`;
try {
  new Function(patched + '\n' + tests)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
