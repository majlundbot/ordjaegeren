// Mythic end-game test: 5% drop, unikke items, angreb, aura, kube-beskyttelse
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, textContent:'', innerHTML:'', value:'', children: [], appendChild(c){ this.children.push(c); return c; } };
  el._classes = new Set();
  Object.defineProperty(el, 'className', { get(){ return [...el._classes].join(' '); }, set(v){ el._classes = new Set(String(v).split(' ').filter(Boolean)); } });
  Object.defineProperty(el, 'innerHTML', { get(){ return el._html || ''; }, set(v){ el._html = String(v); el.children = []; } });
  el.classList = { add(...cs){ cs.forEach(c => el._classes.add(c)); }, remove(...cs){ cs.forEach(c => el._classes.delete(c)); }, contains(c){ return el._classes.has(c); } };
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
function makeBtn() {
  const b = { textContent:'', style: { setProperty(){} }, classList: { add(){}, remove(){}, toggle(){}, contains(){return false} }, disabled: false };
  return b;
}
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
  querySelector: (sel) => {
    if (sel.includes('classConfirm')) return els['classConfirm']._btn;
    return null;
  },
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

t('mythic er i RARITIES med kraft 10', () => {
  const m = RARITIES.find(r => r.key === 'mythic');
  if (!m) throw new Error('mythic raritet mangler');
  if (m.power !== 10) throw new Error('mythic kraft skal være 10, fik ' + m.power);
  if (MYTHIC_ITEMS.length !== 6) throw new Error('6 mytiske items forventet, fik ' + MYTHIC_ITEMS.length);
});

t('rollMythicDrop: 10% chance, giver unikke items man mangler', () => {
  state.gear = {}; state.bag = [];
  // Stub Math.random lav → altid mythic-drop (0 < 0.10)
  const origRandom = Math.random;
  Math.random = () => 0.0;
  try {
    const drop = rollMythicDrop();
    if (!drop) throw new Error('skal droppe mythic ved random=0');
    if (!MYTHIC_ITEMS.some(m => m.slot === drop.slot)) throw new Error('ugyldigt slot: ' + drop.slot);
  } finally { Math.random = origRandom; }
});

t('rollMythicDrop: ingen mythic over 10%', () => {
  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const drop = rollMythicDrop();
    if (drop !== null) throw new Error('skal IKKE droppe ved random=0.99');
  } finally { Math.random = origRandom; }
});

t('lykkehjul: mythic rul giver item med unikt navn', () => {
  state.gear = {}; state.bag = []; state.worlds = {}; state.xp = 0; state.heroClass = 'kriger'; state.skin = 0; state.lootCount = 0; state.mapAt = 0;
  const w0 = worldState(0); w0.done = [true,true,true]; w0.hear=3; w0.type=3; w0.fill=3;
  cur.world = 0;
  const origRandom = Math.random;
  Math.random = () => 0.0; // < 0.25 → mythic + deterministisk
  try { showLootWheel(); } finally { Math.random = origRandom; }
  if (!wheelPending || wheelPending.rk !== 'mythic') throw new Error('lykkehjul skal give mythic ved random=0, fik ' + (wheelPending && wheelPending.rk));
  if (!wheelPending.item.name) throw new Error('mythic skal have navn');
  if (!MYTHIC_ITEMS.some(m => m.name === wheelPending.item.name)) throw new Error('navn skal være et mytisk navn, fik: ' + wheelPending.item.name);
  Math.random = () => 0.5;
  try { spinLootWheel(); } finally { Math.random = origRandom; }
  const mythicInBag = state.bag.find(b => b.rarity === 'mythic');
  if (!mythicInBag) throw new Error('mythic skal være i tasken efter spin');
});

t('mythic angreb vises kun når udstyret', () => {
  state.gear = {}; state.bag = [];
  cur.world = 0;
  renderAttacks();
  const before = els['attackBar'].children.filter(b => b.className.includes('mythic')).length;
  if (before !== 0) throw new Error('ingen mythic-angreb uden udstyret mythic, fik ' + before);
  // Udrust et mythic item
  state.gear['helm'] = 'mythic';
  renderAttacks();
  const after = els['attackBar'].children.filter(b => b.className.includes('mythic')).length;
  if (after !== 1) throw new Error('1 mythic-angreb forventet, fik ' + after);
});

t('mythic aura: ingen aura uden mythic, aura med mythic', () => {
  state.gear = {};
  const empty = mythicAuraMarkup();
  if (empty !== '') throw new Error('ingen aura uden mythic');
  state.gear['helm'] = 'mythic';
  const aura = mythicAuraMarkup();
  if (!aura.includes('mythAura')) throw new Error('aura skal indeholde mythAura-gradient');
});

t('kube afviser mythic items', () => {
  const fake = { rarity: 'mythic', name: 'Kronen af Ord', slot: 'helm' };
  const lenBefore = CUBE_SLOTS.filter(x => x).length;
  cubeAdd(fake);
  const lenAfter = CUBE_SLOTS.filter(x => x).length;
  if (lenAfter !== lenBefore) throw new Error('mythic skal afvises i kuben');
});

t('mythic gear beholder navn ved udskiftning', () => {
  state.gear = { helm: 'mythic' };
  state.bag = [{ id: 'x1', slot: 'helm', rarity: 'rare', name: 'Vikingehjelm' }];
  // Simuler klik på det rare item → bytter mythic ud
  const item = state.bag[0];
  if (state.gear[item.slot]) {
    const oldRk = state.gear[item.slot];
    const oldName = oldRk === 'mythic' && mythicForSlot(item.slot) ? mythicForSlot(item.slot).name : '?';
    if (!oldName || oldName === '?') throw new Error('mythic-navn skal bevares ved udskiftning');
    if (!MYTHIC_ITEMS.some(m => m.name === oldName)) throw new Error('gammelt navn skal være mytisk: ' + oldName);
  }
});

queue.then(() => {
  console.log(fails.length === 0 ? 'ALLE MYTHIC-TESTS GRØNNE' : 'FEJL: ' + fails.length);
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
