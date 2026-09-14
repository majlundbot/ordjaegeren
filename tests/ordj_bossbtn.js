// Målrettet test: bossBtn-disabled-buggen (is-dragen kan ikke kæmpes)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' , scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}}, classList: { add(){}, remove(){}, toggle(){}, contains(){return false} }, textContent:'', innerHTML:'', children: [], appendChild(c){ this.children.push(c); return c; } };
  el.setAttribute = () => {};
  el.animate = () => ({});
  el.addEventListener = () => {};
  el.remove = () => {};
  return el;
};
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats','screen-class'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMapA','worldMapB','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn','attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','freeSpinBtn','freeSpinCount','toastGear','classGrid','classConfirm','mythicCount','mythicTrack'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children);
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.choice')) return [];
    return [];
  },
  querySelector: (sel) => sel === '#classConfirm .btn' ? null : null
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
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
function t(label, fn) { try { fn(); console.log('OK   ' + label); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }

t('verden 3 låst op efter Ild-drage-sejr', () => {
  state.worlds = {};
  state.heroClass = 'kriger';
  state.xp = 0;
  state.mapAt = 0;
  state.gear = {}; state.bag = []; state.skin = 0; state.lootCount = 0;
  const w0 = worldState(0); w0.done = [true,true,true]; w0.hear=3; w0.type=3; w0.fill=3; w0.boss = true;
  const w1 = worldState(1); w1.done = [true,true,true]; w1.hear=3; w1.type=3; w1.fill=3; w1.boss = true;
  const w2 = worldState(2); w2.done = [true,true,true]; w2.hear=3; w2.type=3; w2.fill=3; w2.boss = true;
  if (!worldUnlocked(3)) throw new Error('verden 3 skal være låst op');
});

t('besøg verden 2 → knap disabled+done (som i fejlen)', () => {
  showWorld(2);
  if (els['bossBtn'].disabled !== true) throw new Error('knap skal være disabled efter sejr');
  if (!els['bossBtn'].textContent.includes('besejret')) throw new Error('skal vise besejret');
});

t('verden 3 → knappen er KLIKBAR (bugfix)', () => {
  const w3 = worldState(3);
  w3.done = [true,true,true]; w3.hear=3; w3.type=3; w3.fill=3;
  showWorld(3);
  if (els['bossBtn'].disabled !== false) throw new Error('knap skal være enabled — fik disabled=' + els['bossBtn'].disabled);
  if (!els['bossBtn'].textContent.includes('Is-dragen')) throw new Error('skal vise Is-dragen, fik: ' + els['bossBtn'].textContent);
  if (els['bossBtn'].style.display !== 'block') throw new Error('knap skal være synlig');
  startBoss(3);
  if (BOSSES[cur.world].name !== 'Is-dragen') throw new Error('kamp skal være mod Is-dragen');
  if (!bossState) throw new Error('bossState ikke sat');
});

t('besejr Is-dragen → verden 4 låses op', () => {
  bossState.playerHp = 999;
  bossWin();
  if (!state.worlds[3] || !state.worlds[3].boss) throw new Error('worlds[3].boss skal være true');
  if (!worldUnlocked(4)) throw new Error('verden 4 skal låses op efter sejr');
});

console.log(fails.length === 0 ? 'ALLE BOSS-TESTS GRØNNE' : 'FEJL: ' + fails.length);
if (fails.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
