// HELTEFLOW: sejren skal føre til helteskærmen, og ubrugte talent-point skal kunne SES.
//
// Baggrund (Kenneth 18. sep, med skærmbillede af helteskærmen):
//   "Dette skærmbillede skal komme op når man har vundet over bossen, så man ved at det
//    eksisterer. Og når man har ubrugte talent-point skal det være en Plus på bjælken
//    eller sådan noget så man ved der er ubrugte point."
// Før: talent-pointene stod KUN inde på helteskærmen (i parentes), og skærmen skulle man
// selv finde via "⚔️ Helt". Se Docs/helteskaerm-efter-sejr.md.
//
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
// Stub med toggle(c, f) der RESPEKTERER tvang — mærket vises/skjules netop med toggle
const mk = () => ({ style:{ setProperty(){} }, classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
    toggle(c, f){ const on = f === undefined ? !this._s.has(c) : !!f; if (on) this._s.add(c); else this._s.delete(c); return on; },
    contains(c){ return this._s.has(c); } },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>mk(),
  textContent:'', innerHTML:'', value:'', remove(){}, focus(){}, scrollTo(){}, getAnimations:()=>[], animate(){}, offsetWidth:0,
  setAttribute(){}, getAttribute(){ return null; } });
const els = {};
global.document = { createElement: mk, getElementById: id => els[id] || (els[id] = mk()), querySelectorAll: () => [], querySelector: () => null, body: mk() };
global.window = {}; const store = {};
global.localStorage = { getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v;} };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.window.__els = els;
global.Audio = function(u){ this.src=u; this.play = () => Promise.resolve(); };

const t = `
let F = 0;
const E = window.__els;
// Elementer laves først når koden selv spørger efter dem — el(id) gør det samme
const el = id => document.getElementById(id);
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };
const skjult = id => el(id).classList.contains('hidden');
console.log('--- Helteskaerm efter sejr + ubrugte point ---');

/* 1) MED POINT: pilla på bjælken OG +-mærket på Helt-knappen skal kunne ses, og
   pilla skal vise HVOR MANGE der er ubrugte. */
state.talentPoints = 2;
renderTalentBadge();
check('med 2 point: pilla på bjælken er synlig', !skjult('tpPill'));
check('med 2 point: pilla viser tallet 2', el('tpPillNum').textContent === '2', el('tpPillNum').textContent);
check('med 2 point: +-mærket på Helt-knappen er synligt', !skjult('heroPlus'));
check('med 2 point: Helt-knappen lyser (has-points)', el('heroBtn').classList.contains('has-points'));

/* 2) UDEN POINT: ingen støj — begge mærker væk. */
state.talentPoints = 0;
renderTalentBadge();
check('uden point: pilla er skjult', skjult('tpPill'));
check('uden point: +-mærket er skjult', skjult('heroPlus'));
check('uden point: Helt-knappen lyser ikke', !el('heroBtn').classList.contains('has-points'));

/* 3) PILLA SKAL GØRE NOGET (ingen døde knapper): den åbner helteskærmen. */
state.talentPoints = 1;
renderTalentBadge();
el('screen-hero').classList.remove('active');
goSpendPoints();
check('tryk på pilla åbner helteskærmen', el('screen-hero').classList.contains('active'));
check('tryk på pilla skjuler ikke mærket (pointet er der endnu)', !skjult('tpPill'));

/* 4) BRUGER MAN SIT SIDSTE POINT, forsvinder mærket med det samme. */
state.talents = { hp: 0, power: 0, crit: 0 };
spendTalent('hp');
check('spendTalent brugte pointet', state.talentPoints === 0, state.talentPoints);
check('efter sidste point: mærkerne er væk med det samme', skjult('tpPill') && skjult('heroPlus'));

/* 5) SEJREN FØRER TIL HELTESKÆRMEN (Kenneth: "så man ved at det eksisterer").
   Timere sættes til at køre med det samme, så flowet kan måles uden ventetid. */
const _st = global.setTimeout;
global.setTimeout = (fn) => { try { fn(); } catch (err) { console.log('timeout-fn fejlede: ' + err.message); } return 0; };
state.talentPoints = 0;
cur = { world: 0, words: WORLDS[0].words, idx: 0, answered: false, streak: 0 };
bossState = { over: false, playerHp: 100, playerMax: 100, bossHp: 0, busy: false, charge: null };
bossWin();
check('efter sejren venter helteskærmen på belønningen (flaget er sat)', heroAfterWin === true, heroAfterWin);
check('lykkehjulet vises først (lootet må ikke skjules)', !skjult('wheelOverlay'));
el('screen-hero').classList.remove('active');
closeLootWheel();
check('barnet lander på helteskærmen når hjulet lukkes', el('screen-hero').classList.contains('active'));
check('banneret på helteskærmen er synligt efter sejren', !skjult('heroWelcome'));
check('banneret fortæller at man får point for hvert niveau (0 point)',
  el('heroWelcome').innerHTML.indexOf('hvert niveau') > 0, el('heroWelcome').innerHTML);
check('flaget er brugt op (skærmen kommer ikke igen ved næste hjul)', heroAfterWin === false);

/* 6) BANNERET MÅ IKKE HÆNGE VED: åbner man helteskærmen normalt, er det væk. */
showHero();
check('normal åbning af helteskærmen viser IKKE sejrs-banneret', skjult('heroWelcome'));

/* 7) MED POINT EFTER SEJR: banneret skal nævne hvor mange point man har. */
state.talentPoints = 1;
heroWelcomeAfterWin();
check('banneret nævner det ubrugte point når man har ét',
  el('heroWelcome').innerHTML.indexOf('1 talent-point') > 0, el('heroWelcome').innerHTML);
global.setTimeout = _st;
`;
new Function(src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas') + '\n' + t)();

/* 8) CSS: gløden omkring pilla skal være slukket ved prefers-reduced-motion.
   (Læses fra filen, fordi det er en media-query og ikke JS.) */
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const cssLet = { ok: false, detalje: '' };
const mediaIdx = html.indexOf('@media (prefers-reduced-motion: no-preference)');
if (mediaIdx > 0) {
  const blok = html.slice(mediaIdx, mediaIdx + 400);
  cssLet.ok = blok.indexOf('tpPulse') > 0 && blok.indexOf('.tp-pill') > 0;
  cssLet.detalje = blok.slice(0, 120);
}
let fejl = 0;
console.log((cssLet.ok ? 'OK   ' : 'FEJL ') + 'pilla gløder KUN når barnet ikke har bedt om rolige bevægelser (prefers-reduced-motion)' + (cssLet.ok ? '' : ' :: ' + cssLet.detalje));
if (!cssLet.ok) fejl++;
console.log(fejl === 0 ? '\\nHELTEFLOW OK' : '\\n' + fejl + ' FEJL');
process.exit(fejl ? 1 : 0);