// Stavelses-test: så-dan, ikke s-t-å — alle 120 ord + fejl-flow i Fang-ordet
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
  const b = { textContent:'', style: { setProperty(){} }, classList: { add(){}, remove(){} }, disabled: false };
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
function t(label, fn) { try { fn(); console.log('OK   ' + label); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }

// Forventede stavelser for flerstavede ord (håndverificeret)
const EXPECTED = {
  ikke:"ik-ke", noget:"no-get", være:"væ-re", bare:"ba-re", have:"ha-ve",
  ville:"vil-le", hvorfor:"hvor-for", alle:"al-le", lige:"li-ge", hende:"hen-de",
  hvordan:"hvor-dan", gøre:"gø-re", kunne:"kun-ne", kommer:"kom-mer", havde:"hav-de",
  eller:"el-ler", meget:"me-get", ingen:"in-gen", bliver:"bli-ver", efter:"ef-ter",
  sagde:"sag-de", tilbage:"til-ba-ge", måske:"må-ske", også:"og-så", vores:"vo-res",
  mere:"me-re", skulle:"skul-le", nogen:"no-gen", aldrig:"al-drig", siger:"si-ger",
  over:"o-ver", sådan:"så-dan", igen:"i-gen", sammen:"sam-men", tager:"ta-ger",
  hele:"he-le", deres:"de-res", okay:"o-kay"
};

t('alle 120 ord deles korrekt i stavelser', () => {
  let n = 0;
  for (const w of ALL_WORDS) {
    const got = syllableDisplay(w);
    if (EXPECTED[w] && got !== EXPECTED[w]) { throw new Error(w + ': fik "' + got + '", forventet "' + EXPECTED[w] + '"'); }
    if (EXPECTED[w]) n++;
    // Intet ord må deles bogstav-for-bogstav
    if (got.includes("-") && got.replace(/-/g, "") !== w) throw new Error(w + ': stavelserne mister bogstaver: ' + got);
  }
  if (n < 37) throw new Error('forventede mindst 37 flerstavede ord, fandt ' + n);
});

t('sådan → så-dan (det Kenneth bad om)', () => {
  if (syllableDisplay("sådan") !== "så-dan") throw new Error('sådan skal være så-dan, fik ' + syllableDisplay("sådan"));
  if (syllableDisplay("ikke") !== "ik-ke") throw new Error('ikke skal være ik-ke');
  if (syllableDisplay("han") !== "han") throw new Error('han skal være én stavelse');
});

t('syllableHtml giver farvet stavelses-markup', () => {
  const h = syllableHtml("sådan");
  if (!h.includes("så") || !h.includes("dan") || !h.includes("-")) throw new Error('markup mangler stavelser: ' + h);
});

t('typeSubmit fejl viser stavelser i stedet for bogstaver', () => {
  state.worlds = {}; state.xp = 0; state.heroClass = 'kriger'; state.gear = {}; state.bag = []; state.skin = 0; state.lootCount = 0; state.mapAt = 0;
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  startGame(0, 'type');
  // Sæt cur.words til ["sådan", ...] deterministisk
  cur.words = ["sådan", "ikke", "han"];
  cur.idx = 0;
  renderType();
  els['typeInput'].value = "såden"; // forkert
  typeSubmit();
  const hint = els['typeHint'].innerHTML;
  if (!hint.includes("så-dan")) throw new Error('hint skal vise så-dan, fik: ' + hint);
  if (hint.includes("s - å")) throw new Error('må IKKE vise bogstav-for-bogstav: ' + hint);
  const status = els['typeStatus'].innerHTML;
  if (!status.includes("så")) throw new Error('status skal vise ordet: ' + status);
});

t('answerHear fejl viser stavelser', () => {
  state.worlds = {}; state.xp = 0; state.heroClass = 'kriger'; state.gear = {}; state.bag = []; state.skin = 0; state.lootCount = 0; state.mapAt = 0;
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  startGame(0, 'hear');
  cur.words = ["sådan", "ikke"];
  cur.idx = 0;
  renderHear();
  const btn = document.createElement('button'); btn.textContent = 'såden';
  answerHear('såden', 'sådan', btn);
  const status = els['hearStatus'].innerHTML;
  // Stavelses-markup indeholder "så" og "dan" (i spans) — tjek begge dele findes
  if (!status.includes('så') || !status.includes('dan')) throw new Error('hear-status skal vise så-dan stavelser, fik: ' + status);
  if (status.includes('s - å')) throw new Error('må IKKE vise bogstav-for-bogstav: ' + status);
});

console.log(fails.length === 0 ? 'ALLE STAVELSES-TESTS GRØNNE' : 'FEJL: ' + fails.length);
if (fails.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
