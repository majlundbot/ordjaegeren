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

/* Test-ordet er "kat" og ikke "at": ord på højst 2 bogstaver får SÆTNINGEN først
   (se Docs/lyd-og-udtale.md), og kæde-kontrakten skal kunne testes uden at blande
   den regel ind. Selve reglen er pinnet fast i afsnit 10 nedenfor. */
// 2) KERNEN I FEJLEN: nyt spørgsmål før det gamle er færdigt
reset();
playWordAndSentence('der', () => {});          // spørgsmål N-1 ("der")
const oldWord = made[0];
playWordAndSentence('kat', () => {});         // spørgsmål N ("kat") starter
check('nyt spørgsmål starter sin egen ORD-fil', made.length === 2 && made[1].src.includes('/words/kat.mp3'),
  made.map(m=>m.src).join(','));
check('den gamle lyd blev stoppet', oldWord.paused === true);
const before = made.length;
oldWord.end();                                  // den GAMLE lyd slutter nu (forsinket)
check('den gamle kæde må IKKE fortsætte til sin sætning',
  made.length === before && !made.some(m => m.src.includes('/sentences/der.mp3')),
  made.map(m=>m.src).join(','));
made[1].end();                                  // den NYE lyd slutter
check('den nye kæde fortsætter til SIN sætning (kat)',
  made.length === before + 1 && made[made.length-1].src.includes('/sentences/kat.mp3'),
  made.map(m=>m.src).join(','));
// Rækkefølgen må ikke give "der"-sætningen til "at"-spørgsmålet
const sentences = made.filter(m => m.src.includes('/sentences/')).map(m => m.src.split('/').pop().split('?')[0]);
check('kun ÉN sætning blev spillet, og det er den rigtige', JSON.stringify(sentences) === JSON.stringify(['kat.mp3']),
  JSON.stringify(sentences));

// 3) Tre hurtige spørgsmål i træk — kun det sidste må lyde
reset();
playWordAndSentence('der', () => {});
playWordAndSentence('jeg', () => {});
playWordAndSentence('kat', () => {});
made.forEach(a => a.end());
const sents = made.filter(m => m.src.includes('/sentences/')).map(m => m.src.split('/').pop().split('?')[0]);
check('3 hurtige spørgsmål giver kun ÉN sætning (den sidste)', sents.length === 1 && sents[0] === 'kat.mp3', JSON.stringify(sents));

// 4) Enkelt-afspilning (sætningsknappen) stopper også det der kører
reset();
playWordAndSentence('kat', () => {});
const w = made[0];
playSentenceAudio('der', () => {});
check('sætnings-knappen stopper den kørende lyd', w.paused === true);

// 5) stopAudio rydder alt
reset();
playWordAndSentence('kat', () => {});
stopAudio();
const n = made.length;
made[0].end();
check('stopAudio gør at ingen sætning spilles bagefter', made.length === n, made.map(m=>m.src).join(','));

// 6) Hvis MP3-filen mangler: kæden må ikke hænge, og der falder tilbage til tale-syntese
const spoken = global.__spoken;
reset();
spoken.length = 0;
let done = 0;
playWordAndSentence('kat', () => { done++; });
check('ord-filen blev oprettet', made.length === 1, made.length);
made[0].onerror();                       // simuler at MP3 ikke kan afspilles
/* RETTET KONTRAKT (Kenneth: "den siger AT men saetningen er DER"):
   Foer kaldte en MP3-fejl videre til naeste led i kaeden OG talte reservestemmen
   oveni — to stemmer samtidigt, saa barnet kunne hoere det forkerte ord.
   Nu: fejler filen, taler reservestemmen ordet ALENE, og kaeden stopper der. */
check('MP3-fejl starter IKKE naeste led i kaeden (ingen to stemmer samtidigt)',
  !made.some(m => m.src.includes('/sentences/kat.mp3')), made.map(m=>m.src).join(','));

/* Der oprettes IKKE noget made[1] mere: fejler ord-filen, fortsætter kæden ikke.
   Det er hele pointen med rettelsen — derfor testes der ikke på en sætning her. */
check('der blev ikke oprettet en saetnings-fil efter ord-fejlen',
  made.length === 1, made.map(m=>m.src).join(','));
check('tale-syntese blev brugt som fallback da MP3 fejlede', spoken.includes('SPEAK'), JSON.stringify(spoken));

// 7) "Spiller nu"-animationen må ikke hænge fast når en kæde afbrydes
const sp = { _s:new Set(['speaking']), classList:{ remove(c){ sp._s.delete(c); }, add(c){ sp._s.add(c); }, contains(c){ return sp._s.has(c); } } };
document.querySelectorAll = (sel) => (sel === '.speaking' ? [sp] : []);
playWordAndSentence('der', () => {});
playWordAndSentence('kat', () => {});       // afbryder den første
check('"spiller nu"-animationen blev ryddet da kaeden blev afbrudt', !sp._s.has('speaking'), JSON.stringify([...sp._s]));
document.querySelectorAll = () => [];

console.log('--- 8. Afbrudt lyd maa IKKE tale det FORRIGE ord ---');
/* Kenneth: "den siger 'af', men saetningen er 'der's saetning".
   Bliver en fil stoppet fordi et nyt spoergsmaal overtager, afviser browseren
   play()-kaldet. Tog vi det for en fejl, talte reservestemmen det FORRIGE ord. */
spoken.length = 0;
made.length = 0;
playWordAndSentence('der', () => {});
const afbrudt = made[0];
playWordAndSentence('kat', () => {});        // overtager — den foerste stoppes
const antalEfter = made.length;
if (afbrudt && afbrudt.onerror) afbrudt.onerror();     // simuler afbrydelsen
if (afbrudt && afbrudt.play) afbrudt.play = () => Promise.reject(new Error('AbortError'));
check('afbrudt fil taler IKKE med reservestemmen (ville sige det forrige ord)',
  !spoken.includes('SPEAK'), JSON.stringify(spoken));
check('afbrudt fil fortsaetter IKKE til sin egen saetning',
  !made.some(m => m.src.includes('/sentences/der.mp3')), made.map(m=>m.src).join(','));

console.log('--- 9. Tavshed maa ikke vaere muligt ---');
/* Kenneth: "lyden til af spiller slet ikke". Den vaerste fejl i et lytte-spil er
   at der INTET sker: barnet ved ikke om det hoerte forkert eller spillet er i
   stykker. Nu skal der altid komme en synlig besked. */
check('lydFejl findes', typeof lydFejl === 'function');
const fejlEl = document.getElementById('lydFejl');
fejlEl.textContent = '';
const rigtigPick = pickVoice;
pickVoice = () => null;                       // browseren har INGEN dansk stemme
spoken.length = 0;
made.length = 0;
lydFejl('Lyden kunne ikke hentes');
check('lydFejl skriver en synlig besked', fejlEl.textContent.includes('Lyden kunne ikke hentes'),
  fejlEl.textContent);
check('lydFejl-beskeden bliver gjort synlig (klassen vis)', fejlEl.classList.contains('vis'),
  JSON.stringify([...fejlEl.classList._s || []]));
spoken.length = 0;
lydFejl('ingen dansk stemme');
speak('der');                                  // maa IKKE give tavshed
check('speak uden dansk stemme giver en besked i stedet for tavshed',
  fejlEl.textContent.includes('dansk stemme'), fejlEl.textContent);
check('og den taler ikke med en stemme den ikke har', !spoken.includes('SPEAK'),
  JSON.stringify(spoken));
pickVoice = rigtigPick;

console.log('--- 10. Ord på 2 bogstaver: konteksten skal høres først ---');
/* Kenneth 18. sep: "den siger 'Er, jeg elsker AT spise is'". Et isoleret dansk
   funktionsord er én kort vokal — målt 0,15 s lyd — så barnet gætter forkert.
   Derfor spilles sætningen først for ord på højst 2 bogstaver. */
reset();
playWordAndSentence('at', () => {});
check('2-bogstavs ord: SÆTNINGEN spilles først (konteksten)', made.length === 1 && made[0].src.includes('/sentences/at.mp3'),
  made.map(m=>m.src).join(','));
made[0].end();
check('og bagefter ordet alene som bekræftelse', made.length === 2 && made[1].src.includes('/words/at.mp3'),
  made.map(m=>m.src).join(','));
reset();
playWordAndSentence('kat', () => {});
check('3-bogstavs ord (og længere): ordet spilles først, som før', made.length === 1 && made[0].src.includes('/words/kat.mp3'),
  made.map(m=>m.src).join(','));


console.log(F === 0 ? '\\nALLE LYD-TESTS GRØNNE' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
global.__created = created;
try { new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)(); }
catch(e) { console.log('RUNTIME FEJL: ' + e.message); process.exit(1); }