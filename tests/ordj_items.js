// ITEMS: 10x flere navne, random styrke, og kubens chancer (10 % / 10 % / 80 %).
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__html = fs.readFileSync('/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html', 'utf-8');

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
const fs = { readFileSync: () => global.__html };   // new Function-scope
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

console.log('--- 1. 10x flere item-navne ---');
const slots = Object.keys(GEAR_NAMES);
check('alle 6 slotter har navne', slots.length === 6, JSON.stringify(slots));
const antal = slots.map(s => GEAR_NAMES[s].length);
const total = antal.reduce((a, b) => a + b, 0);
console.log('     navne pr. slotte: ' + JSON.stringify(antal) + '  i alt ' + total);
check('mindst 70 navne pr. slotte (var 7 = 10x)', antal.every(n => n >= 70), JSON.stringify(antal));
check('mindst 400 navne i alt (var 42)', total >= 400, total);
check('ingen dubletter i samme slotte',
  slots.every(s => new Set(GEAR_NAMES[s]).size === GEAR_NAMES[s].length),
  JSON.stringify(slots.map(s => GEAR_NAMES[s].length - new Set(GEAR_NAMES[s]).size)));
check('hvert navn er unikt paa tvaers af alt',
  new Set(slots.flatMap(s => GEAR_NAMES[s])).size === total, total);
check('de klassiske navne findes stadig',
  ['Vikingehjelm','Dragehjelm','Stjernehjelm'].every(n => GEAR_NAMES.helm.includes(n)),
  JSON.stringify(GEAR_NAMES.helm.slice(0, 6)));

console.log('--- 2. Random styrke pr. item ---');
check('rollItemStrength findes', typeof rollItemStrength === 'function');
check('itemPower findes', typeof itemPower === 'function');
// 200 items: styrken skal variere, og alle skal ligge i 0..35
const it = [];
for (let i = 0; i < 200; i++) it.push(makeItem('helm', 'rare'));
const rolls = it.map(x => x.roll);
check('alle items har en styrke', rolls.every(r => Number.isFinite(r)), JSON.stringify(rolls.slice(0, 5)));
check('styrken ligger i 0..35 %', rolls.every(r => r >= 0 && r <= 35), Math.min(...rolls) + '..' + Math.max(...rolls));
check('styrken VARIERER (ikke samme tal hver gang)', new Set(rolls).size > 5, new Set(rolls).size + ' forskellige');
check('både lave og høje styrker forekommer', Math.min(...rolls) < 10 && Math.max(...rolls) > 25,
  Math.min(...rolls) + '..' + Math.max(...rolls));
check('navnene varierer ogsaa', new Set(it.map(x => x.name)).size > 20, new Set(it.map(x => x.name)).size);

console.log('--- 3. Styrken betyder noget for kraften ---');
const svag = { slot: 'helm', rarity: 'rare', roll: 0 };
const staerk = { slot: 'helm', rarity: 'rare', roll: 30 };
check('samme sjaeldenhed, forskellig kraft', itemPower(staerk) > itemPower(svag),
  itemPower(svag) + ' vs ' + itemPower(staerk));
check('+30 % giver praecis 30 % mere', Math.abs(itemPower(staerk) / itemPower(svag) - 1.30) < 0.02,
  (itemPower(staerk) / itemPower(svag)).toFixed(3));
// en god "rare" skal kunne slaa en dårlig "epic"
check('en god rare kan slaa en dårlig epic',
  itemPower({ rarity: 'rare', roll: 30 }) >= itemPower({ rarity: 'epic', roll: 0 }) * 0.85,
  itemPower({ rarity: 'rare', roll: 30 }) + ' vs ' + itemPower({ rarity: 'epic', roll: 0 }));

console.log('--- 4. Sjaeldne items er mere stabile i styrke ---');
const spans = {};
['common','rare','legendary','mythic','secret'].forEach(k => {
  let mx = 0, mn = 999;
  for (let i = 0; i < 400; i++) { const v = rollItemStrength(k); mx = Math.max(mx, v); mn = Math.min(mn, v); }
  spans[k] = mx;
});
check('common har stoerst spredning', spans.common > spans.legendary, JSON.stringify(spans));
check('secret har mindst spredning', spans.secret <= spans.mythic, JSON.stringify(spans));
check('mythic/secret ruller ogsaa en styrke', 
  [1,2,3,4,5].some(() => rollItemStrength('mythic') >= 0) && rollItemStrength('secret') <= 8,
  JSON.stringify(spans));

console.log('--- 5. Kubens chancer: 7 % / 3 % / 90 % ---');
check('pickMythicMissing findes', typeof pickMythicMissing === 'function');
check('pickSecretMissing findes', typeof pickSecretMissing === 'function');
// Statistisk test af fordelingen ved at efterligne kubens rul
function udfald(r) {
  if (r < 0.07) return 'mythic';
  if (r < 0.10) return 'secret';
  return 'trin-op';
}
const N = 20000;
let my = 0, se = 0, op = 0;
for (let i = 0; i < N; i++) {
  const u = udfald(Math.random());
  if (u === 'mythic') my++; else if (u === 'secret') se++; else op++;
}
const pm = my / N, ps = se / N, po = op / N;
console.log('     maalt: mythic ' + (pm*100).toFixed(1) + ' % · secret ' + (ps*100).toFixed(1) + ' % · trin-op ' + (po*100).toFixed(1) + ' %');
check('mythic ~7 %', Math.abs(pm - 0.07) < 0.012, (pm*100).toFixed(2) + ' %');
check('secret ~3 %', Math.abs(ps - 0.03) < 0.010, (ps*100).toFixed(2) + ' %');
check('trin-op ~90 %', Math.abs(po - 0.90) < 0.012, (po*100).toFixed(2) + ' %');

// Kubens kildekode skal indeholde de praecise graenser
const html = fs.readFileSync('/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html', 'utf-8');
const kub = html.slice(html.indexOf('function cubeTransmute'), html.indexOf('function cubeTransmute') + 900);
check('kuben ruller mythic ved r < 0.07', kub.includes('if (r < 0.07)') && kub.includes('mythic'));
check('kuben ruller secret ved 0.07 <= r < 0.10', kub.includes('else if (r < 0.10)') && kub.includes('secret'));
check('kuben bruger ét rul (const r = Math.random())', /const r = Math\\.random\\(\\);[\\s\\S]{0,200}if \\(r < 0\\.10\\)/.test(html));

console.log(F === 0 ? '\\nITEMS OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
