// QOL: fremgang i runden, mute-knap, stoerre trykflade.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__html = fs.readFileSync('/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
// Element-stub der HUSKER innerHTML — saa vi kan se hvad der blev tegnet
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c,f){ f?this._s.add(c):this._s.delete(c); }, contains(c){return this._s.has(c);} },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0 });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.global.lavedeLyd = 0;
global.Audio = function(){ global.lavedeLyd++; this.play = () => Promise.resolve(); this.pause=()=>{}; };

const t = `
const html = global.__html;
const fs = { readFileSync: () => global.__html };
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

console.log('--- 1. Fremgang i runden (barnet skal se hvor langt det er) ---');
check('updateHud findes', typeof updateHud === 'function');
check('toggleMute findes', typeof toggleMute === 'function');
cur = { idx: 0, words: ['der','at','af','er','jeg','det','du','ikke','en','og'], world: 0 };
updateHud();
const rp = document.getElementById('rp-hear').innerHTML;
check('fremgangen skrives ind i Hør & Slå', rp.includes('Ord 1 af 10'), rp.slice(0, 80));
check('fremgangen skrives ind i Skriv', document.getElementById('rp-type').innerHTML.includes('Ord 1 af 10'));
check('fremgangen skrives ind i Udfyld', document.getElementById('rp-fill').innerHTML.includes('Ord 1 af 10'));
check('baeren er 0 % ved foerste ord', rp.includes('width:0%'), rp);
cur.idx = 5;
updateHud();
const rp5 = document.getElementById('rp-hear').innerHTML;
check('ved ord 6 af 10 staar der "Ord 6 af 10"', rp5.includes('Ord 6 af 10'), rp5.slice(0, 60));
check('baeren er 50 % naar man er halvvejs', rp5.includes('width:50%'), rp5);
cur.idx = 9; updateHud();
check('ved sidste ord er baeren 90 %', document.getElementById('rp-hear').innerHTML.includes('width:90%'));

console.log('--- 2. Mute-knap ---');
check('muted er slaaet FRA fra start', muted === false, String(muted));
toggleMute();
check('toggleMute slår lyden fra', muted === true, String(muted));
check('valget huskes (localStorage)', localStorage.getItem('ordj_muted') === '1', String(localStorage.getItem('ordj_muted')));
check('knappen viser at lyden er slaaet fra', document.getElementById('muteBtn').textContent === '🔇',
  document.getElementById('muteBtn').textContent);
toggleMute();
check('toggleMute slår lyden til igen', muted === false);
check('knappen viser hoejttaleren igen', document.getElementById('muteBtn').textContent === '🔊',
  document.getElementById('muteBtn').textContent);

console.log('--- 3. Mute maa ikke stoppe SPILLET ---');
global.lavedeLyd = 0;
toggleMute();                       // slaa fra
let kaldt = 0;
_playClip('audio/words/der.mp3', 'der', () => { kaldt++; }, true);
check('ingen lydfil oprettes naar lyden er slaaet fra', global.lavedeLyd === 0, String(global.lavedeLyd));
check('men kæden kalder videre, saa spillet ikke går i stå', kaldt === 1, String(kaldt));
let beepKaldt = 0;
const gammelAC = global.AudioContext;
global.AudioContext = function(){ beepKaldt++; };
beep(440, .1, 'sine', .2);
check('effekt-lyde er tavse naar lyden er slaaet fra', beepKaldt === 0, String(beepKaldt));
global.AudioContext = gammelAC;
let taleKaldt = 0;
const gammelSpeak = global.speechSynthesis.speak;
global.speechSynthesis.speak = () => { taleKaldt++; };
speak('der');
check('tale-syntesen er tavs naar lyden er slaaet fra', taleKaldt === 0, String(taleKaldt));
global.speechSynthesis.speak = gammelSpeak;
toggleMute();                       // slaa til igen
global.lavedeLyd = 0;
_playClip('audio/words/der.mp3', 'der', () => {}, true);
check('med lyden slaaet TIL oprettes filen igen', global.lavedeLyd === 1, String(global.lavedeLyd));

console.log('--- 4. Stoerre trykflade + markup ---');
check('HUD har en mute-knap', html.includes('id="muteBtn"'));
check('de tre spil har hver sin fremgangsbar',
  ['rp-hear','rp-type','rp-fill'].every(id => html.includes('id="' + id + '"')));
const m = html.match(/\\.speak-btn \\{[^}]*width: (\\d+)px; height: (\\d+)px/);
check('tale-knappen er mindst 110px (stoerre at ramme paa iPad)',
  m && Number(m[1]) >= 110 && Number(m[2]) >= 110, m ? m[1] + 'x' + m[2] : 'fandt ikke CSS');
check('der staar HØR IGEN under knappen', html.includes('HØR IGEN'));

console.log('--- 5. Svarmuligheder maa ikke kunne forveksles (Kenneths fejl) ---');
check('lydKlasse findes', typeof lydKlasse === 'function');
check('at og er er i SAMME lydklasse (de forveksles)',
  lydKlasse('at') === lydKlasse('er'), lydKlasse('at') + ' / ' + lydKlasse('er'));
check('der og er er i samme klasse', lydKlasse('der') === lydKlasse('er'));
check('af og er er i samme klasse', lydKlasse('af') === lydKlasse('er'));
check('af og at er i samme klasse', lydKlasse('af') === lydKlasse('at'));
let daarlige = 0, forFaa = 0;
for (const svar of ['at', 'er', 'af', 'der', 'det', 'de', 'du', 'i', 'og']) {
  const min = lydKlasse(svar);
  for (let i = 0; i < 200; i++) {
    const valg = distractors(svar, 3);
    if (valg.length !== 4) forFaa++;
    // Det RIGTIGE ord er selvfoelgelig blandt valgene - kun DISTRAKTORERNE tjekkes
    if (valg.some(w => w !== svar && lydKlasse(w) === min)) daarlige++;
  }
}
console.log('     1800 tilfaeldige sporgsmaal testet');
check('INGEN sporgsmaal tilbyder et forveksleligt ord som svar', daarlige === 0, daarlige + ' darlige');
check('der er altid praecis 4 svarmuligheder', forFaa === 0, forFaa);
check('det rigtige ord er altid med blandt valgene',
  distractors('at', 3).includes('at') && distractors('er', 3).includes('er'));

console.log(F === 0 ? '\\nALLE QOL-TESTS GRØNNE' : '\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
try { new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)(); }
catch(e) { console.log('RUNTIME FEJL: ' + e.message); process.exit(1); }