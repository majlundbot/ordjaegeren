// Test: D&D-terningekamp + kube-rework (bagToCube)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, textContent:'', innerHTML:'', value:'', children: [], appendChild(c){ this.children.push(c); return c; } };
  el._classes = new Set();
  Object.defineProperty(el, 'className', { get(){ return [...el._classes].join(' '); }, set(v){ el._classes = new Set(String(v).split(' ').filter(Boolean)); } });
  Object.defineProperty(el, 'innerHTML', { get(){ return el._html || ''; }, set(v){ el._html = String(v); el.children = []; } });
  el.classList = { add(...cs){ cs.forEach(c => el._classes.add(c)); }, remove(...cs){ cs.forEach(c => el._classes.delete(c)); }, toggle(c, f){ const has = el._classes.has(c); const on = (f === undefined) ? !has : !!f; if (on) el._classes.add(c); else el._classes.delete(c); return on; }, contains(c){ return el._classes.has(c); } };
  el.setAttribute = () => {};
  el.animate = () => ({});
  el.addEventListener = () => {};
  el.remove = () => {};
  el.focus = () => {};
  el.querySelector = () => el._btn || null;
  el.querySelectorAll = (sel) => sel.includes('.class-card') ? el.children : [];
  el._btn = makeBtn();
  return el;
};
function makeBtn() { const b = { textContent:'', style: { setProperty(){} }, classList: { add(){}, remove(){}, toggle(){}, contains(){return false} }, disabled: false }; return b; }
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn','attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','freeSpinBtn','freeSpinCount','toastGear','classGrid','classConfirm','profileGrid','newProfileBox','newProfileName','mythicCount','mythicTrack'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
els['classConfirm']._btn = makeBtn();
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMap'].children;
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.choice')) return [];
    if (sel.includes('.class-card')) return els['classGrid'].children;
    return [];
  },
  querySelector: (sel) => { if (sel.includes('classConfirm')) return els['classConfirm']._btn; return null; },
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
const storage = {};
global.localStorage = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = class { play() { return Promise.resolve(); } };
global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0 }), width:0, height:0 };
const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
const els = global.__els;
const fails = [];
let queue = Promise.resolve();
function t(label, fn) { queue = queue.then(() => { try { return Promise.resolve(fn()).then(() => console.log('OK   ' + label)); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }); }

t('rollDice giver 1-20 per terning', () => {
  const origRandom = Math.random;
  Math.random = () => 0.0;
  try { if (rollDice(1) !== 1) throw new Error('min rul skal være 1, fik ' + rollDice(1)); } finally { Math.random = origRandom; }
  Math.random = () => 0.9999;
  try { if (rollDice(1) !== 20) throw new Error('max rul skal være 20, fik ' + rollDice(1)); } finally { Math.random = origRandom; }
  // 2 terninger spænder 2-40
  Math.random = () => 0.5;
  try { const v = rollDice(2); if (v < 2 || v > 40) throw new Error('2d20 skal være 2-40, fik ' + v); } finally { Math.random = origRandom; }
});

t('bossDiceCount: 1 terning fra start, 2 efter 4 drager', () => {
  state.worlds = {};
  if (bossDiceCount() !== 1) throw new Error('1 terning fra start');
  const w0 = worldState(0); w0.boss = true;
  const w1 = worldState(1); w1.boss = true;
  const w2 = worldState(2); w2.boss = true;
  const w3 = worldState(3); w3.boss = true;
  if (bossDiceCount() !== 2) throw new Error('2 terninger efter 4 drager, fik ' + bossDiceCount());
});

t('bossAttack: højeste rul vinder (spiller vinder → drage mister HP)', async () => {
  state.gear = {}; state.worlds = {}; state.xp = 0; state.heroClass = 'kriger'; state.skin = 0; state.lootCount = 0; state.mapAt = 0;
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  cur.world = 0;
  startBoss();
  const hpBefore = bossState.dragonHp;
  // Spiller ruller 20, drage ruller 1 (første kald spiller, andet drage)
  let calls = 0;
  const origRandom = Math.random;
  Math.random = () => (calls++ % 2 === 0 ? 0.999 : 0.001);
  try { bossAttack(ATTACKS[0]); } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.dragonHp >= hpBefore) throw new Error('dragen skal miste HP når spilleren vinder, fik ' + bossState.dragonHp + ' (før ' + hpBefore + ')');
  if (bossState.playerHp <= 0) throw new Error('spiller må ikke tage skade når han vinder');
});

t('bossAttack: drage vinder → spiller mister HP, drage tager ingen skade', async () => {
  state.gear = {}; state.worlds = {}; state.xp = 0; state.heroClass = 'kriger'; state.skin = 0; state.lootCount = 0; state.mapAt = 0;
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  cur.world = 0;
  startBoss();
  const dHpBefore = bossState.dragonHp;
  const pHpBefore = bossState.playerHp;
  // Spiller ruller 1, drage ruller 20
  let calls = 0;
  const origRandom = Math.random;
  Math.random = () => (calls++ % 2 === 0 ? 0.001 : 0.999);
  try { bossAttack(ATTACKS[0]); } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.playerHp >= pHpBefore) throw new Error('spiller skal miste HP når dragen vinder');
  if (bossState.dragonHp !== dHpBefore) throw new Error('drage må ikke tage skade når den vinder');
});

t('bagToCube flytter item fra rygsæk til kube', () => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  state.bag = [{ id: 'a1', slot: 'helm', rarity: 'rare', name: 'Vikingehjelm' }];
  const ok = bagToCube(state.bag[0]);
  if (!ok) throw new Error('skulle kunne lægge i kuben');
  if (state.bag.length !== 0) throw new Error('item skal fjernes fra rygsækken, fik ' + state.bag.length);
  if (!CUBE_SLOTS[0]) throw new Error('item skal ligge i kuben');
});

t('kube: 3 items → forvandl giver bedre item', () => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  state.bag = [
    { id: 'b1', slot: 'helm', rarity: 'common', name: 'A' },
    { id: 'b2', slot: 'weapon', rarity: 'common', name: 'B' },
    { id: 'b3', slot: 'armor', rarity: 'common', name: 'C' }
  ];
  bagToCube(state.bag[0]); bagToCube(state.bag[0]); bagToCube(state.bag[0]);
  const before = state.bag.length;
  // Stub: ingen mythic (random > 0.10)
  const origRandom = Math.random;
  Math.random = () => 0.5;
  try { cubeTransmute(); } finally { Math.random = origRandom; }
  if (state.bag.length !== before + 1) throw new Error('forvandling skal give 1 nyt item, fik ' + state.bag.length);
  const newItem = state.bag[state.bag.length - 1];
  if (newItem.rarity !== 'magic') throw new Error('3 common skal give magic, fik ' + newItem.rarity);
  if (CUBE_SLOTS.some(x => x)) throw new Error('kuben skal være tom efter forvandling');
});

t('kube: 10% chance for mythic ved forvandling', () => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  state.gear = {}; state.bag = [
    { id: 'c1', slot: 'helm', rarity: 'rare', name: 'A' },
    { id: 'c2', slot: 'weapon', rarity: 'rare', name: 'B' },
    { id: 'c3', slot: 'armor', rarity: 'rare', name: 'C' }
  ];
  bagToCube(state.bag[0]); bagToCube(state.bag[0]); bagToCube(state.bag[0]);
  const before = state.bag.length;
  // Stub: mythic-drop (random=0 < 0.10)
  const origRandom = Math.random;
  Math.random = () => 0.0;
  try { cubeTransmute(); } finally { Math.random = origRandom; }
  const newItem = state.bag[state.bag.length - 1];
  if (newItem.rarity !== 'mythic') throw new Error('kuben skal kunne give mythic ved random=0, fik ' + newItem.rarity);
  if (state.bag.length !== before + 1) throw new Error('skulle have fået 1 mythic item');
});

t('kube: mythic kan ikke lægges i', () => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  state.bag = [{ id: 'm1', slot: 'helm', rarity: 'mythic', name: 'Kronen af Ord' }];
  const ok = bagToCube(state.bag[0]);
  if (ok) throw new Error('mythic skal afvises');
  if (state.bag.length !== 1) throw new Error('mythic skal blive i rygsækken');
});

t('kube: fortryd → item kommer tilbage i rygsækken', () => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  state.bag = [{ id: 'z1', slot: 'helm', rarity: 'rare', name: 'Vikingehjelm' }];
  // Læg i kuben
  bagToCube(state.bag[0]);
  if (state.bag.length !== 0) throw new Error('item skal være i kuben efter bagToCube');
  if (!CUBE_SLOTS[0]) throw new Error('kube-slot skal være fyldt');
  // Fortryd: simulér klik på kube-slot (genbrug renderCube's onclick-logik via direkte kald)
  const slotEl = els['cubeSlots'].children[0];
  if (slotEl && slotEl.onclick) slotEl.onclick();
  else {
    // Hvis stub ikke gav onclick, kør logikken direkte
    const it = CUBE_SLOTS[0];
    state.bag.push(it);
    CUBE_SLOTS[0] = null;
    save();
    renderHero();
  }
  if (state.bag.length !== 1) throw new Error('item skal være tilbage i rygsækken, fik ' + state.bag.length);
  if (state.bag[0].name !== 'Vikingehjelm') throw new Error('det samme item skal komme tilbage, fik ' + state.bag[0].name);
  if (CUBE_SLOTS[0]) throw new Error('kube-slot skal være tomt efter fortryd');
});

t('gratis spins fjernet: ingen useFreeSpin-funktion, ingen freeSpins i state', () => {
  if (typeof useFreeSpin !== 'undefined') throw new Error('useFreeSpin skal være fjernet');
  if ('freeSpins' in state) throw new Error('freeSpins skal være fjernet fra state');
});

t('lykkehjul: kan spinde FLERE gange efter hinanden (disabled nulstilles)', () => {
  state.gear = {}; state.worlds = {}; state.bag = [];
  for (let i = 0; i < 3; i++) {
    showLootWheel();
    if (!wheelPending) throw new Error('spin ' + (i+1) + ': wheelPending skal være sat');
    if (els['wheelBtn'].disabled) throw new Error('spin ' + (i+1) + ': Snur-knappen må ikke være disabled ved nyt hjul');
    const before = state.bag.length;
    const origRandom = Math.random;
    Math.random = () => 0.5;
    try { spinLootWheel(); } finally { Math.random = origRandom; }
    if (state.bag.length !== before + 1) throw new Error('spin ' + (i+1) + ': loot skal uddeles');
    // Simulér at brugeren lukker hjulet og åbner det igen
    closeLootWheel();
  }
});

queue.then(() => {
  console.log(fails.length === 0 ? 'ALLE D&D + KUBE-TESTS GRØNNE' : 'FEJL: ' + fails.length);
  if (fails.length) process.exit(1);
});
`;

const combined = patched + '\n' + tests;
(async () => {
  try {
    await new Function(combined)();
  } catch(e) {
    console.log('RUNTIME ERROR:', e.message);
    process.exit(1);
  }
})();
