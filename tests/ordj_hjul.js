// LYKKEHJUL-TESTS (Docs/lykkehjulet.md)
// Den vigtigste test her er "nålen peger på den uddelte præmie" ved mange træk:
// det er præcis den fejl et billigt hjul laver (lander tilfældigt, og så passer
// teksten ikke med feltet under nålen) — og en 10-årig opdager det med det samme.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

// ---- DOM-stub. #wheelSpin bygger sine felt-elementer ud fra den SVG-markup
// koden selv skriver, så vi tester data-seg/klasserne og ikke en efterligning.
function makePathEl(key) {
  const p = {
    _c: [], _key: key,
    getAttribute(n) { return n === 'data-seg' ? key : null; },
    classList: {
      add(c) { if (!p._c.includes(c)) p._c.push(c); },
      remove(c) { p._c = p._c.filter(x => x !== c); },
      contains(c) { return p._c.includes(c); },
      toggle(c, f) { const on = f === undefined ? !p._c.includes(c) : !!f; if (on) p.classList.add(c); else p.classList.remove(c); return on; }
    }
  };
  return p;
}
function makeEl(id) {
  const el = {
    id, _text: '', _class: [], children: [], _value: '', _paths: [],
    style: { setProperty() {} },
    classList: {
      add(c) { if (!el._class.includes(c)) el._class.push(c); },
      remove(c) { el._class = el._class.filter(x => x !== c); },
      toggle(c, f) { const has = el._class.includes(c); const on = (f === undefined) ? !has : !!f; if (on && !has) el._class.push(c); if (!on && has) el._class = el._class.filter(x => x !== c); return on; },
      contains(c) { return el._class.includes(c); }
    },
    get className() { return el._class.join(' '); }, set className(v) { el._class = String(v).split(' ').filter(Boolean); },
    get textContent() { return el._text; }, set textContent(v) { el._text = String(v); },
    get value() { return el._value; }, set value(v) { el._value = String(v); },
    appendChild(c) { el.children.push(c); return c; },
    addEventListener() {}, focus() {}, click() {},
    querySelector() { return null; },
    querySelectorAll(sel) { return sel === '.wheel-seg' ? el._paths : []; },
    onclick: null, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    setProperty() {}, offsetWidth: 0, remove() {}, title: '', disabled: false,
    getAnimations: () => [], animate() { return {}; }
  };
  // Sætter man innerHTML, bygges felt-stubbene om — ligesom browseren ville bygge DOM'en
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._h || ''; },
    set(v) {
      el._h = String(v);
      el._paths = [];
      const re = /<path[^>]*data-seg="([^"]+)"[^>]*>/g; let m;
      while ((m = re.exec(el._h))) el._paths.push(makePathEl(m[1]));
    }
  });
  return el;
}
const els = {};
['wheelOverlay', 'wheelSpin', 'wheelResult', 'wheelBtn', 'wheelClose', 'wheelNeedle', 'fxLayer', 'rewardCard',
 'rewardEmoji', 'rewardText', 'bossMsg', 'bossHint', 'bossStatus', 'bossDragonEmoji', 'attackBar'].forEach(id => els[id] = makeEl(id));
global.__els = els;

global.fakeCanvas = { getContext: () => ({ clearRect() {}, beginPath() {}, arc() {}, fill() {}, fillRect() {}, fillStyle: '', strokeStyle: '', lineWidth: 0, createRadialGradient() { return { addColorStop() {} }; }, ellipse() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, drawImage() {}, measureText: () => ({ width: 10 }) }), width: 0, height: 0 };
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => (sel && sel.includes('.screen')) ? [] : [],
  querySelector: () => null,
  body: { appendChild() {} }, title: ''
};
global.window = { AudioContext: null, webkitAudioContext: null };
const store = {};
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } };
global.speechSynthesis = { getVoices: () => [{ lang: 'da-DK' }], cancel() {}, speak() {} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 1000; global.innerHeight = 800;
global.addEventListener = () => {};
global.navigator = {};
global.Audio = function () { this.play = () => Promise.resolve(); };
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;

const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

// ---- Falsk ur + rAF-kø: så kan HELE spin-løbet køres frame for frame i en test.
// (Den kørende stjerne-animation ligger også i køen; vi kalder blot alle frames.)
let fakeT = 0, frameQueue = [];
const realPerf = global.performance, realRaf = global.requestAnimationFrame;
const realCancel = global.cancelAnimationFrame;
function installFakeRAF() {
  fakeT = 0; frameQueue = [];
  global.performance = { now: () => fakeT };
  global.requestAnimationFrame = cb => { frameQueue.push(cb); return frameQueue.length; };
  global.cancelAnimationFrame = () => {};
}
function restoreRAF() {
  global.performance = realPerf;
  global.requestAnimationFrame = realRaf;
  if (realCancel === undefined) delete global.cancelAnimationFrame; else global.cancelAnimationFrame = realCancel;
}
function drainFrame(stepMs) {
  fakeT += stepMs;
  const q = frameQueue; frameQueue = [];
  q.forEach(cb => { try { cb(fakeT); } catch (e) { throw new Error('en animation-frame kastede: ' + e.message); } });
}
function appliedDeg() {
  const m = /rotate\(([-0-9.]+)deg\)/.exec(els['wheelSpin'].style.transform || '');
  return m ? parseFloat(m[1]) : null;
}
function clickTones() { return toneLog.filter(t => t.type === 'square').map(t => t.f); }
let toneLog = [];
function installFakeAudio() {
  toneLog = [];
  global.window.AudioContext = function () {
    this.currentTime = 0; this.destination = {};
    this.createOscillator = () => {
      const o = { type: 'sine', frequency: { value: 0 }, connect() {}, start() { toneLog.push({ f: o.frequency.value, type: o.type }); }, stop() {} };
      return o;
    };
    this.createGain = () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} });
  };
}

// ---- Delt med testkoden via global (se forklaringen i tests-blokken) ----
global.__wheelTest = { installFakeRAF, restoreRAF, drainFrame, appliedDeg, clickTones, installFakeAudio, html };

const tests = `
const els = global.__els;
// Testkoden kører inde i samme funktion som spillet (new Function), så modul-scope
// i Node (hr. denne fil) kan ikke ses herinde. Derfor deles hjælperne via global.
const H = global.__wheelTest;
const html = H.html;
const fails = [];
let queue = Promise.resolve();
function wtest(label, fn) {
  queue = queue.then(() => {
    try { return Promise.resolve(fn()).then(() => console.log('OK   ' + label)); }
    catch (e) { fails.push(label + ': ' + e.message); console.log('FEJL ' + label + ' :: ' + e.message); }
  });
}
function close(a, b, tol) { return Math.abs(a - b) <= (tol === undefined ? 1e-6 : tol); }
function resetState() {
  state.worlds = {}; state.bag = []; state.gear = {}; state.lootCount = 0; state.xp = 0;
  state.talents = { hp: 0, power: 0, crit: 0 };
}
function segsFor(w) { cur.world = w; return wheelSegs(); }

// ---------- 1) Feltets størrelse = den faktiske sandsynlighed ----------
wtest('hjul: hvert felts vinkel = dets sandsynlighed (25/25/50 og 10/20/20/50)', () => {
  [[0, [.25, .25, .5]], [12, [.10, .20, .20, .50]]].forEach(([w, pcts]) => {
    const segs = segsFor(w);
    if (segs.length !== pcts.length) throw new Error('verden ' + w + ': ' + segs.length + ' felter, forventet ' + pcts.length);
    const ranges = wheelSegRanges(segs);
    ranges.forEach((r, i) => {
      if (!close(r.to - r.from, pcts[i] * 360, 1e-9)) throw new Error('verden ' + w + ' felt ' + i + ': ' + (r.to - r.from).toFixed(4) + ' grader, forventet ' + (pcts[i] * 360));
      if (!close(r.mid, r.from + pcts[i] * 180, 1e-9)) throw new Error('midtvinklen stemmer ikke for ' + r.key);
    });
    if (!close(ranges[ranges.length - 1].to, 360, 1e-9)) throw new Error('felterne dækker ikke hele skiven');
  });
  cur.world = 0;
});

// ---------- 2) Vinklen vi regner baglæns lander i det rigtige felt ----------
wtest('hjul: wheelAngleFor → wheelKeyAtDeg giver samme felt (alle felter × 10 omgangstal)', () => {
  [0, 12].forEach(w => {
    const segs = segsFor(w);
    segs.forEach(s => {
      for (let turns = 1; turns <= 10; turns++) {
        const deg = wheelAngleFor(segs, s.key, turns);
        if (deg <= 0) throw new Error('rotationen skal være fremad: ' + deg);
        if (deg > 3600 + 360) throw new Error('urimelig stor rotation: ' + deg);
        const got = wheelKeyAtDeg(segs, deg);
        if (got !== s.key) throw new Error(w + '/' + s.key + ' @ ' + turns + ' omgange: nålen peger på ' + got);
      }
    });
  });
  cur.world = 0;
});

// ---------- 3) Landingen er MIDT i feltet, ikke på kanten ----------
wtest('hjul: rotationen lander MIDT i feltet (mindst 80 % af halvbredden fra kanten)', () => {
  [0, 12].forEach(w => {
    const segs = segsFor(w);
    const ranges = wheelSegRanges(segs);
    segs.forEach(s => {
      const deg = wheelAngleFor(segs, s.key, 6);
      let p = (-deg) % 360; if (p < 0) p += 360;
      const r = ranges.find(x => x.key === s.key);
      const half = (r.to - r.from) / 2;
      const distEdge = Math.min(p - r.from, r.to - p);
      if (distEdge < half * 0.8) throw new Error(s.key + ': kun ' + distEdge.toFixed(2) + '° fra kanten (halvbredde ' + half.toFixed(2) + '°)');
    });
  });
  cur.world = 0;
});

// ---------- 4) Den STORE test: 500 træk — nålen peger på den uddelte præmie ----------
wtest('hjul: 500 tilfældige træk — nålen under nålen = den præmie der blev uddelt', () => {
  resetState();
  let seed = 987654321;
  const lcg = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const origRandom = Math.random;
  const origTimeout = global.setTimeout;
  global.setTimeout = () => 0; // sikkerhedsnettet behøver ikke at tælle 500 timere med her
  let drawn = {};
  try {
    for (let i = 0; i < 500; i++) {
      cur.world = (i % 2 === 0) ? 0 : 12; // begge hjul-opstillinger
      Math.random = lcg;
      showLootWheel();                       // præmien trækkes FØRST
      if (!wheelPending) throw new Error('træk ' + (i + 1) + ': wheelPending mangler');
      const rk = wheelPending.rk;
      const segs = wheelSegs();
      drawn[rk] = (drawn[rk] || 0) + 1;
      spinLootWheel();                       // ... og rotationen regnes bagefter
      const deg = wheelPending.landDeg;
      if (typeof deg !== 'number' || !isFinite(deg)) throw new Error('træk ' + (i + 1) + ': hjulet fik ingen landingsvinkel');
      const pointed = wheelKeyAtDeg(segs, deg);
      if (pointed !== rk) throw new Error('træk ' + (i + 1) + ' (verden ' + cur.world + '): uddelt=' + rk + ' men nålen peger på ' + pointed + ' ved ' + deg.toFixed(3) + '°');
      const got = state.bag[state.bag.length - 1];
      if (!got || got.rarity !== rk) throw new Error('træk ' + (i + 1) + ': tasken fik ' + (got && got.rarity) + ', præmien var ' + rk);
      wheelPending = null; // som wheelFinish ville gøre
    }
  } finally { Math.random = origRandom; global.setTimeout = origTimeout; }
  if (Object.keys(drawn).length < 3) throw new Error('testen ramte kun ' + JSON.stringify(drawn) + ' — den skal dække flere felter');
  cur.world = 0;
});

// ---------- 5) Fordelingen følger pct (uafhængig forventning) ----------
wtest('hjul: 500 jævnt fordelte træk rammer de rigtige felter (pct-respekt)', () => {
  resetState();
  const origRandom = Math.random;
  const origTimeout = global.setTimeout;
  global.setTimeout = () => 0;
  const count = {}; let mismatches = [];
  try {
    for (let i = 0; i < 500; i++) {
      const roll = (i + 0.5) / 500;
      cur.world = 0;
      const segs = wheelSegs();
      // Uafhængig forventning, regnet direkte ud af pct-tabellen
      let acc = 0, want = segs[segs.length - 1].key;
      for (const s of segs) { acc += s.pct; if (roll < acc) { want = s.key; break; } }
      Math.random = () => roll;
      showLootWheel();
      const got = wheelPending.rk;
      if (got !== want) mismatches.push('roll ' + roll.toFixed(3) + ': fik ' + got + ', forventet ' + want);
      count[got] = (count[got] || 0) + 1;
      wheelPending = null;
    }
  } finally { Math.random = origRandom; global.setTimeout = origTimeout; }
  if (mismatches.length) throw new Error(mismatches.length + ' forkerte, fx ' + mismatches[0]);
  if ('secret' in count) throw new Error('verden 1 må ikke kunne give secret');
  // 500 jævnt fordelte træk: 25/25/50 skal give præcis 125/125/250
  if (count.mythic !== 125 || count.legendary !== 125 || count.magic !== 250) throw new Error('fordeling ' + JSON.stringify(count) + ', forventet 125/125/250');
});

// ---------- 6) Omgangstallet er ikke hardcodet (de gamle 1440° = 4 omgange) ----------
wtest('hjul: omgangstallet følger hjulet og er aldrig de gamle 4', () => {
  const origRandom = Math.random;
  try {
    [0, 12].forEach(w => {
      const segs = segsFor(w);
      const seen = {};
      for (let i = 0; i < 40; i++) { Math.random = () => i / 40; seen[wheelSpinTurns()] = 1; }
      const turns = Object.keys(seen).map(Number);
      if (turns.some(t => t < 4 + segs.length)) throw new Error('for få omgange: ' + turns.join(','));
      if (turns.length < 3) throw new Error('omgangstallet varierer ikke: ' + turns.join(','));
      turns.forEach(t => {
        const deg = wheelAngleFor(segs, segs[0].key, t);
        if (deg <= 4 * 360) throw new Error('rotationen ' + deg + '° er ikke mere end de gamle 1440°');
      });
    });
  } finally { Math.random = origRandom; }
  cur.world = 0;
});

// ---------- 7) Fartprofilen: opkørsel, fri rotation, nedbremsning ----------
wtest('hjul: opkørsel — farten starter i 0, vokser og topper i den fri rotation', () => {
  const segs = segsFor(0);
  const fd = wheelAngleFor(segs, 'magic', 7);
  const at = ms => wheelPosAt(ms, fd);
  if (at(0).v !== 0) throw new Error('farten skal starte i 0, ikke ' + at(0).v);
  if (at(-5).deg !== 0) throw new Error('før start skal vinklen være 0');
  let prevV = -1, prevDeg = -1;
  for (let ms = 0; ms <= WHEEL_T_UP; ms += 20) {
    const p = at(ms);
    if (p.v < prevV - 1e-9) throw new Error('farten falder i opkørslen ved ' + ms + ' ms');
    if (p.deg < prevDeg - 1e-9) throw new Error('vinklen går baglæns i opkørslen ved ' + ms + ' ms');
    prevV = p.v; prevDeg = p.deg;
  }
  const cruiseMid = WHEEL_T_UP + WHEEL_T_CRUISE / 2;
  const V = wheelSpeedFor(fd);
  if (!close(at(cruiseMid).v, V, 1e-6)) throw new Error('den fri rotation skal holde topfarten');
  let slow = true;
  for (let ms = WHEEL_T_UP + 40; ms < cruiseMid; ms += 40) if (at(ms).v > V + 1e-9) slow = false;
  if (!slow) throw new Error('farten må ikke overstige topfarten');
  cur.world = 0;
});

wtest('hjul: nedbremsning + tilbagesving — hjulet stopper PRÆCIS på finalDeg', () => {
  const segs = segsFor(0);
  const fd = wheelAngleFor(segs, 'legendary', 8);
  const decStart = WHEEL_T_UP + WHEEL_T_CRUISE, decEnd = decStart + WHEEL_T_DOWN;
  // Farten skal falde jævnt til 0 gennem hele nedbremsningen
  let prevV = Infinity, prevDeg = -1;
  for (let ms = decStart; ms < decEnd; ms += 25) {
    const p = wheelPosAt(ms, fd);
    if (p.v > prevV + 1e-9) throw new Error('farten stiger i nedbremsningen ved ' + ms + ' ms');
    if (p.deg < prevDeg - 1e-9) throw new Error('vinklen går baglæns i nedbremsningen ved ' + ms + ' ms');
    prevV = p.v; prevDeg = p.deg;
  }
  if (!close(wheelPosAt(decEnd, fd).deg, fd, 1e-6)) throw new Error('ved nedbremsningens slutning skal vinklen være ' + fd);
  if (!close(wheelPosAt(WHEEL_T_TOTAL, fd).deg, fd, 1e-9)) throw new Error('slutvinklen skal være præcis finalDeg');
  // ... og der SKAL være et tilbagesving inden da, ellers føles det klippet af
  let minDeg = fd, maxOffset = 0;
  for (let ms = decEnd; ms <= WHEEL_T_TOTAL; ms += 10) {
    const d = wheelPosAt(ms, fd).deg;
    minDeg = Math.min(minDeg, d);
    maxOffset = Math.max(maxOffset, Math.abs(d - fd));
  }
  if (!(fd - minDeg > 0.5)) throw new Error('der er intet tilbagesving (dybeste ' + (fd - minDeg).toFixed(2) + '°)');
  if (maxOffset > 4) throw new Error('tilbagesvinget er for voldsomt (' + maxOffset.toFixed(2) + '°) — det må ikke kunne skifte felt');
  // Konklusionen: hele vejen rundt om tilbagesvinget ligger nålen i samme felt
  if (wheelKeyAtDeg(segs, minDeg) !== 'legendary') throw new Error('tilbagesvinget flytter nålen over i et andet felt');
  if (wheelKeyAtDeg(segs, fd) !== 'legendary') throw new Error('slutningen peger ikke på det uddelte felt');
  cur.world = 0;
});

wtest('hjul: klik-frekvensen falder med farten', () => {
  const V = wheelSpeedFor(wheelAngleFor(segsFor(0), 'magic', 7));
  const fast = wheelClickFreq(V, V), mid = wheelClickFreq(V / 2, V), slow = wheelClickFreq(V / 10, V);
  if (!(fast > mid && mid > slow)) throw new Error('tonen falder ikke med farten: ' + fast + ' / ' + mid + ' / ' + slow);
  if (fast > 1600 || slow < 400) throw new Error('tonerne ligger uden for det hørbare klik-område: ' + fast + ' / ' + slow);
  cur.world = 0;
});

// ---------- 8) HELE spin-løbet, frame for frame med falsk ur ----------
function simSpin(world) {
  cur.world = world;
  H.installFakeRAF();
  H.installFakeAudio();
  resetState();
  const origRandom = Math.random;
  Math.random = () => 0.42;
  let rk, ticks = 0, degs = [];
  try {
    showLootWheel();
    rk = wheelPending.rk;
    spinLootWheel();
    while (wheelPending && ticks++ < 2000) {
      H.drainFrame(16);
      const d = H.appliedDeg();
      if (d !== null) degs.push(d);
    }
  } finally { Math.random = origRandom; H.restoreRAF(); }
  return { rk, ticks, degs, segs: wheelSegs(), bag: state.bag[state.bag.length - 1] };
}

wtest('hjul: fuldt spin simuleret — hjulet drejer, lander på den uddelte præmie og afslutter', () => {
  const r = simSpin(0);
  if (r.ticks >= 2000) throw new Error('spin-løbet sluttede aldrig (wheelPending blev aldrig null)');
  if (r.degs.length < 100) throw new Error('der blev kun tegnet ' + r.degs.length + ' frames');
  const last = r.degs[r.degs.length - 1];
  if (wheelKeyAtDeg(r.segs, last) !== r.rk) throw new Error('nålen endte på ' + wheelKeyAtDeg(r.segs, last) + ', men præmien var ' + r.rk + ' (' + last + '°)');
  if (!r.bag || r.bag.rarity !== r.rk) throw new Error('tasken fik ' + (r.bag && r.bag.rarity) + ', præmien var ' + r.rk);
  if (!(r.degs[0] < 60)) throw new Error('hjulet skal starte langsomt, første frame var ' + r.degs[0] + '°');
  const mid = r.degs[Math.floor(r.degs.length / 2)];
  if (!(mid > r.degs[0])) throw new Error('hjulet skal accelerere');
  // Tilbagesvinget skal kunne ses i den målte vinkel: hjulet vipper TILBAGE
  // under slutvinklen og falder så på plads — ellers føles det klippet af.
  // Vi kigger kun på de sidste frames (tilbagesvinget varer ~0,4 s = ~26 frames).
  const tailEnd = r.degs.slice(-20);
  const low = Math.min(...tailEnd);
  if (!(last - low > 0.3)) throw new Error('intet tilbagesving i den målte rotation (laveste ' + low.toFixed(2) + ', slut ' + last.toFixed(2) + ')');
  if (last - low > 4) throw new Error('tilbagesvinget er for stort: ' + (last - low).toFixed(2) + '°');
  if (Math.max(...r.degs) > last + 1e-3) throw new Error('hjulet svinger forbi slutvinklen');
});

wtest('hjul: klik pr. felt under spinnet — og tonen falder mod slutningen', () => {
  const r = simSpin(12);
  const tones = H.clickTones();
  if (tones.length < 8) throw new Error('der blev kun klikket ' + tones.length + ' gange gennem hele spinnet');
  if (tones.length > 400) throw new Error('der klikkes for meget: ' + tones.length + ' klik');
  const first = tones.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3 = tones.slice(-3).reduce((a, b) => a + b, 0) / 3;
  if (!(last3 < first)) throw new Error('tonen falder ikke: start ' + first.toFixed(0) + ' Hz, slut ' + last3.toFixed(0) + ' Hz');
  if (r.ticks >= 2000) throw new Error('spin-løbet sluttede aldrig');
});

wtest('hjul: muted giver ingen klik-lyde (men spinnet kører)', () => {
  const wasMuted = muted;
  muted = true;
  try {
    const r = simSpin(14);
    if (H.clickTones().length !== 0) throw new Error('der blev klikket ' + H.clickTones().length + ' gange selv om lyden er slukket');
    if (r.ticks >= 2000) throw new Error('spin-løbet sluttede aldrig mens lyden var slukket');
    if (wheelKeyAtDeg(r.segs, r.degs[r.degs.length - 1]) !== r.rk) throw new Error('landingen blev forkert uden lyd');
  } finally { muted = wasMuted; }
});

wtest('hjul: vinder-feltet lyser op, de øvrige dæmpes (win/dim/won)', () => {
  const r = simSpin(0);
  if (!els['wheelSpin'].classList.contains('won')) throw new Error('skiven fik ikke .won (kanten skal lyse)');
  const paths = els['wheelSpin']._paths;
  if (paths.length !== r.segs.length) throw new Error(paths.length + ' felt-elementer i markupen, forventet ' + r.segs.length);
  const winners = paths.filter(p => p.classList.contains('win'));
  if (winners.length !== 1) throw new Error(winners.length + ' felter lyser op, forventet præcis 1');
  if (winners[0]._key !== r.rk) throw new Error('det forkerte felt lyser op: ' + winners[0]._key + ' (præmien var ' + r.rk + ')');
  paths.filter(p => p !== winners[0]).forEach(p => { if (!p.classList.contains('dim')) throw new Error('feltet ' + p._key + ' blev ikke dæmpet'); });
});

wtest('hjul: resultatet kommer EFTER hjulet er stoppet, og så kan man lukke', () => {
  const r = simSpin(0);
  if (els['wheelResult'].classList.contains('hidden')) throw new Error('resultat-kortet skal vises når hjulet er stoppet');
  if (!els['wheelResult'].innerHTML.includes(r.rk === 'magic' ? 'Magisk' : (r.rk === 'mythic' ? 'Mytisk' : 'Legendarisk'))) {
    throw new Error('resultatet nævner ikke den uddelte grad: ' + els['wheelResult'].innerHTML.slice(0, 120));
  }
  if (els['wheelClose'].classList.contains('hidden')) throw new Error('"Fedt!"-knappen skal dukke op til sidst');
  if (!els['wheelBtn'].classList.contains('hidden')) throw new Error('Snur-knappen skal skjules når hjulet er stoppet');
});

wtest('hjul: looten er sikret allerede ved spin (overlay kan lukkes uden at miste præmien)', () => {
  resetState();
  cur.world = 0;
  const origRandom = Math.random;
  Math.random = () => 0.6;
  try {
    showLootWheel();
    const before = state.bag.length;
    spinLootWheel();
    if (state.bag.length !== before + 1) throw new Error('looten blev ikke uddelt ved spin');
    closeLootWheel(); // barnet lukker med ✕ midt i spinnet
    if (state.bag.length !== before + 1) throw new Error('looten forsvandt da overlayet blev lukket');
    wheelPending = null; // ryd op, så sikkerhedsnettet ikke laver mere
  } finally { Math.random = origRandom; }
});

// ---------- 9) Struktur: nålen SKAL ligge uden om det roterende element ----------
wtest('hjul: nålen ligger UDEN om det roterende element i index.html', () => {
  if (!/<div class="wheel" id="wheelSpin"><\\/div>/.test(html)) throw new Error('#wheelSpin skal være tom — alt der ligger inde i den drejer med nålen');
  if (!/id="wheelNeedle"/.test(html)) throw new Error('nålen mangler et id (wheelNeedle)');
  if (!/<div class="wheel-needle" id="wheelNeedle"/.test(html)) throw new Error('nålen skal være et selvstændigt element uden for #wheelSpin');
  const box = html.slice(html.indexOf('class="wheel-box"'), html.indexOf('id="wheelBtn"'));
  if (box.indexOf('id="wheelSpin"') > box.indexOf('id="wheelNeedle"')) throw new Error('rækkefølgen i markupen er forkert');
  if (box.indexOf('wheelNeedle') < 0) throw new Error('nålen ligger ikke i wheel-box');
});

wtest('hjul: CSS — ingen overflow:hidden på skiven, ingen gammel spin-animation', () => {
  const style = /<style>([\\s\\S]*?)<\\/style>/.exec(html)[1];
  const wheelBlock = /\\n  \\.wheel \\{([^}]*)\\}/.exec(style);
  if (!wheelBlock) throw new Error('kan ikke finde .wheel-blokken i CSS');
  if (/overflow\\s*:\\s*hidden/.test(wheelBlock[1])) throw new Error('.wheel har stadig overflow:hidden — den klipper glow på vinder-feltet');
  if (/wheelSpinAnim/.test(style)) throw new Error('den gamle CSS-rotation (wheelSpinAnim) hænger stadig i CSS');
  if (/\\.wheel\\.spinning/.test(style)) throw new Error('.wheel.spinning er ikke længere i brug og skal væk');
  if (!/@keyframes needleHit/.test(style)) throw new Error('nålens rystelse (needleHit) mangler i CSS');
  if (!/@keyframes segWinPulse/.test(style)) throw new Error('vinder-feltets puls (segWinPulse) mangler i CSS');
  if (!/\\.wheel\\.won \\.wheel-seg:not\\(\\.win\\)/.test(style)) throw new Error('de øvrige felter bliver ikke dæmpet i CSS');
  if (!/@keyframes wheelUnfold/.test(style)) throw new Error('resultat-kortets udfoldning (wheelUnfold) mangler i CSS');
});

queue.then(() => {
  console.log(fails.length === 0 ? 'ALLE LYKKEHJUL-TESTS GRØNNE' : 'FEJL: ' + fails.length);
  if (fails.length) process.exit(1);
});
`;

const combined = patched + '\n' + tests;
(async () => {
  try {
    await new Function(combined)();
  } catch (e) {
    console.log('RUNTIME FEJL: ' + e.message + ' @ ' + String(e.stack).split('\n')[1]);
    process.exit(1);
  }
})();
