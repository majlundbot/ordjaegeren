// KRAVET OM RIGTIGT SVAR + KORTERE MISSIONER (Kenneth 18. sep, efter Robins spil)
//
//   "Robin sidder bare og svarer fejl for hurtigere at komme til bossen. Jeg skal tror vi skal
//    have lavet lidt ændringer. I stedet for 10 opgave skal det være 5 så man hurtigere kommer
//    til bossen. Og man skal trykke eller skrive det rigtige ord så man ikke kan snyde."
//
// To ting blev ændret, og begge fanges her:
//   1) MISSIONEN ER 5 OPGAVER (TASKS_PER_MISSION) i stedet for 8/6 — så man hurtigere når bossen.
//   2) ET FORKERT SVAR LÅSER RUNDEN. Før sprang runden selv videre efter et forkert svar
//      (setTimeout(nextX)), så man kunne hamre forkerte svar og nå bossen uden at kunne ordene.
//      Nu vises det rigtige svar, men barnet skal SELV give det (trykke/skrive) for at komme
//      videre. XP gives kun for første forsøg — man kan ikke svare forkert for at se svaret.
//
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

// ==== DOM-stub (samme princip som ordj_flow.js: classList har RIGTIG tilstand) ====
function makeEl(id) {
  const el = {
    id, _text: '', _html: '', _class: [], children: [], _value: '',
    classList: {
      add(c){ if(!el._class.includes(c)) el._class.push(c); },
      remove(c){ el._class = el._class.filter(x=>x!==c); },
      toggle(c,f){ const has=el._class.includes(c); const on = (f===undefined)? !has : !!f; if(on && !has) el._class.push(c); if(!on && has) el._class = el._class.filter(x=>x!==c); return on; },
      contains(c){ return el._class.includes(c); }
    },
    get className() { return el._class.join(' '); }, set className(v) { el._class = v.split(' ').filter(Boolean); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); el.children = []; },
    get value() { return el._value; }, set value(v) { el._value = String(v); },
    appendChild(c) { el.children.push(c); }, addEventListener() {}, focus() {}, style: {}, click() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, scrollTo() {},
    scrollWidth: 2000, clientWidth: 1000, scrollLeft: 0, onclick: null, setAttribute() {}, getAttribute() { return null; }
  };
  return el;
}
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-read','screen-result','screen-collect','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','readText','readQuestion','readChoices','readStatus',
 'resultEmoji','resultTitle','resultStars','resultMsg','resultXp','rewardCard','rewardEmoji','rewardText',
 'resultNext','collectGrid','rp-hear','rp-type','rp-fill','rp-read','toastGear','xpFill','xpText'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, measureText: () => ({ width: 10 }), save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){} }), width:0, height:0 };
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('#hearChoices .choice')) return els['hearChoices'].children;
    if (sel.includes('#fillChoices .choice')) return els['fillChoices'].children;
    if (sel.includes('#readChoices .choice')) return els['readChoices'].children;
    if (sel.includes('.choice')) return els['hearChoices'].children.concat(els['fillChoices'].children, els['readChoices'].children);
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.world-card')) return els['worldMap'].children;
    return [];
  },
  querySelector: () => null
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{ lang: 'da-DK' }], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = class { constructor(src) { this.src = src; } play() { return Promise.resolve(); } };

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
const els = global.__els;
const F = [];
const k = (label, ok, detalje) => { if (!ok) F.push(label); console.log((ok ? 'OK   ' : 'FEJL ') + label + (!ok && detalje !== undefined ? ' :: ' + detalje : '')); };
const valg = (box, tekst) => els[box].children.find(c => c.textContent === tekst);
const forkertValg = (box, ord) => els[box].children.find(c => c.textContent !== ord);

console.log('--- Kortere missioner: 5 opgaver ---');

k('TASKS_PER_MISSION er 5', TASKS_PER_MISSION === 5, TASKS_PER_MISSION);

startGame(0, 'hear');
k('Hør & Slå: runden er 5 ord (foer 8)', cur.words.length === 5, cur.words.length);
k('Hør & Slå: barnet ser "Ord 1 af 5"', /Ord 1 af 5/.test(els['rp-hear'].innerHTML), els['rp-hear'].innerHTML);

startGame(0, 'type');
k('Fang ordet: runden er 5 ord (foer 6)', cur.words.length === 5, cur.words.length);

startGame(0, 'fill');
k('Sætnings-gåden: runden er 5 ord (foer 6)', cur.words.length === 5, cur.words.length);

startGame(0, 'read');
k('Forstå det!: bruger verdens læse-opgaver (uaendret)', cur.words.length === cur.readTasks.length, cur.words.length + '/' + cur.readTasks.length);

console.log('--- Kravet om rigtigt svar: Hør & Slå ---');
startGame(0, 'hear');
{
  const ord = cur.words[cur.idx];
  const f = forkertValg('hearChoices', ord);
  answerHear(f.textContent, ord, f);
  k('forkert svar: runden gaar IKKE videre af sig selv', cur.idx === 0, 'idx=' + cur.idx);
  k('forkert svar: runden staar stadig aaben (kan besvares igen)', cur.answered === false && cur.fix === true,
    'answered=' + cur.answered + ' fix=' + cur.fix);
  k('forkert svar: der staar HVAD man skal goere', /fix-krav/.test(els['hearStatus'].innerHTML) && /komme videre/.test(els['hearStatus'].innerHTML));
  k('forkert svar: det rigtige ord vises (saa man ikke kan gaa i staa)', els['hearStatus'].innerHTML.includes(ord), ord);
  k('forkert svar: fejlen taelles én gang', cur.errors === 1, cur.errors);
  const f2 = forkertValg('hearChoices', ord);
  if (f2) answerHear(f2.textContent, ord, f2);
  k('spam af forkerte svar: fejlen taelles stadig kun én gang (statistikken pustes ikke op)', cur.errors === 1, cur.errors);
  k('spam af forkerte svar: kommer stadig ikke videre', cur.idx === 0, cur.idx);
  nextHear();
  k('selv et direkte kald til nextHear kan ikke springe et ubesvaret ord over', cur.idx === 0, cur.idx);
  const rigtig = valg('hearChoices', ord);
  answerHear(rigtig.textContent, ord, rigtig);
  k('det rigtige ord trykket: runden er besvaret', cur.answered === true);
  k('det rigtige ord trykket: teksten viser det var andet forsoeg (ingen XP)', /Nu var det rigtigt/.test(els['hearStatus'].innerHTML), els['hearStatus'].innerHTML.slice(0, 60));
}
startGame(0, 'hear');
{
  const ord = cur.words[cur.idx];
  const rigtig = valg('hearChoices', ord);
  answerHear(rigtig.textContent, ord, rigtig);
  k('rigtigt i FOERSTE forsoeg: teksten er den beloennede vej', els['hearStatus'].textContent === '✔️ ' + ord, els['hearStatus'].textContent);
}

console.log('--- Kravet om rigtigt svar: Fang ordet (skriv) ---');
startGame(0, 'type');
{
  const ord = cur.words[cur.idx];
  const inp = els['typeInput'];
  inp.value = 'zzz';
  typeSubmit();
  k('forkert skrevet ord: runden gaar ikke videre', cur.idx === 0, cur.idx);
  k('forkert skrevet ord: der staar at man skal skrive det rigtige', /fix-krav/.test(els['typeStatus'].innerHTML) && /Skriv det rigtige ord/.test(els['typeStatus'].innerHTML));
  k('forkert skrevet ord: knappen er "Tjek svar" og proever igen (ikke "Naeste")',
    els['typeNext'].textContent === 'Tjek svar ✓' && els['typeNext'].onclick === typeSubmit, els['typeNext'].textContent);
  k('forkert skrevet ord: feltet ryddes, saa ordet skal skrives selv', inp.value === '', JSON.stringify(inp.value));
  k('forkert skrevet ord: fejlen taelles én gang', cur.errors === 1, cur.errors);
  nextType();
  k('selv et direkte kald til nextType kan ikke springe et ubesvaret ord over', cur.idx === 0, cur.idx);
  inp.value = ord;
  typeSubmit();
  k('det rigtige ord skrevet: runden er besvaret', cur.answered === true);
  k('det rigtige ord skrevet: knappen bliver "Naeste →"', els['typeNext'].textContent === 'Næste →', els['typeNext'].textContent);
  k('det rigtige ord skrevet: teksten viser at det var andet forsoeg', /Nu var det rigtigt/.test(els['typeStatus'].innerHTML), els['typeStatus'].innerHTML.slice(0, 60));
}
startGame(0, 'type');
k('nyt ord: knappen starter som "Tjek svar" igen', els['typeNext'].textContent === 'Tjek svar ✓' && els['typeNext'].onclick === typeSubmit, els['typeNext'].textContent);
{
  const ord = cur.words[cur.idx];
  els['typeInput'].value = ord;
  typeSubmit();
  k('rigtigt skrevet i foerste forsoeg: den beloennede vej', /✔️ Rigtigt/.test(els['typeStatus'].innerHTML), els['typeStatus'].innerHTML.slice(0, 60));
}

console.log('--- Kravet om rigtigt svar: Saetnings-gaaden og Forstaa det! ---');
startGame(0, 'fill');
{
  const ord = cur.words[cur.idx];
  const f = forkertValg('fillChoices', ord);
  answerFill(f.textContent, ord, f);
  k('Saetnings-gaaden: forkert svar laaser runden', cur.idx === 0 && cur.answered === false && cur.fix === true);
  k('Saetnings-gaaden: der staar hvad man skal goere', /fix-krav/.test(els['fillStatus'].innerHTML));
  const rigtig = valg('fillChoices', ord);
  answerFill(rigtig.textContent, ord, rigtig);
  k('Saetnings-gaaden: rigtigt trykket svar lukker runden', cur.answered === true);
}
startGame(0, 'read');
{
  const t = cur.readTasks[cur.idx] || cur.readTasks[0];
  const f = els['readChoices'].children.find(c => c.textContent !== t.svar);
  if (f) answerRead(f.textContent, t, f);
  k('Forstaa det!: forkert svar laaser runden', cur.idx === 0 && cur.answered === false && cur.fix === true);
  k('Forstaa det!: der staar hvad man skal goere', /fix-krav/.test(els['readStatus'].innerHTML));
  k('Forstaa det!: det rigtige svar afsloeres FOERST efter man har svaret (kravet fra foer)', /Det rigtige svar er/.test(els['readStatus'].innerHTML));
  const rigtig = els['readChoices'].children.find(c => c.textContent === t.svar);
  if (rigtig) answerRead(rigtig.textContent, t, rigtig);
  k('Forstaa det!: rigtigt trykket svar lukker runden', cur.answered === true);
}

console.log(F.length === 0 ? 'ALLE KRAV-TESTS GRØNNE' : 'FEJL: ' + F.length);
if (F.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch (e) {
  console.log('RUNTIME ERROR:', e.message, '\n', e.stack.split('\n').slice(0, 3).join('\n'));
  process.exit(1);
}
