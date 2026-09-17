// STAVELSES-VISNINGEN I FEJL-TILBAGEMELDINGEN.
//
// Kenneth: "jeg fangede næsten ikke at du havde skrevet ord i stavelser hvilket er rigtig godt"
//
// Funktionen FANDTES og VIRKEDE — og blev ikke set. Det er der testen skal fange.
// Den måler derfor ikke "findes elementet" (det gjorde det hele tiden), men det der
// faktisk gik galt: at opdelingen var MINDRE end det røde ord og stod klemt ind ved
// siden af det på samme linje.
//
//   FØR:  .big-red 1.5em (21 px)  >  .syllables 1.35em (19 px)   ← undervisningen var mindst
//   NU:   .syl-box mindst 34 px   >  .big-red højst 28 px        ← undervisningen er størst
//
// De to px-tal læses direkte ud af CSS'en, så testen er rød på den gamle kode og
// grøn på den nye — på ALLE skærmstørrelser, fordi begge bruger clamp.
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');
const HTML_CSS = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];

const makeEl = (id) => {
  const el = { id, style: { setProperty(){}, display:'' }, textContent:'', innerHTML:'', value:'', children: [],
    appendChild(c){ this.children.push(c); return c; } };
  el._classes = new Set();
  Object.defineProperty(el, 'className', { get(){ return [...el._classes].join(' '); }, set(v){ el._classes = new Set(String(v).split(' ').filter(Boolean)); } });
  Object.defineProperty(el, 'innerHTML', { get(){ return el._html || ''; }, set(v){ el._html = String(v); el.children = []; } });
  el.classList = { add(...cs){ cs.forEach(c => el._classes.add(c)); }, remove(...cs){ cs.forEach(c => el._classes.delete(c)); },
    toggle(c, f){ const on = f === undefined ? !el._classes.has(c) : !!f; if (on) el._classes.add(c); else el._classes.delete(c); return on; },
    contains(c){ return el._classes.has(c); } };
  el.setAttribute = () => {};
  el.animate = () => ({});
  el.addEventListener = () => {};
  el.remove = () => {};
  el.focus = () => {};
  el.querySelector = () => null;
  el.querySelectorAll = () => [];
  el.getBoundingClientRect = () => ({ left:0, top:0, width:100, height:40 });
  return el;
};
const els = {};
const screens = ['screen-start','screen-map','screen-world','screen-hear','screen-type','screen-fill','screen-read','screen-result','screen-hero','screen-boss','screen-stats','screen-class','screen-profiles','screen-achieve','screen-lesson'];
screens.forEach(id => els[id] = makeEl(id));
['hud','hudProgress','startMeta','worldMapA','worldMapB','worldMapC','worldEmoji','worldName','worldWords','worldStatus','gameGrid',
 'hearWord','hearSpeak','hearChoices','hearStatus','typeHint','typeInput','typeStatus','typeNext',
 'fillSentence','fillSpeak','fillChoices','fillStatus','resultEmoji','resultTitle','resultStars',
 'resultMsg','resultXp','rewardCard','rewardEmoji','rewardText','resultNext','resultLearn','collectGrid',
 'heroSvg','heroName','heroPower','heroPowerNum','heroLevelNum','heroClassLabel','gearSlots','heroBag','heroHint',
 'bossDragonEmoji','bossDragonName','dragonHpFill','bossDragonPower','bossHeroSvg','bossStatus','bossMsg','bossHint','bossBtn',
 'attackBar','fxLayer','cubeSlots','cubeBtn','cubeOverlay','coInputs','coIcon','coRarity','coName','coSub','coResult',
 'wheelOverlay','wheelSpin','wheelResult','wheelBtn','wheelClose','toastGear','classGrid','classConfirm','profileGrid',
 'newProfileBox','newProfileName','mythicCount','mythicTrack','mythicInfo','talentPoints','talentRow',
 'achieveCount','achieveGrid','lessonTitle','lessonRule','lessonMeta','lessonTip','lessonExamples','lessonDrill','lessonIcon',
 'statsGrid','statsWeak','statsGames','statsPatterns','statsMastered','statsHistory','statsMester',
 'xpStrip','xpFill','xpText','xpToNext','xpGain','levelUp','levelUpTitle','levelUpSkin','levelUpGains','levelUpBtn',
 'mesterPanel','mesterTitle','mesterList','mesterBtn','mesterHeroPanel','trofeTrack','trofeCount','mesterInfo','mapMester'
].forEach(id => { if (!els[id]) els[id] = makeEl(id); });
global.__els = els;
global.document = {
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelectorAll: (sel) => {
    if (sel.includes('.screen')) return screens.map(id => els[id]);
    if (sel.includes('.game-btn')) return els['gameGrid'].children;
    return [];
  },
  querySelector: () => null,
  body: { appendChild(){} }
};
global.window = { AudioContext: null, webkitAudioContext: null };
const storage = {};
global.localStorage = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } };
global.speechSynthesis = { getVoices: () => [{lang:'da-DK'}], cancel(){}, speak(){} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.innerWidth = 820; global.innerHeight = 1180;
global.addEventListener = () => {};
global.Audio = function(){ this.play = () => Promise.resolve(); };
global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'',
  createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0,
  save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width:10}) }), width:0, height:0 };
const patched = src.replace('const cv = document.getElementById("bg")', 'var cv = fakeCanvas');

const tests = `
const els = global.__els;
const SRC = global.SRC;
const CSS = global.HTML_CSS;
let F = 0;
function check(label, cond, extra) { if (!cond) F++; console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra !== undefined && !cond ? ' :: ' + extra : '')); }

/* ---- HJÆLPER: læs et font-size-clamp fra CSS og giv {min,max} i px ---- */
function fontSizeRule(selector) {
  const i = CSS.indexOf(selector + " {");
  if (i < 0) return null;
  const block = CSS.slice(i, CSS.indexOf("}", i));
  const fm = block.match(/font-size:\\s*([^;]+);/);
  if (!fm) return null;
  const raw = fm[1].trim();
  const cl = raw.match(/clamp\\(\\s*([0-9.]+)px\\s*,\\s*[^,]+,\\s*([0-9.]+)px\\s*\\)/);
  if (cl) return { raw, min: parseFloat(cl[1]), max: parseFloat(cl[2]) };
  const px = raw.match(/^([0-9.]+)px$/);
  if (px) return { raw, min: parseFloat(px[1]), max: parseFloat(px[1]) };
  return { raw, min: null, max: null };
}

console.log('--- 1. DET DER GIK GALT: opdelingen var MINDRE end det roede ord ---');
const wordFs = fontSizeRule('.big-red');
const boxFs = fontSizeRule('.syl-box');
check('CSS har .big-red med laesbar font-size', !!wordFs, CSS.length);
check('CSS har .syl-box med laesbar font-size', !!boxFs);
check('begge font-size-regler kan laeses som px', wordFs && boxFs && wordFs.max !== null && boxFs.min !== null,
  (wordFs && wordFs.raw) + ' | ' + (boxFs && boxFs.raw));
// KAERNE-TESTEN. Den er ROED paa den gamle kode (1.5em vs 1.35em).
check('KRAV: stavelses-kasserne er STOERRE end det roede ord (mindste kasse > stoerste ord)',
  boxFs && wordFs && boxFs.min > wordFs.max,
  'syl-box min ' + (boxFs && boxFs.min) + 'px vs big-red max ' + (wordFs && wordFs.max) + 'px');
check('kassen er ogsaa stoerre end det gamle .syllables-niveau (1.35em ~ 19px)', boxFs && boxFs.min > 19,
  boxFs && boxFs.min);
check('ordet er ikke laengere sat i em (saa forholdet ikke skifter med skaermen)',
  wordFs && /px/.test(wordFs.raw), wordFs && wordFs.raw);

console.log('--- 2. Hver stavelse i sin EGEN kasse ---');
check('CSS har .syl-feedback som blok-element', /[.]syl-feedback[ ]*[{][^}]*display:[ ]*block/.test(CSS));
check('.syl-plain findes (skjult lineaer form)', /[.]syl-plain[ ]*[{]/.test(CSS));
check('.syl-row har luft mellem kasserne (gap 8px)', /[.]syl-row[ ]*[{][^}]*gap:[ ]*8px/.test(CSS));
check('.syl-box har sin egen baggrund (en KASSE, ikke bare tekst)',
  /[.]syl-box[ ]*[{][^}]*background:[ ]*linear-gradient/.test(CSS));
check('.syl-box har sin egen ramme (border)', /[.]syl-box[ ]*[{][^}]*border:[ ]*3px/.test(CSS));
const cases = ['dejlig', 'sådan', 'ikke', 'han', 'kanin', 'fodbold', 'morgen'];
cases.forEach(w => {
  const fb = syllableFeedbackHtml(w);
  const parts = syllabify(w);
  const boxes = (fb.match(/class="syl-box/g) || []).length;
  check('"' + w + '" -> ' + parts.length + ' stavelser giver ' + parts.length + ' kasser', boxes === parts.length, 'fik ' + boxes);
  const texts = [...fb.matchAll(/<span class="syl-box[^"]*">([^<]*)<\\/span>/g)].map(m => m[1]);
  check('"' + w + '" kasserne i raekkefoelge giver ordet', texts.join('') === w, JSON.stringify(texts));
  check('"' + w + '" der er et skilletegn mellem kasserne', fb.includes('syl-dot') || parts.length === 1, '');
  check('"' + w + '" lineaer form bevares for skaermlaesere', fb.includes(syllableDisplay(w)), syllableDisplay(w));
  check('"' + w + '" hver kasse skifter farve (graensen ses uden at laese bindestregen)',
    parts.length < 2 || fb.includes('syl-a') && fb.includes('syl-b'), '');
});

console.log('--- 3. Forklaringen: barnet skal vide hvad det skal BRUGE det til ---');
const demo = syllableFeedbackHtml('dejlig');
check('fejl-markup indeholder "Del ordet op"', demo.includes('Del ordet op'));
check('der er et tip om at klappe ordet', /Klap ordet/.test(demo));
check('forklaringen staar FOER kasserne (ikke efter)', demo.indexOf('Del ordet op') < demo.indexOf('syl-box'));

console.log('--- 4. Blok, ikke klemt ind ved siden af ordet ---');
check('blokken aabner med et div-element (IKKE en inline span)', /^<div class="syl-feedback">/.test(demo), demo.slice(0, 40));
check('blokken er selvstaendig: label + egen raekke + tip',
  demo.includes('class="syl-label"') && demo.includes('class="syl-row"') && demo.includes('class="syl-tip"'));

console.log('--- 5. Alle TRE fejl-tilbagemeldinger bruger blokken ---');
const SRC_LINES = SRC.split("\\n");
function lineWith(needle, also) {
  const l = SRC_LINES.filter(x => x.indexOf(needle) >= 0 && (!also || x.indexOf(also) >= 0));
  return l.length ? l[0] : "";
}
const hearLine = lineWith('hearStatus").innerHTML =', "big-red");
const typeLine = lineWith('typeStatus").innerHTML =', "big-red");
const fillLine = lineWith('fillStatus").innerHTML =', "big-red");
const hintLine  = lineWith('typeHint").innerHTML =', "syllableFeedbackHtml");
check('Hør & Slå bruger blokken', hearLine.indexOf("syllableFeedbackHtml(word)") >= 0, hearLine.slice(0, 110));
check('Fang ordet bruger blokken i status', typeLine.indexOf("syllableFeedbackHtml(word)") >= 0, typeLine.slice(0, 110));
check('Fang ordet bruger blokken i hint (ikke den gamle inline form)',
  hintLine.indexOf("syllableFeedbackHtml(word)") >= 0 && hintLine.indexOf("syllables") < 0, hintLine.slice(0, 110));
check('Sætnings-gåden bruger blokken', fillLine.indexOf("syllableFeedbackHtml(word)") >= 0, fillLine.slice(0, 110));
check('den gamle inline .syllables-form er helt væk fra fejl-tilbagemeldingerne',
  SRC.indexOf("class='syllables'") < 0, SRC.indexOf("class='syllables'"));
check('Forstå det! er urørt (ingen stavelses-blok der — opgaven er laesning)',
  lineWith('readStatus").innerHTML =').indexOf("syllableFeedbackHtml") < 0);

console.log('--- 6. Den ÆGTE fejl kan ikke komme tilbage ---');
const redLines = SRC_LINES.filter(l => l.indexOf('big-red\\'>" + word') >= 0);
const blockLines = SRC_LINES.filter(l => l.indexOf("syllableFeedbackHtml(word)") >= 0);
check('alle ' + redLines.length + ' roede fejl-steder har stavelses-blokken (blok-linjer: ' + blockLines.length + ')',
  redLines.length === 3 && blockLines.length >= 3, 'roede: ' + redLines.length + ', blokke: ' + blockLines.length);
redLines.forEach(l => {
  check('fejl-sted "' + l.trim().slice(0, 34) + '…" har BADE ordet og opdelingen',
    l.indexOf('big-red') >= 0 && l.indexOf("syllableFeedbackHtml(word)") >= 0);
  check('  ...og opdelingen staar EFTER ordet',
    l.indexOf('big-red') < l.indexOf("syllableFeedbackHtml(word)"));
});

console.log('--- 7. Ipad-bredde (820 px): raekken maa ikke klippes ---');
const nParts = syllabify('fodbold').length;
const approxBox = nParts * (58 * 0.6 * 3 + 32) + (nParts - 1) * 30;
check('en 2-stavelses kasse-raekke er under panelets bredde ved 58 px skrift', approxBox < 560, Math.round(approxBox) + 'px');

console.log(F === 0 ? 'ALLE STAVELSES-BLOK-TESTS GROENNE' : 'FEJL: ' + F);
if (F) process.exit(1);
`;
const wrapper = `
global.SRC = ${JSON.stringify(src)};
global.HTML_CSS = ${JSON.stringify(HTML_CSS)};
${patched}
${tests}
`;
try { new Function(wrapper)(); } catch(e) { console.log('RUNTIME ERROR:', e.message); process.exit(1); }