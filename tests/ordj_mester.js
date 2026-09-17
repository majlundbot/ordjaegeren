// «MESTER-PRØVEN» — belønning for at øve sine EGNE svage ord.
//
// HELE POINTEN MED DENNE FIL er spørgsmålet fra reglerne:
//   "fanger denne test at et barn kan vinde uden at gøre arbejdet?"
//
// Mekanikken giver en belønning for at øve svage ord. Uden spærringer kan et barn
// svare bevidst forkert, skabe svage ord på et minut og høste belønningen. Testene
// 1-4 SIMULERER SNYDERIET og kræver at det IKKE virker. Test 5-7 beviser at den
// rigtige vej virker — ellers var anti-snyd-testene bare en død knap.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');

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
let F = 0;
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); }

/* ---- HJÆLPER ---- */
function renSpiller() {
  state.stats = { words:{}, games:{}, days:{}, history:[] };
  state.mester = null;
  state.bag = []; state.gear = {}; state.worlds = {}; state.achievements = [];
  state.xp = 0; state.talentPoints = 0; state.wrong = {}; state.heroClass = 'kriger';
  state.xpStats = { answers: 0, answerXp: 0 };
  cur = { world: 0, game: 'hear', words: [], idx: 0, errors: 0, answered: false, wrongWords: [], session: 0, mester: false };
  mesterEnsure();
}
// En dato i fortiden = "ordet blev svagt FØR i dag". Uden dette kan ordet ikke bruges i dag.
function igaar() {
  const d = new Date(Date.now() - 86400000);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function goerSvag(w, dag) { state.stats.words[w] = { tries: 4, wrong: 3, weakDay: dag }; }
// En ny RUNDE = en ny session. Mester-prøven kræver 2 rigtige i træk i FORSKELLIGE sessioner.
function nyRunde() { startGame(0, "hear"); return cur.session; }

console.log('--- 1. SNYD: bevidst forkerte svar i dag ---');
renSpiller();
const snyderi = ALL_WORDS.slice(0, 10);
snyderi.forEach(w => markWrong(w));           // barnet svarer bevidst forkert 10 gange
check('de 10 ord er nu registreret svage', snyderi.every(w => state.stats.words[w] && state.stats.words[w].wrong >= 1));
check('...og de fik weakDay = I DAG (ikke i gaar)', snyderi.every(w => state.stats.words[w].weakDay === todayKey()),
  JSON.stringify(snyderi.map(w => state.stats.words[w].weakDay)));
check('SNYD 1: ingen af dem kan komme i Mester-proeven i dag', mesterKandidater().length === 0, mesterKandidater().length);
check('SNYD 1: proeven er tom', mesterProve().words.length === 0, JSON.stringify(mesterProve().words));
check('SNYD 1: intet ord erobret', mesterEnsure().erobret.length === 0, JSON.stringify(mesterEnsure().erobret));
check('SNYD 1: ingen trofé udleveret', state.bag.filter(b => b.rarity === "trofe").length === 0);
// Og selv om barnet bagefter svarer RIGTIGT pa de samme ord, sker der intet:
snyderi.forEach(w => markRight(w));
check('SNYD 1: rigtige svar bagefter giver STADIG ingen fremgang', mesterEnsure().erobret.length === 0, JSON.stringify(mesterEnsure().erobret));
check('SNYD 1: snyd koster en dag og giver nul', mesterProve().words.length === 0);
console.log('   → snyd i dag: ' + mesterKandidater().length + ' kandidater, ' + mesterEnsure().erobret.length + ' erobrede, ' + state.bag.length + ' items');

console.log('--- 2. SNYD: sabotere et ord der VAR svagt i gaar ---');
renSpiller();
const wSab = ALL_WORDS[0];
goerSvag(wSab, igaar());
check('ordet fra i gaar ER kandidat', mesterKandidatOrd(wSab));
const pSab = mesterNyProve();
check('ordet kom med i proeven', pSab.words.indexOf(wSab) >= 0, JSON.stringify(pSab.words));
nyRunde(); markRight(wSab);
check('1 rigtig i traek → raekken er 1', mesterEnsure().streak[wSab] === 1, mesterEnsure().streak[wSab]);
check('...men ordet er IKKE erobret efter ét rigtigt', !mesterErobret(wSab));
nyRunde(); markWrong(wSab);                    // barnet saboterer bevidst
check('SNYD 2: et forkert svar NULSTILLER raekken', mesterEnsure().streak[wSab] === 0, mesterEnsure().streak[wSab]);
check('SNYD 2: ordet bliver IKKE erobret af sabotage', !mesterErobret(wSab));
nyRunde(); markRight(wSab);
check('SNYD 2: efter sabotage mangler der stadig ét rigtigt', mesterEnsure().streak[wSab] === 1 && !mesterErobret(wSab),
  mesterEnsure().streak[wSab]);
check('SNYD 2: sabotage gjorde det kun LANGSOMMERE, ikke hurtigere', !mesterErobret(wSab));

console.log('--- 3. SNYD: to rigtige i SAMME session ---');
renSpiller();
const wSes = ALL_WORDS[1];
goerSvag(wSes, igaar());
mesterNyProve();
nyRunde();
const sess = cur.session;
markRight(wSes); markRight(wSes); markRight(wSes);   // tre rigtige i samme runde
check('SNYD 3: samme session taeller kun ÉN gang', mesterEnsure().streak[wSes] === 1, mesterEnsure().streak[wSes]);
check('SNYD 3: ordet er ikke erobret af tre svar i samme runde', !mesterErobret(wSes));
check('kravet er 2 (MESTER_STREAK_KRAV)', MESTER_STREAK_KRAV === 2, MESTER_STREAK_KRAV);
check('sessionen er skiftet naar en ny runde starter', nyRunde() !== sess);

console.log('--- 4. SNYD: fremgang uden om ordet ---');
renSpiller();
const frisk = ALL_WORDS[2];
check('SNYD 4: et frisk ord er ikke kandidat', !mesterKandidatOrd(frisk));
check('SNYD 4: mesterFremgang rører det ikke', mesterFremgang(frisk, true) === false);
check('SNYD 4: der blev ingen raekke oprettet', mesterEnsure().streak[frisk] === undefined, mesterEnsure().streak[frisk]);
check('SNYD 4: intet erobret', mesterEnsure().erobret.length === 0);
// Et ord der VAR svagt i gaar, men som ikke er med i den aktuelle proeve
renSpiller();
const mange = ALL_WORDS.slice(0, 7);
mange.forEach(w => goerSvag(w, igaar()));
const p7 = mesterNyProve();
check('proeven tager kun 5 af de 7 kandidater', p7.words.length === 5, p7.words.length);
const udenfor = mange.filter(w => p7.words.indexOf(w) < 0);
check('der ER ord uden for proeven (2)', udenfor.length === 2, udenfor.length);
check('SNYD 4: et kandidat-ord UDEN FOR proeven giver ingen fremgang', mesterFremgang(udenfor[0], true) === false);
check('SNYD 4: og det taeles ikke som erobret', !mesterErobret(udenfor[0]));
check('mesterFremgang giver false for et forkert svar (ingen fremgang at hente)', mesterFremgang(p7.words[0], false) === false);

console.log('--- 5. DEN RIGTIGE VEJ: 2 rigtige i traek i to sessioner ---');
renSpiller();
const wRigtig = ALL_WORDS[3];
goerSvag(wRigtig, igaar());
mesterNyProve();
const xpFoer = state.xp;
nyRunde(); markRight(wRigtig);
check('efter 1 rigtig: raekke 1, ikke erobret', mesterEnsure().streak[wRigtig] === 1 && !mesterErobret(wRigtig));
check('der kom XP for svaret med det samme', state.xp === xpFoer + XP_PER_ANSWER, state.xp + ' vs ' + (xpFoer + XP_PER_ANSWER));
nyRunde(); markRight(wRigtig);
check('KRAV: erobret efter 2 rigtige i traek i TO sessioner', mesterErobret(wRigtig), JSON.stringify(mesterEnsure().erobret));
check('KRAV: erobringen giver XP (den stoerste enkeltpost i spillet)',
  state.xp === xpFoer + 2 * XP_PER_ANSWER + MESTER_XP_PER_WORD, state.xp + ' vs ' + (xpFoer + 2 * XP_PER_ANSWER + MESTER_XP_PER_WORD));
check('raekken nulstilles efter erobringen (naeste ord starter forfra)', mesterEnsure().streak[wRigtig] === 0);

console.log('--- 6. BARNET SER FORVANDLINGEN (svag → staerk) ---');
renSpiller();
const wVis = ALL_WORDS[4], wVis2 = ALL_WORDS[5];
goerSvag(wVis, igaar()); goerSvag(wVis2, igaar());
mesterNyProve();
nyRunde(); markRight(wVis); nyRunde(); markRight(wVis);   // erobr det ene
const vis = mesterRowsHtml();
check('den stregede (SVAGE) form staar pa skaermen', vis.indexOf("mp-weak") >= 0 && vis.indexOf(wVis) >= 0, vis.slice(0, 200));
check('KRAV: den staerke form med flueben staar VED SIDEN AF', vis.indexOf("✓ " + wVis) >= 0, vis.slice(0, 200));
check('KRAV: begge former af SAMME ord (forvandlingen ses)', (vis.match(new RegExp(wVis, "g")) || []).length >= 2);
check('det ikke-erobrede ord viser hvor mange rigtige der mangler', /rigtig[e]? i traek til/.test(vis) || /rigtig.* til/.test(vis), vis.slice(0, 300));
mesterRenderPanel();
check('KRAV: kortet viser "Mester-proeven — 1 af 2 svaere ord erobrede"',
  els['mesterTitle'].textContent === "Mester-prøven — 1 af 2 svære ord erobrede", els['mesterTitle'].textContent);
mesterRenderStats();
check('KRAV: statistikken viser det SAMME tal', els['statsMester'].innerHTML.indexOf("1 af 2 svære ord erobrede") >= 0, els['statsMester'].innerHTML.slice(0, 120));
check('statistikken forklarer hvorfor man ikke kan snyde', /ikke snyde|FØR i dag/.test(els['statsMester'].innerHTML));

console.log('--- 7. TROFÆEN: hele proeven → beloenning + stoerre proeve ---');
renSpiller();
const fem = ALL_WORDS.slice(0, 5);
fem.forEach(w => goerSvag(w, igaar()));
check('proeven starter pa 5 ord', mesterSize() === 5, mesterSize());
const p5 = mesterNyProve();
check('KRAV: spillet vaelger selv 5 ord fra barnets egne tal', p5.words.length === 5, JSON.stringify(p5.words));
check('ordene er de SVAGESTE foerst (sorteret pa svaghed)', fem.every(w => p5.words.indexOf(w) >= 0));
fem.forEach(w => { nyRunde(); markRight(w); });
check('efter foerste runde: 0 erobret endnu (kraever 2 i traek)', mesterEnsure().erobret.length === 0, JSON.stringify(mesterEnsure().erobret));
check('ingen trofé for proeven er klaret', state.bag.filter(b => b.rarity === "trofe").length === 0);
fem.forEach(w => { nyRunde(); markRight(w); });
check('alle 5 erobret', fem.every(w => mesterErobret(w)), JSON.stringify(mesterEnsure().erobret));
check('KRAV: troféen blev udleveret', state.bag.some(b => b.rarity === "trofe"), JSON.stringify(state.bag.map(b => b.rarity)));
check('troféen er et rigtigt item fra TROFE_ITEMS', TROFE_ITEMS.some(t => state.bag.some(b => b.name === t.name)));
check('troféen har en kraft (rarityOf kender den)', rarityOf("trofe") && rarityOf("trofe").power > 0, JSON.stringify(rarityOf("trofe")));
check('KRAV: proeven VOKSER (5 → 8)', mesterSize() === 8, mesterSize());
check('...og den slutter ikke (der kom en ny proeve)', mesterEnsure().prove !== null);
// Trappen helt op
mesterEnsure().runder = 0; check('runde 0 → 5 ord', mesterSize() === 5);
mesterEnsure().runder = 1; check('runde 1 → 8 ord', mesterSize() === 8);
mesterEnsure().runder = 2; check('runde 2 → 12 ord', mesterSize() === 12);
mesterEnsure().runder = 9; check('den vokser ikke ud over 12', mesterSize() === 12);
check('MESTER_SIZES er 5, 8, 12 (trappen)', JSON.stringify(MESTER_SIZES) === "[5,8,12]", JSON.stringify(MESTER_SIZES));

console.log('--- 8. EKSKLUSIVITET: troféen kan KUN komme herfra ---');
check('trofé-rariteten kan ikke rulles (weight 0)', TROFE_RARITY.weight === 0, TROFE_RARITY.weight);
check('trofe ligger UDEN FOR RARITIES (man kan ikke rulle den)', !RARITIES.some(r => r.key === "trofe"));
check('ASEGÅRD er stadig det sidste niveau i RARITIES', RARITIES[RARITIES.length - 1].key === "asgard");
check('6 trofæer, én pr. slot', TROFE_ITEMS.length === 6 && new Set(TROFE_ITEMS.map(t => t.slot)).size === 6);
check('trofé-kraft ligger over secret men under asgard (×25)',
  TROFE_RARITY.power > 15 && TROFE_RARITY.power < 45, TROFE_RARITY.power);
check('troféen har et navn og et angreb (som ASEGÅRD-moenstret)',
  TROFE_ITEMS.every(t => t.name && t.attack && t.attack.name && t.attack.icon && t.attack.mult));
// Kuben
CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
cubeAdd({ slot: "helm", rarity: "trofe", name: "Mesterens Krone", id: "t1" });
check('KRAV: kuben afviser trofæer', CUBE_SLOTS.every(x => !x), JSON.stringify(CUBE_SLOTS));
state.bag = [{ slot: "helm", rarity: "trofe", name: "Mesterens Krone", id: "t2" }];
check('KRAV: man kan ikke putte en trofé i kuben fra tasken', bagToCube(state.bag[0]) === false);
check('...og troféen ligger stadig i tasken', state.bag.length === 1);
// Lykkehjulet
cur.world = 0;
check('KRAV: lykkehjulet kan ikke give trofæer', !wheelSegs().some(s => s.key === "trofe"), JSON.stringify(wheelSegs().map(s => s.key)));
cur.world = 12;
check('...heller ikke i akademi-hjulet', !wheelSegs().some(s => s.key === "trofe"));
// Drop-funktionerne
check('KRAV: mythic-drop peger ikke på trofæer', !/function rollMythicDrop[\\s\\S]{0,500}TROFE_ITEMS/.test(SRC));
check('KRAV: secret-drop peger ikke på trofæer', !/function rollSecretDrop[\\s\\S]{0,500}TROFE_ITEMS/.test(SRC));
check('KRAV: boss-belønningen peger ikke på trofæer', !/asgardDropForWorld[\\s\\S]{0,500}TROFE_ITEMS/.test(SRC));
check('mytisk/secret/asgard-listerne er urørte', MYTHIC_ITEMS.length === 6 && SECRET_ITEMS.length === 6 && ASGARD_ITEMS.length === 6);
check('troféerne vises som fjerde gruppe på skatte-tavlen', HTML.indexOf('id="trofeTrack"') > 0 && /mb-trofe/.test(HTML));

console.log('--- 9. MESTER-PRØVEN SOM MISSION ---');
renSpiller();
const tom = mesterProve();
check('uden svage ord er proeven tom', tom.words.length === 0);
mesterStart();
check('start uden ord starter IKKE en mission (ingen falsk indgang)', cur.mester !== true);
renSpiller();
const wM = ALL_WORDS[0];
goerSvag(wM, igaar());
mesterStart();
check('med kandidater starter proeven som mission', cur.mester === true, cur.mester);
check('missionens ord er praecis proevens ord', JSON.stringify(cur.words) === JSON.stringify(mesterProve().words), JSON.stringify(cur.words));
check('missionen har en session', typeof cur.session === "number" && cur.session > 0, cur.session);
cur.idx = cur.words.length; cur.errors = 0; cur.wrongWords = [];
finishGame();
check('KRAV: Mester-proeven taeller IKKE som verdens-fremgang', !(state.worlds[0] && state.worlds[0].hear),
  JSON.stringify(state.worlds[0]));

console.log('--- 10. VISNINGEN FINDES (usynlig beloenning = ingen beloenning) ---');
check('kortet har panelet', HTML.indexOf('id="mesterPanel"') > 0);
check('kortet tegner det', /function renderWorldMap[\\s\\S]{0,600}mesterRenderPanel\\(\\)/.test(SRC));
check('statistik har sektionen', HTML.indexOf('id="statsMester"') > 0);
check('statistikken tegner den', /function renderStats[\\s\\S]{0,9000}mesterRenderStats\\(\\)/.test(SRC));

console.log(F === 0 ? 'ALLE MESTER-TESTS GROENNE' : 'FEJL: ' + F);
if (F) process.exit(1);
`;
const wrapper = `
global.SRC = ${JSON.stringify(src)};
global.HTML_SRC = ${JSON.stringify(html)};
${patched}
${tests}
`;
try { new Function(wrapper)(); } catch(e) { console.log('RUNTIME ERROR:', e.message); process.exit(1); }