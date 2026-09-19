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
// index.html selv, så tema-checks (afsnit 13) læser den RIGTIGE fil — ikke en tom streng
global.__html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

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
/* 12) DØD-ENDE-VÆRN: har man point, men ALLE tre grene er fyldt op, må mærket ikke
   love noget der ikke kan bruges (Kenneths regel: ingen døde knapper). */
state.talentPoints = 3;
state.talents = { hp: 5, power: 5, crit: 5 };     // alle grene på max
renderTalentBadge();
check('alle grene fyldt op: mærkerne vises ikke (der er intet at bruge pointene på)',
  skjult('tpPill') && skjult('heroPlus'));
heroWelcomeAfterWin();
check('alle grene fyldt op: banneret siger det højt i stedet for at love en opgradering',
  el('heroWelcome').innerHTML.indexOf('fyldt op') > 0, el('heroWelcome').innerHTML);
state.talents = { hp: 4, power: 5, crit: 5 };     // én gren har plads
renderTalentBadge();
check('én gren med plads: mærket er tilbage', !skjult('tpPill'));
state.talents = { hp: 0, power: 0, crit: 0 };
state.talentPoints = 0;
renderTalentBadge();

/* 13) TEMA-KONSISTENS: siden hedder Den forbudte skov (18. sep). Den gamle
   Ord-akademi-tekst må ikke ligge tilbage i det barnet kan læse. */
const html2 = global.__html || '';
[['7 % fra akademi-monstre', 'skatte-tavlens tekst'],
 ['akademi-monstre (verden 13-24)', 'skattekortets forklaring'],
 ['Akademi-monstre kan droppe', 'sejrs-beskeden'],
 ['Akademi-kronen', 'item-navnet'],
 ['Akademi-mester', 'bedrifts-navnet']].forEach(([tekst, hvor]) => {
  check('gammel akademi-tekst er væk fra ' + hvor + ' ("' + tekst + '")', html2.indexOf(tekst) < 0);
});

global.setTimeout = _st;
/* ============ GENVEJ TIL VERDENERNE (Kenneth 18. sep, efter Robins spil) ============
   "Når Robin har været i helte skærmen går han helt ude i hovede menuen og derved ind i
    verden igen. Der skal være en genvej fra Helteskærm og tilbage til verdernerne."
   Udgangen FANDTES — men i bunden af en lang skærm, så Robin brugte 🏠 Hjem i stedet og
   endte i hovedmenuen. Testene her fanger BÅDE at genvejen findes og at den ligger i toppen,
   og at den fører tilbage til DEN verden man kom fra. */
console.log('--- Genvej til verdenerne ---');

check('helteskærmen har en genvej i toppen (Til verdenerne)', global.__html.includes('onclick="lukHero()"'),
  'genvejen mangler i markup');
const hIHero = global.__html.slice(global.__html.indexOf('id="screen-hero"'),
                                  global.__html.indexOf('id="screen-achieve"'));
const iGenvej = hIHero.indexOf('onclick="lukHero()"');
const iLangtIndhold = hIHero.indexOf('Udstyret gear');
check('genvejen staar FOER det lange indhold (ellers er den lige så gemt som den gamle)',
  iGenvej > -1 && iLangtIndhold > -1 && iGenvej < iLangtIndhold, 'genvej@' + iGenvej + ' indhold@' + iLangtIndhold);
const iOverskrift = hIHero.indexOf('Din ordjæger-helt');
check('genvejen staar lige under overskriften', iOverskrift > -1 && iGenvej - iOverskrift < 400,
  'afstand=' + (iGenvej - iOverskrift));
check('etiketten er kort nok til et barn (hoejst 20 tegn)',
  /Til verdenerne/.test(global.__html) && 'Til verdenerne'.length <= 20);

// --- hvor FOERER den hen? Spioner på begge destinationer ---
{
  const gammelWorld = showWorld, gammelKort = showWorldMap;
  const kaldt = [];
  showWorld = i => kaldt.push('verden:' + i);
  showWorldMap = () => kaldt.push('kort');
  try {
    // 1) kommet fra verden 6 (0-baseret indeks 6 = Verden 7)
    cur.world = 6;
    showHero('screen-world');
    lukHero();
    check('kom man fra en verden, foerer genvejen til DEN verden (indeks 6)',
      kaldt.length === 1 && kaldt[0] === 'verden:6', kaldt.join(',')); 
    // 2) kommet fra en mission i verden 2
    kaldt.length = 0; cur.world = 2;
    showHero('screen-boss'); lukHero();
    check('kom man fra en mission, foerer genvejen til den verden missionen var i',
      kaldt[0] === 'verden:2', kaldt.join(','));
    // 3) kommet fra startskærmen
    kaldt.length = 0;
    showHero('screen-start'); lukHero();
    check('kom man fra startskærmen, foerer genvejen til verdenskortet', kaldt[0] === 'kort', kaldt.join(','));
    // 4) ukendt oprindelse (fx HUD-knappen uden kendt skaerm): kortet
    kaldt.length = 0;
    showHero(); lukHero();
    check('uden kendt oprindelse foerer genvejen til verdenskortet', kaldt[0] === 'kort', kaldt.join(','));
    // 5) den gamle udgang i bunden virker stadig
    kaldt.length = 0;
    showWorldMap();
    check('den gamle udgang i bunden (Tilbage til kortet) er uændret', kaldt[0] === 'kort', kaldt.join(','));
  } finally { showWorld = gammelWorld; showWorldMap = gammelKort; }
}

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