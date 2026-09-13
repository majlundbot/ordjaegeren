// Verificér 2-kort-systemet: hvert kort har 12 verdener, swipe fungerer, helt vises på rigtigt kort
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeEl = id => {
  const el = { id, classList:{add(){},remove(){},contains:()=>false}, textContent:'', innerHTML:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{}, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'' };
  // innerHTML-set rydder children (som i browseren)
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
['screen-start','screen-map','screen-world','screen-boss','screen-hero','hud','hudProgress','startMeta',
 'worldMapA','worldMapB','mapCarousel','mapTitle','mapDots','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'bossBtn','bossStatus','bossMsg','bossHint','attackBar','bossDragonEmoji','bossDragonName','bossDragonPower','bossHeroSvg','heroHpFill','dragonHpFill','playerDice','dragonDice','playerDiceTotal','dragonDiceTotal','potionBtn','potionCount','fxLayer',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint','mythicCount','mythicTrack','talentPoints','talentRow','achieveCount','cubeSlots','cubeBtn','cubeResult','crInputs','crIcon','crRarity','crName','crSub','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear',
 'collectGrid','achieveGrid','achieveMeta','statsGrid','statsWeak','statsHistory','resultEmoji','resultTitle','resultStars','resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','typeInput','fillSentence','fillChoices','fillStatus','hearSpeak','hearChoices','hearStatus','typeHint','typeStatus','typeNext','classGrid','classConfirm'
].forEach(id => els[id] = makeEl(id));
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss','screen-hero'].map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children);
    return [];
  },
  querySelector: (sel) => sel.includes('.map-swipe-hint') ? makeEl('hint') : null
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => {}; };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }
let fails = 0;

// 1) renderWorldMap tegner begge kort med 12 verdener hver
state.worlds = {}; state.mapAt = 0;
renderWorldMap();
const a = els['worldMapA'];
const b = els['worldMapB'];
const cardA = a.children.filter(c => c.className.includes('world-card'));
const cardB = b.children.filter(c => c.className.includes('world-card'));
check('kort A (Galaksen) har 12 verdener', cardA.length === 12, cardA.length);
check('kort B (Akademiet) har 12 verdener', cardB.length === 12, cardB.length);
check('kort A indeholder Start-planeten', cardA.some(c => c.innerHTML.includes('Start-planeten')));
check('kort B indeholder Bog-klassen', cardB.some(c => c.innerHTML.includes('Bog-klassen')));
check('kort A har IKKE akademi-ord', !cardA.some(c => c.innerHTML.includes('Bog-klassen')));
check('kort B har IKKE galakse-ord', !cardB.some(c => c.innerHTML.includes('Start-planeten')));
check('kort A har 1 helt', a.children.filter(c => c.className.includes('map-hero')).length === 1);
check('kort B har 0 helte', b.children.filter(c => c.className.includes('map-hero')).length === 0);

// 2) Helten vises kun på kortet hvor han er
const heroInA = els['worldMapA'].children.filter(c => c.className.includes('map-hero'));
const heroInB = els['worldMapB'].children.filter(c => c.className.includes('map-hero'));
check('helt A findes når mapAt=0', heroInA.length === 1);
check('helt B findes IKKE når mapAt=0', heroInB.length === 0);
state.mapAt = 15;
renderWorldMap();
const heroInA2 = els['worldMapA'].children.filter(c => c.className.includes('map-hero'));
const heroInB2 = els['worldMapB'].children.filter(c => c.className.includes('map-hero'));
check('helt B findes når mapAt=15', heroInB2.length === 1);
check('helt A findes IKKE når mapAt=15', heroInA2.length === 0);

// 3) setMapPage opdaterer titel + dots (native scroll)
setMapPage(0, false);
check('titlen er Galaksen på side 0', els['mapTitle'].textContent.includes('Galaksen'));
setMapPage(1, false);
check('titlen er akademiet på side 1', els['mapTitle'].textContent.includes('Ord-akademiet'));

// 4) swipeMap skifter side men bliver inden for 0-1
curMapPage = 0; swipeMap(1);
check('swipe til akademiet', curMapPage === 1);
swipeMap(1);
check('kan ikke swipe forbi akademiet', curMapPage === 1);
swipeMap(-1); swipeMap(-1);
check('kan ikke swipe forbi galaksen', curMapPage === 0);

// 5) travelToWorld på akademi-verden bruger helt B
state.mapAt = 0; state.worlds[11] = { boss: true }; state.worlds[12] = { done: [true,true,true], boss: false };
renderWorldMap();
travelToWorld(12);
check('travel til akademi-verden sætter mapAt', state.mapAt === 12);

console.log('2-KORT-TESTS DONE');
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
