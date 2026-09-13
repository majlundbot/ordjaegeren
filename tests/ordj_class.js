// Test: klasse-valg skal være klikbart og tydeligt
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, textContent:'', innerHTML:'', value:'', children: [], appendChild(c){ this.children.push(c); return c; } };
  el.scrollWidth = 2000; el.clientWidth = 1000; el.scrollLeft = 0; el.scrollTo = () => {};
  el._classes = new Set();
  Object.defineProperty(el, 'className', { get(){ return [...el._classes].join(' '); }, set(v){ el._classes = new Set(String(v).split(' ').filter(Boolean)); } });
  Object.defineProperty(el, 'innerHTML', { get(){ return el._html || ''; }, set(v){ el._html = String(v); el.children = []; } });
  el.classList = {
    add(...cs){ cs.forEach(c => el._classes.add(c)); },
    remove(...cs){ cs.forEach(c => el._classes.delete(c)); },
    contains(c){ return el._classes.has(c); }
  };
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
  const b = { textContent:'', style: { setProperty(){} }, classList: { add(){}, remove(){} } };
  return b;
}
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMapA','worldMapB','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn','attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','freeSpinBtn','freeSpinCount','toastGear','classGrid','classConfirm','mythicCount','mythicTrack','profileGrid','newProfileBox','newProfileName'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
els['classConfirm']._btn = makeBtn();
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children);
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.choice')) return [];
    if (sel.includes('.class-card')) return els['classGrid'].children;
    return [];
  },
  querySelector: (sel) => {
    if (sel.includes('classConfirm')) return els['classConfirm']._btn;
    return null;
  }
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
function t(label, fn) { try { fn(); console.log('OK   ' + label); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }

t('klasse-skærm viser 4 helte-kort', () => {
  showClassSelect();
  const cards = els['classGrid'].children;
  if (cards.length !== 4) throw new Error('forventet 4 klasse-kort, fik ' + cards.length);
  if (cards[0].onclick === null || cards[0].onclick === undefined) throw new Error('kort skal være klikbart (onclick)');
});

t('klik på Troldmand → valgt + confirm-knap vises', () => {
  showClassSelect();
  const cards = els['classGrid'].children;
  const mage = cards.find(c => c.innerHTML.includes('Troldmand'));
  if (!mage) throw new Error('Troldmand-kort ikke fundet');
  mage.onclick();
  if (state.heroClass !== 'troldmand') throw new Error('heroClass skal være troldmand');
  if (!mage.className.includes('selected')) throw new Error('kortet skal have selected-klasse');
  if (els['classConfirm'].classList.contains('hidden')) throw new Error('confirm-knap skal være synlig');
  if (!els['classConfirm']._btn.textContent.includes('Troldmand')) throw new Error('confirm skal nævne Troldmand, fik: ' + els['classConfirm']._btn.textContent);
});

t('kun ét kort er selected ad gangen', () => {
  showClassSelect();
  const cards = els['classGrid'].children;
  cards[2].onclick(); // Jæger
  const sel = cards.filter(c => c.className.split(' ').includes('selected'));
  if (sel.length !== 1) throw new Error('præcis 1 kort skal være selected, fik ' + sel.length);
  if (state.heroClass !== 'jæger') throw new Error('heroClass skal være jæger');
});

t('confirmClass → kortet åbnes', () => {
  showClassSelect();
  els['classGrid'].children[0].onclick();
  confirmClass();
  if (!els['screen-map'].classList.contains('active')) throw new Error('kortet skal åbne efter confirm');
});

console.log(fails.length === 0 ? 'ALLE KLASSE-TESTS GRØNNE' : 'FEJL: ' + fails.length);
if (fails.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
