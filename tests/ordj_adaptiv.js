// Adaptiv læring: mønster-detektion + lektioner + drill
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeEl = id => {
  const el = { id, classList:{add(){},remove(){},toggle(){},contains:()=>false}, textContent:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{}, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'', onclick:null };
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
['screen-start','screen-map','screen-world','screen-boss','screen-hero','screen-stats','screen-lesson','hud','hudProgress','startMeta',
 'worldMapA','worldMapB','mapCarousel','mapTitle','mapDots','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'bossBtn','bossStatus','bossMsg','bossHint','attackBar','bossDragonEmoji','bossDragonName','bossDragonPower','bossHeroSvg','heroHpFill','dragonHpFill','playerDice','dragonDice','playerDiceTotal','dragonDiceTotal','potionBtn','potionCount','fxLayer',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint','mythicCount','mythicTrack','talentPoints','talentRow','achieveCount','cubeSlots','cubeBtn','cubeResult','crInputs','crIcon','crRarity','crName','crSub','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear',
 'collectGrid','achieveGrid','achieveMeta','statsGrid','statsWeak','statsGames','statsHistory','statsPatterns','lessonIcon','lessonTitle','lessonRule','lessonTip','lessonExamples','lessonDrill','lessonMeta',
 'resultEmoji','resultTitle','resultStars','resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','typeInput','fillSentence','fillChoices','fillStatus','hearSpeak','hearChoices','hearStatus','typeHint','typeStatus','typeNext','classGrid','classConfirm','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult'
].forEach(id => els[id] = makeEl(id));
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss','screen-hero','screen-stats','screen-lesson'].map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children);
    return [];
  },
  querySelector: () => null
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => Promise.resolve(); this.onerror = null; this.onended = null; };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }

// 1) Mønstre findes og matcher korrekt
check('mindst 6 mønstre defineret', SPELL_PATTERNS.length >= 6, SPELL_PATTERNS.length);
const hv = SPELL_PATTERNS.find(p => p.key === 'hv');
check('hv-mønster matcher hvad/hvor/hvordan', hv.test('hvad') && hv.test('hvor') && hv.test('hvordan'));
check('hv-mønster matcher IKKE hest', !hv.test('hest'));
const dbl = SPELL_PATTERNS.find(p => p.key === 'dbl');
check('dobbelt-mønster matcher ikke/alle/sukker', dbl.test('ikke') && dbl.test('alle') && dbl.test('sukker'));
check('dobbelt-mønster matcher IKKE hus/kat', !dbl.test('hus') && !dbl.test('kat'));
const nd = SPELL_PATTERNS.find(p => p.key === 'stumtd');
check('stumt-d matcher mand/hund/vind', nd.test('mand') && nd.test('hund') && nd.test('vind'));
check('stumt-d matcher IKKE man', !nd.test('man'));
const ae = SPELL_PATTERNS.find(p => p.key === 'ae');
check('æ-lyd matcher æble, ikke hus', ae.test('æble') && !ae.test('hus'));
check('æøå matcher IKKE hus', !ae.test('hus'));

// 2) patternWords finder ord i spillet
const hvWords = patternWords('hv');
check('patternWords hv finder >=3 ord', hvWords.length >= 3, hvWords.length);
check('patternWords hv indeholder kun hv-ord', hvWords.every(w => /^hv/.test(w)), JSON.stringify(hvWords));
const longWords = patternWords('lang');
check('lange ord finder ord med 7+ bogstaver', longWords.length > 0 && longWords.every(w => w.length >= 7), JSON.stringify(longWords.slice(0,5)));
check('patternWords ukendt nøgle = tom', patternWords('findes-ikke').length === 0);

// 3) patternStats: ingen mønstre uden fejl
state.worlds = {}; state.wrong = {}; state.stats = { words: {}, games: {}, days: {}, history: [] };
check('ingen mønstre når ingen fejl', patternStats().length === 0);

// 4) Fejl registreres → mønster opdages
state.stats.words['hvad'] = { tries: 5, wrong: 3 };
state.stats.words['hvor'] = { tries: 4, wrong: 2 };
const pats = patternStats();
check('hv-mønster opdages efter fejl', pats.length >= 1 && pats.some(p => p.key === 'hv'), JSON.stringify(pats.map(p => p.key)));
const hvPat = pats.find(p => p.key === 'hv');
check('mønster tæller fejl korrekt', hvPat.wrong === 5, hvPat.wrong);
check('mønster har øve-ord', hvPat.practice.length >= 3);

// 5) unseenPattern / markPatternSeen
state.seenPatterns = [];
check('unseenPattern finder nyt mønster', unseenPattern() && unseenPattern().key === 'hv');
markPatternSeen('hv');
check('markPatternSeen markerer set', state.seenPatterns.includes('hv'));

// 6) Drill starter Fang-ordet med mønstrets ord
state.wrong = { 'hvad': 2 };
startPatternDrill('hv');
check('drill sætter cur.drill', cur.drill === 'hv');
check('drill bruger type-spillet', cur.game === 'type');
check('drill ord er alle hv-ord', cur.words.every(w => /^hv/.test(w)), JSON.stringify(cur.words));
check('drill har maks 6 ord', cur.words.length <= 6);

// 7) showLesson udfylder skærmen
state.seenPatterns = [];
showLesson('hv');
check('lektion viser titel', els['lessonTitle'].textContent.includes('HV'));
check('lektion viser regel', els['lessonRule'].textContent.length > 10);
check('lektion viser eksempler', els['lessonExamples'].innerHTML.includes('lesson-chip'));
check('lektion markerer set', state.seenPatterns.includes('hv'));
check('lektion har øve-knap', els['lessonDrill'].textContent.includes('Øv'));

console.log('ADAPTIV-TESTS DONE');
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
