// Fuld flow-test: simulerer DOM og gennemspiller alle 4 spil
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

// ==== Robust DOM-stub ====
function makeEl(id) {
  const el = {
    id, _text: '', _html: '', _class: [], children: [], _value: '',
    classList: { add(c){ if(!el._class.includes(c)) el._class.push(c); }, remove(c){ el._class = el._class.filter(x=>x!==c); }, toggle(c,f){ const has=el._class.includes(c); const on = (f===undefined)? !has : !!f; if(on && !has) el._class.push(c); if(!on && has) el._class = el._class.filter(x=>x!==c); return on; }, contains(c){ return el._class.includes(c); } },
    get className() { return el._class.join(' '); }, set className(v) { el._class = v.split(' ').filter(Boolean); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get innerHTML() { return el._html; }, set innerHTML(v) { el._html = String(v); el.children = []; },
    get value() { return el._value; }, set value(v) { el._value = String(v); },
    appendChild(c) { el.children.push(c); },
    addEventListener() {}, focus() {}, style: {}, click() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    scrollTo() {}, scrollWidth: 2000, clientWidth: 1000, scrollLeft: 0,
    onclick: null
  };
  return el;
}
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-read','screen-result','screen-collect'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMap','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','rewardCard','rewardEmoji','rewardText','resultNext','collectGrid'].forEach(id => els[id] = makeEl(id));

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0 }), width:0, height:0 };
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.world-card')) return els['worldMap'].children;
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    if (sel.includes('.choice')) return els['hearChoices'].children.concat(els['fillChoices'].children);
    if (sel.includes('.class-card')) return els['classGrid'].children;
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.btn') return makeEl('btn');
    if (sel === '.screen.active') return null;
    if (sel === '.world-card:not(.locked)') return els['worldMap'].children[0] || null;
    if (sel === '.game-btn') return els['gameGrid'].children[0] || null;
    if (sel.includes('classConfirm')) return els['classConfirm'].querySelector ? els['classConfirm'].querySelector(sel) : null;
    return null;
  }
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 100; global.innerHeight = 100;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = class { constructor(src) { this.src = src; } play() { return Promise.resolve(); } }; // stub — ingen rigtig lyd i test

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
// ==== FLOW TESTS ====
const els = global.__els;
const fails = [];
function flow(label, fn) { try { fn(); console.log('OK   ' + label); } catch(e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.stack.split('\\n')[0]); } }

flow('showWorldMap', () => { showWorldMap(); if (!document.getElementById('screen-map').classList.contains('active')) throw new Error('map ikke aktiv'); });
flow('showWorld(0)', () => { showWorld(0); if (els['gameGrid'].children.length !== 4) throw new Error('4 spil-knapper forventet, fik ' + els['gameGrid'].children.length); });
flow('startGame hear', () => {
  startGame(0, 'hear');
  if (!document.getElementById('screen-hear').classList.contains('active')) throw new Error('hear-skærm ikke aktiv');
  if (els['hearChoices'].children.length !== 4) throw new Error('4 valg forventet, fik ' + els['hearChoices'].children.length);
});
flow('answerHear korrekt', () => {
  const word = cur.words[cur.idx];
  const btn = els['hearChoices'].children.find(c => c.textContent === word);
  if (!btn) throw new Error('rigtig knap ikke fundet for ' + word);
  answerHear(word, word, btn);
});
flow('nextHear', () => { nextHear(); if (cur.idx !== 1) throw new Error('idx=' + cur.idx); });
flow('startGame type', () => {
  startGame(0, 'type');
  if (!document.getElementById('screen-type').classList.contains('active')) throw new Error('type-skærm ikke aktiv');
});
flow('typeSubmit korrekt', () => {
  const word = cur.words[cur.idx];
  els['typeInput'].value = word;
  typeSubmit();
  if (cur.errors !== 0) throw new Error('fejl talt: ' + cur.errors);
});
flow('startGame fill', () => {
  startGame(0, 'fill');
  if (!document.getElementById('screen-fill').classList.contains('active')) throw new Error('fill-skærm ikke aktiv');
  if (!els['fillSentence'].innerHTML.includes('____')) throw new Error('ingen blank i sætning: ' + els['fillSentence'].innerHTML);
});
flow('answerFill korrekt', () => {
  const word = cur.words[cur.idx];
  const btn = els['fillChoices'].children.find(c => c.textContent === word);
  if (!btn) throw new Error('rigtig knap ikke fundet for ' + word);
  answerFill(word, word, btn);
});
flow('startGame read (Forstå det! — 4. mission)', () => {
  startGame(0, 'read');
  if (!document.getElementById('screen-read').classList.contains('active')) throw new Error('read-skærm ikke aktiv');
  if (els['readText'].textContent !== cur.readTasks[0].tekst) throw new Error('teksten vises ikke som tekst');
  if (els['readChoices'].children.length !== 3) throw new Error('3 valg forventet, fik ' + els['readChoices'].children.length);
  if (els['readStatus'].textContent !== '') throw new Error('svaret må ikke afsløres før man svarer');
});
flow('answerRead korrekt', () => {
  const t0 = cur.readTasks[cur.idx];
  const btn = document.createElement('button');
  answerRead(t0.svar, t0, btn);
  if (cur.errors !== 0) throw new Error('fejl talt: ' + cur.errors);
});
flow('finishGame', () => { finishGame(); if (!document.getElementById('screen-result').classList.contains('active')) throw new Error('resultat-skærm ikke aktiv'); });
flow('spaced repetition: forkert ord gemmes', () => {
  markWrong('jeg');
  if (!state.wrong['jeg']) throw new Error('jeg ikke registreret som forkert');
  markRight('jeg');
  if (state.wrong['jeg']) throw new Error('jeg ikke ryddet efter korrekt');
});
flow('verdens-kort: 2 kort renderes', () => { showWorldMap(); });

console.log('\\nFejl i alt: ' + fails.length);
if (fails.length) process.exit(1);
`;

const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME ERROR:', e.message, '\n', e.stack.split('\n').slice(0,3).join('\n'));
  process.exit(1);
}
