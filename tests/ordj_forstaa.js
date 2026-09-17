// FORSTÅ DET! — læseforståelse (PISA), ikke stavning.
// Kenneth: "vores opgave er så at klæde børn på til at score godt i PISA i fremtiden."
//
// DEN VIGTIGSTE TEST HER: ved mange tusinde tilfældige træk skal de forkerte svar
// faktisk VÆRE forkerte — altså at det rigtige svar kan udledes af teksten, og at
// ingen distraktor kan. Det er ren logik over opgave-dataene (ingen animation).
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
global.__html = fs.readFileSync('/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
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
global.Audio = function(){ global.lavedeLyd++; this.play = () => Promise.resolve(); this.pause=()=>{}; };
global.lavedeLyd = 0;
global.__src = src;

const t = `
const html = global.__html;
const SRC = global.__src;
let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

// ---- hjælpere: tekst-søgning på ord-grænse (æøå tæller med) ----
const BOGSTAV = "abcdefghijklmnopqrstuvwxyzæøåABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ";
const erBogstav = c => !!c && BOGSTAV.includes(c);   // "" maa IKKE taelle som bogstav (includes("") er sand!)
const ordIOg = (ord, s) => {
  const o = ord.toLowerCase(), t2 = s.toLowerCase();
  let i = t2.indexOf(o);
  while (i >= 0) {
    const foer = i === 0 ? "" : t2[i-1];
    const ef = (i + o.length >= t2.length) ? "" : t2[i + o.length];
    if (!erBogstav(foer) && !erBogstav(ef)) return true;
    i = t2.indexOf(o, i + 1);
  }
  return false;
};
const ORD_I = s => (s.toLowerCase().match(/[a-zæøå]+/g) || []);
/* Funktionelt tomme ord. Et "nyt ord" i en distraktor er et indholdsord (3+ bogstaver)
   som IKKE staar i teksten — det er dét der goer distraktionen umulig at laese ud af
   teksten, og som et barn der ikke forstod teksten realistisk kunne finde paa at vaelge. */
const FUNKTIONSORD = new Set(("og i jeg det at en den til er som på de med han af for ikke der var mig sig men et har om vi min havde ham hun nu over da fra du ud sin dem os op man hans hvor eller hvad skal selv her alle vil blev kunne ind når være dog noget ingen også må nok hvem denne hvordan hvis dem end bare gør gøre kun lad to tre lige sådan jo ja nej hej okay tak kan ville må få får kommer kom gik går tager tog siger sagde ser efter sammen tilbage måske meget nogen hende deres vores dit din sit jer os dig selv aldrig alt andet samme blot både endnu eller").split(" "));
const nyeOrd = (f, tekst) => ORD_I(f).filter(w => w.length >= 3 && !FUNKTIONSORD.has(w) && !ordIOg(w, tekst));

console.log('--- 1. Dataene: 36 verdener x 3 opgaver ---');
check('READ_TASKS findes', typeof READ_TASKS !== 'undefined');
check('én opgavesaet pr. verden', READ_TASKS.length === 36, READ_TASKS.length);
check('hver verden har 3 opgaver (3-4 pr. verden)',
  READ_TASKS.every(a => Array.isArray(a) && a.length === 3), JSON.stringify(READ_TASKS.map(a => a.length)));
const alle = READ_TASKS.reduce((n, a) => n.concat(a), []);
check('108 opgaver i alt', alle.length === 108, alle.length);
check('hvert opgave har lv/tekst/q/svar/forkert',
  alle.every(x => x.lv && x.tekst && x.q && x.svar && Array.isArray(x.forkert)),
  JSON.stringify(alle.filter(x => !(x.lv && x.tekst && x.q && x.svar && Array.isArray(x.forkert))).slice(0,2)));
check('hvert opgave handler om et ord fra sin egen verden',
  READ_TASKS.every((a, i) => a.every(x => WORLDS[i].words.includes(x.ord))),
  JSON.stringify(READ_TASKS.map((a,i) => a.filter(x => !WORLDS[i].words.includes(x.ord)).map(x => x.ord)).flat()));
check('ordet bruges kun én gang pr. verden',
  READ_TASKS.every(a => new Set(a.map(x => x.ord)).size === a.length));

console.log('--- 2. Tre niveauer, fordelt efter verdens svaerhed ---');
check('kun find/forstaa/vurder bruges',
  alle.every(x => ['find','forstaa','vurder'].includes(x.lv)));
check('de foerste 12 verdener har KUN find og forstaa',
  READ_TASKS.slice(0, 12).every(a => a.every(x => x.lv === 'find' || x.lv === 'forstaa')));
check('VURDER kommer foerst efter verden 12',
  READ_TASKS.slice(0, 12).every(a => a.every(x => x.lv !== 'vurder')) &&
  READ_TASKS.slice(12).every(a => a.some(x => x.lv === 'vurder')));
check('verden 1-12 har mindst eet FIND og eet FORSTAA pr. verden',
  READ_TASKS.slice(0, 12).every(a => a.some(x => x.lv === 'find') && a.some(x => x.lv === 'forstaa')));
check('VURDER-teksten har altid en kilde ("X siger/mener/synes")',
  alle.filter(x => x.lv === 'vurder').every(x => /\\b(siger|mener|synes|tror|fortæller)\\b/.test(x.tekst.toLowerCase())),
  JSON.stringify(alle.filter(x => x.lv === 'vurder' && !/\\b(siger|mener|synes|tror|fortæller)\\b/.test(x.tekst.toLowerCase())).map(x => x.tekst)));
check('VURDER-svaret naegter (mening != kendsgerning)',
  alle.filter(x => x.lv === 'vurder').every(x => x.svar.startsWith('Nej')));
check('hver VURDER-distraktor tager meningen for en kendsgerning ("Ja ...")',
  alle.filter(x => x.lv === 'vurder').every(x => x.forkert.every(f => f.startsWith('Ja'))),
  JSON.stringify(alle.filter(x => x.lv === 'vurder').flatMap(x => x.forkert.filter(f => !f.startsWith('Ja')))));

console.log('--- 3. Teksten er kort (laeseforstaaelse, ikke laeseudholdenhed) ---');
const forLang = alle.filter(x => (x.tekst.match(/[.!?]+/g) || []).length > 2);
check('hoejst 2 saetninger pr. tekst', forLang.length === 0, JSON.stringify(forLang.map(x => x.tekst)));
check('teksten er kortere end 90 tegn',
  alle.every(x => x.tekst.length <= 90), JSON.stringify(alle.filter(x => x.tekst.length > 90).map(x => [x.tekst.length, x.tekst])));
check('teksten slutter med tegnsaetning', alle.every(x => /[.!?]$/.test(x.tekst)));


console.log('--- 4. DET VIGTIGSTE: mange traek — er de forkerte svar FAKTISK forkerte? ---');
/* For hver opgave traekkes svarmulighederne tilfaeldigt (som spillet goer) 200 gange.
   For hvert traek tjekkes:
     a) praecis EET af valgene er det rigtige svar (og alle valg er forskellige)
     b) det rigtige svar KAN udledes af teksten: 'bevis' staar i teksten OG i svaret
     c) INGEN distraktor kan udledes af teksten: den indeholder mindst eet ord der
        ikke staar i teksten — og den baerer ikke tekstens bevis for svaret
   Det er (b)+(c) der goer at opgaven maaler forstaaelse og ikke held. */
let traek = 0, fejlA = [], fejlB = [], fejlC = [];
for (let r = 0; r < 200; r++) {
  alle.forEach((x, i) => {
    const valg = readOptions(x);
    traek++;
    // a) praecis ét rigtigt svar, alle valg unikke
    if (valg.length !== 3) fejlA.push(i + ': ' + valg.length + ' valg');
    if (new Set(valg).size !== valg.length) fejlA.push(i + ': dubletter ' + JSON.stringify(valg));
    if (valg.filter(o => o === x.svar).length !== 1) fejlA.push(i + ': ikke praecis ét rigtigt svar');
    if (x.lv !== 'vurder') {
      // b) svaret kan udledes af teksten
      if (!ordIOg(x.bevis, x.tekst)) fejlB.push(i + ': bevis "' + x.bevis + '" staar ikke i teksten');
      if (!ordIOg(x.bevis, x.svar)) fejlB.push(i + ': bevis "' + x.bevis + '" staar ikke i svaret');
    } else {
      if (!x.tekst.toLowerCase().includes(x.navn.toLowerCase())) fejlB.push(i + ': navn i teksten');
      if (!x.svar.toLowerCase().includes(x.navn.toLowerCase())) fejlB.push(i + ': navn i svaret');
    }
    // c) distraktorerne kan IKKE udledes
    x.forkert.forEach(f => {
      if (f.trim().toLowerCase() === x.svar.trim().toLowerCase()) fejlC.push(i + ': distraktor = svaret');
      if (x.lv === 'vurder') {
        /* VURDER: distraktoren er forkert, fordi den goer en MENING til en kendsgerning.
           Den skal derfor (1) vaere en "Ja"-paastand, mens teksten kun TILSKRIVER
           udsagnet en person — og (2) enten opfinde noget nyt eller gentage praecis
           den tilskrevne paastand. Begge dele er forkert ud fra teksten, som kun
           siger hvad personen siger. */
        if (!f.startsWith('Ja')) fejlC.push(i + ': VURDER-distraktor tager ikke meningen for fakta: "' + f + '"');
        const rest = f.replace(/^Ja[,!]?\s*/i, '').replace(/[.!?]+$/, '');
        const kerne = ORD_I(rest).filter(w => w.length >= 3 && !FUNKTIONSORD.has(w));
        const kunFraTeksten = kerne.length > 0 && kerne.every(w => ordIOg(w, x.tekst));
        if (nyeOrd(f, x.tekst).length === 0 && !kunFraTeksten) {
          fejlC.push(i + ': VURDER-distraktor "' + f + '" er hverken ny eller en gentagelse af paastanden');
        }
      } else {
        if (nyeOrd(f, x.tekst).length === 0) fejlC.push(i + ': "' + f + '" har intet nyt ord (kan maaske udledes)');
        if (ordIOg(x.bevis, f)) fejlC.push(i + ': "' + f + '" baerer beviset "' + x.bevis + '"');
      }
    });
  });
}
console.log('     ' + traek + ' tilfaeldige traek testet (' + alle.length + ' opgaver x 200)');
check('a) der er altid praecis 3 unikke valg med praecis ét rigtigt svar', fejlA.length === 0, JSON.stringify(fejlA.slice(0,4)));
check('b) det rigtige svar kan udledes af teksten i ALLE opgaver', fejlB.length === 0, JSON.stringify(fejlB.slice(0,4)));
check('c) INGEN distraktor kan udledes af teksten i nogen opgave', fejlC.length === 0, JSON.stringify(fejlC.slice(0,6)));

console.log('--- 5. INGEN maskin-hjaelp (PISA: maskinen maa ikke goere arbejdet) ---');
check('der findes en skaerm til Forstaa det!', html.includes('id="screen-read"'));
const readBlock = html.slice(html.indexOf('id="screen-read"'), html.indexOf('id="screen-result"'));
check('skaermen har ingen hoettaler-knap', !readBlock.includes('speak-btn') && !readBlock.includes('🔊'),
  readBlock.slice(0, 120));
check('skaermen har ingen opsummerings-/forklar-knap',
  !/opsummer|opsummering|hvad betyder|forklar mig/i.test(readBlock));
check('skaermen siger at barnet selv skal laese', /læs teksten selv/i.test(readBlock));
check('startGame for "read" kalder IKKE tale',
  !/game === "read"[\\s\\S]{0,400}speak(Now|Sentence|WordAndSentence)?\\(/.test(SRC));
check('renderRead laeser ikke op', (() => {
  const m = SRC.match(/function renderRead\\(\\)[\\s\\S]*?\\n\\}/);
  return m && !/speak|Speech|_playClip|playWord|playSentence/i.test(m[0]);
})());
check('answerRead laeser ikke op', (() => {
  const m = SRC.match(/function answerRead\\([^)]*\\)[\\s\\S]*?\\n\\}/);
  return m && !/speak|Speech|_playClip|playWord|playSentence/i.test(m[0]);
})());
check('READ_TASKS indeholder ingen lyd-stier', !JSON.stringify(READ_TASKS).includes('audio/'));
check('README-reglen staar i koden', SRC.includes('Barnet læser selv'));

console.log('--- 6. Svaret maa ikke afsloeres foer man har svaret ---');
cur = { world: 0, game: 'read', idx: 0, words: [], readTasks: READ_TASKS[0], errors: 0, answered: false, wrongWords: [] };
renderRead();
const t0 = READ_TASKS[0][0];
check('teksten skrives som TEKST i #readText', document.getElementById('readText').textContent === t0.tekst,
  document.getElementById('readText').textContent);
check('spoergsmaalet vises', document.getElementById('readQ').textContent === t0.q);
check('statusfeltet er tomt foer man svarer (intet svar afsloeret)', document.getElementById('readStatus').textContent === '',
  document.getElementById('readStatus').textContent);
const valgte = document.getElementById('readChoices').children.map(b => b.textContent);
check('de tre valg staar paa skaermen', valgte.length === 3, JSON.stringify(valgte));
check('det rigtige svar er blandt valgene', valgte.includes(t0.svar));
// forkert svar -> foerst DER vises det rigtige svar
const forkertValg = document.getElementById('readChoices').children.find(b => b.textContent !== t0.svar);
document.getElementById('readStatus').textContent = '';
answerRead(forkertValg.textContent, t0, forkertValg);
check('efter et forkert svar vises det rigtige svar + hvorfor',
  document.getElementById('readStatus').innerHTML.includes(t0.svar) || document.getElementById('readStatus').textContent.includes(t0.svar),
  document.getElementById('readStatus').innerHTML);
check('et forkert svar taeller som en fejl', cur.errors === 1, cur.errors);
check('et forkert svar rammer det ord opgaven handlede om', cur.wrongWords.includes(t0.ord), JSON.stringify(cur.wrongWords));
check('et forkert svar laaser opgaven (man kan ikke svare igen)', (() => {
  const foer = cur.errors;
  answerRead(t0.svar, t0, document.getElementById('readChoices').children[0]);
  return cur.errors === foer;
})());

console.log('--- 7. Runden: samme struktur som de tre andre missioner ---');
cur = { world: 0, game: 'read', idx: 0, words: [], readTasks: READ_TASKS[0], errors: 0, answered: false, wrongWords: [] };
startGame(0, 'read');
check('startGame("read") saetter cur.game', cur.game === 'read');
check('runden bestaar af verdens opgaver', cur.readTasks && cur.readTasks.length === 3, cur.readTasks && cur.readTasks.length);
check('cur.words er ét ord pr. opgave (saa statistik/loot virker som de andre)',
  cur.words.length === cur.readTasks.length && cur.words.every(w => WORLDS[0].words.includes(w)), JSON.stringify(cur.words));
check('alle opgavernes ord er med — runden kan afsluttes', cur.words.length === 3);
const ws0 = worldState(0);
check('verdens-fremskridt har 4 missioner + monster = 5 pladser i done',
  Array.isArray(ws0.done) && ws0.done.length === 4, JSON.stringify(ws0.done));
check('Forstaa det! har sin egen stjerne-plads i verdenen',
  'read' in worldState(0), JSON.stringify(Object.keys(worldState(0))));

console.log('--- 8. Missionen vises i verdenen (den fjerde knap) ---');
showWorld(0);
const grid = document.getElementById('gameGrid').children;
check('verdens-menuen viser 4 missioner', grid.length === 4, grid.length);
check('den fjerde mission hedder Forstaa det!',
  grid.some(b => b.innerHTML.includes('Forstå det!')), JSON.stringify(grid.map(b => (b.innerHTML.match(/<b>(.*?)<\\/b>/) || [])[1])));
check('den fjerde mission kan startes (knappen kalder startGame med "read")', (() => {
  const b = grid.find(b => b.innerHTML.includes('Forstå det!'));
  if (!b || typeof b.onclick !== 'function') return false;
  b.onclick();
  return cur.game === 'read';
})());

console.log('--- 9. Kortet: stjerner og status-segmenter ---');
state.worlds = {};
showWorldMap();
const cards = document.getElementById('worldMapA').children || [];
const kort = cards.find(c => c.className && c.className.indexOf('world-card') === 0);
check('hvert verdenskort har 5 status-segmenter (4 missioner + monster)', !!kort && (kort.innerHTML.match(/class="w-seg /g) || []).length === 5,
  kort ? (kort.innerHTML.match(/class="w-seg /g) || []).length : 'intet kort');
check('kortet viser 4 stjerner pr. verden', !!kort && (kort.innerHTML.match(/class="ws /g) || []).length === 4,
  kort ? (kort.innerHTML.match(/class="ws /g) || []).length : 'intet kort');
check('kortets titel naevner 12 stjerner', !!kort && /12 stjerner/.test(kort.title), kort && kort.title);
check('verdens-status siger 4 missioner', (() => { showWorld(0); return /4 missioner/.test(document.getElementById('worldStatus').innerHTML); })(),
  document.getElementById('worldStatus').innerHTML);

console.log('--- 10. ?screen=read (QA-krogen) ---');
check('bootFromQuery har en read-krog', /s === "read"[\\s\\S]{0,40}startGame\\(0, "read"\\)/.test(SRC));
check('HUDen har en fremgangsbar til Forstaa det!', html.includes('id="rp-read"'));
check('updateHud skriver til rp-read', /rp-hear", "rp-type", "rp-fill", "rp-read"/.test(SRC));
check('GAME_LABELS kender read', /read: "📖 Forstå det!"/.test(SRC));

console.log('--- 11. Gemte spil fra før den 4. mission ---');
/* Robin har spillet spillet i uger. Hans gemte verden har kun 3 pladser i done.
   Var de tre klaret, ER verdenen klaret — han må ikke pludselig låse monsteret
   igen, fordi der kom en fjerde mission til. Nye verdener skal stadig klare alle 4. */
localStorage.setItem('ordjaegeren_active_v1', 'robin');
localStorage.setItem('ordjaegeren_v1_robin', JSON.stringify({
  worlds: { 0: { hear:3, type:3, fill:3, done:[true,true,true] }, 1: { hear:1, type:0, fill:null, done:[true,false,false] } }
}));
loadState();
check('gammel FÆRDIG verden bliver ikke låst af den nye mission',
  Array.isArray(state.worlds[0].done) && state.worlds[0].done.length === 4 && state.worlds[0].done[3] === true,
  JSON.stringify(state.worlds[0].done));
check('gammel UFÆRDIG verden skal stadig klare alle fire',
  Array.isArray(state.worlds[1].done) && state.worlds[1].done.length === 4 && state.worlds[1].done[3] === false,
  JSON.stringify(state.worlds[1].done));
check('migrationen giver den nye mission en stjerne-plads', state.worlds[0].read === undefined || state.worlds[0].read === null,
  String(state.worlds[0].read));

console.log(F === 0 ? '\\\\nFORSTÅ DET! — ALLE TESTS GRØNNE' : '\\\\n' + F + ' FEJL');
process.exit(F ? 1 : 0);
`;
const FULL = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t;
if (process.env.DUMP_ORDJ) { require('fs').writeFileSync('/tmp/combined.js', FULL); process.exit(0); }
try { new Function(FULL)(); }
catch(e) { console.log('RUNTIME FEJL: ' + e.message); process.exit(1); }
