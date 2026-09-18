// VERDENER + QOL — temaet skal kunne SES, og barnet skal se hvem der venter.
// Baggrund (Kenneth, 17. sep om aftenen): "vores første verden galaksen er rigtig god …
// de andre 2 er ikke gennemtænkt og virker alt for AI agtigt. Et andet tema kunne være
// Underverdenen" + "gerne kig igennem med QOL forbedringer. Det er så vigtigt i spil."
// Derfor maaler denne pakke:
//   1) hver kort-side har sin EGEN verden (tema, historie og baggrund — ikke bare et navn)
//   2) monstrene passer til sidens tema (hverdagsting der lever · underverdenens skabninger)
//   3) barnet ser HVILKEN skabning der venter, FOER kampen (verdensskærmen)
//   4) "Parér" siger selv hvornaar den er til noget (et blindt tryk kostede liv)
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const htmlSrc = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
const cssSrc = (htmlSrc.match(/<style>([\s\S]*?)<\/style>/) || [,''])[1];

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => ({ style:{ _p:{}, setProperty(k,v){ this._p[k]=v; }, removeProperty(){}, getPropertyValue(){return '';}, display:'', width:'', transition:'' },
  classList:{ _s:new Set(), add(...c){ c.forEach(x=>this._s.add(x)); }, remove(...c){ c.forEach(x=>this._s.delete(x)); },
              toggle(c,f){ const has=this._s.has(c); const on=(f===undefined)?!has:!!f; if(on)this._s.add(c); else this._s.delete(c); return on; },
              contains(c){ return this._s.has(c); } },
  children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, blur(){}, setSelectionRange(){},
  value:'', textContent:'', disabled:false, title:'', onclick:null, querySelectorAll:()=>[], querySelector:()=>mk(),
  scrollTo(){}, getAnimations:()=>[], animate(){}, remove(){}, offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0,
  getBoundingClientRect: () => ({ left:100, top:100, width:120, height:140 }) });
const els = {}; global.__els = els;
const MAP_IDS = ['worldMapA','worldMapB','worldMapC'];
global.document = {
  createElement: () => mk(),
  getElementById: id => els[id] || (els[id] = mk()),
  querySelectorAll: sel => {
    if (sel.includes('.screen')) return ['screen-map','screen-world','screen-boss'].map(id => els[id] || (els[id] = mk()));
    if (sel.includes('.world-card')) return MAP_IDS.flatMap(id => (els[id] || (els[id] = mk())).children);
    return [];
  },
  querySelector: sel => sel.includes('.map-swipe-hint') ? (els['__hint'] || (els['__hint'] = mk())) : null,
  body: mk(), title:''
};
global.window = {}; const store = {};
global.localStorage = { getItem:k => store[k]||null, setItem:(k,v)=>{ store[k]=v; } };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.location = { search: '' };
global.matchMedia = () => ({ matches: false });

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); if (!cond) fails++; }
let fails = 0;

console.log('--- 1. Hver kort-side er sin EGEN verden ---');
check('tre sider, tre temaer — ingen deler tema',
  new Set(MAP_PAGES.map(p => p.theme)).size === 3, JSON.stringify(MAP_PAGES.map(p => p.theme)));
check('hvert tema har en historie-linje (ikke bare et navn)',
  MAP_PAGES.every(p => p.line && p.line.length > 20), JSON.stringify(MAP_PAGES.map(p => p.line)));
check('hver side har sin egen baggrunds-type',
  new Set(MAP_PAGES.map(p => p.sky)).size === 3, JSON.stringify(MAP_PAGES.map(p => p.sky)));
check('galaksen er uændret (Kenneth: den er rigtig god)',
  MAP_PAGES[0].title.includes('Galaksen') && MAP_PAGES[0].theme.includes('Galaksen'));
check('de to andre sider har fået en fortælling: den levende hverdag + underverdenen',
  MAP_PAGES[1].theme.includes('hverdag') && MAP_PAGES[2].theme.includes('Underverden'), JSON.stringify(MAP_PAGES.map(p => p.theme)));
check('titlen (aftalen med Kenneth) staar stadig',
  MAP_PAGES[0].title.includes('Galaksen') && MAP_PAGES[1].title.includes('Ord-akademiet') && MAP_PAGES[2].title.includes('Mester-riget'));

// Baggrunden pr. side tegnes forskelligt, og kan ses i DOM'en
state.worlds = {}; state.mapAt = 0;
renderWorldMap();
const svgA = String(els['worldMapA'].innerHTML), svgB = String(els['worldMapB'].innerHTML), svgC = String(els['worldMapC'].innerHTML);
check('kort A tegnes som rummet', svgA.includes('data-page="rum"'));
check('kort B tegnes som den levende hverdag', svgB.includes('data-page="hverdag"'));
check('kort C tegnes som underverdenen', svgC.includes('data-page="underverden"'));
check('hverdags-kortet har sit eget landskab (sol, huse, gadelygter)',
  svgB.includes('#ffcf7a') && svgB.includes('#ffe9a8') && (svgB.match(/<polygon/g) || []).length >= 9);
check('underverdens-kortet har lava og stalagmitter',
  svgC.includes('#ff6a3a') && (svgC.match(/<polygon/g) || []).length >= 8);
// Alle tre sider skal have PRÆCIS de samme 12 kort-omraader (Kenneths krav), men forskellig baggrund
check('de tre sider er ens i layout men forskellige i baggrund',
  [svgA, svgB, svgC].every(s => (s.match(/data-page=/g) || []).length === 1) && svgA !== svgB && svgB !== svgC && svgA !== svgC);
check('baggrunden er FAST (ingen tilfældige tal = ingen kort der skifter udseende)',
  !/Math\\.random/.test(String(pageBackdropMarkup)));

console.log('--- 2. Monstrene passer til sidens tema ---');
// Den levende hverdag (side B): monsteret ER tingen. Underverdenen (side C): underverdenens skabninger.
const HVERDAG = ['bog', 'troldHus', 'troldFamilie', 'raev', 'ballon', 'mad', 'sok', 'muskel', 'froe', 'loeber', 'ur', 'foelseskejser'];
const UNDERVERDEN = ['troldStavelse', 'drage', 'tvilling', 'stilhedsaand', 'trafik', 'spoegelse', 'ulveflok', 'skygge', 'troldSpejl', 'vogter', 'troldmand', 'droemme'];
const bForms = WORLDS.slice(12, 24).map((w, i) => BOSSES[12 + i].form);
const cForms = WORLDS.slice(24, 36).map((w, i) => BOSSES[24 + i].form);
check('side B (den levende hverdag) har hverdagsting der er blevet levende',
  bForms.every(f => HVERDAG.includes(f)), JSON.stringify(bForms.filter(f => !HVERDAG.includes(f))));
check('side C (underverdenen) har underverdenens skabninger',
  cForms.every(f => UNDERVERDEN.includes(f)), JSON.stringify(cForms.filter(f => !UNDERVERDEN.includes(f))));
check('underverdenen har de mørke skabninger: trolde, ånder og dragen',
  ['troldStavelse', 'spoegelse', 'skygge', 'drage'].every(f => cForms.includes(f)));
check('ingen side låner den anden sides skabninger',
  bForms.every(f => !cForms.includes(f)) && cForms.every(f => !bForms.includes(f)));
check('dragen hører til underverdenen (den sidste verden)',
  BOSSES[25].form === 'drage' && mapPageForWorld(25) === 2);
/* Verdens navn skal passe til VERDENS EGNE ORD. Verden 14 hed "Skrive-værkstedet",
   men ordene er hus-ord (hus, køkken, stue …) og bossen er "Hustrolden" — et navn der
   ikke passer til indholdet er praecis det der faar et kort til at virke ugennemtaenkt. */
check('verden 14 hedder noget med hjem/hus — fordi dens ord ER hus-ord',
  /hjem|hus/i.test(WORLDS[13].name) && WORLDS[13].words.includes('køkken') && WORLDS[13].words.includes('vindue'),
  WORLDS[13].name + ' / ' + WORLDS[13].words.join(','));
check('hver verdens navn har noget til fælles med dens ord (stikproeve paa 6)',
  [[0, /plan|start/i], [12, /bog|klasse/i], [13, /hjem|hus/i], [17, /mad|marked/i], [23, /følelse|skov/i], [30, /vildt|reservat/i]]
    .every(([i, re]) => re.test(WORLDS[i].name)), 'navn/ord-par');

console.log('--- 3. Temaet kan SES paa skærmen ---');
const pageThemes = [];
for (let p = 0; p < 3; p++) {
  setMapPage(p, false);
  const mt = String(els['mapTheme'].innerHTML || '');
  pageThemes.push((/class="mt-theme">([^<]+)</.exec(mt) || [,''])[1]);
  check('kort-side ' + (p + 1) + ' viser sit tema under titlen', pageThemes[p] === MAP_PAGES[p].theme, pageThemes[p]);
}
check('de tre sider viser tre FORSKELLIGE temaer', new Set(pageThemes).size === 3, JSON.stringify(pageThemes));
check('tema-linjen (historien) vises ogsaa', /class="mt-line">[^<]{20,}</.test(String(els['mapTheme'].innerHTML)));
check('swipe-hintet peger paa næste TEMA (ikke bare et sidetal)',
  MAP_PAGES.every(p => /hverdag|Underverden|Galaksen/.test(p.hint)), JSON.stringify(MAP_PAGES.map(p => p.hint)));

console.log('--- 4. QOL: barnet ser HVEM der venter, foer det kaemper ---');
state.worlds = {};
const pvFejl = [], temaFejl = [];
for (let i = 0; i < 36; i++) {
  state.worlds[i] = { hear:null, type:null, fill:null, read:null, done:[false,false,false,false] };
  showWorld(i);
  const pv = String(els['worldBossPreview'].innerHTML || '');
  if (!pv.includes('data-form="' + BOSSES[i].form + '"')) pvFejl.push((i+1) + ':form');
  if (!pv.includes(BOSSES[i].name)) pvFejl.push((i+1) + ':navn');
  if (!pv.includes('Kraft ' + BOSSES[i].power)) pvFejl.push((i+1) + ':kraft');
  const tema = String(els['worldTheme'].textContent || '');
  if (!tema.includes(MAP_PAGES[mapPageForWorld(i)].theme)) temaFejl.push((i+1) + ':' + tema);
}
check('verdensskærmen viser skabningen (samme form som kampen) for alle 36', pvFejl.length === 0, pvFejl.join(','));
check('verdensskærmen viser hvilken verden (tema) man er i', temaFejl.length === 0, temaFejl.join(','));
check('forventningen er sat FOER arbejdet: monsteret vises ogsaa naar missionerne mangler',
  (() => { showWorld(3); return String(els['worldBossPreview'].innerHTML).includes('Venter på dig'); })());
check('besejret monster vises som besejret (og knappen er ikke en død knap)',
  (() => { const w = state.worlds[3]; w.done = [true,true,true,true]; w.boss = true; showWorld(3);
    return String(els['worldBossPreview'].innerHTML).includes('Besejret') && els['bossBtn'].disabled === true; })());
check('verdensskærmen har ikke faaet en ny død knap (kun monsteret som billede)',
  (() => { showWorld(6);   // en verden der IKKE er besejret
    return !/onclick/.test(String(els['worldBossPreview'].innerHTML))
      && els['worldBossPreview'].classList.contains('wbp-done') === false; })());

console.log('--- 5. QOL: Parér siger selv hvornaar den er til noget ---');
state.worlds = {}; cur.world = 0; startBoss(0);
const db = els['defendBtn'];
check('naar der ikke lades op: knappen er daempet og forklarer sig',
  db.classList.contains('parry-idle') && !db.classList.contains('parry-now') && /vent/i.test(db.title), db.title);
bossState.charge = { name: 'Ildpust', color: '#f97316' };
renderChargeWarn();
check('naar monsteret lader op: knappen lyser og siger PARÉR NU',
  db.classList.contains('parry-now') && !db.classList.contains('parry-idle') && /PARÉR NU/.test(db.textContent), db.textContent + ' / ' + db.title);
bossState.charge = null;
renderChargeWarn();
check('naar opladningen er brugt: knappen er daempet igen', db.classList.contains('parry-idle') && !db.classList.contains('parry-now'));
check('CSS har baade den daempede og den lysende Parér-knap',
  cssSrc.includes('.defend-btn.parry-now') && cssSrc.includes('.defend-btn.parry-idle') && cssSrc.includes('@keyframes parryPulse'));
check('Parér-knappens lys respekterer reducer bevægelse',
  (cssSrc.match(/@media \\(prefers-reduced-motion: reduce\\)\\s*\\{([\\s\\S]*?)\\n  \\}/) || [,''])[1].includes('.defend-btn.parry-now'));
check('CSS til temaet findes (kort-titel + verdens-skærm)',
  cssSrc.includes('.map-theme') && cssSrc.includes('.world-theme') && cssSrc.includes('.wb-preview'));
check('ingen nye biblioteker (kun CSS/SVG)',
  !/<script[^>]+src=/.test(htmlSrc) && !cssSrc.includes('@import'));

console.log(fails === 0 ? 'VERDENER OG QOL OK' : fails + ' FEJL');
if (fails) process.exit(1);
`;
try {
  new Function(patched + '\nconst htmlSrc = ' + JSON.stringify(htmlSrc) + ';\nconst cssSrc = ' + JSON.stringify(cssSrc) + ';\nconst MAP_IDS = ["worldMapA","worldMapB","worldMapC"];\n' + tests)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
