// Verificér 3-kort-systemet: hvert kort har sine verdener, swipe fungerer,
// helten vises på det rigtige kort — og verden 25+26 har deres EGEN tredje side.
// (Kontrakten er udvidet fra 2 til 3 sider da verden 25 og 26 kom til: de to første
// kort skal være identiske i layout, så de nye verdener kan ikke ligge oveni dem.)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeEl = id => {
  const el = { id, classList:{add(){},remove(){},toggle(){},contains:()=>false}, textContent:'', innerHTML:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{}, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'' };
  // innerHTML-set rydder children (som i browseren)
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
['screen-start','screen-map','screen-world','screen-boss','screen-hero','hud','hudProgress','startMeta',
 'worldMapA','worldMapB','worldMapC','mapCarousel','mapTitle','mapDots','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'bossBtn','bossStatus','bossMsg','bossHint','attackBar','bossDragonEmoji','bossDragonName','bossDragonPower','bossHeroSvg','heroHpFill','dragonHpFill','playerDice','dragonDice','playerDiceTotal','dragonDiceTotal','potionBtn','potionCount','fxLayer',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint','mythicCount','mythicTrack','talentPoints','talentRow','achieveCount','cubeSlots','cubeBtn','cubeResult','crInputs','crIcon','crRarity','crName','crSub','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear',
 'collectGrid','achieveGrid','achieveMeta','statsGrid','statsWeak','statsHistory','resultEmoji','resultTitle','resultStars','resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','typeInput','fillSentence','fillChoices','fillStatus','hearSpeak','hearChoices','hearStatus','typeHint','typeStatus','typeNext','classGrid','classConfirm'
].forEach(id => els[id] = makeEl(id));
global.__els = els;
global.__fs = fs;
global.__dirname = __dirname;
const MAP_IDS = ['worldMapA','worldMapB','worldMapC'];
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss','screen-hero'].map(id => els[id]);
    if (sel.includes('.world-card')) return MAP_IDS.flatMap(id => els[id].children);
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
const fs = global.__fs;
const __dirname = global.__dirname;
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); if (!cond) fails++; }
let fails = 0;
const cardsOf = id => els[id].children.filter(c => c.className.includes('world-card'));
const heroesIn = id => els[id].children.filter(c => c.className.includes('map-hero'));

// 1) renderWorldMap tegner TRE kort: 12 + 12 + 2 verdener
state.worlds = {}; state.mapAt = 0;
renderWorldMap();
check('kort A (Galaksen) har 12 verdener', cardsOf('worldMapA').length === 12, cardsOf('worldMapA').length);
check('kort B (Akademiet) har 12 verdener', cardsOf('worldMapB').length === 12, cardsOf('worldMapB').length);
check('kort C (Mester-riget) har 2 verdener', cardsOf('worldMapC').length === 2, cardsOf('worldMapC').length);
check('kort A indeholder Start-planeten', cardsOf('worldMapA').some(c => c.innerHTML.includes('Start-planeten')));
check('kort B indeholder Bog-klassen', cardsOf('worldMapB').some(c => c.innerHTML.includes('Bog-klassen')));
check('kort C indeholder Den svære skov', cardsOf('worldMapC').some(c => c.innerHTML.includes('Den svære skov')));
check('kort C indeholder Mesterskabet', cardsOf('worldMapC').some(c => c.innerHTML.includes('Mesterskabet')));
check('kort A har IKKE akademi-ord', !cardsOf('worldMapA').some(c => c.innerHTML.includes('Bog-klassen')));
check('kort B har IKKE galakse-ord', !cardsOf('worldMapB').some(c => c.innerHTML.includes('Start-planeten')));
check('kort B har IKKE de nye verdener', !cardsOf('worldMapB').some(c => c.innerHTML.includes('Mesterskabet')));
check('kort A har 1 helt', heroesIn('worldMapA').length === 1);
check('kort B har 0 helte', heroesIn('worldMapB').length === 0);
check('kort C har 0 helte', heroesIn('worldMapC').length === 0);

// 2) Helten vises kun på det kort hvor han er — også side C
check('helt findes på kort A når mapAt=0', heroesIn('worldMapA').length === 1);
state.mapAt = 15; renderWorldMap();
check('helt findes på kort B når mapAt=15', heroesIn('worldMapB').length === 1);
check('helt findes IKKE på kort A når mapAt=15', heroesIn('worldMapA').length === 0);
state.mapAt = 24; renderWorldMap();
check('helt findes på kort C når mapAt=24 (verden 25)', heroesIn('worldMapC').length === 1);
check('kort C-helten har id mapHeroC', heroesIn('worldMapC').some(c => c.id === 'mapHeroC'));
check('kort A+B er tomme for helte når mapAt=24', heroesIn('worldMapA').length === 0 && heroesIn('worldMapB').length === 0);

// 3) setMapPage opdaterer titel + dots for alle TRE sider
setMapPage(0, false);
check('titlen er Galaksen på side 0', els['mapTitle'].textContent.includes('Galaksen'));
check('der er 3 prikker i navigeringen', (els['mapDots'].innerHTML.match(/map-dot/g) || []).length === 3, els['mapDots'].innerHTML);
setMapPage(1, false);
check('titlen er akademiet på side 1', els['mapTitle'].textContent.includes('Ord-akademiet'));
setMapPage(2, false);
check('titlen er Mester-riget på side 2', els['mapTitle'].textContent.includes('Mester-riget'));
check('praecis én prik lyser', (els['mapDots'].innerHTML.match(/map-dot on/g) || []).length === 1, els['mapDots'].innerHTML);
check('det er den SIDSTE prik der lyser',
  els['mapDots'].innerHTML.indexOf('map-dot on') > els['mapDots'].innerHTML.lastIndexOf('map-dot"'),
  els['mapDots'].innerHTML);
setMapPage(9, false);
check('setMapPage klemmer til side 2', els['mapTitle'].textContent.includes('Mester-riget'));

// 4) swipeMap skifter side men bliver inden for 0-2
curMapPage = 0; swipeMap(1);
check('swipe til akademiet', curMapPage === 1);
swipeMap(1);
check('swipe videre til Mester-riget', curMapPage === 2);
swipeMap(1);
check('kan ikke swipe forbi Mester-riget', curMapPage === 2);
swipeMap(-1); swipeMap(-1); swipeMap(-1);
check('kan ikke swipe forbi galaksen', curMapPage === 0);

// 5) travelToWorld viser det rigtige kort — også for de nye verdener
state.worlds = {}; state.mapAt = 0; setMapPage(0, false);
travelToWorld(24);
check('travel til verden 25 sætter mapAt', state.mapAt === 24);
renderWorldMap();
check('kortet skifter til tredje side når helten er i verden 25', curMapPage === 2, curMapPage);
check('helten står på kort C efter travel til verden 25', heroesIn('worldMapC').length === 1);

// 6) MAP_POS: 2 nye positioner, så verden 25/26 IKKE ligger oveni de gamle
check('MAP_POS har 26 positioner', MAP_POS.length === 26, MAP_POS.length);
check('MAP_BIOMES har 26 biom', MAP_BIOMES.length === 26, MAP_BIOMES.length);
const nye = [MAP_POS[24], MAP_POS[25]];
check('verden 25/26 har deres EGNE positioner (ikke samme som verden 1/2)',
  nye.every(p => !MAP_POS.slice(0, 24).some(q => q.x === p.x && q.y === p.y)),
  JSON.stringify(nye));

// 7) Kilden: der er faktisk tre worldmap-divs i HTML, og tre sider i MAP_PAGES
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
check('HTML har worldMapA, worldMapB og worldMapC',
  html.includes('id="worldMapA"') && html.includes('id="worldMapB"') && html.includes('id="worldMapC"'));
check('MAP_PAGES beskriver 3 sider', MAP_PAGES.length === 3, MAP_PAGES.length);
check('side 3 starter ved verden 25 og slutter ved 26', MAP_PAGES[2].start === 24 && MAP_PAGES[2].end === 26);

console.log('3-KORT-TESTS DONE');
if (fails) process.exit(1);
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
