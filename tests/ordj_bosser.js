// BOSSER OG ANIMATIONER — tester det BARNET oplever, ikke at funktionen findes.
// Baggrund (Kenneth): "De forskellige bosser ligner hinanden og stemmer ikke overens med
// det vi snakkede om" + "billede i verden 1 afspejler et dyr, det dyr skal også være bossen".
// Derfor maaler denne pakke:
//   1) at ingen to bosser tegnes ens (formen, ikke farven)
//   2) at verdenskortets ikon og kampens skabning er DEN SAMME
//   3) at kampen bevæger sig (spring, rekyl, opladning der kan ses, rysten)
//   4) at "reducér bevægelse" respekteres
// Hver test er efterprøvet med en mutation (se Docs/bosser-og-animationer.md §5).
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, fillRect(){}, beginPath(){}, arc(){}, ellipse(){}, fill(){}, stroke(){}, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; }, measureText: () => ({width:10}) }), width:0, height:0 };
const mk = () => {
  const el = { style:{ _p:{}, setProperty(k,v){ this._p[k]=v; }, removeProperty(){}, getPropertyValue(){ return ''; }, display:'', width:'', transition:'', filter:'', borderColor:'' },
    classList:{ _s:new Set(), add(...c){ c.forEach(x => this._s.add(x)); }, remove(...c){ c.forEach(x => this._s.delete(x)); },
                toggle(c,f){ const has=this._s.has(c); const on=(f===undefined)?!has:!!f; if(on)this._s.add(c); else this._s.delete(c); return on; },
                contains(c){ return this._s.has(c); } },
    children:[], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, blur(){}, setSelectionRange(){},
    value:'', textContent:'', disabled:false, title:'', onclick:null, querySelectorAll:()=>[], querySelector:()=>mk(),
    scrollTo(){}, getAnimations:()=>[], animate(){}, remove(){ this._removed = true; }, offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0,
    getBoundingClientRect: () => ({ left:100, top:100, width:120, height:140 }) };
  Object.defineProperty(el, 'innerHTML', { get(){ return el._h||''; }, set(v){ el._h=String(v); el.children=[]; } });
  return el;
};
const els = {}; global.__els = els;
const MAP_IDS = ['worldMapA','worldMapB','worldMapC'];
global.document = {
  createElement: () => mk(),
  getElementById: id => els[id] || (els[id] = mk()),
  querySelectorAll: sel => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss'].map(id => els[id] || (els[id] = mk()));
    if (sel.includes('.world-card')) return MAP_IDS.flatMap(id => (els[id] || (els[id] = mk())).children);
    return [];
  },
  querySelector: sel => {
    if (sel.includes('.boss-arena')) return els['bossArena'] || (els['bossArena'] = mk());
    return null;
  },
  body: mk(), title:''
};
global.window = {}; const store = {};
global.localStorage = { getItem:k => store[k]||null, setItem:(k,v)=>{ store[k]=v; } };
global.speechSynthesis = { getVoices:()=>[], cancel(){}, speak(){} };
global.performance = { now:()=>0 }; global.requestAnimationFrame = () => {};
global.innerWidth=1000; global.innerHeight=800; global.addEventListener=()=>{}; global.navigator={};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.location = { search: '' };
global.__motion = { reduced: false };             // styres af testen
global.matchMedia = () => ({ matches: global.__motion.reduced, addEventListener(){}, removeEventListener(){} });
global.__fs = fs;

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
const tests = `
const els = global.__els;
const FAKE = global.__motion;   // reduced-motion-indstillingen styres herfra
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); if (!cond) fails++; }
let fails = 0;
/* Rydder markup for ALT der ikke er FORM: farver, gradient-id'er, tal og mellemrum.
   Det er netop fejlen "kun farven skifter" vi skal fange — derfor maa farven IKKE
   indgaa i signaturen. */
function formSignature(md) {
  return String(md)
    .replace(/url\\(#[A-Za-z0-9]+\\)/g, 'url(#G)')
    .replace(/id="[A-Za-z0-9]+e?"/g, 'id="G"')
    .replace(/#[0-9a-fA-F]{3,8}/g, '#C')
    .replace(/rgba?\\([^)]*\\)/g, 'rgba(C)')
    .replace(/data-form="[^"]*"/g, '')
    .replace(/aria-label="[^"]*"/g, '')
    .replace(/[0-9.]+/g, 'N')
    .replace(/\\s+/g, ' ')
    .trim();
}
const markupOf = i => monsterSvgMarkup(i);
const formOf = i => BOSSES[i].form;

console.log('--- 1. Hver skabning tegnes for sig (FEJLEN fra Kenneth) ---');
check('hver boss har en form-funktion', BOSSES.every(b => typeof MONSTER_FORMS[b.form] === 'function'),
  JSON.stringify(BOSSES.filter(b => typeof MONSTER_FORMS[b.form] !== 'function').map(b => b.form)));
check('ingen boss falder tilbage til en anden skabnings tegning (form-id findes)',
  BOSSES.every((b, i) => markupOf(i).includes('data-form="' + b.form + '"')),
  JSON.stringify(BOSSES.map((b, i) => b.form).filter((f, i) => !markupOf(i).includes('data-form="' + f + '"'))));
check('hver boss tegnes med SIN egen forms funktion (36 forskellige form-navne)',
  new Set(BOSSES.map(b => b.form)).size === 36, new Set(BOSSES.map(b => b.form)).size);
// Parvis: to bosser maa ALDRIG give samme form-signatur naar farven er fjernet
const sigs = BOSSES.map((b, i) => formSignature(markupOf(i)));
const denyder = [];
for (let i = 0; i < 36; i++) for (let j = i + 1; j < 36; j++) if (sigs[i] === sigs[j]) denyder.push((i+1) + '=' + (j+1));
check('ingen to bosser tegnes ens UDEN farve (630 par sammenlignet)', denyder.length === 0, denyder.join(','));
check('alle 36 har en unik form-signatur', new Set(sigs).size === 36, new Set(sigs).size);
// Familien: og det gaelder ogsaa INDE i en familie (fx begge kraker, begge aander)
const fam = {};
BOSSES.forEach((b, i) => { (fam[MONSTER_FAMILIES[b.form]] = fam[MONSTER_FAMILIES[b.form]] || []).push(i); });
const famDup = [];
Object.keys(fam).forEach(k => {
  const set = new Set(fam[k].map(i => sigs[i]));
  if (set.size !== fam[k].length) famDup.push(k);
});
check('to skabninger i SAMME familie tegnes ogsaa forskelligt', famDup.length === 0, famDup.join(','));
check('skabningerne er grupperet i mindst 8 familier', Object.keys(fam).length >= 8, Object.keys(fam).length + ' familier');
check('ingen familie er en sammenkogt gryde (hoejst 7 i samme)', Object.values(fam).every(a => a.length <= 7),
  JSON.stringify(Object.keys(fam).map(k => k + ':' + fam[k].length)));
check('alle former har en familie', BOSSES.every(b => !!MONSTER_FAMILIES[b.form]));
check('hver skabning baerer SIN boses farver',
  BOSSES.every((b, i) => markupOf(i).includes(b.c1) && markupOf(i).includes(b.c2)));
check('en boss kan kendes uden farve: formen har 8+ elementer',
  BOSSES.every((b, i) => (markupOf(i).match(/<(path|circle|ellipse|rect|text)/g) || []).length >= 8),
  JSON.stringify(BOSSES.map((b, i) => (markupOf(i).match(/<(path|circle|ellipse|rect|text)/g) || []).length)));

console.log('--- 2. Mester-dragen er den ENESTE drage ---');
check('kun én boss har drage-formen', BOSSES.filter(b => MONSTER_FAMILIES[b.form] === 'drage').length === 1,
  JSON.stringify(BOSSES.filter(b => MONSTER_FAMILIES[b.form] === 'drage').map(b => b.name)));
check('dragen er Mester-dragen i verden 26', BOSSES[25].form === 'drage' && BOSSES[25].name === 'Mester-dragen');
const drager = BOSSES.map((b, i) => i).filter(i => markupOf(i).includes('#f97316'));
check('kun Mester-dragen har ild i tegningen', drager.length === 1 && drager[0] === 25, JSON.stringify(drager.map(i => i + 1)));
check('Mester-dragen har vinger OG et trofae (Mesterskabet)',
  markupOf(25).includes('#fbbf24') && (markupOf(25).match(/Q/g) || []).length > 8);
check('ingen af de andre 35 tegninger har vinger-formen fra den gamle drage',
  BOSSES.every((b, i) => i === 25 || !markupOf(i).includes('M118 108 Q150 78 190 70')));

console.log('--- 3. Verdenskortets ikon = kampens skabning (Kenneths regel) ---');
check('verdens ikon og bossens ikon er den SAMME skabning (36/36)',
  WORLDS.every((w, i) => w.emoji === BOSSES[i].emoji),
  JSON.stringify(WORLDS.map((w, i) => (w.emoji === BOSSES[i].emoji ? null : (i+1) + ':' + w.emoji + '!=' + BOSSES[i].emoji)).filter(Boolean)));
check('alle 36 ikoner er forskellige (ingen to verdener ser ens ud)',
  new Set(WORLDS.map(w => w.emoji)).size === 36, new Set(WORLDS.map(w => w.emoji)).size);
// Verdenskortet: den RIGTIGE render-funktion skal vise bossens skabning
state.worlds = {}; state.mapAt = 0;
renderWorldMap();
const kart = [];
MAP_IDS.forEach(id => els[id].children.forEach(c => {
  const m = /Verden (\\d+):/.exec(c.title || '');
  const em = /class="emoji">([^<]+)</.exec(c.innerHTML || '');
  if (m && em) kart.push([Number(m[1]) - 1, em[1]]);
}));
check('verdenskortet tegner alle 36 kort', kart.length === 36, kart.length);
const kortFejl = kart.filter(([i, em]) => em !== BOSSES[i].emoji);
check('hvert kort paa verdenskortet viser BOSSENS skabning', kortFejl.length === 0,
  JSON.stringify(kortFejl.map(([i, em]) => (i+1) + ':' + em + '!=' + BOSSES[i].emoji)));
// Verdenens skaerm: samme ikon, og kamp-knappen lover den rigtige skabning
const skaermFejl = [], knapFejl = [];
for (let i = 0; i < 36; i++) {
  state.worlds[i] = { hear:null, type:null, fill:null, read:null, done:[true,true,true,true] };
  showWorld(i);
  if (els['worldEmoji'].textContent !== BOSSES[i].emoji) skaermFejl.push((i+1) + ':' + els['worldEmoji'].textContent);
  if (!String(els['bossBtn'].textContent).includes(BOSSES[i].emoji) || !String(els['bossBtn'].textContent).includes(BOSSES[i].name))
    knapFejl.push((i+1) + ':' + els['bossBtn'].textContent);
}
check('verdenens skaerm viser bossens ikon', skaermFejl.length === 0, skaermFejl.join(','));
check('kamp-knappen viser skabningens ikon + navn (ikke altid en drage)', knapFejl.length === 0, knapFejl.join(','));
// Kampen: skabningen der tegnes er DEN SAMME som kortet viste
const kampFejl = [];
state.worlds = {};
for (let i = 0; i < 36; i++) {
  cur.world = i;
  startBoss(i);
  const html = String(els['bossDragonEmoji'].innerHTML);
  if (!html.includes('data-form="' + BOSSES[i].form + '"')) kampFejl.push((i+1) + ':form');
  else if (!html.includes(BOSSES[i].c1)) kampFejl.push((i+1) + ':farve');
  if (WORLDS[i].emoji !== BOSSES[i].emoji) kampFejl.push((i+1) + ':ikon');
}
check('kampen tegner praecis den skabning barnet saa paa kortet (alle 36)', kampFejl.length === 0, kampFejl.join(','));

console.log('--- 4. Det hopper, reagerer og kan SES (Kenneths animations-spoergsmaal) ---');
state.worlds = {}; cur.world = 0; startBoss(0);
const mon = els['bossDragonEmoji'], hero = els['bossHeroSvg'], arena = document.querySelector('.boss-arena');
const fxLayer = document.getElementById('fxLayer');
// Helten: hopper frem
heroLunge(1);
check('helten hopper frem ved angreb (klasse attack-1)', hero.classList.contains('attack-1'));
heroLunge(3);
check('tre slag i traek ser anderledes ud end eet (attack-3)', hero.classList.contains('attack-3') && !hero.classList.contains('attack-1'));
// Monsteret: SPRINGER frem (ikke bare et stik)
monsterLeap();
check('monsteret SPRINGER frem naar det angriber', mon.classList.contains('attack-leap'));
monsterLeap(true);
check('det opladede angreb er et STOERRE spring', mon.classList.contains('attack-leap-big') && !mon.classList.contains('attack-leap'));
// Rekyl
monsterKnockback();
check('monsteret faar REKYL naar det rammes (kastes baglaens)', mon.classList.contains('knockback'));
// Opladningen skal kunne SES paa skabningen
bossState.charge = { name: 'Ildpust', color: '#f97316' };
renderChargeWarn();
check('opladnings-advarslen vises PAA monsteret (det vokser/gloeder)', mon.classList.contains('charging'));
check('opladningens farve foelger med til monsteret', mon.style._p['--chargec'] === '#f97316', JSON.stringify(mon.style._p));
bossState.charge = null;
renderChargeWarn();
check('opladningen forsvinder fra monsteret naar den er brugt', !mon.classList.contains('charging'));
// Arenaen ryster
arenaQuake('big');
check('arenaen ryster ved store slag', arena.classList.contains('quake-big'));
arenaQuake();
check('små slag ryster mindre', arena.classList.contains('quake') && !arena.classList.contains('quake-big'));
// Stoev
const before = fxLayer.children.length;
dustPuff(100, 100, '#fff');
check('der kommer stoev ved afsaet/landing', fxLayer.children.length === before + 6, fxLayer.children.length - before);
check('CSS har springet, rekylen, opladningen, rysten og stoevet',
  ['monsterLeap','monsterLeapBig','monsterKnockback','monsterCharge','arenaQuake','arenaQuakeBig','dustOut','chargeRing','heroLunge1','heroLunge3']
    .every(k => cssSrc.includes('@keyframes ' + k)),
  JSON.stringify(['monsterLeap','monsterLeapBig','monsterKnockback','monsterCharge','arenaQuake','arenaQuakeBig','dustOut','chargeRing','heroLunge1','heroLunge3'].filter(k => !cssSrc.includes('@keyframes ' + k))));
check('CSS har stoev-klassen og opladnings-ringen',
  cssSrc.includes('.fx-dust') && cssSrc.includes('.boss-dragon.charging') && cssSrc.includes('attack-leap'));
check('ingen biblioteker blev indfoert (kun CSS/JS)',
  !/<script[^>]+src=/.test(htmlSrc) && !cssSrc.includes('@import'));

console.log('--- 5. reducér bevægelse ---');
check('CSS respekterer prefers-reduced-motion', cssSrc.includes('@media (prefers-reduced-motion: reduce)'));
const rmBlock = (cssSrc.match(/@media \\(prefers-reduced-motion: reduce\\)\\s*\\{([\\s\\S]*?)\\n  \\}/) || [,''])[1];
check('reduced-motion slaar animationerne fra for helt, monster og arena',
  rmBlock.includes('.boss-hero') && rmBlock.includes('.boss-dragon') && rmBlock.includes('.boss-arena') && rmBlock.includes('animation: none'),
  rmBlock.slice(0, 80));
check('reduced-motion fjerner rystelser (shake + flash)',
  rmBlock.includes('.screen-shake') && rmBlock.includes('.fx-flash') && rmBlock.includes('.fx-spark'));
check('reduced-motion beholder et glimt naar man rammes (uden blink)', rmBlock.includes('.hit-flash'));
// JS-siden: med "reducér bevægelse" slaaet til kommer der intet stoev
FAKE.reduced = true;
check('JS laeser systemets indstilling (reducedMotion)', reducedMotion() === true && typeof matchMedia === 'function');
const n0 = fxLayer.children.length;
dustPuff(120, 120, '#fff');
check('reducer bevægelse: INTET stoev i DOMen', fxLayer.children.length === n0, fxLayer.children.length - n0);
heroLunge(2);
check('reducer bevægelse: helten faar stadig klassen (CSS slukker bevægelsen)', hero.classList.contains('attack-2'));
FAKE.reduced = false;
check('uden reducer bevægelse: stoevet kommer tilbage', reducedMotion() === false);
dustPuff(140, 140, '#fff');
check('stoev virker igen naar indstillingen er slukket', fxLayer.children.length > n0);
const oldMM = global.matchMedia;
delete global.matchMedia;
check('reducedMotion er defensiv (ingen matchMedia = ingen fejl)', reducedMotion() === false);
global.matchMedia = oldMM;

console.log(fails === 0 ? 'BOSSE- OG ANIMATIONSTESTS OK' : fails + ' FEJL');
if (fails) process.exit(1);
`;
// Kilden laeses en gang her (CSS + JS) saa testene kan maale den — bruges i test 4 og 5
const htmlSrc = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
const cssSrc = (htmlSrc.match(/<style>([\s\S]*?)<\/style>/) || [,''])[1];
const combined = patched + '\nconst htmlSrc = ' + JSON.stringify(htmlSrc) + ';\nconst cssSrc = ' + JSON.stringify(cssSrc) + ';\nconst MAP_IDS = ["worldMapA","worldMapB","worldMapC"];\nconst __dir = ' + JSON.stringify(__dirname) + ';\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
