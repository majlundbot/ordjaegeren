// Verden 2 smoke-test: sekventiel kø (settimers deler state)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const els = {};
const stubEl = id => els[id] || (els[id] = { classList:{add(){},remove(){},contains:()=>false}, textContent:'', innerHTML:'', appendChild(){}, addEventListener(){}, focus(){}, style:{}, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, setProperty(){}, remove(){}, title:'' });
global.document = { getElementById: id => stubEl(id), querySelectorAll: () => [], querySelector: () => stubEl(), createElement: () => stubEl(), body: { appendChild(){} } };
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => {}; };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }
// state via localStorage-stub med getItem der giver et rent state
let fails = 0;

// 1) Verden 2 findes og er låst fra start
check('verden 12 (Bog-klassen) findes', WORLDS[12] && WORLDS[12].name === 'Bog-klassen', WORLDS[12] && WORLDS[12].name);
check('verden 12 låst fra start', worldUnlocked(12) === false);
check('verden 23 (Følelses-skoven) findes', WORLDS[23] && WORLDS[23].name === 'Følelses-skoven');

// 2) blankInSentence matcher bøjede former
check('tavle→tavlen hul', blankInSentence('tavle', 'Læreren skriver på tavlen.', '____').includes('____'), blankInSentence('tavle', 'Læreren skriver på tavlen.', '____'));
check('kat→katten hul', blankInSentence('kat', 'Katten sover på sofaen.', '____').includes('____'));
check('klods→klodser hul', blankInSentence('klods', 'Jeg bygger et tårn af klodser.', '____').includes('____'));
check('skole→skole hul (eksakt)', blankInSentence('skole', 'Vi går i skole hver dag.', '____').includes('____'));
check('i→i hul (kort ord)', blankInSentence('i', 'Jeg går i skole.', '____').includes('____'));

// 3) SECRET system
const sItem = makeItem('helm', 'secret');
check('secret item oprettes', sItem.rarity === 'secret' && sItem.secret === true && sItem.name === 'Akademi-kronen', JSON.stringify(sItem));
check('secretForSlot', secretForSlot('weapon').name === 'Ordets Forbandede Sværd');
check('raritet-secret findes med power 15', RARITIES.find(r => r.key === 'secret').power === 15);

// 4) Kube blokerer secret
check('secret kan ikke i kuben', (() => { const before = CUBE_SLOTS.filter(Boolean).length; bagToCube(sItem); return CUBE_SLOTS.filter(Boolean).length === before; })());

// 5) wheelSegs — akademi-hjul har secret-segment
cur.world = 12;
const segs = wheelSegs();
check('akademi-hjul har secret-segment', segs.some(s => s.key === 'secret'), JSON.stringify(segs.map(s=>s.key)));
check('akademi-hjul pct summer til 1', Math.abs(segs.reduce((n,s)=>n+s.pct,0)-1) < 0.001);
cur.world = 0;
check('verden 1-hjul har IKKE secret', !wheelSegs().some(s => s.key === 'secret'));

console.log('VERDEN-2-SMOKE DONE');
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + e.stack.split('\n')[1]);
  process.exit(1);
}
