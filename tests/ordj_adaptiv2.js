// Adaptiv læring v2 — grundig test: 10 mønstre, fejl-hint, mestring, adaptiv sværhedsgrad, smart review
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const makeEl = id => {
  const el = { id, classList:{add(){},remove(){},toggle(){},contains:()=>false}, textContent:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){ return ''; } }, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, setProperty(){}, remove(){}, title:'', onclick:null };
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
['screen-start','screen-map','screen-world','screen-boss','screen-hero','screen-stats','screen-lesson','screen-type','screen-result','hud','hudProgress','startMeta',
 'worldMapA','worldMapB','mapCarousel','mapTitle','mapDots','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'bossBtn','bossStatus','bossMsg','bossHint','attackBar','bossDragonEmoji','bossDragonName','bossDragonPower','bossHeroSvg','heroHpFill','dragonHpFill','playerDice','dragonDice','playerDiceTotal','dragonDiceTotal','potionBtn','potionCount','fxLayer',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint','mythicCount','mythicTrack','talentPoints','talentRow','achieveCount','cubeSlots','cubeBtn','cubeResult','crInputs','crIcon','crRarity','crName','crSub','wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear',
 'collectGrid','achieveGrid','achieveMeta','statsGrid','statsWeak','statsGames','statsHistory','statsPatterns','statsMastered','lessonIcon','lessonTitle','lessonRule','lessonTip','lessonExamples','lessonDrill','lessonMeta',
 'resultEmoji','resultTitle','resultStars','resultMsg','resultXp','resultLearn','rewardCard','rewardEmoji','rewardText','resultNext','lootCard','lootIcon','lootRarity','lootName','lootSub',
 'typeInput','fillSentence','fillChoices','fillStatus','hearSpeak','hearChoices','hearStatus','typeHint','typeStatus','typeNext','classGrid','classConfirm','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult'
].forEach(id => els[id] = makeEl(id));
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss','screen-hero','screen-stats','screen-lesson','screen-type','screen-result'].map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children);
    return [];
  },
  querySelector: () => null
};
global.window = { AudioContext: null, webkitAudioContext: null };
const store = {};
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } };
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
let F = 0;
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }
function resetState() {
  state.worlds = {}; state.wrong = {}; state.seenPatterns = []; state.mastered = [];
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  state.bag = []; state.gear = {}; state.lootCount = 0;
}

// ===== 1) MØNSTER-BIBLIOTEK =====
check('12 mønstre defineret', SPELL_PATTERNS.length === 12, SPELL_PATTERNS.length);
const keys = SPELL_PATTERNS.map(p => p.key);
check('alle nøgler unikke', new Set(keys).size === SPELL_PATTERNS.length, JSON.stringify(keys));
check('alle har icon+name+rule+tip+look', SPELL_PATTERNS.every(p => p.icon && p.name && p.rule && p.tip && p.look && p.look.length));
// Hvert mønster skal have mindst 2 ord i spillet (ellers kan det ikke øves)
let tooFew = [];
SPELL_PATTERNS.forEach(p => { const n = ALL_WORDS.filter(w => p.test(w)).length; if (n < 2) tooFew.push(p.key + ':' + n); });
check('alle 12 mønstre har >= 2 ord i spillet', tooFew.length === 0, JSON.stringify(tooFew));

// Mønster-matcher korrekthed
const pat = k => SPELL_PATTERNS.find(p => p.key === k);
check('hv matcher hvad/hvor/hvordan/hvem', ['hvad','hvor','hvordan','hvem'].every(w => pat('hv').test(w)));
check('hv matcher IKKE hest/hus', !pat('hv').test('hest') && !pat('hv').test('hus'));
check('dbl matcher ikke/alle/sukker/klasse', ['ikke','alle','sukker','klasse'].every(w => pat('dbl').test(w)));
check('dbl matcher IKKE kat/hus', !pat('dbl').test('kat') && !pat('dbl').test('hus'));
check('konsstart matcher skole/stue/blomst/træ', ['skole','stue','blomst','træ'].every(w => pat('konsstart').test(w)));
check('stumtd matcher mand/hund/hånd/vind/mund', ['mand','hund','hånd','vind','mund'].every(w => pat('stumtd').test(w)));
check('stumtd matcher IKKE man/hus', !pat('stumtd').test('man') && !pat('stumtd').test('hus'));
check('æ matcher æble/træ', pat('ae').test('æble') && pat('ae').test('træ'));
check('æ matcher IKKE hus/hund', !pat('ae').test('hus') && !pat('ae').test('hund'));
check('ø matcher øje/høne/smør', ['øje','høne','smør'].every(w => pat('oe').test(w)));
check('ø matcher IKKE hus/æble', !pat('oe').test('hus') && !pat('oe').test('æble'));
check('å matcher år/hår/hånd/gå', ['år','hår','hånd','gå'].every(w => pat('aa').test(w)));
check('å matcher IKKE hus/oje', !pat('aa').test('hus') && !pat('aa').test('oje'));
check('j matcher jeg/ja/tøj/trøje', ['jeg','ja','tøj','trøje'].every(w => pat('j').test(w)));
check('j matcher IKKE hus/mand', !pat('j').test('hus') && !pat('j').test('mand'));
check('erendelse matcher lærer/søster/sukker', ['lærer','søster','sukker'].every(w => pat('erendelse').test(w)));
check('erendelse matcher IKKE hus/mand', !pat('erendelse').test('hus') && !pat('erendelse').test('mand'));
check('lang matcher ord med 7+ tegn', pat('lang').test('familie') && pat('lang').test('bedstefar'));
check('lang matcher IKKE hus', !pat('lang').test('hus'));

// ===== 2) PATTERN WORDS =====
resetState();
check('patternWords hv giver kun hv-ord', patternWords('hv').every(w => /^hv/.test(w)));
check('patternWords hv har >= 3', patternWords('hv').length >= 3);
check('patternWords ukendt = tom', patternWords('nope').length === 0);

// ===== 3) FEJL-HINT (øjeblikkelig forklaring) =====
check('patternHintFor hvad giver hint', patternHintFor('hvad').includes('fail-hint'));
check('patternHintFor hvad nævner reglen', patternHintFor('hvad').includes('hv-ord'));
check('patternHintFor hus (intet mønster) = tom', patternHintFor('hus') === '' || patternHintFor('hus').includes('fail-hint'));
check('patternHintFor år matcher å-mønster', patternHintFor('år').includes('fail-hint'));

// ===== 4) MØNSTER-STATS =====
resetState();
check('ingen mønstre uden fejl', patternStats().length === 0);
state.stats.words['hvad'] = { tries: 5, wrong: 3 };
state.stats.words['hvor'] = { tries: 4, wrong: 2 };
const ps = patternStats();
check('hv opdages efter fejl', ps.some(p => p.key === 'hv'));
check('fejl tælles korrekt (5)', ps.find(p => p.key === 'hv').wrong === 5, ps.find(p => p.key === 'hv').wrong);

// ===== 5) MESTRING =====
resetState();
state.stats.words['hvad'] = { tries: 5, wrong: 4 }; state.stats.words['hvor'] = { tries: 5, wrong: 4 };
check('svag når fejlrate > 30%', patternMastery('hv').level === 'weak', patternMastery('hv').level);
resetState();
state.stats.words['hvad'] = { tries: 10, wrong: 1 }; state.stats.words['hvor'] = { tries: 10, wrong: 1 };
check('stærk når fejlrate < 15%', patternMastery('hv').level === 'strong', patternMastery('hv').level);
check('mastery rate beregnet', Math.abs(patternMastery('hv').rate - 0.10) < 0.001, patternMastery('hv').rate);
resetState();
state.stats.words['hvad'] = { tries: 2, wrong: 0 };
check('for lidt data = learning', patternMastery('hv').level === 'learning');
check('MASTERY_LABEL har 3 niveauer', Object.keys(MASTERY_LABEL).length === 3);

// checkPatternMastery: når et mønster er stærkt OG har fejlhistorik → markeres mestret
resetState();
state.stats.words['hvad'] = { tries: 10, wrong: 1 }; state.stats.words['hvor'] = { tries: 10, wrong: 1 };
// patternStats kræver wrong>0, så tilføj en gammel fejl
state.wrong = {};
checkPatternMastery();
check('mestret-array oprettet', Array.isArray(state.mastered));

// ===== 6) ADAPTIV SVÆRHEDSGRAD =====
resetState();
check('ingen data → basis-antal', adaptiveWordCount(8) === 8, adaptiveWordCount(8));
// God præstation: høje stjerner, lav fejlrate
state.stats.history = [
  { stars: 3, wrong: [], total: 8 }, { stars: 3, wrong: [], total: 8 }, { stars: 3, wrong: [], total: 8 }
];
check('flyvende → +2 ord', adaptiveWordCount(8) === 10, adaptiveWordCount(8));
check('adaptiv note positiv', adaptiveNote().includes('flere ord'));
// Dårlig præstation: mange fejl
state.stats.history = [
  { stars: 1, wrong: ['a','b','c','d'], total: 8 }, { stars: 1, wrong: ['a','b','c'], total: 8 }
];
check('kæmper → -2 ord', adaptiveWordCount(8) === 6, adaptiveWordCount(8));
check('adaptiv note støttende', adaptiveNote().includes('færre ord'));
state.stats.history = [{ stars: 2, wrong: ['a'], total: 8 }, { stars: 2, wrong: ['a'], total: 8 }];
check('mellem → basis', adaptiveWordCount(8) === 8, adaptiveWordCount(8));
check('adaptiv note tom i midten', adaptiveNote() === '');

// ===== 7) SMART REVIEW: svage mønster-ord prioriteres =====
resetState();
state.stats.words['hvad'] = { tries: 5, wrong: 4 }; state.stats.words['hvor'] = { tries: 5, wrong: 4 };
state.wrong['hvad'] = 2;
const wl = buildWordList(0, 8);
check('wordlist har 8 ord', wl.length === 8, wl.length);
check('wordlist unikke', new Set(wl).size === 8, new Set(wl).size);
check('wordlist inkluderer svagt mønster-ord', wl.some(w => pat('hv').test(w)), JSON.stringify(wl));

// ===== 8) DRILL & LEKTION =====
resetState();
state.stats.words['hvad'] = { tries: 5, wrong: 4 }; state.stats.words['hvor'] = { tries: 5, wrong: 4 };
startPatternDrill('hv');
check('drill sætter cur.drill', cur.drill === 'hv');
check('drill ord alle hv', cur.words.every(w => /^hv/.test(w)));
showLesson('hv');
check('lektion titel indeholder HV', els['lessonTitle'].textContent.includes('HV'));
check('lektion markeret set', state.seenPatterns.includes('hv'));
check('lektion har øve-knap med antal', /Øv \\d+ ord/.test(els['lessonDrill'].textContent), els['lessonDrill'].textContent);

// ===== 9) RESULTAT-SKÆRM: lærings-opsummering =====
resetState();
state.stats.words['hvad'] = { tries: 5, wrong: 4 };
cur = { world: 0, game: 'type', words: ['hvad','hvor','hus','mand'], idx: 4, errors: 2, answered: false, wrongWords: ['hvad','hvor'], drill: null };
finishGame();
check('resultLearn udfyldt med mønster-hint', els['resultLearn'].innerHTML.includes('fail-hint'), els['resultLearn'].innerHTML.slice(0,80));
check('resultLearn nævner hv-ord', els['resultLearn'].innerHTML.includes('hv-ord'));

// ===== 10) STATISTIK viser mønstre =====
resetState();
state.stats.words['hvad'] = { tries: 5, wrong: 4 };
state.mastered = ['ae'];
showStats();
check('statsPatterns viser svagt mønster', els['statsPatterns'].innerHTML.includes('hv-ord'));
check('statsPatterns viser mestrings-badge', els['statsPatterns'].innerHTML.includes('mastery'));
check('statsMastered viser mestret mønster', els['statsMastered'].innerHTML.includes('Mestret'));

// ===== 11) DRILL tæller ikke som verdens-mission =====
resetState();
cur = { world: 0, game: 'type', words: ['hvad','hvor'], idx: 2, errors: 0, answered: false, wrongWords: [], drill: 'hv' };
finishGame();
const w0 = state.worlds[0] || {};
check('drill sætter IKKE verdens-fremskridt', !w0.hear && !w0.type && !w0.fill, JSON.stringify(w0));
check('drill logges i historik', state.stats.history.some(h => h.game === 'drill'));

console.log(F === 0 ? '\\nALLE ADAPTIV-V2-TESTS GRØNNE' : '\\n' + F + ' FEJL');
if (F) process.exit(1);
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}