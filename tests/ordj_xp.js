// XP OG LEVELS PÅ SKÆRMEN.
//
// Udgangspunktet: XP-systemet FANDTES og VIRKEDE (XP_PER_LEVEL, heroLevel, levelPower,
// talenter, level-up-besked) — men XP blev vist PRÆCIS ét sted: på resultat-skærmen
// EFTER missionen. Undervejs var der intet. Man kan ikke sigte efter et mål man ikke
// kan se.
//
// Testene her spørger derfor ikke "findes #xpStrip". De spørger om det der gik galt:
//   · kan barnet se XP MENS det spiller (ikke bagefter)?
//   · staar der en AFSTAND i klar tekst — ikke bare 78/120?
//   · staar der hvad næste level GIVER?
//   · flyver XP op når det tjenes?
//   · fylder level-up skærmen?
//   · følger HERO_SKIN faktisk level?
//   · LYVER bjælken? (procent og ord-til-næste skal komme fra samme tal)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
const HTML_CSS = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];

const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, textContent:'', innerHTML:'', value:'', children: [],
    appendChild(c){ this.children.push(c); return c; } };
  el._classes = new Set();
  Object.defineProperty(el, 'className', { get(){ return [...el._classes].join(' '); }, set(v){ el._classes = new Set(String(v).split(' ').filter(Boolean)); } });
  Object.defineProperty(el, 'innerHTML', { get(){ return el._html || ''; }, set(v){ el._html = String(v); el.children = []; } });
  el.classList = { add(...cs){ cs.forEach(c => el._classes.add(c)); }, remove(...cs){ cs.forEach(c => el._classes.delete(c)); },
    toggle(c, f){ const on = f === undefined ? !el._classes.has(c) : !!f; if (on) el._classes.add(c); else el._classes.delete(c); return on; },
    contains(c){ return el._classes.has(c); } };
  el.setAttribute = () => {};
  el.animate = () => ({});
  el.addEventListener = () => {};
  el.remove = () => {};
  el.focus = () => {};
  el.querySelector = () => null;
  el.querySelectorAll = () => [];
  el.getBoundingClientRect = () => ({ left: 400, top: 300, width: 100, height: 40 });
  return el;
};
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-read','screen-result','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles','screen-achieve','screen-lesson'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMapA','worldMapB','worldMapC','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','resultLearn','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn',
 'attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult',
 'wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear','classGrid','classConfirm','profileGrid',
 'newProfileBox','newProfileName','mythicCount','mythicTrack','mythicInfo','talentPoints','talentRow',
 'achieveCount','achieveGrid','lessonTitle','lessonRule','lessonMeta','lessonTip','lessonExamples','lessonDrill','lessonIcon',
 'statsGrid','statsWeak','statsGames','statsPatterns','statsMastered','statsHistory','statsMester',
 'xpStrip','xpFill','xpText','xpNum','xpToNext','levelUp','levelUpTitle','levelUpSkin','levelUpGains','levelUpBtn',
 'mesterPanel','mesterTitle','mesterList','mesterBtn','trofeTrack','mbTrofe'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    return [];
  },
  querySelector: () => null,
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
const storage = {};
global.localStorage = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 820; global.innerHeight = 1180;
global.addEventListener = () => {};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'',
  createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0,
  save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width:10}) }), width:0, height:0 };
const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
const els = global.__els;
const SRC = global.SRC;
const HTML = global.HTML_SRC;
const CSS = global.HTML_CSS;
let F = 0;
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); }
function nySpiller() {
  state.xp = 0; state.talentPoints = 0; state.talents = { hp: 0, power: 0, crit: 0 };
  state.xpStats = { answers: 0, answerXp: 0 };
  state.bag = []; state.gear = {}; state.worlds = {}; state.stats = { words:{}, games:{}, days:{}, history:[] };
  state.achievements = []; state.heroClass = 'kriger'; state.mester = null; state.wrong = {};
  cur = { world: 0, game: 'hear', words: ['dejlig','kanin'], idx: 0, errors: 0, answered: false, wrongWords: [], session: 1 };
  cur.session = ++mesterEnsure().session;
}

console.log('--- 1. BJÆLKEN ER SYNLIG MENS MAN SPILLER (fejlen: XP var usynligt) ---');
const iHud = HTML.indexOf('id="hud"');
const iXp = HTML.indexOf('id="xpStrip"');
const iStart = HTML.indexOf('id="screen-start"');
check('#xpStrip findes i HTML', iXp > 0);
check('KRAV: XP-bjælken ligger INDE i #hud (den der er synlig under spil — ikke kun på resultat-skærmen)',
  iXp > iHud && iXp < iStart, 'hud@' + iHud + ' xp@' + iXp + ' start@' + iStart);
check('HUD er den der tændes når man spiller (startGame)', /getElementById\\("hud"\\).classList.remove\\("hidden"\\)/.test(SRC));
check('XP-bjælken tegnes når HUD opdateres (altså hvert skridt i spillet)', /function updateHud[\\s\\S]{0,220}renderXpBar\\(\\)/.test(SRC));
check('XP-bjælken tegnes også ved start (så den aldrig står tom)', /renderXpBar\\(\\);\\s*\\n\\/\\* Debug/.test(SRC) || (SRC.match(/renderXpBar\\(\\)/g) || []).length >= 4,
  (SRC.match(/renderXpBar\\(\\)/g) || []).length);
check('.xp-strip er ikke skjult i CSS', !/[.]xp-strip[ ]*[{][^}]*display:[ ]*none/.test(CSS));
check('bjælken har en fyldning der kan vokse (.xp-fill med width)', /[.]xp-fill[ ]*[{][^}]*width:/.test(CSS));

console.log('--- 2. AFSTANDEN I KLAR TEKST (en på 7 forstaar ikke 78/120) ---');
nySpiller();
state.xp = 240 + 60; state.xpStats = { answers: 20, answerXp: 60 };  // niveau 3, 60/120
renderXpBar();
check('bjælken skriver niveauet', els['xpText'].textContent === 'Niveau 3', els['xpText'].textContent);
check('bjælken viser tallet (60 / 120 XP)', els['xpNum'].textContent.indexOf('60 / 120 XP') >= 0, els['xpNum'].textContent);
check('KRAV: linjen under bjælken siger hvor mange ORD der mangler til næste level',
  /\\d+ ord/.test(els['xpToNext'].innerHTML) && els['xpToNext'].innerHTML.indexOf('til niveau 4') > 0, els['xpToNext'].innerHTML);
check('KRAV: der staar HVAD næste level giver (kraft + talent-point)',
  els['xpToNext'].innerHTML.indexOf('+1 kraft') > 0 && els['xpToNext'].innerHTML.indexOf('talent-point') > 0, els['xpToNext'].innerHTML);
check('ord-antallet regnes fra spillets EGEN maaling (20 svar / 60 XP = 3 XP pr. svar → 20 ord)',
  wordsToNextLevel() === Math.ceil(xpToNextLevel() / 3), wordsToNextLevel() + ' vs ' + Math.ceil(xpToNextLevel() / 3));
check('"ord til naeste" viser det UREGNEDE tal, ikke et fast tal',
  (state.xpStats = { answers: 4, answerXp: 6 }, renderXpBar(), els['xpToNext'].innerHTML.indexOf('<b>' + wordsToNextLevel() + ' ord</b>') >= 0),
  els['xpToNext'].innerHTML);
check('uden data bruges startvaerdien (XP_PER_ANSWER)', (state.xpStats = { answers: 0, answerXp: 0 }, avgXpPerAnswer() === XP_PER_ANSWER), avgXpPerAnswer());

console.log('--- 3. BJÆLKEN LYVER IKKE (procent og tekst fra SAMME tal) ---');
nySpiller();
[0, 30, 60, 90, 119].forEach(xpVal => {
  state.xp = xpVal; state.xpStats = { answers: 10, answerXp: 30 };
  renderXpBar();
  const forventet = Math.round(((xpVal % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
  check('XP ' + xpVal + ' → bjælken staar paa ' + forventet + ' %', els['xpFill'].style.width === forventet + '%', els['xpFill'].style.width);
  check('XP ' + xpVal + ' → niveau ' + (1 + Math.floor(xpVal / XP_PER_LEVEL)), els['xpText'].textContent === 'Niveau ' + (1 + Math.floor(xpVal / XP_PER_LEVEL)), els['xpText'].textContent);
});
check('bjælken og linjen bruger samme "mangler"-tal',
  (state.xp = 100, state.xpStats = { answers: 10, answerXp: 30 }, renderXpBar(),
   els['xpToNext'].innerHTML.indexOf(String(wordsToNextLevel())) >= 0 && wordsToNextLevel() === Math.ceil(xpToNextLevel() / avgXpPerAnswer())),
  els['xpToNext'].innerHTML);

console.log('--- 4. XP FLYVER OP NAAR DET TJENES ---');
nySpiller();
els['fxLayer'].children = [];
const foer = state.xp;
markRight('dejlig');
check('et rigtigt svar giver XP med det samme', state.xp === foer + XP_PER_ANSWER, state.xp + ' vs ' + foer);
// Den ÆGTE vej: svar rigtigt i et spil (answerHear kalder markRight + xpFlyFrom)
els['fxLayer'].children = [];
nySpiller();
cur.words = ['dejlig']; cur.idx = 0;
const svarKnap = document.createElement('button');
svarKnap.textContent = 'dejlig';
answerHear('dejlig', 'dejlig', svarKnap);
const flyvende = els['fxLayer'].children.filter(c => c.className === 'fx-xp');
check('KRAV: der oprettes et synligt XP-tal (fx-xp) naar svaret er rigtigt', flyvende.length === 1, flyvende.length);
check('XP-tallet viser hvad man TJENTE', flyvende[0] && flyvende[0].textContent === '+' + XP_PER_ANSWER + ' XP', flyvende[0] && flyvende[0].textContent);
check('XP-tallet stiger OPAD (animation med translateY negativ)', /@keyframes xpFly[\\s\\S]{0,200}-[0-9]+px/.test(CSS));
check('XP-tallet staar hvor ordet er (koordinater sat)', flyvende[0] && /px$/.test(flyvende[0].style.left), flyvende[0] && flyvende[0].style.left);
// De tre spil: Hør & Slå, Fang ordet og Sætnings-gåden skal alle vise flugten
check('Hør & Slå viser XP-flugt', /xpFlyFrom\\(btn, XP_PER_ANSWER\\)/.test(SRC));
check('Fang ordet viser XP-flugt', /xpFlyFrom\\(inp, XP_PER_ANSWER\\)/.test(SRC));
check('Sætnings-gåden viser XP-flugt ved rigtigt svar', (SRC.match(/xpFlyFrom\\(btn, XP_PER_ANSWER\\)/g) || []).length >= 2);

console.log('--- 5. LEVEL-UP FYLDER SKÆRMEN (ikke en tekstlinje) ---');
nySpiller();
els['levelUp'].classList.add('hidden');
state.xp = 100; state.talentPoints = 0;
addXp(30, {});
check('level steg til 2', heroLevel() === 2, heroLevel());
check('KRAV: level-up-overlayet bliver synligt', !els['levelUp'].classList.contains('hidden'));
check('overlayet skriver det nye level STORT', els['levelUpTitle'].textContent === 'LEVEL 2', els['levelUpTitle'].textContent);
check('overlayet viser det nye HERO_SKIN-navn', els['levelUpSkin'].textContent.indexOf(heroSkinName(2).toUpperCase()) >= 0, els['levelUpSkin'].textContent);
check('overlayet viser hvad man fik', els['levelUpGains'].textContent.indexOf('kraft') >= 0 && els['levelUpGains'].textContent.indexOf('talent-point') >= 0, els['levelUpGains'].textContent);
check('talent-point blev givet', state.talentPoints === 1, state.talentPoints);
check('overlayet daekker skaermen (fixed + fuld skaerm)', /[.]levelup-overlay[ ]*[{][^}]*position:[ ]*fixed/.test(CSS) && /[.]levelup-overlay[ ]*[{][^}]*inset:[ ]*0/.test(CSS));
closeLevelUp();
check('man kan lukke det igen', els['levelUp'].classList.contains('hidden'));
check('det lukker sig selv (timeout)', /levelUpShow[\\s\\S]{0,900}setTimeout\\(closeLevelUp/.test(SRC));
check('resultat-skærmen beholder kvitteringen (foraeldre skal kunne laese tallet)', /resultXp[\\s\\S]{0,600}LEVEL UP/.test(SRC));

console.log('--- 6. HERO_SKIN ER BUNDET TIL LEVEL ---');
check('level 1 giver Ordjægeren', heroSkinIndex(1) === 0 && heroSkinName(1) === 'Ordjægeren', heroSkinName(1));
check('level 4 giver Ordkrigeren', heroSkinIndex(4) === 1 && heroSkinName(4) === 'Ordkrigeren', heroSkinName(4));
check('level 8 giver Mesterjægeren', heroSkinIndex(8) === 2 && heroSkinName(8) === 'Mesterjægeren', heroSkinName(8));
check('level 13 giver Ordhelten', heroSkinIndex(13) === 3 && heroSkinName(13) === 'Ordhelten', heroSkinName(13));
check('skinnet skifter kun ved de rigtige graenser', heroSkinIndex(3) === 0 && heroSkinIndex(7) === 1 && heroSkinIndex(12) === 2,
  [heroSkinIndex(3), heroSkinIndex(7), heroSkinIndex(12)].join(','));
nySpiller();
state.xp = 0; renderHero();
check('helteskærmen viser navnet fra level (level 1)', els['heroName'].textContent === 'Ordjægeren', els['heroName'].textContent);
state.xp = 500;  // level 5
renderHero();
check('helteskærmen skifter navn naar level skifter', els['heroName'].textContent === heroSkinName(5), els['heroName'].textContent);
check('gemt state.skin opdateres som spejl', state.skin === heroSkinIndex(), state.skin);
check('bosskampen viser ogsaa navnet fra level', /bossHeroName"\\).textContent = heroSkinName\\(\\)/.test(SRC));
check('skinnet saettes ikke laengere ud fra antal besejrede monstre',
  !/state.skin = Math.min\\(Math.floor\\(completed \\/ 3\\)/.test(SRC));

console.log('--- 7. XP OG MESTER-PRØVEN ER ÉT SYSTEM ---');
check('erobret ord giver XP (samme addXp som alt andet)', /function mesterWordErobret[\\s\\S]{0,400}addXp\\(MESTER_XP_PER_WORD/.test(SRC));
check('al XP gaar gennem addXp (saa bjælken ikke kan komme bagud)',
  (SRC.match(/state.xp = \\(state.xp \\|\\| 0\\) \\+ /g) || []).length === 1, (SRC.match(/state.xp = \\(state.xp \\|\\| 0\\) \\+ /g) || []).length);
check('erobringen er den stoerste enkeltpost i spillet', MESTER_XP_PER_WORD > 40, MESTER_XP_PER_WORD);

console.log(F === 0 ? 'ALLE XP-OG-LEVEL-TESTS GROENNE' : 'FEJL: ' + F);
if (F) process.exit(1);
`;
const wrapper = `
global.SRC = ${JSON.stringify(src)};
global.HTML_SRC = ${JSON.stringify(html)};
global.HTML_CSS = ${JSON.stringify(HTML_CSS)};
${patched}
${tests}
`;
try { new Function(wrapper)(); } catch(e) { console.log('RUNTIME ERROR:', e.message); process.exit(1); }