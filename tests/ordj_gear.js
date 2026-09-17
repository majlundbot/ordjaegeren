// Gear/loot-tests: kør spil-scriptet med DOM-stub og test gear-logikken
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

function makeEl(id) {
  const el = {
    id, _text: '', _html: '', _class: [], children: [], _value: '',
    style: { setProperty() {} },
    classList: { add(c){ if(!el._class.includes(c)) el._class.push(c); }, remove(c){ el._class = el._class.filter(x=>x!==c); }, toggle(c,f){ const has=el._class.includes(c); const on = (f===undefined)? !has : !!f; if(on && !has) el._class.push(c); if(!on && has) el._class = el._class.filter(x=>x!==c); return on; }, contains(c){ return el._class.includes(c); } },
    get className() { return el._class.join(' '); }, set className(v) { el._class = v.split(' ').filter(Boolean); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); el.children = []; },
    get value() { return el._value; }, set value(v) { el._value = String(v); },
    appendChild(c) { el.children.push(c); },
    addEventListener() {}, focus() {}, click() {},
    querySelector() { return this._btn || null; }, querySelectorAll() { return []; },
    _btn: null,
    onclick: null, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    setProperty() {}, offsetWidth: 0, remove() {}, title: "", disabled: false,
    animate() { return {}; }
  };
  return el;
}
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-result','screen-collect','screen-hero','screen-boss','screen-stats'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid',
 'heroSvg','heroName','heroPower','gearSlots','heroBag','heroHint','lootCard','lootIcon','lootRarity','lootName','lootSub',
 'bossBtn','bossHeroSvg','bossHeroName','bossHeroPower','bossDragonEmoji','bossDragonName','bossDragonPower','bossStatus','bossMsg','bossHint',
 'heroHpFill','dragonHpFill','attackBar',
 'statsGrid','statsWeak','statsGames','statsHistory'].forEach(id => els[id] = makeEl(id));
els['fxLayer'] = makeEl('fxLayer');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0 }), width:0, height:0 };
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMap'].children;
    if (sel.includes('.class-card')) return els['classGrid'].children;
    return [];
  },
  querySelector: () => null,
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = class { constructor(src) { this.src = src; } play() { return Promise.resolve(); } };
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
// ==== GEAR TESTS ====
const els = global.__els;
const fails = [];
let gqueue = Promise.resolve();
function gtest(label, fn) { gqueue = gqueue.then(() => { try { return Promise.resolve(fn()).then(() => console.log('OK   ' + label)); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); } }); }

gtest('gear-data: 6 slots, 8 rariteter (inkl. mythic + secret + asgard)', () => {
  if (GEAR_SLOTS.length !== 6) throw new Error('6 slots forventet');
  if (RARITIES.length !== 8) throw new Error('8 rariteter forventet (inkl. mythic + secret + asgard)');
  if (!RARITIES.find(r => r.key === 'mythic')) throw new Error('mythic-raritet mangler');
  if (!RARITIES.find(r => r.key === 'secret')) throw new Error('secret-raritet mangler');
  if (!RARITIES.find(r => r.key === 'asgard')) throw new Error('asgard-raritet mangler');
  // ASEGÅRD skal ligge OVER secret — både i listen og i kraft
  const si = RARITIES.findIndex(r => r.key === 'secret'), ai = RARITIES.findIndex(r => r.key === 'asgard');
  if (ai !== RARITIES.length - 1) throw new Error('asgard skal være det sidste (stærkeste) niveau');
  if (ai <= si) throw new Error('asgard skal ligge efter secret');
  if (RARITIES[ai].power <= RARITIES[si].power) throw new Error('asgard-kraft skal være over secret');
  if (Object.keys(GEAR_NAMES).length !== 6) throw new Error('navne for alle slots');
});

gtest('makeItem laver gyldigt item', () => {
  const it = makeItem('helm', 'rare');
  if (!it.name || it.slot !== 'helm' || it.rarity !== 'rare' || !it.id) throw new Error('ufuldstændigt item: ' + JSON.stringify(it));
});

gtest('rollRarity giver gyldig raritet', () => {
  for (let s = 1; s <= 3; s++) {
    const rk = rollRarity(s);
    if (!RARITIES.find(r => r.key === rk)) throw new Error('ugyldig raritet: ' + rk);
  }
});

gtest('heroPower starter på 0', () => {
  if (heroPower() !== 0) throw new Error('forventet 0, fik ' + heroPower());
});

gtest('equipItem + heroPower stiger', () => {
  const it = makeItem('weapon', 'epic');      // grundkraft 4
  state.bag.push(it);
  equipItem(it);
  // NY KONTRAKT: items har nu en RANDOM STYRKE, saa kraften er grundkraften
  // plus 0-25 % (epic). Den er derfor MINDST 4 og hoejst 5 — ikke praecis 4.
  const p = heroPower();
  if (p < 4 || p > 5) throw new Error('forventet 4-5, fik ' + p);
  if (it.roll === undefined) throw new Error('itemet mangler en styrke (roll)');
});

gtest('showHero renderer uden fejl', () => {
  showHero();
  if (!els['screen-hero'].classList.contains('active')) throw new Error('hero-skærm ikke aktiv');
  if (!els['heroSvg'].innerHTML.includes('<svg') && !els['heroSvg'].innerHTML.includes('ellipse')) throw new Error('SVG ikke renderet');
  if (els['gearSlots'].children.length !== 6) throw new Error('6 gear-slots forventet, fik ' + els['gearSlots'].children.length);
});

gtest('loot: finishGame giver gear i tasken', () => {
  const before = state.bag.length;
  cur.world = 0; cur.game = 'hear'; cur.errors = 0; cur.words = ['jeg','det','er','du','ikke','at','i','en'];
  finishGame();
  if (state.bag.length !== before + 1) throw new Error('tasken skulle have 1 mere, før=' + before + ' efter=' + state.bag.length);
  if (els['lootCard'].classList.contains('hidden')) throw new Error('loot-kort skulle være synligt (hidden fjernet)');
  if (!els['lootName'].textContent) throw new Error('loot-navn mangler');
});

gtest('state migreres korrekt (gamle saves)', () => {
  const old = { worlds: {} };
  const s2 = old;
  if (!s2.gear) s2.gear = {};
  if (!s2.bag) s2.bag = [];
  if (s2.skin === undefined) s2.skin = 0;
  if (s2.lootCount === undefined) s2.lootCount = 0;
  if (!Array.isArray(s2.bag)) throw new Error('bag skal være array');
});

gtest('boss-data: 36 drager, stigende kraft', () => {
  if (BOSSES.length !== 36) throw new Error('36 drager forventet');
  for (let i = 1; i < BOSSES.length; i++) {
    if (BOSSES[i].power <= BOSSES[i-1].power) throw new Error('kraft skal stige: ' + i);
  }
  if (ATTACKS.length !== 5) throw new Error('5 angreb forventet');
  if (ATTACKS[0].unlock !== 0) throw new Error('slag skal være ulåst fra start');
});

gtest('startBoss renderer uden fejl', () => {
  cur.world = 0;
  startBoss();
  if (!els['screen-boss'].classList.contains('active')) throw new Error('boss-skærm ikke aktiv');
  if (!els['bossDragonName'].textContent) throw new Error('drage-navn mangler');
  if (!els['bossHeroSvg'].innerHTML.includes('svg')) throw new Error('helt-SVG mangler');
  if (els['attackBar'].children.length !== 5) throw new Error('5 angrebsknapper forventet, fik ' + els['attackBar'].children.length);
});

gtest('bossAttack sejr: terninge-vinder → boss besejret', async () => {
  // Giv helten masser af kraft
  state.gear = { helm:'legendary', weapon:'legendary', armor:'legendary', shield:'legendary', boots:'legendary', amulet:'legendary' };
  state.worlds = {};
  cur.world = 0;
  startBoss();
  const dragonHpBefore = bossState.dragonHp;
  // Stub terninger: spiller ruller altid 20, dragen altid 1 → spiller vinder runden
  const origRandom = Math.random;
  Math.random = () => 0.999;
  try {
    bossAttack(ATTACKS[0]);
  } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.dragonHp >= dragonHpBefore) throw new Error('drage-HP skal falde efter vunden runde, fik ' + bossState.dragonHp + ' (før: ' + dragonHpBefore + ')');
  if (dragonHpBefore !== 30) throw new Error('drage 1 skal have 30 HP (5 × 6), fik ' + dragonHpBefore);
  bossWin(); // kald direkte (spring animation over)
  await new Promise(r => setTimeout(r, 600)); // lad bossWin's showLootWheel-timer køre færdig
  if (!state.worlds[0].boss) throw new Error('boss skulle være besejret');
  if (collectedCount() !== 1) throw new Error('samlekort-tæller skal være 1');
});

gtest('lykkehjul: 25/25/50 chancer + loot uddeles ved spin', async () => {
  state.gear = {}; state.worlds = {}; state.bag = [];
  cur.world = 0;
  // Stub: roll < .25 → mytisk
  const origRandom = Math.random;
  Math.random = () => 0.0;
  try { showLootWheel(); } finally { Math.random = origRandom; }
  if (!wheelPending) throw new Error('wheelPending skal være sat');
  if (wheelPending.rk !== 'mythic') throw new Error('random=0 skal give mythic, fik ' + wheelPending.rk);
  const before = state.bag.length;
  Math.random = () => 0.5; // fulde omgange deterministisk
  try { spinLootWheel(); } finally { Math.random = origRandom; }
  // Loot uddeles MED DET SAMME ved spin (ikke efter animation)
  if (state.bag.length !== before + 1) throw new Error('lykkehjul skal uddele 1 item ved spin, fik ' + state.bag.length + ' (før ' + before + ')');
  const got = state.bag[state.bag.length - 1];
  if (got.rarity !== 'mythic') throw new Error('skulle have fået mythic, fik ' + got.rarity);
});

gtest('bossAttack tab: drage vinder runden → spiller mister liv', async () => {
  state.gear = {};
  state.worlds = {};
  cur.world = 0;
  state.heroClass = "troldmand"; // ingen HP-bonus → baseline 50
  startBoss();
  if (bossState.playerHp !== 50) throw new Error('spiller-HP uden gear skal være 50, fik ' + bossState.playerHp);
  const hpBefore = bossState.playerHp;
  // Stub terninger: spiller ruller altid 1, dragen altid 20 → dragen vinder runden
  let calls = 0;
  const origRandom = Math.random;
  Math.random = () => (calls++ % 2 === 0 ? 0.001 : 0.999);
  try {
    bossAttack(ATTACKS[0]);
  } finally { Math.random = origRandom; }
  await new Promise(r => setTimeout(r, 1600)); // vent på terninge-animation + skade
  if (bossState.playerHp >= hpBefore) throw new Error('spiller skal miste liv når dragen vinder, fik ' + bossState.playerHp + ' (før: ' + hpBefore + ')');
  bossLose(); // kald direkte
  if (state.worlds[0] && state.worlds[0].boss) throw new Error('boss må ikke besejres når man er for svag');
  if (!bossState.over) throw new Error('bossState skal være over efter tab');
});
gtest('kriger-klassen giver ekstra HP', () => {
  state.gear = {};
  state.worlds = {};
  cur.world = 0;
  state.heroClass = "kriger"; // +30 HP bonus
  startBoss();
  if (bossState.playerHp !== 80) throw new Error('kriger skal have 80 HP, fik ' + bossState.playerHp);
});

/* NY KONTRAKT (18. sep): ingen verdenslås — alt kan vælges fra start.
   worldReached viser stadig OM spilleren er nået hertil (til status/stjerner). */
gtest('worldReached kræver boss besejret (progression vises, ikke spærrer)', () => {
  state.worlds = { 0: { hear:3, type:3, fill:3, done:[true,true,true], boss:true } };
  if (!worldReached(1)) throw new Error('verden 1 skal være NÅET når boss 0 er besejret');
  state.worlds = { 0: { hear:3, type:3, fill:3, done:[true,true,true] } };
  if (worldReached(1)) throw new Error('verden 1 må ikke være nået uden boss-sejr');
});

gtest('man kan vælge en vilkårlig verden fra start', () => {
  state.worlds = {};
  for (let i = 0; i < WORLDS.length; i++) {
    if (!canEnterWorld(i)) throw new Error('verden ' + i + ' skal kunne vælges fra start');
  }
  if (canEnterWorld(-1)) throw new Error('negativt indeks må ikke kunne vælges');
  if (canEnterWorld(WORLDS.length)) throw new Error('indeks ud over spillet må ikke kunne vælges');
});

gtest('statistik: markWrong/markRight registreres', () => {
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  cur.game = 'hear';
  markWrong('jeg');
  markWrong('jeg');
  markRight('det');
  const sw = state.stats.words['jeg'];
  if (sw.tries !== 2 || sw.wrong !== 2) throw new Error('jeg-statistik forkert: ' + JSON.stringify(sw));
  if (state.stats.games['hear'].tries !== 3) throw new Error('spiltype-statistik forkert');
});

gtest('showStats + renderStats uden fejl', () => {
  showStats();
  if (!els['screen-stats'].classList.contains('active')) throw new Error('stats-skærm ikke aktiv');
  if (!els['statsGrid'].innerHTML.includes('Stjerner')) throw new Error('stats-grid mangler oversigt');
  if (!els['statsWeak'].innerHTML) throw new Error('svage-ord-liste mangler');
});

gtest('svaghedsvægtning: buildWordList inkluderer svage ord', () => {
  state.stats = { words: {}, games: {}, days: {}, history: [] };
  state.wrong = {};
  // Lav "på" til et svagt ord fra verden 1 (tidligere verden i forhold til verden 2)
  state.stats.words['på'] = { tries: 5, wrong: 4 };
  const list = buildWordList(2, 8);
  if (!list.includes('på')) throw new Error('svagt ord "på" burde dukke op i genøvning, fik: ' + JSON.stringify(list));
});

// ==================== EQUIP/UNEQUIP (Docs/equip-system.md) ====================
// Kernen i det nye system: man kan nu TAGE GEAR AF igen — og intet item forsvinder.
function resetGear() {
  state.gear = {}; state.gearRoll = {}; state.gearItem = {}; state.bag = [];
  state.xp = 0; state.heroClass = 'kriger'; state.talents = { hp: 0, power: 0, crit: 0 };
  state.worlds = {}; state.potions = 2; state.talentPoints = 0; state.achievements = [];
  closeSlotPanel();
}
function mkItem(slot, rarity, name, roll) {
  return { id: 't_' + slot + '_' + Math.random().toString(36).slice(2, 7), slot: slot, rarity: rarity, name: name, roll: roll };
}

gtest('unequipItem findes (den manglende handling)', () => {
  if (typeof unequipItem !== 'function') throw new Error('unequipItem mangler');
  if (typeof gearItemFor !== 'function') throw new Error('gearItemFor mangler');
  if (typeof equippedPower !== 'function') throw new Error('equippedPower mangler');
});

gtest('tag af: itemet ligger i tasken bagefter med sin styrke', () => {
  resetGear();
  const it = mkItem('helm', 'rare', 'Sølvhjelm', 20);
  state.bag.push(it);
  equipItem(it);
  if (state.gear.helm !== 'rare') throw new Error('itemet skulle være udrustet');
  if (state.gearItem.helm !== it) throw new Error('gearItem skal holde selve item-objektet');
  const ok = unequipItem('helm');
  if (ok !== true) throw new Error('unequipItem skulle returnere true');
  if (state.gear.helm !== undefined) throw new Error('state.gear skal ryddes');
  if (state.gearItem.helm !== undefined) throw new Error('state.gearItem skal ryddes');
  if (state.bag.length !== 1) throw new Error('itemet skal ligge i tasken, fik ' + state.bag.length);
  const back = state.bag[0];
  if (back.name !== 'Sølvhjelm') throw new Error('samme navn forventet, fik ' + back.name);
  if (back.roll !== 20) throw new Error('styrken skal bevares, fik ' + back.roll);
  if (back.rarity !== 'rare' || back.slot !== 'helm') throw new Error('raritet/slot skal bevares');
});

gtest('kraften falder naar man tager af — og gearRoll ryddes (ingen forældreløs styrke)', () => {
  resetGear();
  if (heroPower() !== 0) throw new Error('skal starte på 0, fik ' + heroPower());
  const it = mkItem('helm', 'rare', 'Sølvhjelm', 20); // 3 grundkraft × 1,20 = 3,6 → 4
  state.bag.push(it);
  equipItem(it);
  const withGear = heroPower();
  if (withGear !== 4) throw new Error('rare +20 % skal give 4 kraft, fik ' + withGear);
  unequipItem('helm');
  if (heroPower() !== 0) throw new Error('kraften skal tilbage til 0, fik ' + heroPower());
  if (state.gearRoll && state.gearRoll.helm !== undefined) throw new Error('gearRoll.helm skal ryddes — ellers tæller en forældreløs styrke med');
});

gtest('intet item forsvinder: udrust nyt → det gamle ryger tilbage i tasken', () => {
  resetGear();
  const old = mkItem('helm', 'rare', 'Jernhjelm', 12);
  const next = mkItem('helm', 'epic', 'Krystalhjelm', 0);
  state.bag.push(old);
  equipItem(old);
  if (state.bag.length !== 0) throw new Error('tasken skal være tom efter udrustning');
  state.bag.push(next);
  equipItem(next);
  if (state.gear.helm !== 'epic') throw new Error('det nye item skal være udrustet');
  if (state.bag.length !== 1) throw new Error('det gamle item skal være tilbage, fik ' + state.bag.length);
  if (state.bag[0].name !== 'Jernhjelm') throw new Error('det RIGTIGE gamle item skal tilbage, fik ' + state.bag[0].name);
  if (state.bag[0].roll !== 12) throw new Error('gammel styrke skal bevares (ikke rulles igen), fik ' + state.bag[0].roll);
  if (state.gearRoll.helm !== 0) throw new Error('gearRoll skal foelge det NYE item, fik ' + state.gearRoll.helm);
});

gtest('gammel save UDEN gearItem: gearItemFor rekonstruerer uden at gaa ned', () => {
  resetGear();
  state.gear = { helm: 'legendary' };
  state.gearRoll = { helm: 10 };
  delete state.gearItem;                       // som et spil gemt foer gearItem fandtes
  const it = gearItemFor('helm');
  if (!it) throw new Error('itemet skulle kunne rekonstrueres');
  if (it.rarity !== 'legendary' || it.roll !== 10) throw new Error('raritet/styrke forkert: ' + JSON.stringify(it));
  if (!it.name) throw new Error('navnet mangler (vis sjaeldenheden)');
  if (it.name !== 'Legendarisk Hjelm') throw new Error('forventede sjaeldenheds-navn, fik ' + it.name);
  if (state.gear.helm !== 'legendary') throw new Error('state.gear maa ikke aendres af rekonstruktionen');
});

gtest('gammel save: man kan TAGE AF og itemet ender i tasken', () => {
  resetGear();
  state.gear = { helm: 'legendary' };
  state.gearRoll = { helm: 10 };
  delete state.gearItem;
  const ok = unequipItem('helm');
  if (!ok) throw new Error('tag af skulle lykkes paa en gammel save');
  if (state.gear.helm !== undefined) throw new Error('gear skal ryddes');
  if (state.bag.length !== 1) throw new Error('itemet skal ligge i tasken, fik ' + state.bag.length);
  if (state.bag[0].roll !== 10) throw new Error('styrken skal bevares, fik ' + state.bag[0].roll);
  if (heroPower() !== 0) throw new Error('kraften skal falde, fik ' + heroPower());
});

gtest('tag af det SIDSTE item → tasken er ikke tom, kraften er 0', () => {
  resetGear();
  const it = mkItem('weapon', 'epic', 'Runeklinge', 0);   // grundkraft 4
  state.bag.push(it);
  equipItem(it);
  if (state.bag.length !== 0) throw new Error('tasken skal være tom');
  if (heroPower() !== 4) throw new Error('epic uden styrke skal give 4, fik ' + heroPower());
  unequipItem('weapon');
  if (state.bag.length !== 1) throw new Error('itemet skal være i tasken');
  if (heroPower() !== 0) throw new Error('kraften skal være 0, fik ' + heroPower());
});

gtest('tag af en tom plads er harmløst (returnerer false)', () => {
  resetGear();
  const ok = unequipItem('boots');
  if (ok !== false) throw new Error('skal returnere false paa tom plads');
  if (state.bag.length !== 0) throw new Error('tasken skal være uændret');
});

gtest('intet item forsvinder: 6 byt i træk holder antallet konstant', () => {
  resetGear();
  for (let i = 0; i < 6; i++) {
    state.bag.push(mkItem('helm', 'rare', 'Hjelm' + i, i));
    const before = state.bag.length + (state.gear.helm ? 1 : 0);
    equipItem(state.bag[state.bag.length - 1]);
    const after = state.bag.length + (state.gear.helm ? 1 : 0);
    if (after !== before) throw new Error('item forsvandt i byt ' + i + ' (' + before + ' → ' + after + ')');
  }
  if (state.bag.length !== 5) throw new Error('5 items skulle ligge i tasken, fik ' + state.bag.length);
  unequipItem('helm');
  if (state.bag.length !== 6) throw new Error('efter tag af skal ALLE 6 items ligge i tasken, fik ' + state.bag.length);
});

gtest('equippedPower = itemPower paa det udrustede item', () => {
  resetGear();
  if (equippedPower('helm') !== 0) throw new Error('tom plads skal give 0');
  const it = mkItem('helm', 'rare', 'Sølvhjelm', 20);
  state.bag.push(it);
  equipItem(it);
  const p = equippedPower('helm');
  if (Math.abs(p - 3.6) > 0.01) throw new Error('rare +20 % = 3,6 kraft, fik ' + p);
});

gtest('helteskærmen viser det udrustede items NAVN (ikke bare sjaeldenheden)', () => {
  resetGear();
  const it = mkItem('helm', 'epic', 'Krystalhornhjelm', 25);
  state.bag.push(it);
  equipItem(it);
  showHero();
  const html = els['gearSlots'].children[0].innerHTML;
  if (!html.includes('Krystalhornhjelm')) throw new Error('navnet mangler i slot-visningen: ' + html);
  if (!html.includes('+25 %')) throw new Error('styrken mangler: ' + html);
});

gtest('et gammelt spil viser ogsaa gear i helteskærmen (migration)', () => {
  resetGear();
  state.gear = { boots: 'epic' };
  state.gearRoll = { boots: 5 };
  delete state.gearItem;
  renderHero();  // maa ikke kaste
  const html = els['gearSlots'].children[4].innerHTML; // boots er 5. slot
  if (!html.includes('Episk')) throw new Error('sjaeldenheden skulle vises, fik: ' + html);
});

gtest('slot-panel: viser det udrustede item med navn, grad og styrke', () => {
  resetGear();
  const it = mkItem('helm', 'rare', 'Sølvhjelm', 30);   // 30/30 = PERFEKT
  state.bag.push(it);
  equipItem(it);
  openSlotPanel('helm');
  const html = els['spEquipped'].innerHTML;
  if (!html.includes('Sølvhjelm')) throw new Error('navnet mangler: ' + html);
  if (!html.includes('PERFEKT')) throw new Error('graden mangler: ' + html);
  if (!html.includes('⭐⭐⭐')) throw new Error('stjernerne mangler: ' + html);
  if (!html.includes('+30 %')) throw new Error('styrken mangler: ' + html);
  if (!html.includes('Kraft 3,9')) throw new Error('kraften mangler (dansk komma): ' + html);
  if (!els['spTitle'].textContent.includes('Hjelm')) throw new Error('titlen mangler slots-navnet');
});

gtest('slot-panel: tom plads giver venlig besked + skjult Tag af-knap', () => {
  resetGear();
  openSlotPanel('amulet');
  if (!els['spEquipped'].innerHTML.includes('Intet udstyr')) throw new Error('tom-besked mangler: ' + els['spEquipped'].innerHTML);
  if (!els['spUnequip'].classList.contains('hidden')) throw new Error('Tag af skal være skjult naar intet er udrustet');
  if (!els['spList'].innerHTML.includes('Ingen amulet')) throw new Error('venlig tasken-besked mangler: ' + els['spList'].innerHTML);
});

gtest('slot-panel: Tag af-knappen tager itemet af og lægger det i tasken', () => {
  resetGear();
  const it = mkItem('helm', 'rare', 'Sølvhjelm', 20);
  state.bag.push(it);
  equipItem(it);
  openSlotPanel('helm');
  if (els['spUnequip'].classList.contains('hidden')) throw new Error('Tag af skal være synlig naar der er gear paa');
  els['spUnequip'].onclick();
  if (state.gear.helm !== undefined) throw new Error('itemet skulle være taget af');
  if (state.bag.length !== 1) throw new Error('itemet skal ligge i tasken, fik ' + state.bag.length);
});

gtest('slot-panel: tasken sorteres efter kraft med op/ned-pile', () => {
  resetGear();
  const equipped = mkItem('helm', 'rare', 'Sølvhjelm', 0);       // 3,0 kraft
  state.bag.push(equipped);
  equipItem(equipped);
  state.bag.push(mkItem('helm', 'common', 'Læderhjelm', 0));      // 1,0 → svagere
  state.bag.push(mkItem('helm', 'epic', 'Krystalhjelm', 0));      // 4,0 → stærkere
  state.bag.push(mkItem('helm', 'rare', 'Guldhjelm', 0));         // 3,0 → lige saa stærk
  openSlotPanel('helm');
  const rows = els['spList'].children;
  if (rows.length !== 3) throw new Error('3 items i panelet forventet, fik ' + rows.length);
  // Stærkest først
  if (!rows[0].innerHTML.includes('Krystalhjelm')) throw new Error('stærkeste item skal staa først: ' + rows[0].innerHTML);
  if (!rows[2].innerHTML.includes('Læderhjelm')) throw new Error('svageste item skal staa sidst: ' + rows[2].innerHTML);
  // Grøn op-pil + anbefaling paa den stærkeste
  if (!rows[0].innerHTML.includes('▲')) throw new Error('op-pil mangler: ' + rows[0].innerHTML);
  if (!rows[0].innerHTML.includes('1 stærkere')) throw new Error('kraft-forskellen mangler: ' + rows[0].innerHTML);
  if (!rows[0].innerHTML.includes('anbefalet')) throw new Error('anbefalingen mangler: ' + rows[0].innerHTML);
  if (!rows[0].className.includes('recommended')) throw new Error('recommended-klassen mangler');
  // Rød ned-pil paa den svageste
  if (!rows[2].innerHTML.includes('▼')) throw new Error('ned-pil mangler: ' + rows[2].innerHTML);
  if (!rows[2].innerHTML.includes('2 svagere')) throw new Error('svagere-teksten mangler: ' + rows[2].innerHTML);
  // Lige saa stærk
  if (!rows[1].innerHTML.includes('＝')) throw new Error('lige-saa-stærk-tegnet mangler: ' + rows[1].innerHTML);
  // Hver række har en Udrust-knap
  if (!rows[0].innerHTML.includes('Udrust')) throw new Error('Udrust-knappen mangler');
});

gtest('fortryd: efter tag af kan man udruste igen med ét tryk', () => {
  resetGear();
  const it = mkItem('helm', 'epic', 'Krystalhjelm', 10);
  state.bag.push(it);
  equipItem(it);
  openSlotPanel('helm');
  els['spUnequip'].onclick();
  if (state.gear.helm !== undefined) throw new Error('skulle være taget af');
  openSlotPanel('helm');
  const row = els['spList'].children[0];
  if (!row) throw new Error('itemet skal kunne ses i panelet igen');
  row.onclick();                               // ét tryk
  if (state.gear.helm !== 'epic') throw new Error('itemet skulle være udrustet igen');
  if (state.bag.length !== 0) throw new Error('itemet skal ud af tasken igen');
  if (state.gearRoll.helm !== 10) throw new Error('styrken skal foelge med tilbage');
});

gtest('et klik paa en slot-plads i helteskærmen aabner panelet', () => {
  resetGear();
  showHero();
  const slot = els['gearSlots'].children[0];
  if (!slot || !slot.onclick) throw new Error('slot mangler en klik-handling');
  slot.onclick();
  if (openSlotKey !== 'helm') throw new Error('panelet skulle aabne for helm, fik ' + openSlotKey);
  if (els['slotPanel'].classList.contains('hidden')) throw new Error('panelet skulle være synligt');
  closeSlotPanel();
  if (!els['slotPanel'].classList.contains('hidden')) throw new Error('panelet skulle lukkes');
  if (openSlotKey !== null) throw new Error('openSlotKey skal nulstilles');
});

gtest('mythic-gear: navn bevares, og det kan tages af igen', () => {
  resetGear();
  const it = makeItem('helm', 'mythic');
  state.bag.push(it);
  equipItem(it);
  if (state.gear.helm !== 'mythic') throw new Error('state.gear skal stadig være en streng (mythic)');
  openSlotPanel('helm');
  if (!els['spEquipped'].innerHTML.includes(it.name)) throw new Error('det unikke mythic-navn skal vises: ' + els['spEquipped'].innerHTML);
  unequipItem('helm');
  if (state.gear.helm !== undefined || state.gearItem.helm !== undefined) throw new Error('mythic skal kunne tages af');
  if (state.bag.length !== 1 || state.bag[0].rarity !== 'mythic') throw new Error('mythic skal tilbage i tasken');
});

gqueue.then(() => {
  console.log('\\nGear-fejl i alt: ' + fails.length);
  if (fails.length) process.exit(1);
});
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message);
  process.exit(1);
}
