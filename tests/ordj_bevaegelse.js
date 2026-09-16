// HELTE-BEVAEGELSE: helten skal springe frem og angribe (Robins oenske).
// Testen laaser baade CSS-animationerne og at koden faktisk kalder dem i kampen.
const fs = require('fs');
const DIR = '/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren';
const html = fs.readFileSync(DIR + '/index.html', 'utf-8');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__html = html;
global.__src = src;   // new Function-scope ser ikke ydre const — derfor global

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const klasser = new Set();
const heroEl = { classList: { add(c){ klasser.add(c); }, remove(c){ klasser.delete(c); }, toggle(){}, contains: c => klasser.has(c) }, style:{ setProperty(){} }, offsetWidth: 100, innerHTML:'', textContent:'' };
const dragonEl = { classList: { add(c){ klasser.add('D:' + c); }, remove(c){ klasser.delete('D:' + c); }, toggle(){}, contains: c => klasser.has('D:' + c) }, style:{ setProperty(){} }, offsetWidth: 100, innerHTML:'', textContent:'' };
const els = { bossHeroSvg: heroEl, bossDragonEmoji: dragonEl };
const mk = () => ({ style:{ setProperty(){} }, classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.setTimeout = (fn, ms) => 0;      // vi tester HVILKEN klasse der saettes, ikke timingen
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };

const t = `
const html = global.__html;
const src = global.__src;
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

console.log('--- 1. Hjaelperne findes ---');
['heroLunge','heroReact','dragonCounter'].forEach(f =>
  check(f + ' er en funktion', typeof globalThis[f] === 'function' || eval('typeof ' + f) === 'function'));

console.log('--- 2. Helten springer frem ved angreb (1-3 slag) ---');
[1, 2, 3].forEach(n => {
  heroLunge(n);
  check('heroLunge(' + n + ') saetter attack-' + n, document.getElementById('bossHeroSvg').classList.contains('attack-' + n),
    JSON.stringify([...document.getElementById('bossHeroSvg').classList ? [] : []]));
});
check('heroLunge(9) klippes til attack-3 (ingen ugyldig klasse)',
  (function(){ heroLunge(9); return document.getElementById('bossHeroSvg').classList.contains('attack-3'); })());
check('heroLunge() uden argument giver attack-1',
  (function(){ heroLunge(); return document.getElementById('bossHeroSvg').classList.contains('attack-1'); })());

console.log('--- 3. Helten reagerer ---');
heroReact('recoil');
check('recoil-klassen saettes naar helten rammes', document.getElementById('bossHeroSvg').classList.contains('recoil'));
heroReact('guard');
check('guard-klassen saettes naar helten forsvarer sig', document.getElementById('bossHeroSvg').classList.contains('guard'));

console.log('--- 4. Monsteret stikker frem ---');
dragonCounter();
check('counter-klassen saettes paa monsteret', document.getElementById('bossDragonEmoji').classList.contains('counter'));

console.log('--- 5. CSS-animationerne findes ---');
['heroLunge1','heroLunge2','heroLunge3','heroRecoil','heroGuard','dragonCounter'].forEach(k => {
  check('@keyframes ' + k + ' er defineret', html.includes('@keyframes ' + k), 'mangler');
});
check('.boss-hero.attack-1 bruger heroLunge1', /\\.boss-hero\\.attack-1\\s*\\{[^}]*heroLunge1/.test(html));
const kfStart = html.indexOf('@keyframes heroLunge1');
const kfNext = html.indexOf('@keyframes', kfStart + 10);
const kfBody = html.slice(kfStart, kfNext > 0 ? kfNext : kfStart + 400);
check('.boss-hero attackerer mod HOEJRE (frem mod monsteret)', kfBody.includes('translate(44px'), kfBody.replace(/\s+/g, ' ').slice(0, 110));

console.log('--- 6. Koden kalder dem i kampen ---');
const kaldHero = (src.match(/heroLunge\\(/g) || []).length;
const kaldReact = (src.match(/heroReact\\(/g) || []).length;
check('heroLunge kaldes mindst 2 steder i kampen', kaldHero >= 3, kaldHero);
check('heroReact kaldes naar helten rammes og forsvarer', kaldReact >= 3, kaldReact);
check('dragonCounter kaldes ved modangreb', (src.match(/dragonCounter\\(\\)/g) || []).length >= 3,
  (src.match(/dragonCounter\\(\\)/g) || []).length);

console.log(F === 0 ? '\\nHELTE-BEVAEGELSE OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
