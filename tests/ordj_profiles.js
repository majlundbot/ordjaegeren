// Profil-test: hver spiller har eget fremskridt
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, classList: { add(){}, remove(){}, contains(){return false} }, textContent:'', innerHTML:'', value:'', children: [], appendChild(c){ this.children.push(c); return c; } };
  el.setAttribute = () => {};
  el.animate = () => ({});
  el.addEventListener = () => {};
  el.remove = () => {};
  el.focus = () => {};
  return el;
};
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn','attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','freeSpinBtn','freeSpinCount','toastGear','classGrid','classConfirm','mythicCount','mythicTrack','profileGrid','newProfileBox','newProfileName'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMap'].children;
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.choice')) return [];
    return [];
  },
  querySelector: (sel) => sel === '#classConfirm .btn' ? null : null
};
global.window = { AudioContext: null, webkitAudioContext: null };
// localStorage stub med rigtig opførsel (get/set virker)
const storage = {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
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

t('første kørsel: Robin-profil oprettes automatisk', () => {
  const ps = profileStore();
  if (ps.length !== 1) throw new Error('forventet 1 profil, fik ' + ps.length);
  if (ps[0].name !== 'Robin') throw new Error('forventet Robin, fik ' + ps[0].name);
  if (activeId() !== 'robin') throw new Error('aktiv skal være robin');
});

t('Robin kan spille (state er isoleret)', () => {
  // Simuler at Robin har klaret verden 0's første mission
  const w0 = worldState(0);
  w0.hear = 3; w0.done[0] = true;
  save();
  const saved = JSON.parse(global.localStorage.getItem(profileKey('robin')));
  if (!saved.worlds[0] || saved.worlds[0].hear !== 3) throw new Error('Robin-fremskridt ikke gemt');
});

t('opret Joey-profil → tom state', () => {
  els['newProfileName'].value = 'Joey';
  createProfile();
  const ps = profileStore();
  if (ps.length !== 2) throw new Error('forventet 2 profiler, fik ' + ps.length);
  const joey = ps.find(p => p.name === 'Joey');
  if (!joey) throw new Error('Joey ikke oprettet');
  if (activeId() !== joey.id) throw new Error('Joey skal være aktiv');
  // Joey skal have tomt fremskridt (ikke Robins 3 stjerner)
  if (totalStars() !== 0) throw new Error('Joey skal starte på 0 stjerner, fik ' + totalStars());
  if (state.worlds[0] && state.worlds[0].hear) throw new Error('Joey må ikke arve Robins data');
});

t('skift tilbage til Robin → fremskridt er der', () => {
  switchProfile('robin');
  if (activeId() !== 'robin') throw new Error('ikke skiftet tilbage');
  if (totalStars() !== 3) throw new Error('Robin skal have sine 3 stjerner, fik ' + totalStars());
});

t('profil-kort vises i grid (Robin + Joey + ny-knap)', () => {
  showProfiles();
  const cards = els['profileGrid'].children;
  if (cards.length !== 3) throw new Error('forventet 3 kort (2 spillere + ny), fik ' + cards.length);
});

console.log(fails.length === 0 ? 'ALLE PROFIL-TESTS GRØNNE' : 'FEJL: ' + fails.length);
if (fails.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
