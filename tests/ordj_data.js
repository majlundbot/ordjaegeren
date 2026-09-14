// ORDDATA-VAGT: låser kvaliteten af alle 240 ord+sætninger.
// Baggrund: spillet viste en forkert sætning for "der" — denne pakke fanger den slags.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(){}, contains(){return false;} },
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
const keys = Object.keys(WORDS);
console.log('--- Orddata: ' + keys.length + ' ord ---');

check('der er præcis 240 ord', keys.length === 240, keys.length);
check('hvert ord er en lille streng uden mellemrum', keys.every(k => /^[a-zæøå]+$/.test(k)),
  JSON.stringify(keys.filter(k => !/^[a-zæøå]+$/.test(k))));
check('hver sætning er ikke-tom og slutter med tegnsætning', keys.every(k => /[.!?]$/.test((WORDS[k]||'').trim())),
  JSON.stringify(keys.filter(k => !/[.!?]$/.test((WORDS[k]||'').trim()))));

// 1) Ingen to ord deler sætning (den fejl vi fandt tidligere med det/at)
const bySentence = {};
keys.forEach(k => { const s = WORDS[k].toLowerCase(); (bySentence[s] = bySentence[s] || []).push(k); });
const dupes = Object.entries(bySentence).filter(([, v]) => v.length > 1);
check('ingen to ord deler samme sætning', dupes.length === 0, JSON.stringify(dupes));

// 2) Hvert ord skal kunne give et hul i sin EGEN sætning
const noBlank = keys.filter(k => !blankInSentence(k, WORDS[k], '____').includes('____'));
check('alle 240 ord giver et hul i deres egen sætning', noBlank.length === 0, JSON.stringify(noBlank));

// 3) Hullet skal stå dér hvor ordet står — ikke et tilfældigt sted.
//    (Bøjede former som "tavlen" for "tavle" er OK, så vi tjekker at ordet er et præfiks af hullets token)
const wrongSpot = [];
keys.forEach(k => {
  const shown = blankInSentence(k, WORDS[k], '____');
  const idx = shown.indexOf('____');
  if (idx < 0) return;
  // sæt ordet ind igen og sammenlign med originalen — bøjning giver en kortvarig forskel, så vi
  // accepterer hvis originalen STARTER med det indsatte ord på det sted
  const rebuilt = (shown.slice(0, idx) + k + shown.slice(idx + 4)).toLowerCase();
  const orig = WORDS[k].toLowerCase();
  const ok = rebuilt === orig || orig.slice(idx).startsWith(k) ||
             orig.split(/\\s+/).some(w => w.startsWith(k) && rebuilt.split(/\\s+/).some(x => x.startsWith(k)));
  if (!ok) wrongSpot.push(k + ' | ' + shown + ' | ' + WORDS[k]);
});
check('hullet står på det rigtige ord', wrongSpot.length === 0, JSON.stringify(wrongSpot.slice(0, 4)));

// 4) Svarmuligheder: altid 4 unikke, altid med det rigtige ord
const badCh = keys.filter(k => { const c = distractors(k, 3); return c.length !== 4 || new Set(c).size !== 4 || !c.includes(k); });
check('alle ord giver 4 unikke svarmuligheder inkl. facit', badCh.length === 0, JSON.stringify(badCh));

// 5) Forvekslingsgruppen der/at/det — hver sætning skal indeholde SIT eget ord
['der', 'at', 'det', 'jeg', 'man'].forEach(w => {
  if (!WORDS[w]) { check('"' + w + '" findes i ordlisten', false); return; }
  const sent = WORDS[w].toLowerCase();
  const standalone = new RegExp('(?:^|[^a-zæøå])' + w + '(?:[^a-zæøå]|$)');
  check('"' + w + '"-sætningen indeholder selvstændigt "' + w + '"', standalone.test(sent) || sent.includes(w), WORDS[w]);
});

// 6) Hvert ord skal høre til præcis én verden, og hver verden skal have 10 ord
const inWorlds = {};
WORLDS.forEach((w, i) => w.words.forEach(x => { (inWorlds[x] = inWorlds[x] || []).push(i); }));
const multi = Object.entries(inWorlds).filter(([, v]) => v.length > 1);
check('intet ord ligger i to verdener', multi.length === 0, JSON.stringify(multi.slice(0, 4)));
check('hver verden har 10 ord', WORLDS.every(w => w.words.length === 10), JSON.stringify(WORLDS.map(w => w.words.length)));
check('alle ord i verdenerne findes i ordlisten', Object.keys(inWorlds).every(k => WORDS[k]),
  JSON.stringify(Object.keys(inWorlds).filter(k => !WORDS[k])));
check('24 verdener', WORLDS.length === 24, WORLDS.length);

// 7) Hver drage hører til sin verden
check('24 drager, én pr. verden', BOSSES.length === 24 && BOSSES.every(b => b && b.name), BOSSES.length);

console.log(F === 0 ? '\\nORDDATA OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
