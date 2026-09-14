// KAMP-SYSTEMER: elementer, energimåler, combo, opladning, forsvar, signaturangreb
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => {
  const el = { style:{ setProperty(){}, removeProperty(){}, getPropertyValue(){return '';}, display:'', width:'', transition:'' },
    classList:{ _s:new Set(), add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); },
                toggle(c,f){ const has=this._s.has(c); const on=(f===undefined)?!has:!!f; if(on)this._s.add(c); else this._s.delete(c); return on; },
                contains(c){ return this._s.has(c); } },
    children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, blur(){}, setSelectionRange(){},
    value:'', textContent:'', disabled:false, title:'', onclick:null, querySelectorAll:()=>[], querySelector:()=>mk(),
    scrollTo(){}, getAnimations:()=>[], animate(){}, remove(){}, offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0,
    getBoundingClientRect: () => ({ left:100, top:100, width:120, height:140 }) };
  Object.defineProperty(el, 'innerHTML', { get(){ return el._h||''; }, set(v){ el._h=String(v); el.children=[]; } });
  return el;
};
const els = {}; global.__els = els;
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()),
  querySelectorAll: () => [], querySelector: () => null, body: mk(), title:'' };
global.window = {}; const store = {};
global.localStorage = { getItem:k => store[k]||null, setItem:(k,v)=>{ store[k]=v; } };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.location = { search: '' };
global.toast = () => {};   // spilllet har sin egen toast, men vi kalder den ikke her

const p = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const t = `
let F = 0;
function check(l, c, e) { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); }
const els = global.__els;   // new Function-scope: globale stubs skal hentes ind
const wait = ms => new Promise(r => setTimeout(r, ms));
let queue = Promise.resolve();
function step(label, fn) { queue = queue.then(async () => { try { await fn(); } catch(err) { F++; console.log('FEJL ' + label + ' :: ' + err.message); } }); }
function reset() {
  state.worlds={}; state.wrong={}; state.seenPatterns=[]; state.mastered=[]; state.patternSnapshots={};
  state.stats={words:{},games:{},days:{},history:[]}; state.bag=[]; state.gear={}; state.lootCount=0; state.xp=0;
  state.heroClass='kriger'; state.talents={hp:0,power:0,crit:0}; state.achievements=[]; state.potions=2; state.skin=0;
}

/* ===== 1) ELEMENTER (synkront) ===== */
console.log('--- Elementer ---');
check('5 elementer defineret', ELEMENT_ORDER.length === 5, ELEMENT_ORDER.length);
check('alle elementer har icon+color+moves', ELEMENT_ORDER.every(k => {
  const e = ELEMENTS[k]; return e.icon && e.color && Array.isArray(e.moves) && e.moves.length >= 3;
}));
check('elementOf(0) = ild', elementOf(0).key === 'ild');
check('elementOf(1) = is', elementOf(1).key === 'is');
check('elementOf(4) = skygge', elementOf(4).key === 'skygge');
check('elementOf cykler (5 = ild igen)', elementOf(5).key === 'ild', elementOf(5).key);
check('alle 24 verdener får et gyldigt element', Array.from({length:24},(_,i)=>elementOf(i)).every(e => e && e.moves.length >= 3));

/* ===== 2) SIGNATURANGREB (synkront) ===== */
console.log('--- Signaturangreb ---');
check('alle 4 klasser har et signaturangreb', CLASSES.every(c => !!SIGNATURES[c.key]), JSON.stringify(Object.keys(SIGNATURES)));
check('hvert signatur har name+icon+hits+dmgFrac', Object.values(SIGNATURES).every(s =>
  s.name && s.icon && s.hits >= 1 && s.dmgFrac > 0 && s.dmgFrac <= 0.6 && s.flash));
state.heroClass = 'kriger';
check('signatureOf giver kriger-ultimativ', signatureOf().name === 'RASERI', signatureOf().name);
check('kriger har 3 hits', signatureOf().hits === 3);
state.heroClass = 'troldmand';
check('troldmand får METEORSTORM', signatureOf().name === 'METEORSTORM');
state.heroClass = 'paladin';
check('paladin heler', signatureOf().heal > 0, signatureOf().heal);
state.heroClass = 'jæger';
check('jæger får PRÆCISIONSSKUD', signatureOf().name === 'PRÆCISIONSSKUD');
state.heroClass = 'kriger';
check('ukendt klasse falder tilbage til kriger', signatureOf().name === 'RASERI');

/* ===== 3) startBoss initialiserer de nye systemer ===== */
console.log('--- startBoss ---');
step('startBoss initialiserer energi/combo/runde/element', async () => {
  reset(); cur.world = 0;
  startBoss(0);
  check('energy starter på 0', bossState.energy === 0, bossState.energy);
  check('combo starter på 0', bossState.combo === 0);
  check('runde starter på 1', bossState.round === 1);
  check('charge starter som null', bossState.charge === null);
  check('busy starter false', bossState.busy === false);
  check('element sat fra verden', bossState.el && bossState.el.key === elementOf(0).key, JSON.stringify(bossState.el && bossState.el.key));
  check('HP stadig sat', bossState.playerMax > 0 && bossState.dragonMax > 0);
  check('energimåler tegnet (0%)', els['energyFill'].style.width === '0%', els['energyFill'].style.width);
  check('signaturknap er disabled ved 0 energi', els['sigBtn'].disabled === true);
  check('runde-nummer vist', els['cmRound'].textContent === 1);
  check('element-badge vist', /Ild|Is|Lyn|Gift|Skygge/.test(els['cmElement'].textContent), els['cmElement'].textContent);
  check('opladnings-advarsel skjult', els['chargeWarn'].classList.contains('hidden'));
});

/* ===== 4) bossRoundEnd: energi, combo, runde, opladning ===== */
console.log('--- bossRoundEnd ---');
step('vundet runde giver +34 energi og +1 combo', async () => {
  reset(); cur.world = 0; startBoss(0);
  const e0 = bossState.energy;
  bossRoundEnd(true);
  check('energi +34 ved sejr', bossState.energy === e0 + 34, bossState.energy);
  check('combo = 1 efter sejr', bossState.combo === 1, bossState.combo);
  check('runde = 2', bossState.round === 2, bossState.round);
  check('busy frigivet', bossState.busy === false);
});
step('tabt runde nulstiller combo og giver +20 energi', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.combo = 4; const e0 = bossState.energy;
  bossRoundEnd(false);
  check('combo nulstilles ved tab', bossState.combo === 0, bossState.combo);
  check('energi +20 ved tab', bossState.energy === e0 + 20, bossState.energy);
});
step('energi kan ikke overstige max', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.energy = 95;
  bossRoundEnd(true);
  check('energi cappes ved 100', bossState.energy === 100, bossState.energy);
  check('energimåler viser 100%', els['energyFill'].style.width === '100%', els['energyFill'].style.width);
  check('energimåler markeres som fuld', els['energyWrap'].classList.contains('full'));
  check('signaturknap aktiveres ved fuld energi', els['sigBtn'].disabled === false);
  check('signaturknap viser navnet', els['sigBtn'].textContent.includes('RASERI'), els['sigBtn'].textContent);
});
step('opladning ruller kun med sandsynlighed og har navn+farve', async () => {
  reset(); cur.world = 0; startBoss(0);
  const orig = Math.random;
  Math.random = () => 0.01;   // tving opladning
  bossRoundEnd(true);
  check('opladning opstår ved lavt roll', !!bossState.charge, JSON.stringify(bossState.charge));
  check('opladning har et navn fra elementet', bossState.charge && bossState.el.moves.includes(bossState.charge.name), bossState.charge && bossState.charge.name);
  check('opladning har element-farve', bossState.charge.color === bossState.el.color);
  check('advarsel vises', !els['chargeWarn'].classList.contains('hidden'));
  check('advarselsnavn vist', els['chargeName'].textContent === bossState.charge.name);
  Math.random = () => 0.99;   // ingen opladning
  bossRoundEnd(true);
  check('ingen opladning ved højt roll', bossState.charge === null, JSON.stringify(bossState.charge));
  check('advarsel skjules igen', els['chargeWarn'].classList.contains('hidden'));
  Math.random = orig;
});
step('dragen lader oftere op når den er presset', async () => {
  reset(); cur.world = 0; startBoss(0);
  const orig = Math.random;
  // 34% chance: ved fuld HP ingen opladning, ved lav HP opladning
  Math.random = () => 0.38;
  bossState.dragonHp = bossState.dragonMax;      // chance 0.30 → 0.38 > 0.30 → nej
  bossRoundEnd(true);
  const notDesperate = !!bossState.charge;
  reset(); cur.world = 0; startBoss(0);
  Math.random = () => 0.38;
  bossState.dragonHp = bossState.dragonMax * 0.3; // chance 0.46 → 0.38 < 0.46 → ja
  bossRoundEnd(true);
  const desperate = !!bossState.charge;
  check('presset drage lader op (0.38 < 0.46) men ikke ellers (0.38 > 0.30)', desperate === true && notDesperate === false,
    'presset=' + desperate + ' ikkePresset=' + notDesperate);
  Math.random = orig;
});

/* ===== 5) FORSVAR ===== */
console.log('--- Forsvar ---');
step('forsvar uden opladning giver +50 energi og koster intet liv', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.energy = 0; bossState.charge = null;
  const hp0 = bossState.playerHp;
  bossDefend();
  check('ingen skade uden opladning', bossState.playerHp === hp0, bossState.playerHp + ' vs ' + hp0);
  check('forsvar giver +50 energi', bossState.energy === 50, bossState.energy);
  check('busy låses under forsvar', bossState.busy === true);
  await wait(750);
  check('runden afsluttes efter forsvar', bossState.round === 2, bossState.round);
  check('busy frigives igen', bossState.busy === false);
});
step('forsvar halverer det opladede angreb (40%)', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.charge = { name: 'Ildpust', color: '#f97316' };
  const hp0 = bossState.playerHp;
  const full = chargedDamage();   // samme funktion som spillet bruger
  const expect = Math.max(1, Math.round(full * 0.4));
  bossDefend();
  const taken = hp0 - bossState.playerHp;
  check('forsvar tager kun 40% af det fulde angreb', taken === expect, taken + ' vs ' + expect + ' (fuld=' + full + ')');
  check('opladningen forbruges straks ved blokering', bossState.charge === null, JSON.stringify(bossState.charge));
  check('advarslen skjules straks', els['chargeWarn'].classList.contains('hidden'));
  await wait(750);
});
step('at angribe i stedet for at forsvare koster fuld skade', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.charge = { name: 'Isstorm', color: '#38bdf8' };
  const hp0 = bossState.playerHp;
  bossAttack(ATTACKS[0]);
  await wait(2200);
  const taken = hp0 - bossState.playerHp;
  check('ubeskyttet opladning gør mere skade end forsvar', taken > 8, 'tabt liv i alt=' + taken);
  // (opladningen er brugt — der KAN være rullet en ny, så vi tjekker ikke null her)
  check('runden er afsluttet efter angrebet', bossState.round >= 2, bossState.round);
});

/* ===== 6) SIGNATURANGREB ===== */
console.log('--- Signaturangreb ---');
step('signatur kræver fuld energi', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.energy = 50;
  const hp0 = bossState.dragonHp;
  bossSignature();
  check('intet sker uden fuld energi', bossState.dragonHp === hp0, bossState.dragonHp);
  check('busy forbliver fri', bossState.busy === false);
});
step('kriger-signatur rammer 3 gange og nulstiller energi', async () => {
  reset(); cur.world = 0; state.heroClass = 'kriger'; startBoss(0);
  bossState.energy = 100;
  const hp0 = bossState.dragonHp;
  const perHit = Math.max(1, Math.round(bossState.dragonMax * SIGNATURES.kriger.dmgFrac));
  bossSignature();
  check('energi nulstilles straks', bossState.energy === 0, bossState.energy);
  check('busy låses', bossState.busy === true);
  await wait(2400);
  const dealt = hp0 - bossState.dragonHp;
  check('skaden = 3 hits × dmgFrac af drage-max', dealt === perHit * 3 || bossState.dragonHp === 0,
    dealt + ' vs ' + (perHit * 3) + ' (max=' + bossState.dragonMax + ')');
});
step('troldmand-signatur gør mere end kriger pr. hit', async () => {
  const k = SIGNATURES.kriger, tr = SIGNATURES.troldmand;
  check('troldmand enkelt-hit er større end kriger enkelt-hit', tr.dmgFrac > k.dmgFrac, tr.dmgFrac + ' vs ' + k.dmgFrac);
  check('troldmand total > kriger total', tr.dmgFrac * tr.hits > k.dmgFrac * k.hits,
    (tr.dmgFrac * tr.hits).toFixed(2) + ' vs ' + (k.dmgFrac * k.hits).toFixed(2));
});
step('paladin-signatur heler spilleren', async () => {
  reset(); cur.world = 0; state.heroClass = 'paladin'; startBoss(0);
  bossState.energy = 100;
  bossState.playerHp = Math.round(bossState.playerMax * 0.3);
  const hp0 = bossState.playerHp;
  bossSignature();
  await wait(2000);
  check('paladin heler sig selv', bossState.playerHp > hp0, bossState.playerHp + ' vs ' + hp0);
  check('liv overstiger ikke max', bossState.playerHp <= bossState.playerMax);
});
step('signaturangreb kan besejre dragen', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.energy = 100;
  bossState.dragonHp = 5;   // næsten død
  bossSignature();
  await wait(2000);
  check('dragen besejres af signatur', bossState.over === true, 'over=' + bossState.over + ' hp=' + bossState.dragonHp);
});

/* ===== 7) BUSY-LÅS (ingen dobbelt-handlinger) ===== */
console.log('--- Busy-lås ---');
step('man kan ikke handle mens en animation kører', async () => {
  reset(); cur.world = 0; startBoss(0);
  bossState.busy = true;
  const hp0 = bossState.dragonHp, e0 = bossState.energy;
  bossAttack(ATTACKS[0]);
  bossDefend();
  bossSignature();
  check('angreb ignoreres når busy', bossState.dragonHp === hp0);
  check('forsvar ignoreres når busy', bossState.energy === e0, bossState.energy);
  bossState.busy = false;
});

/* ===== 8) KAMPEN KAN GENNEMFØRES (integration) ===== */
console.log('--- Integrationskamp ---');
step('en hel kamp kan spilles til ende uden crash', async () => {
  reset(); cur.world = 0; startBoss(0);
  let guard = 0;
  while (!bossState.over && guard++ < 60) {
    bossState.busy = false;
    if (bossState.energy >= 100) bossSignature();
    else if (bossState.charge) bossDefend();
    else bossAttack(ATTACKS[Math.floor(Math.random() * ATTACKS.length)]);
    await wait(1900);
  }
  check('kampen blev afsluttet', bossState.over === true, 'runder=' + bossState.round + ' spiller=' + bossState.playerHp + ' drage=' + bossState.dragonHp);
  check('kampen tog rimeligt antal runder (< 40)', bossState.round < 40, bossState.round);
});

queue.then(() => {
  console.log(F === 0 ? '\\nALLE KAMP-TESTS GRØNNE' : '\\n' + F + ' FEJL');
  process.exit(F ? 1 : 0);
});
`;
try { new Function(p + '\n' + t)(); } catch(e) { console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1]||'')); process.exit(1); }