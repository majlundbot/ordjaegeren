// LYD-KÆDEN: beviser at et nyt spørgsmål afbryder det forriges "ord → sætning"-kæde.
// Kenneths rapport: barnet hørte ordet fra det NYE spørgsmål og sætningen fra det GAMLE.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

// Stub Audio der lader os styre hvornår lyden "slutter"
const created = [];
function FakeAudio(src) {
  this.src = src; this.paused = false; this.currentTime = 0;
  this.onended = null; this.onerror = null;
  created.push(this);
  this.play = () => Promise.resolve();
  this.pause = () => { this.paused = true; };
}
FakeAudio.prototype.end = function () { if (this.onended) this.onended(); };

global.Audio = FakeAudio;
global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(){}, contains(c){return this._s.has(c);} },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
const spoken = [];
global.__spoken = spoken;   // new Function-scope ser ikke ydre const — derfor global
const errs = [];
global.__errs = errs;
global.speechSynthesis = { getVoices:()=>[{ lang:'da-DK', name:'TestStemme', localService:true }], cancel(){ spoken.push('CANCEL'); }, speak(){ spoken.push('SPEAK'); }, onvoiceschanged:null };
global.SpeechSynthesisUtterance = function(t){ this.text = t; };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};

const t = `
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };
const made = global.__created;
const reset = () => { made.length = 0; stopAudio(); made.length = 0; };

console.log('--- Lyd: én afspilning ad gangen ---');

// 1) Normal kæde: ord -> sætning
reset();
playWordAndSentence('der', () => {});
check('kæden starter med ORD-filen', made.length === 1 && made[0].src.includes('/words/der.mp3'), made.map(m=>m.src).join(','));
made[0].end();
check('når ordet slutter, spilles SÆTNINGEN', made.length === 2 && made[1].src.includes('/sentences/der.mp3'),
  made.map(m=>m.src).join(','));

// 2) KERNEN I FEJLEN: nyt spørgsmål før det gamle er færdigt
reset();
playWordAndSentence('der', () => {});          // spørgsmål N-1 ("der")
const oldWord = made[0];
playWordAndSentence('at', () => {});           // spørgsmål N ("at") starter
check('nyt spørgsmål starter sin egen ORD-fil', made.length === 2 && made[1].src.includes('/words/at.mp3'),
  made.map(m=>m.src).join(','));
check('den gamle lyd blev stoppet', oldWord.paused === true);
const before = made.length;
oldWord.end();                                  // den GAMLE lyd slutter nu (forsinket)
check('den gamle kæde må IKKE fortsætte til sin sætning',
  made.length === before && !made.some(m => m.src.includes('/sentences/der.mp3')),
  made.map(m=>m.src).join(','));
made[1].end();                                  // den NYE lyd slutter
check('den nye kæde fortsætter til SIN sætning (at)',
  made.length === before + 1 && made[made.length-1].src.includes('/sentences/at.mp3'),
  made.map(m=>m.src).join(','));
// Rækkefølgen må ikke give "der"-sætningen til "at"-spørgsmålet
const sentences = made.filter(m => m.src.includes('/sentences/')).map(m => m.src.split('/').pop().split('?')[0]);
check('kun ÉN sætning blev spillet, og det er den rigtige', JSON.stringify(sentences) === JSON.stringify(['at.mp3']),
  JSON.stringify(sentences));

// 3) Tre hurtige spørgsmål i træk — kun det sidste må lyde
reset();
playWordAndSentence('der', () => {});
playWordAndSentence('jeg', () => {});
playWordAndSentence('at', () => {});
made.forEach(a => a.end());
const sents = made.filter(m => m.src.includes('/sentences/')).map(m => m.src.split('/').pop().split('?')[0]);
check('3 hurtige spørgsmål giver kun ÉN sætning (den sidste)', sents.length === 1 && sents[0] === 'at.mp3', JSON.stringify(sents));

// 4) Enkelt-afspilning (sætningsknappen) stopper også det der kører
reset();
playWordAndSentence('at', () => {});
const w = made[0];
playSentenceAudio('der', () => {});
check('sætnings-knappen stopper den kørende lyd', w.paused === true);

// 5) stopAudio rydder alt
reset();
playWordAndSentence('at', () => {});
stopAudio();
const n = made.length;
made[0].end();
check('stopAudio gør at ingen sætning spilles bagefter', made.length === n, made.map(m=>m.src).join(','));

// 6) Hvis MP3-filen mangler: kæden må ikke hænge, og der falder tilbage til tale-syntese
const spoken = global.__spoken;
reset();
spoken.length = 0;
let done = 0;
playWordAndSentence('at', () => { done++; });
check('ord-filen blev oprettet', made.length === 1, made.length);
made[0].onerror();                       // simuler at MP3 ikke kan afspilles
/* RETTET KONTRAKT (Kenneth: "den siger AT men saetningen er DER"):
   Foer kaldte en MP3-fejl videre til naeste led i kaeden OG talte reservestemmen
   oveni — to stemmer samtidigt, saa barnet kunne hoere det forkerte ord.
   Nu: fejler filen, taler reservestemmen ordet ALENE, og kaeden stopper der. */
check('MP3-fejl starter IKKE naeste led i kaeden (ingen to stemmer samtidigt)',
  !made.some(m => m.src.includes('/sentences/at.mp3')), made.map(m=>m.src).join(','));

/* Der oprettes IKKE noget made[1] mere: fejler ord-filen, fortsætter kæden ikke.
   Det er hele pointen med rettelsen — derfor testes der ikke på en sætning her. */
check('der blev ikke oprettet en saetnings-fil efter ord-fejlen',
  made.length === 1, made.map(m=>m.src).join(','));
check('tale-syntese blev brugt som fallback da MP3 fejlede', spoken.includes('SPEAK'), JSON.stringify(spoken));

// 7) "Spiller nu"-animationen må ikke hænge fast når en kæde afbrydes
const sp = { _s:new Set(['speaking']), classList:{ remove(c){ sp._s.delete(c); }, add(c){ sp._s.add(c); }, contains(c){ return sp._s.has(c); } } };
document.querySelectorAll = (sel) => (sel === '.speaking' ? [sp] : []);
playWordAndSentence('der', () => {});
playWordAndSentence('at', () => {});       // afbryder den første
check('"spiller nu"-animationen blev ryddet da kaeden blev afbrudt', !sp._s.has('speaking'), JSON.stringify([...sp._s]));
document.querySelectorAll = () => [];

console.log(F === 0 ? '\\nALLE LYD-TESTS GRØNNE' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
global.__created = created;
try { new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)(); }
catch(e) { console.log('RUNTIME FEJL: ' + e.message); process.exit(1); }