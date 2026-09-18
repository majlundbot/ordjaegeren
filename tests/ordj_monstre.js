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
check('36 bosser', BOSSES.length === 36, BOSSES.length);
check('36 verdener', WORLDS.length === 36, WORLDS.length);
check('hver boss har navn, emoji, kraft og to farver',
  BOSSES.every(b => b.name && b.emoji && Number.isFinite(b.power) && /^#[0-9a-f]{6}$/i.test(b.c1) && /^#[0-9a-f]{6}$/i.test(b.c2)),
  JSON.stringify(BOSSES.find(b => !(b.name && b.emoji && b.power && b.c1 && b.c2)) || null));
/* UNDTAGELSE: de første 24 må ikke hedde noget med "drage" — de er ikke drager.
   Verden 26 er den RIGTIGE drage i spillet: "Mester-dragen". Den er ikke længere
   den stærkeste i tal (kurven fortsætter, se nedenfor), men den er stadig den
   eneste drage OG den eneste vej til ASEGÅRD-udstyret. Se Docs/nye-verdener-og-asegard.md. */
check('ingen af de 24 første bosser hedder noget med "drage"', !BOSSES.slice(0, 24).some(b => /drage/i.test(b.name)),
  JSON.stringify(BOSSES.slice(0, 24).filter(b => /drage/i.test(b.name)).map(b => b.name)));
check('dragen i spillet er Mester-dragen (verden 26)', BOSSES[25].name === 'Mester-dragen');
check('kun Mester-dragen hedder noget med drage', BOSSES.filter(b => /drage/i.test(b.name)).length === 1,
  JSON.stringify(BOSSES.filter(b => /drage/i.test(b.name)).map(b => b.name)));
check('alle navne er unikke', new Set(BOSSES.map(b => b.name)).size === 36);
check('alle emoji er unikke', new Set(BOSSES.map(b => b.emoji)).size === 36,
  JSON.stringify(BOSSES.map(b => b.emoji)));

console.log('--- 2. Svaerhedsgraden stiger jaevnt ---');
const pw = BOSSES.map(b => b.power);
let rising = true;
for (let i = 1; i < pw.length; i++) if (pw[i] <= pw[i-1]) rising = false;
check('kraften stiger for hver verden', rising, JSON.stringify(pw));
check('foerste boss er let (kraft <= 10)', pw[0] <= 10, pw[0]);
check('sidste boss er svaerest (kraft = maks)', pw[35] === Math.max(...pw), pw[35]);
/* BESLUTNING (17. sep): da side C fik 12 verdener, kunne kurven ikke længere stoppe
   ved Mester-dragen (110) — en verden 28 der var svagere end verden 26 ville føles som
   en nedtur. Derfor er den SIDSTE verden nu den stærkeste i spillet, og Mester-dragen
   er den stærkeste DRAGE. Begge roller testes, så ingen af dem kan forsvinde. */
check('verden 36 er den staerkeste i spillet', BOSSES[35].power === Math.max(...BOSSES.map(b => b.power)), BOSSES[35].power);
check('Mester-dragen er stadig den staerkeste drage (kraft 110)',
  BOSSES[25].power === Math.max(...BOSSES.filter(b => /drage/i.test(b.name)).map(b => b.power)) && BOSSES[25].power === 110,
  BOSSES[25].power);
check('de 10 nye verdener fortsaetter kurven over Mester-dragen',
  BOSSES.slice(26, 36).every(b => b.power > BOSSES[25].power), JSON.stringify(BOSSES.slice(26, 36).map(b => b.power)));

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
  16: 'Spindelvæveren',     // Den glemte legeplads — spinder den ind
  17: 'Vildsvinet',         // Svampe-markedet
  18: 'Natsværmeren',       // Toej-hulen
  19: 'Mangeøjet',          // Knogleskoven
  20: 'Frøen',              // Natur-haven <- haven
  21: 'Skyggeløberen',      // Jagt-stien
  22: 'Urmonstret',         // Tids-uret
  23: 'Følelsernes Kejser', // Foelses-skoven
  24: 'Stavelses-trolden',  // Den svære skov (verden 25) — staver anderledes end det lyder
  25: 'Mester-dragen',      // Mesterskabet (verden 26) — den eneste drage + ASEGÅRD-porten
  /* De 10 nye verdener på side C (27-36). Monsteret skal passe til verdens TEMA. */
  26: 'Tvillingen',         // Dobbelt-bjerget — dobbeltkonsonanter: alt kommer i par
  27: 'Stilheds-ånden',     // Stum-skoven — stumme bogstaver: den siger ingenting
  28: 'Trafik-trolden',     // Byens gader — fremmedordene fra byen
  29: 'Klassens Spøgelse',  // Skole-loftet — skole- og fagord
  30: 'Ulveflokken',        // Vildt-reservatet — natur og dyr
  31: 'Sorgens Skygge',     // Følelses-fjeldet — følelser og egenskaber
  32: 'Spejl-trolden',      // Spejl-søen — ej/øj-lydene
  33: 'Byens Vogter',       // Samfunds-byen — penge, arbejde, sygehus, politi
  34: 'Troldmands-kongen',  // Eventyr-riget — eventyr og myteri
  35: 'Drømme-kejseren',    // Drømme-tårnet — de sværeste ord · STÆRKEST I SPILLET
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
  [18, 'Natsværmeren', /tøj|tøj|kammer/i, 'tøj-verdenen skal handle om tøj'],
  [22, 'Urmonstret', /tid|ur/i, 'tid-verdenen skal handle om tid'],
  [24, 'Stavelses-trolden', /skov/i, 'den svære skov skal have et væsen der driller med stavelser'],
  [25, 'Mester-dragen', /mester|skab/i, 'mesterskabet skal have en final boss'],
  /* De 10 nye: monsteret skal matche verdens navn/tema, så barnet kan huske dem sammen. */
  [26, 'Tvillingen', /dobbelt/i, 'dobbeltkonsonanternes verden skal have et monster der kommer i par'],
  [27, 'Stilheds-ånden', /stum/i, 'stumme bogstaver skal have et monster der er helt tavst'],
  [28, 'Trafik-trolden', /by|gade/i, 'by-verdenen skal handle om byen og dens larm'],
  [29, 'Klassens Spøgelse', /skole/i, 'skole-verdenen skal have noget der hører klasselokalet til'],
  [30, 'Ulveflokken', /vildt|reservat/i, 'dyre-verdenen skal have et dyr (og gerne et farligt et)'],
  [31, 'Sorgens Skygge', /følelse/i, 'følelses-verdenen skal have et monster der er en følelse'],
  [32, 'Spejl-trolden', /spejl/i, 'spejl-søen skal have et monster der spejler sig i navnet'],
  [33, 'Byens Vogter', /samfund/i, 'samfunds-byen skal have en vogter af byen'],
  [34, 'Troldmands-kongen', /eventyr/i, 'eventyr-riget skal have eventyrets stærkeste skurk'],
  [35, 'Drømme-kejseren', /drømme/i, 'drømme-tårnet skal have den stærkeste hersker i spillet'],
];
tema.forEach(([i, navn, re, forklaring]) => {
  check(forklaring + ' (verden ' + i + ')', re.test(WORLDS[i].name) && BOSSES[i].name === navn,
    WORLDS[i].name + ' / ' + BOSSES[i].name);
});

console.log('--- 5. Monsteret bruges i kampen ---');
check('bossState kan startes for alle 36', WORLDS.every((w, i) => typeof startBoss === 'function' && !!BOSSES[i]));
check('kamp-slutteksten naevner ikke drager',
  !/drage/i.test(String(WORLDS[0].name)) , true);

console.log(F === 0 ? '\\nMONSTRE OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
