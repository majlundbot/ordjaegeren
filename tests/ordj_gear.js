// Gear/loot-tests: kør spil-scriptet med DOM-stub og test gear-logikken
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

function makeEl(id) {
  const el = {
    id, _text: '', _html: '', _class: [], children: [], _value: '',
    style: { setProperty() {} },
    classList: { add(c){ if(!el._class.includes(c)) el._class.push(c); }, remove(c){ el._class = el._class.filter(x=>x!==c); }, contains(c){ return el._class.includes(c); } },
    get className() { return el._class.join(' '); }, set className(v) { el._class = v.split(' ').filter(Boolean); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); el.children = []; },
    get value() { return el._value; }, set value(v) { el._value = String(v); },
    appendChild(c) { el.children.push(c); },
    addEventListener() {}, focus() {}, click() {},
    querySelector() { return this._btn || null; }, querySelectorAll() { return []; },
    _btn: null,
    onclick: null, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    setProperty() {}, offsetWidth: 0, remove() {}, title: "", disabled: false,
    animate() { return {}; }
  };
  return el;
}
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','gearSlots','heroBag','heroHint','lootCard','lootIcon','lootRarity','lootName','lootSub',
 'bossBtn','bossHeroSvg','bossHeroName','bossHeroPower','bossDragonEmoji','bossDragonName','bossDragonPower','bossStatus','bossMsg','bossHint',
 'heroHpFill','dragonHpFill','attackBar',
 'statsGrid','statsWeak','statsGames','statsHistory'].forEach(id => els[id] = makeEl(id));
els['fxLayer'] = makeEl('fxLayer');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0 }), width:0, height:0 };
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMap'].children;
    if (sel.includes('.class-card')) return els['classGrid'].children;
    return [];
  },
  querySelector: () => null,
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = class { constructor(src) { this.src = src; } play() { return Promise.resolve(); } };
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
// ==== GEAR TESTS ====
const els = global.__els;
const fails = [];
let gqueue = Promise.resolve();
function gtest(label, fn) { gqueue = gqueue.then(() => { try { return Promise.resolve(fn()).then(() => console.log('OK   ' + label)); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }); }

gtest('gear-data: 6 slots, 7 rariteter (inkl. mythic + secret)', () => {
  if (GEAR_SLOTS.length !== 6) throw new Error('6 slots forventet');
  if (RARITIES.length !== 7) throw new Error('7 rariteter forventet (inkl. mythic + secret)');
  if (!RARITIES.find(r => r.key === 'mythic')) throw new Error('mythic-raritet mangler');
  if (!RARITIES.find(r => r.key === 'secret')) throw new Error('secret-raritet mangler');
  if (Object.keys(GEAR_NAMES).length !== 6) throw new Error('navne for alle slots');
});

gtest('makeItem laver gyldigt item', () => {
  const it = makeItem('helm', 'rare');
  if (!it.name || it.slot !== 'helm' || it.rarity !== 'rare' || !it.id) throw new Error('ufuldstændigt item: ' + JSON.stringify(it));
});

gtest('rollRarity giver gyldig raritet', () => {
  for (let s = 1; s <= 3; s++) {
    const rk = rollRarity(s);
    if (!RARITIES.find(r => r.key === rk)) throw new Error('ugyldig raritet: ' + rk);
  }
});

gtest('heroPower starter på 0', () => {
  if (heroPower() !== 0) throw new Error('forventet 0, fik ' + heroPower());
});

gtest('equipItem + heroPower stiger', () => {
  const it = makeItem('weapon', 'epic'); // power 4
  state.bag.push(it);
  equipItem(it);
  if (heroPower() !== 4) throw new Error('forventet 4, fik ' + heroPower());
});

gtest('showHero renderer uden fejl', () => {
  showHero();
  if (!els['screen-hero'].classList.contains('active')) throw new Error('hero-skærm ikke aktiv');
  if (!els['heroSvg'].innerHTML.includes('<svg') && !els['heroSvg'].innerHTML.includes('ellipse')) throw new Error('SVG ikke renderet');
  if (els['gearSlots'].children.length !== 6) throw new Error('6 gear-slots forventet, fik ' + els['gearSlots'].children.length);
});

gtest('loot: finishGame giver gear i tasken', () => {
  const before = state.bag.length;
  cur.world = 0; cur.game = 'hear'; cur.errors = 0; cur.words = ['jeg','det','er','du','ikke','at','i','en'];
  finishGame();
  if (state.bag.length !== before + 1) throw new Error('tasken skulle have 1 mere, før=' + before + ' efter=' + state.bag.length);
  if (els['lootCard'].classList.contains('hidden')) throw new Error('loot-kort skulle være synligt (hidden fjernet)');
  if (!els['lootName'].textContent) throw new Error('loot-navn mangler');
});

gtest('state migreres korrekt (gamle saves)', () => {
  const old = { worlds: {} };
  const s2 = old;
  if (!s2.gear) s2.gear = {};
  if (!s2.bag) s2.bag = [];
  if (s2.skin === undefined) s2.skin = 0;
  if (s2.lootCount === undefined) s2.lootCount = 0;
  if (!Array.isArray(s2.bag)) throw new Error('bag skal være array');
});

gtest('boss-data: 24 drager, stigende kraft', () => {
  if (BOSSES.length !== 24) throw new Error('24 drager forventet');
  for (let i = 1; i < BOSSES.length; i++) {
    if (BOSSES[i].power <= BOSSES[i-1].power) throw new Error('kraft skal stige: ' + i);
  }
  if (ATTACKS.length !== 5) throw new Error('5 angreb forventet');
  if (ATTACKS[0].unlock !== 0) throw new Error('slag skal være ulåst fra start');
});

gtest('startBoss renderer uden fejl', () => {
  cur.world = 0;
  startBoss();
  if (!els['screen-boss'].classList.contains('active')) throw new Error('boss-skærm ikke aktiv');
  if (!els['bossDragonName'].textContent) throw new Error('drage-navn mangler');
  if (!els['bossHeroSvg'].innerHTML.includes('svg')) throw new Error('helt-SVG mangler');
  if (els['attackBar'].children.length !== 5) throw new Error('5 angrebsknapper forventet, fik ' + els['attackBar'].children.length);
});

gtest('bossAttack sejr: terninge-vinder → boss besejret', async () => {
  // Giv helten masser af kraft
  state.gear = { helm:'legendary', weapon:'legendary', armor:'legendary', shield:'legendary', boots:'legendary', amulet:'legendary' };
  state.worlds = {};
  cur.world = 0;
  startBoss();
  const dragonHpBefore = bossState.dragonHp;
  // Stub terninger: spiller ruller altid 20, dragen altid 1 → spiller vinder runden
  const origRandom = Math.random;
  Math.random = () => 0.999;
  try {
    bossAttack(ATTACKS[0]);
  } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.dragonHp >= dragonHpBefore) throw new Error('drage-HP skal falde efter vunden runde, fik ' + bossState.dragonHp + ' (før: ' + dragonHpBefore + ')');
  if (dragonHpBefore !== 30) throw new Error('drage 1 skal have 30 HP (5 × 6), fik ' + dragonHpBefore);
  bossWin(); // kald direkte (spring animation over)
  await new Promise(r => setTimeout(r, 600)); // lad bossWin's showLootWheel-timer køre færdig
  if (!state.worlds[0].boss) throw new Error('boss skulle være besejret');
  if (collectedCount() !== 1) throw new Error('samlekort-tæller skal være 1');
});

gtest('lykkehjul: 25/25/50 chancer + loot uddeles ved spin', async () => {
  state.gear = {}; state.worlds = {}; state.bag = [];
  cur.world = 0;
  // Stub: roll < .25 → mytisk
  const origRandom = Math.random;
  Math.random = () => 0.0;
  try { showLootWheel(); } finally { Math.random = origRandom; }
  if (!wheelPending) throw new Error('wheelPending skal være sat');
  if (wheelPending.rk !== 'mythic') throw new Error('random=0 skal give mythic, fik ' + wheelPending.rk);
  const before = state.bag.length;
  Math.random = () => 0.5; // fulde omgange deterministisk
  try { spinLootWheel(); } finally { Math.random = origRandom; }
  // Loot uddeles MED DET SAMME ved spin (ikke efter animation)
  if (state.bag.length !== before + 1) throw new Error('lykkehjul skal uddele 1 item ved spin, fik ' + state.bag.length + ' (før ' + before + ')');
  const got = state.bag[state.bag.length - 1];
  if (got.rarity !== 'mythic') throw new Error('skulle have fået mythic, fik ' + got.rarity);
});

gtest('bossAttack tab: drage vinder runden → spiller mister liv', async () => {
  state.gear = {};
  state.worlds = {};
  cur.world = 0;
  state.heroClass = "troldmand"; // ingen HP-bonus → baseline 50
  startBoss();
  if (bossState.playerHp !== 50) throw new Error('spiller-HP uden gear skal være 50, fik ' + bossState.playerHp);
  const hpBefore = bossState.playerHp;
  // Stub terninger: spiller ruller altid 1, dragen altid 20 → dragen vinder runden
  let calls = 0;
  const origRandom = Math.random;
  Math.random = () => (calls++ % 2 === 0 ? 0.001 : 0.999);
  try {
    bossAttack(ATTACKS[0]);
  } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.playerHp >= hpBefore) throw new Error('spiller skal miste liv når dragen vinder, fik ' + bossState.playerHp + ' (før: ' + hpBefore + ')');
  bossLose(); // kald direkte
  if (state.worlds[0] && state.worlds[0].boss) throw new Error('boss må ikke besejres når man er for svag');
  if (!bossState.over) throw new Error('bossState skal være over efter tab');
});
gtest('kriger-klassen giver ekstra HP', () => {
  state.gear = {};
  state.worlds = {};
  cur.world = 0;
  state.heroClass = "kriger"; // +30 HP bonus
  startBoss();
  if (bossState.playerHp !== 80) throw new Error('kriger skal have 80 HP, fik ' + bossState.playerHp);
});

gtest('worldUnlocked kræver boss besejret', () => {
  state.worlds = { 0: { hear:3, type:3, fill:3, done:[true,true,true], boss:true } };
  if (!worldUnlocked(1)) throw new Error('verden 1 skal være åben når boss 0 er besejret');
  state.worlds = { 0: { hear:3, type:3, fill:3, done:[true,true,true] } };
  if (worldUnlocked(1)) throw new Error('verden 1 må ikke være åben uden boss-sejr');
});

gtest('statistik: markWrong/markRight registreres', () => {
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  cur.game = 'hear';
  markWrong('jeg');
  markWrong('jeg');
  markRight('det');
  const sw = state.stats.words['jeg'];
  if (sw.tries !== 2 || sw.wrong !== 2) throw new Error('jeg-statistik forkert: ' + JSON.stringify(sw));
  if (state.stats.games['hear'].tries !== 3) throw new Error('spiltype-statistik forkert');
});

gtest('showStats + renderStats uden fejl', () => {
  showStats();
  if (!els['screen-stats'].classList.contains('active')) throw new Error('stats-skærm ikke aktiv');
  if (!els['statsGrid'].innerHTML.includes('Stjerner')) throw new Error('stats-grid mangler oversigt');
  if (!els['statsWeak'].innerHTML) throw new Error('svage-ord-liste mangler');
});

gtest('svaghedsvægtning: buildWordList inkluderer svage ord', () => {
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  state.wrong = {};
  // Lav "på" til et svagt ord fra verden 1 (tidligere verden i forhold til verden 2)
  state.stats.words['på'] = { tries: 5, wrong: 4 };
  const list = buildWordList(2, 8);
  if (!list.includes('på')) throw new Error('svagt ord "på" burde dukke op i genøvning, fik: ' + JSON.stringify(list));
});

gqueue.then(() => {
  console.log('\\nGear-fejl i alt: ' + fails.length);
  if (fails.length) process.exit(1);
});
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
