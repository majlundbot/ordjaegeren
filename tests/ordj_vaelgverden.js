// NYTTE-TEST (18. sep 2026): "Vælg verden frit fra starten"
// Kenneth skal kunne lade hele Robins klasse teste spillet — et barn skal kunne
// gå direkte til en vilkårlig af de 36 verdener uden at spille sig igennem.
// Kontrakten der testes:
//   1) canEnterWorld(i) er sand for ALLE 36 verdener fra en tom profil.
//   2) Verdenskortet viser INGEN låste felter (ingen .locked, ingen 🔒, ingen "Låst").
//   3) Progressionen er IKKE forsvundet: stjerner pr. verden + status pr. verden
//      vises stadig, og "klaret" kan tydeligt ses i forhold til "ikke klaret".
//   4) Ingen blindgyde: "🏠 Hjem" virker efter man har åbnet en tilfældig verden.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
// classList der OPFØRER sig som browserens (så vi kan teste at "Hjem" skifter skærm)
function mkClassList() {
  const set = new Set();
  return {
    add(...c) { c.forEach(x => set.add(x)); },
    remove(...c) { c.forEach(x => set.delete(x)); },
    toggle(c, force) { const on = force === undefined ? !set.has(c) : !!force; if (on) set.add(c); else set.delete(c); return on; },
    contains(c) { return set.has(c); }
  };
}
const makeEl = id => {
  const el = { id, classList: mkClassList(), textContent:'', innerHTML:'', children: [], appendChild(c){ this.children.push(c); return c; }, addEventListener(){}, focus(){}, style:{ setProperty(){} }, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, scrollWidth:2000, clientWidth:1000, scrollLeft:0, scrollTo(){}, remove(){}, title:'' };
  // innerHTML-set rydder children (som i browseren)
  Object.defineProperty(el, 'innerHTML', { get() { return this._ih || ''; }, set(v) { this._ih = v; this.children = []; } });
  return el;
};
const els = {};
['screen-start','screen-map','screen-world','screen-boss','screen-hero','hud','hudProgress','startMeta',
 'worldMapA','worldMapB','worldMapC','mapCarousel','mapTitle','mapDots','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'bossBtn','bossStatus','bossMsg','bossHint','attackBar','fxLayer','toast'
].forEach(id => els[id] = makeEl(id));
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return ['screen-start','screen-map','screen-world','screen-boss','screen-hero'].map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMapA'].children.concat(els['worldMapB'].children, els['worldMapC'].children);
    return [];
  },
  querySelector: (sel) => sel.includes('.map-swipe-hint') ? makeEl('hint') : null
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function(){ this.play = () => {}; };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');
// new Function ser IKKE modul-scope: del fs/__dirname via global (kendt faldgrube)
global.__fs = fs;
global.__dirname = __dirname;
const tests = `
const els = global.__els;
const fs = global.__fs;
const __dirname = global.__dirname;
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); if (!cond) fails++; }
let fails = 0;
const cards = () => els['worldMapA'].children.concat(els['worldMapB'].children, els['worldMapC'].children).filter(c => c.className.includes('world-card'));

// ---- 1) ALLE 36 verdener kan vælges fra en tom profil ----
state.worlds = {}; state.mapAt = 0;
let notOpen = [];
for (let i = 0; i < WORLDS.length; i++) if (!canEnterWorld(i)) notOpen.push(i);
check('alle 36 verdener kan vælges fra start', WORLDS.length === 36 && notOpen.length === 0, JSON.stringify(notOpen));
check('verden 23 (Følelses-skoven) kan vælges fra start', canEnterWorld(23) === true);
check('verden 25 (Den svære skov) kan vælges fra start', canEnterWorld(24) === true);
check('verden 26 (Mesterskabet) kan vælges fra start', canEnterWorld(25) === true);
check('verden 27 (Dobbelt-bjerget) kan vælges fra start', canEnterWorld(26) === true);
check('verden 36 (Drømme-tårnet) kan vælges fra start', canEnterWorld(35) === true);
check('ugyldigt indeks (-1) kan ikke vælges', canEnterWorld(-1) === false);
check('ugyldigt indeks (36) kan ikke vælges', canEnterWorld(36) === false);

// ---- 2) Progressionen lever videre (worldReached = nået i rejsen) ----
let reached = 0;
for (let i = 0; i < WORLDS.length; i++) if (worldReached(i)) reached++;
check('kun verden 0 er NÅET i en tom profil', reached === 1 && worldReached(0) === true, reached);
state.worlds[0] = { hear:3, type:3, fill:3, done:[true,true,true], boss:true };
check('verden 1 bliver nået da monster 0 er besejret', worldReached(1) === true);
state.worlds = {}; state.mapAt = 0;

// ---- 3) Kortet: INGEN lås nogen steder ----
renderWorldMap();
const all = cards();
check('kortet tegner alle 36 verdenskort', all.length === 36, all.length);
check('ingen kort har .locked-klassen', all.every(c => !c.className.includes('locked')));
check('ingen kort viser "Låst"', all.every(c => !c.innerHTML.includes('Låst')));
check('ingen kort viser låse-emoji 🔒', all.every(c => !c.innerHTML.includes('🔒')));
// Selv en ÅBEN hængelås (🔓) læses som "låst" af et barn — derfor ingen låse-ikoner overhovedet
check('ingen kort viser åben-lås 🔓 (læses som låst af børn)', all.every(c => !c.innerHTML.includes('🔓')));

// ---- 4) Kortet: progressionen er STADIG synlig (stjerner + status pr. verden) ----
check('hvert verdenskort viser stjerner (wstars)', all.every(c => c.innerHTML.includes('class="wstars"')));
check('hvert verdenskort har 3 stjerne-symboler', all.every(c => (c.innerHTML.match(/class="ws /g) || []).length === 3));
check('hvert verdenskort har en status-badge (w-badge)', all.every(c => c.innerHTML.includes('w-badge')));
check('hvert verdenskort har 4 status-segmenter (3 missioner + monster)', all.every(c => (c.innerHTML.match(/class="w-seg /g) || []).length === 4));
check('et urørt kort langt fremme viser "Åben" (ikke låst)', all[23].innerHTML.includes('Åben'), all[23].innerHTML);
check('også det sidste kort (verden 36) viser "Åben"', all[35].innerHTML.includes('Åben'), all[35].innerHTML);
check('det næste skridt i rejsen viser "Start her"', all[0].innerHTML.includes('Start her'));
check('de 12 verdener på tredje side står med deres rigtige navne',
  ['Den svære skov','Mesterskabet','Dobbelt-bjerget','Stum-skoven','Byens gader','Skole-loftet',
   'Vildt-reservatet','Følelses-fjeldet','Spejl-søen','Samfunds-byen','Eventyr-riget','Drømme-tårnet']
    .every((n, k) => all[24 + k].innerHTML.includes(n)),
  all[24].innerHTML + ' / ' + all[35].innerHTML);
check('side C har præcis 12 kort — lige så mange som side A og B',
  all.slice(24, 36).length === 12 && all.length === 36);

// ---- 5) Klaret vs ikke klaret kan ses tydeligt ----
state.worlds = { 0: { hear:3, type:3, fill:3, done:[true,true,true], boss:true } };
renderWorldMap();
let c0 = cards()[0];
check('klaret verden har .cleared-klassen', c0.className.includes('cleared'), c0.className);
check('klaret verden viser "Færdig"', c0.innerHTML.includes('Færdig'));
check('klaret verden har 3 fulde stjerner', (c0.innerHTML.match(/ws full/g) || []).length === 3);
check('nabo-verden er ikke klaret og viser ikke "Færdig"', !cards()[1].innerHTML.includes('Færdig'));

state.worlds = { 2: { hear:3, type:1, fill:null, done:[true,true,false] } };
renderWorldMap();
let c2 = cards()[2];
check('verden i gang viser "I gang"', c2.innerHTML.includes('I gang'), c2.innerHTML);
check('verden i gang har 1 fuld + 1 halv stjerne og 1 tom', (c2.innerHTML.match(/ws full/g) || []).length === 1 && (c2.innerHTML.match(/ws part/g) || []).length === 1 && (c2.innerHTML.match(/ws none/g) || []).length === 1, c2.innerHTML);

// ---- 6) Man kan gå DIREKTE til en tilfældig verden ----
state.worlds = {}; state.mapAt = 0;
travelToWorld(23);
check('travelToWorld(23) flytter helten til Følelses-skoven', state.mapAt === 23, state.mapAt);
renderWorldMap();
check('helten står nu på akademi-kortet (side B)', els['worldMapB'].children.some(c => c.className.includes('map-hero')) && !els['worldMapA'].children.some(c => c.className.includes('map-hero')));
travelToWorld(25);
check('travelToWorld(25) flytter helten til Mesterskabet (verden 26)', state.mapAt === 25, state.mapAt);
renderWorldMap();
check('helten står nu på tredje kort (side C)', els['worldMapC'].children.some(c => c.className.includes('map-hero')) && !els['worldMapB'].children.some(c => c.className.includes('map-hero')));
// Også den SIDSTE verden skal føre til side C — ellers forsvinder helten fra kortet.
travelToWorld(35);
check('travelToWorld(35) flytter helten til Drømme-tårnet (verden 36)', state.mapAt === 35, state.mapAt);
renderWorldMap();
check('helten står stadig på tredje kort ved verden 36', els['worldMapC'].children.some(c => c.className.includes('map-hero')), 'side C mangler helten');
state.mapAt = 0;
travelToWorld(-1);
check('travelToWorld(-1) gør ingenting (sikkerhedsnet)', state.mapAt === 0, state.mapAt);
state.mapAt = 0;
travelToWorld(99);
check('travelToWorld(99) gør ingenting (sikkerhedsnet)', state.mapAt === 0, state.mapAt);

// ---- 7) Verdensskærmen virker for en verden uden fremskridt ----
state.worlds = {}; state.mapAt = 23;
showWorld(23);
check('showWorld(23) viser Følelses-skoven uden fremskridt', els['worldName'].textContent.includes('Følelses-skoven'), els['worldName'].textContent);
check('showWorld(23) viser alle 3 missioner', els['gameGrid'].children.length === 3, els['gameGrid'].children.length);
check('showWorld(23) siger 0/3 missioner', els['worldStatus'].innerHTML.includes('0/3'), els['worldStatus'].innerHTML);

// ---- 8) Ingen blindgyde: "🏠 Hjem" virker altid ----
goHome();
check('Hjem viser startskærmen', els['screen-start'].classList.contains('active'));
check('Hjem skjuler HUD-navigationen', els['hud'].classList.contains('hidden'));

// ---- 9) Kildekoden: den gamle lås findes ikke mere, den nye status-markering gør ----
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
check('CSS har ikke længere .world-card.locked', !html.includes('.world-card.locked'));
check('CSS har ikke længere det låste badge (b-locked)', !html.includes('b-locked'));
check('CSS har .cleared (klaret-markering)', html.includes('.world-card.cleared'));
check('CSS har .b-open (åben-markering)', html.includes('.b-open'));
check('startskærmen tilbyder at vælge verden', html.includes('Vælg verden'));

console.log('VERDENSVALG-TESTS DONE');
if (fails) process.exit(1);
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
