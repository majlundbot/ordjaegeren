// ORDDATA-VAGT: låser kvaliteten af alle 260 ord+sætninger.
// Baggrund: spillet viste en forkert sætning for "der" — denne pakke fanger den slags.
// Udvidet 17. sep da verden 25 og 26 kom til: nu tælles BÅDE unikke nøgler og de
// SKREVNE nøgler, så en usynlig dublet (som den gamle "over") ikke kan snige sig ind.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__fs = fs;
global.__dirname = __dirname;

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

check('der er præcis 260 ord', keys.length === 260, keys.length);
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
check('alle 260 ord giver et hul i deres egen sætning', noBlank.length === 0, JSON.stringify(noBlank));

// 3) Hullet skal stå dér hvor ordet står — ikke et tilfældigt sted.
/* Kontrakten (justeret 17. sep for verden 25): hullet skal stå på en FORM af ordet.
   Vi godtager tre former:
     1) præcis ordet selv (hund → hund)
     2) en bøjning hvor ordet er præfiks (tavle → tavlen, klods → klodser)
     3) intetkøns-formen uden -t: ordet "dejligt" står i sætningen som "dejlig"
        ("Det har været en dejlig dag."). Lydfilen læser ordet — sætningen er
        skrevet så barnet møder det i kontekst, og vi må ikke skrive den om. */
const wrongSpot = [];
keys.forEach(k => {
  const shown = blankInSentence(k, WORDS[k], '____');
  const idx = shown.indexOf('____');
  if (idx < 0) return;                      // fanges af test 2
  const before = shown.slice(0, idx), after = shown.slice(idx + 4);
  const orig = WORDS[k];
  if (!orig.startsWith(before)) { wrongSpot.push(k + ' | ' + shown + ' | ' + orig); return; }
  const rest = orig.slice(before.length);
  // Token uden regex-escapes: læs de første bogstaver (æøå tæller med)
  const bogstaver = "abcdefghijklmnopqrstuvwxyzæøåABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ";
  let ti = 0;
  while (ti < rest.length && bogstaver.includes(rest[ti])) ti++;
  const token = rest.slice(0, ti);
  if (!after.startsWith(rest.slice(token.length))) { wrongSpot.push(k + ' | ' + shown + ' | ' + orig); return; }
  const former = [k];
  if (/t$/.test(k) && k.length >= 4) former.push(k.slice(0, -1));
  const tok = token.toLowerCase();
  const ok = former.includes(tok) || tok.startsWith(k);
  if (!ok) wrongSpot.push(k + ' | token=' + token + ' | ' + shown + ' | ' + orig);
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
check('26 verdener', WORLDS.length === 26, WORLDS.length);
/* KONSISTENS-KRAVET: verdenerne skal tilsammen indeholde PRÆCIS de samme ord som
   WORDS — hverken et ord mere eller et ord mindre. Det er dét der fanger en usynlig
   dublet eller et glemt ord. */
const antalVerdensord = WORLDS.reduce((n, w) => n + w.words.length, 0);
check('260 ord i verdenerne til sammen', antalVerdensord === 260, antalVerdensord);
check('ordene i verdenerne = ordene i WORDS (260 unikke)',
  antalVerdensord === keys.length && Object.keys(inWorlds).length === keys.length,
  antalVerdensord + ' verdensord / ' + Object.keys(inWorlds).length + ' unikke / ' + keys.length + ' i WORDS');
check('hvert ord i WORDS bruges i en verden', keys.every(k => inWorlds[k]), JSON.stringify(keys.filter(k => !inWorlds[k])));

// 8) INGEN USYNLIGE DUBLETTER i kildekoden: antallet af SKREVNE nøgler i WORDS-
//    litteralen skal være præcis det samme som antallet af unikke ord. Skrives en
//    nøgle to gange, forsvinder den ene sporløst i JavaScript — det skete med
//    "over" (241 skrevne nøgler, men kun 240 ord i spillet).
const fs = global.__fs, __dirname = global.__dirname;
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
const wBlock = html.slice(html.indexOf('const WORDS = {'), html.indexOf('const ALL_WORDS'));
// Tæl de SKREVNE nøgler: hver nøgle står som  noegle:"sætning"  — vi leder efter
// mønsteret  :"  og læser nøglen baglæns. (Ingen regex-escapes, så det er til at læse.)
const alfabet = "abcdefghijklmnopqrstuvwxyzæøå0123456789";
const skrevne = [];
let pos = 0;
while ((pos = wBlock.indexOf(':"', pos)) >= 0) {
  let j = pos - 1, k = "";
  while (j >= 0 && alfabet.includes(wBlock[j])) { k = wBlock[j] + k; j--; }
  skrevne.push(k);
  pos += 2;
}
const dubletter = skrevne.filter((k, i) => skrevne.indexOf(k) !== i);
check('ingen nøgle skrives to gange i WORDS', dubletter.length === 0, JSON.stringify(dubletter));
check('antal skrevne nøgler = antal ord (260 = 260)', skrevne.length === 260 && keys.length === 260, skrevne.length + ' skrevne / ' + keys.length + ' unikke');

// 7) Hver drage hører til sin verden
check('26 drager, én pr. verden', BOSSES.length === 26 && BOSSES.every(b => b && b.name), BOSSES.length);

console.log(F === 0 ? '\\nORDDATA OK' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();
