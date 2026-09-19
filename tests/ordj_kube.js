// KUBENS CHANCER — mytiske items bestemmer opgraderingen (Kenneth 18. sep)
//
//   "Når man putter 1 mythic ind i cupen, så skal mane 10% chance for upgrade.
//    Putter man 2 mytchin in skal man have 20% 3 = 50 %"
//
// Reglen (se Docs/kubens-chancer.md):
//   1 mytisk -> 10 %   2 mytiske -> 20 %   3 mytiske -> 50 %
//   Rammer man: ét trin OVER det bedste item i kuben (mytisk -> HEMMELIG).
//   Rammer man ikke: man faar sit mytiske item IGEN i samme sjaeldenhed (man taber ikke sin
//   mytiske genstand — man har brugt de to andre items paa et forsoeg).
//   Uden mytiske items i kuben er den gamle fordeling UÆNDRET (7 % / 3 % / 90 %).
//
// Math.random stubbes, saa grænserne kan maales praecist (praecis under og over chancen).
//
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__html = fs.readFileSync('/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(){}, contains(c){ return this._s.has(c); } },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0,
  setAttribute(){}, getAttribute(){ return null; } });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };

const t = `
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };
const el = id => document.getElementById(id);

// Math.random stubbes: vi skal kunne ramme praecis UNDER og OVER chancen.
let FAKE = 0.5;
Math.random = () => FAKE;

const SLOTTER = GEAR_SLOTS.map(g => g.key);
const fyld = (typer) => {
  CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
  typer.forEach((r, i) => { CUBE_SLOTS[i] = makeItem(SLOTTER[i % SLOTTER.length], r); });
};
const sidsteItem = () => state.bag[state.bag.length - 1];

console.log('--- 1. Chancen efter antal mytiske items ---');
fyld(['mythic', 'common', 'common']);
check('1 mytisk giver 10 %', kubeOpgraderingsChance() === 0.10, kubeOpgraderingsChance());
check('antallet taelles rigtigt (1)', kubeMytiskeAntal() === 1, kubeMytiskeAntal());
fyld(['mythic', 'mythic', 'common']);
check('2 mytiske giver 20 %', kubeOpgraderingsChance() === 0.20, kubeOpgraderingsChance());
fyld(['mythic', 'mythic', 'mythic']);
check('3 mytiske giver 50 %', kubeOpgraderingsChance() === 0.50, kubeOpgraderingsChance());
check('antallet taelles rigtigt (3)', kubeMytiskeAntal() === 3, kubeMytiskeAntal());
fyld(['epic', 'rare', 'common']);
check('0 mytiske giver ingen opgraderings-chance', kubeOpgraderingsChance() === 0, kubeOpgraderingsChance());

console.log('--- 2. Graenserne: praecis under og over chancen ---');
const proev = (typer, r) => { fyld(typer); FAKE = r; cubeTransmute(); return sidsteItem(); };

let it = proev(['mythic', 'common', 'common'], 0.09);
check('1 mytisk, r=0,09: opgradering til HEMMELIG', it.rarity === 'secret', it.rarity);
it = proev(['mythic', 'common', 'common'], 0.11);
check('1 mytisk, r=0,11: ikke ramt — mytisk igen', it.rarity === 'mythic', it.rarity);

it = proev(['mythic', 'mythic', 'common'], 0.19);
check('2 mytiske, r=0,19: opgradering til HEMMELIG', it.rarity === 'secret', it.rarity);
it = proev(['mythic', 'mythic', 'common'], 0.21);
check('2 mytiske, r=0,21: ikke ramt — mytisk igen', it.rarity === 'mythic', it.rarity);

it = proev(['mythic', 'mythic', 'mythic'], 0.49);
check('3 mytiske, r=0,49: opgradering til HEMMELIG', it.rarity === 'secret', it.rarity);
it = proev(['mythic', 'mythic', 'mythic'], 0.51);
check('3 mytiske, r=0,51: ikke ramt — mytisk igen', it.rarity === 'mythic', it.rarity);

console.log('--- 3. Opgraderingen giver ALDRIG asgård (den er forbeholdt bossene) ---');
it = proev(['mythic', 'mythic', 'mythic'], 0.01);
check('højeste udfald fra kuben er hemmelig', it.rarity === 'secret', it.rarity);

console.log('--- 4. Et mislykket forsoeg koster ikke den mytiske genstand ---');
fyld(['mythic', 'common', 'rare']);
const mitItem = CUBE_SLOTS[0];
const mitSlot = mitItem.slot;
FAKE = 0.99;
cubeTransmute();
it = sidsteItem();
check('man faar sit mytiske item igen', it.rarity === 'mythic', it.rarity);
check('i samme plads som det man lagde ind', it.slot === mitSlot, it.slot + ' vs ' + mitSlot);

console.log('--- 5. Uden mytiske items: den gamle fordeling er UÆNDRET ---');
it = proev(['common', 'common', 'common'], 0.06);
check('r=0,06 giver mytisk (7 %-grænsen)', it.rarity === 'mythic', it.rarity);
it = proev(['common', 'common', 'common'], 0.08);
check('r=0,08 giver hemmelig (10 %-grænsen)', it.rarity === 'secret', it.rarity);
it = proev(['common', 'common', 'common'], 0.5);
check('r=0,5 giver ét trin op (almindelig -> magisk)', it.rarity === 'magic', it.rarity);
it = proev(['rare', 'common', 'common'], 0.5);
check('ét trin op tager udgangspunkt i det BEDSTE item', it.rarity === 'epic', it.rarity);

console.log('--- 6. Kuben kan ikke bruges uden tre items (uændret) ---');
state.bag = [];
CUBE_SLOTS[0] = CUBE_SLOTS[1] = CUBE_SLOTS[2] = null;
CUBE_SLOTS[0] = makeItem(SLOTTER[0], 'mythic');
FAKE = 0.01;
cubeTransmute();
check('tom kube (1 item) giver intet resultat', state.bag.length === 0, state.bag.length);

console.log('--- 7. Chancen STAAR paa skaermen, mens man laegger items i ---');
fyld(['epic', 'rare', 'common']);
renderCube();
check('0 mytiske: kuben forklarer hvordan chancen stiger',
  /10 %/.test(el('cubeChance').innerHTML) && /20 %/.test(el('cubeChance').innerHTML) && /50 %/.test(el('cubeChance').innerHTML),
  el('cubeChance').innerHTML);
fyld(['mythic', 'common', 'common']);
renderCube();
check('1 mytisk: kuben viser 10 %', /10 %/.test(el('cubeChance').innerHTML) && /1 mytisk/.test(el('cubeChance').innerHTML), el('cubeChance').innerHTML);
fyld(['mythic', 'mythic', 'common']);
renderCube();
check('2 mytiske: kuben viser 20 %', /20 %/.test(el('cubeChance').innerHTML) && /2 mytiske/.test(el('cubeChance').innerHTML), el('cubeChance').innerHTML);
fyld(['mythic', 'mythic', 'mythic']);
renderCube();
check('3 mytiske: kuben viser 50 %', /50 %/.test(el('cubeChance').innerHTML) && /3 mytiske/.test(el('cubeChance').innerHTML), el('cubeChance').innerHTML);

console.log('--- 8. Resultatet fortæller HVAD der skete ---');
const ind = [makeItem(SLOTTER[0], 'mythic'), makeItem(SLOTTER[1], 'mythic'), makeItem(SLOTTER[2], 'mythic')];
showCubeResult(ind, makeItem(SLOTTER[0], 'secret'), { antalMytiske: 3, chance: 0.5, opgraderet: true });
check('en opgradering siges hoet', /Opgradering/.test(el('coChance').textContent), el('coChance').textContent);
showCubeResult(ind, makeItem(SLOTTER[0], 'mythic'), { antalMytiske: 3, chance: 0.5, opgraderet: false });
check('et mislykket forsoeg siges hoet (ikke som en fejl)', /Prøv igen/.test(el('coChance').textContent), el('coChance').textContent);
showCubeResult(ind, makeItem(SLOTTER[0], 'magic'), { antalMytiske: 0, chance: 0, opgraderet: false });
check('uden mytiske items staar der ingenting (ingen stoj)', el('coChance').textContent === '', el('coChance').textContent);

console.log(F ? 'FEJL: ' + F : 'ALLE KUBE-TESTS GRØNNE');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
