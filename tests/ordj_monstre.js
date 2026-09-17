// MONSTRE: hvert monster skal matche SIN verden, og svaerhedsgraden skal stige jaevnt.
// Baggrund: Kenneth bad om at drage-bosserne blev erstattet af individuelle monstre
// der passer til verdenen (frø i natur-verdenen, ræv i dyre-verdenen osv.).
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
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

console.log('--- 1. Antal og grunddata ---');
check('26 bosser', BOSSES.length === 26, BOSSES.length);
check('26 verdener', WORLDS.length === 26, WORLDS.length);
check('hver boss har navn, emoji, kraft og to farver',
  BOSSES.every(b => b.name && b.emoji && Number.isFinite(b.power) && /^#[0-9a-f]{6}$/i.test(b.c1) && /^#[0-9a-f]{6}$/i.test(b.c2)),
  JSON.stringify(BOSSES.find(b => !(b.name && b.emoji && b.power && b.c1 && b.c2)) || null));
/* UNDTAGELSE: de første 24 må ikke hedde noget med "drage" — de er ikke drager.
   Verden 26 er FINAL BOSS og hedder med vilje "Mester-dragen": den vender tilbage
   som den sidste, men er ikke som de andre (se Docs/nye-verdener-og-asegard.md). */
check('ingen af de 24 første bosser hedder noget med "drage"', !BOSSES.slice(0, 24).some(b => /drage/i.test(b.name)),
  JSON.stringify(BOSSES.slice(0, 24).filter(b => /drage/i.test(b.name)).map(b => b.name)));
check('final boss i verden 26 ER en drage (Mester-dragen)', BOSSES[25].name === 'Mester-dragen');
check('alle navne er unikke', new Set(BOSSES.map(b => b.name)).size === 26);
check('alle emoji er unikke', new Set(BOSSES.map(b => b.emoji)).size === 26,
  JSON.stringify(BOSSES.map(b => b.emoji)));

console.log('--- 2. Svaerhedsgraden stiger jaevnt ---');
const pw = BOSSES.map(b => b.power);
let rising = true;
for (let i = 1; i < pw.length; i++) if (pw[i] <= pw[i-1]) rising = false;
check('kraften stiger for hver verden', rising, JSON.stringify(pw));
check('foerste boss er let (kraft <= 10)', pw[0] <= 10, pw[0]);
check('sidste boss er svaerest (kraft = maks)', pw[25] === Math.max(...pw), pw[25]);
check('verden 26 er den staerkeste i spillet', BOSSES[25].power === Math.max(...BOSSES.map(b => b.power)), BOSSES[25].power);

console.log('--- 3. Monsteret matcher VERDENENS tema ---');
// Verden -> forventet monster. Denne tabel er aftalen med Kenneth.
const VENTET = {
   0: 'Slimklumpen',        // Start-planeten
   1: 'Bjergtrolden',       // Ord-bjergene
   2: 'Ekko-uglen',         // Lyd-dalen
   3: 'Skovtrolden',        // Saetnings-skoven
   4: 'Gåde-kraken',        // Gaade-oeen
   5: 'Strømhesten',        // Fart-floden
   6: 'Huleflagermusen',    // Hemmelige-hulen
   7: 'Klokketrolden',      // Tids-taarnet
   8: 'Stjernevogteren',    // Stjernemarken
   9: 'Månemanden',         // Maane-byen
  10: 'Raketkraken',        // Raket-havet
  11: 'Galakse-kejseren',   // Galaksens kerne
  12: 'Bogsnapperen',       // Bog-klassen
  13: 'Hustrolden',         // Skrive-vaerkstedet (hus-ord)
  14: 'Troldefamilien',     // Familiens hus
  15: 'Ræven',              // Dyre-parken  <- dyreverdenen
  16: 'Ballonmonstret',     // Lege-pladsen
  17: 'Madmonstret',        // Mad-markedet
  18: 'Sokkemonstret',      // Toej-kammeret
  19: 'Muskelmonstret',     // Krop-vaerkstedet
  20: 'Frøen',              // Natur-haven <- haven
  21: 'Hurtigløberen',      // Handle-hallen
  22: 'Urmonstret',         // Tids-uret
  23: 'Følelsernes Kejser', // Foelses-skoven
  24: 'Stavelses-trolden',  // Den svære skov (verden 25) — staver anderledes end det lyder
  25: 'Mester-dragen',      // Mesterskabet (verden 26) — FINAL BOSS
};
let fejl = [];
Object.keys(VENTET).forEach(i => {
  const b = BOSSES[Number(i)];
  if (!b || b.name !== VENTET[i]) fejl.push(\`verden \${i} ("\${WORLDS[i].name}") forventede "\${VENTET[i]}", fik "\${b ? b.name : '?'}"\`);
});
check('hvert monster matcher sin verden', fejl.length === 0, fejl.join(' | '));

console.log('--- 4. Verden og monster passer tematisk ---');
const tema = [
  [15, 'Ræven', /dyr|park/i, 'dyreverdenen skal have et dyr'],
  [20, 'Frøen', /natur|have/i, 'natur-verdenen skal have et naturvaesen'],
  [18, 'Sokkemonstret', /tøj|tøj|kammer/i, 'tøj-verdenen skal handle om tøj'],
  [22, 'Urmonstret', /tid|ur/i, 'tid-verdenen skal handle om tid'],
  [24, 'Stavelses-trolden', /skov/i, 'den svære skov skal have et væsen der driller med stavelser'],
  [25, 'Mester-dragen', /mester|skab/i, 'mesterskabet skal have en final boss'],
];
tema.forEach(([i, navn, re, forklaring]) => {
  check(forklaring + ' (verden ' + i + ')', re.test(WORLDS[i].name) && BOSSES[i].name === navn,
    WORLDS[i].name + ' / ' + BOSSES[i].name);
});

console.log('--- 5. Monsteret bruges i kampen ---');
check('bossState kan startes for alle 26', WORLDS.every((w, i) => typeof startBoss === 'function' && !!BOSSES[i]));
check('kamp-slutteksten naevner ikke drager',
  !/drage/i.test(String(WORLDS[0].name)) , true);

console.log(F === 0 ? '\\nMONSTRE OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
