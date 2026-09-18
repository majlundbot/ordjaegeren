// HUD-PLADS OG LÆSBARE NAVNE: to fejl Kenneth fandt 18. sep, som ingen data-test kunne se.
//
//   1) "Det er jo ikke ordentligt, toppen går igennem skriften Den forbudte skov. Det her
//       skal være et premium produkt så detaljer betyder meget."
//      HUD'en ligger FAST i toppen (position: fixed, z-index 5) og skærmene starter i samme
//      højde → overskriften blev dækket: målt 39 px på h2 på fire skærme, og HELE kortets
//      titel + temalinje. Løsningen: JS måler HUD'ens underkant ind i --hud-h, som skærmene
//      lægger oveni deres top-padding.
//
//   2) Navne i rygsækken var klippet af: "Kronen af Ord" viste 9 px af 81 px, fordi grad og
//      kraft stod på samme linje som navnet i et 198 px kort. 16 af 22 navne var ramt.
//
// Kontrollerne her er i to dele:
//   A) KILDEKONTROLLER (kan køre overalt): CSS'en og JS'en hænger sammen.
//   B) LAYOUT-KONTROL I EN RIGTIG BROWSER (headless Chrome): måler faktisk geometri —
//      dækker HUD'en noget, og er nogen navne klippet? Springes ærligt over hvis Chrome
//      ikke findes på maskinen.
//
// Kør:  bash tests/run-all.sh
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
let fejl = 0;
const linje = (ok, tekst, detalje) => {
  if (!ok) fejl++;
  console.log((ok ? 'OK   ' : 'FEJL ') + tekst + (!ok && detalje !== undefined ? ' :: ' + detalje : ''));
};

console.log('--- HUD-plads og læsbare navne ---');

/* A1-A2) CSS: skærmene skal lægge HUD'ens højde oveni deres top-padding. */
linje(/\.screen \{[^}]*padding-top:\s*calc\(var\(--hud-h/.test(html.replace(/\n/g, ' ')),
  'CSS: .screen lægger --hud-h oveni sin top-padding');
linje(/\.screen\.tall\.active \{[^}]*padding-top:\s*calc\(var\(--hud-h/.test(html.replace(/\n/g, ' ')),
  'CSS: de høje skærme (.screen.tall) gør det samme');

/* A3) JS: HUD'ens underkant lægges i --hud-h (og 0 når HUD'en er skjult). */
function domStub(rectBottom, skjult) {
  const props = {};
  const hud = {
    classList: { contains: (c) => skjult && c === 'hidden' },
    getBoundingClientRect: () => ({ bottom: rectBottom, top: 12, height: rectBottom - 12 }),
    offsetHeight: rectBottom - 12
  };
  const stub = {
    __props: props,
    document: {
      getElementById: (id) => (id === 'hud' ? hud : null),
      documentElement: { style: { setProperty: (k, v) => { props[k] = v; } } }
    }
  };
  return stub;
}
function syncHudHeightIEgenSandkasse(rectBottom, skjult) {
  const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');
  const krop = src.match(/function syncHudHeight\(\)[\s\S]*?\n\}/);
  if (!krop) return { fejl: 'syncHudHeight findes ikke i koden' };
  const s = domStub(rectBottom, skjult);
  const fn = new Function('document', krop[0] + '\nreturn syncHudHeight();');
  fn(s.document);
  return { props: s.__props };
}
const synlig = syncHudHeightIEgenSandkasse(118, false);
linje(synlig.props && synlig.props['--hud-h'] === '118px',
  'JS: synlig HUD giver --hud-h = HUD’ens underkant (118px)', JSON.stringify(synlig));
const skjultHud = syncHudHeightIEgenSandkasse(118, true);
linje(skjultHud.props && skjultHud.props['--hud-h'] === '0px',
  'JS: skjult HUD giver --hud-h = 0px (ingen tom plads på start-skærmen)', JSON.stringify(skjultHud));

/* A4) Navnet skal have sin egen linje i rygsæk-kortet (ellers klemmer grad+kraft det). */
linje(html.indexOf('class="bi-info"') > 0 && html.indexOf('bi-sub') > 0,
  'KODE: rygsæk-kortet har navnet i sin egen boks (bi-info) med grad+kraft under');
linje(html.indexOf('class="bi-name') > 0 && html.indexOf('class="bi-grade') > 0,
  'KODE: navn og grad findes stadig i kortet');

/* ===== B) LAYOUT-KONTROL I EN RIGTIG BROWSER ===== */
function findChrome() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (!fs.existsSync(base)) return null;
  const hits = fs.readdirSync(base).filter(d => d.startsWith('chromium_headless_shell'));
  for (const h of hits) {
    const p = path.join(base, h, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return null;
}
const chrome = findChrome();
if (!chrome) {
  linje(true, 'layout-kontrol: SPRUNGET OVER — headless Chrome findes ikke på maskinen');
} else {
  // Proben lægges ind i en midlertidig kopi og rapporterer geometri som JSON i DOM'en.
  const probe = `<script>
setTimeout(function(){
  try {
    var hud = document.getElementById('hud');
    var hr = hud.getBoundingClientRect();
    var skjult = hud.classList.contains('hidden') || hr.height < 1;
    var ud = [];
    /* 1) alt synligt indhold hvis TOP ligger inde i HUD'ens bånd */
    document.querySelectorAll('.screen.active h1, .screen.active h2, .screen.active h3, #mapTitle, #mapTheme').forEach(function(el){
      if (el.offsetParent === null) return;
      var r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      var over = Math.min(hr.bottom, r.bottom) - Math.max(hr.top, r.top);
      if (!skjult && over > 0) ud.push('DAEKKET: "' + el.textContent.trim().slice(0,30) + '" x' + Math.round(over) + 'px');
    });
    /* 2) navne der klippes af deres egen boks i rygsæk/udstyr */
    var n = 0, klippet = 0;
    document.querySelectorAll('#heroBag .bi-name, #gearSlots .gs-name').forEach(function(el){
      n++;
      if (el.scrollWidth > el.clientWidth + 1) { klippet++; if (ud.length < 8) ud.push('KLIPPET NAVN: "' + el.textContent.slice(0,26) + '" ' + el.clientWidth + '/' + el.scrollWidth + 'px'); }
    });
    var p = document.createElement('pre'); p.id = 'probelayout';
    p.textContent = JSON.stringify({ daekket: ud.filter(function(x){return x.indexOf('DAEKKET')===0;}).length,
                                     navne: n, klippedeNavne: klippet, ud: ud });
    document.body.appendChild(p);
  } catch(e) { var p=document.createElement('pre'); p.id='probelayout'; p.textContent='FEJL: '+e.message; document.body.appendChild(p); }
}, 900);
</script>
</body>`;
  const bagFill = `<script>
setTimeout(function(){
  try {
    var slots = GEAR_SLOTS.map(function(s){ return s.key; });
    var rar = ['mythic','secret','legendary','magic','legendary','magic'];
    state.bag = [];
    for (var i = 0; i < 16; i++) state.bag.push(makeItem(slots[i % slots.length], rar[i % rar.length]));
    if (typeof renderHero === 'function') renderHero();
  } catch(e) {}
}, 500);
</script>`;
  const startProbe = `<script>
setTimeout(function(){
  try {
    var knapper = document.querySelectorAll('#screen-start .btn');
    var ud = [];
    knapper.forEach(function(k){ var b = k.getBoundingClientRect();
      ud.push({ tekst: k.textContent.trim().slice(0,30), x: Math.round(b.left), y: Math.round(b.top),
                b: Math.round(b.width), h: Math.round(b.height) }); });
    var p = document.createElement('pre'); p.id = 'probestart';
    p.textContent = JSON.stringify({ vindue: [window.innerWidth, window.innerHeight],
      synlige: document.querySelectorAll('#screen-start.active').length, knapper: ud });
    document.body.appendChild(p);
  } catch(e) { var p = document.createElement('pre'); p.id = 'probestart'; p.textContent = 'FEJL: ' + e.message; document.body.appendChild(p); }
}, 900);
</script>`;
  const kopi = path.join(os.tmpdir(), 'ordj_layout_probe.html');
  fs.writeFileSync(kopi, html.replace('</body>', bagFill + probe + startProbe));

  const kør = (url) => {
    const res = spawnSync(chrome, ['--headless', '--disable-gpu', '--allow-file-access-from-files',
      '--window-size=1280,617', '--virtual-time-budget=4000', '--dump-dom', url],
      { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
    const d = res.stdout || '';
    const m = d.match(/<pre id="probelayout">([\s\S]*?)<\/pre>/);
    if (!m) return null;
    const txt = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try { return JSON.parse(txt); } catch (e) { return null; }
  };
  const skærme = [['map', '&world=14'], ['map', '&world=0'], ['hero', ''], ['boss', '&world=0']];
  let alleOk = true, detaljer = [];
  skærme.forEach(([navn, ekstra]) => {
    const j = kør('file://' + kopi + '?still=1&screen=' + navn + ekstra);
    if (!j) { alleOk = false; detaljer.push(navn + ': ingen måling'); return; }
    if (j.daekket > 0) { alleOk = false; detaljer.push(navn + ': ' + j.ud.filter(x => x.indexOf('DAEKKET') === 0).join(' | ')); }
    if (j.navne > 0 && j.klippedeNavne > 0) { alleOk = false; detaljer.push(navn + ': ' + j.klippedeNavne + ' klippede navne'); }
  });
  linje(alleOk, 'BROWSER-MÅLING: HUD’en dækker intet indhold, og ingen navne er klippet (1280x617)',
    detaljer.join(' · '));

  /* ---- STARTSKÆRMEN: er der adgang til statistik, og kan et barn ramme knapperne? ----
     Statistik-knappen kom til 18. sep pa Kenneths onske. Den skal ligge ved siden af
     "Skift spiller" — de to sekundaere valg — uden at dække hinanden eller ryge uden for
     skærmen, og være stor nok til en finger pa en iPad. */
  const kørStart = (stoerrelse) => {
    const res = spawnSync(chrome, ['--headless', '--disable-gpu', '--allow-file-access-from-files',
      '--window-size=' + stoerrelse, '--virtual-time-budget=4000', '--dump-dom', 'file://' + kopi],
      { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
    const m = (res.stdout || '').match(/<pre id="probestart">([\s\S]*?)<\/pre>/);
    if (!m) return null;
    const txt = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try { return JSON.parse(txt); } catch (e) { return null; }
  };
  const maal = ['390,844', '820,1180', '1280,800'].map(st => [st, kørStart(st)]);
  const mangler = maal.filter(([, j]) => !j || j.synlige !== 1 || !j.knapper.length).map(([st]) => st);
  linje(mangler.length === 0, 'BROWSER-MÅLING: startskærmen kan måles i 3 vinduesstørrelser', mangler.join(', '));

  const medStatistik = maal.filter(([, j]) => j && j.knapper.some(k => k.tekst.indexOf('Statistik') > -1));
  linje(medStatistik.length === maal.length,
    'BROWSER-MÅLING: statistik-knappen er synlig på startskærmen i alle 3 størrelser',
    maal.filter(x => !medStatistik.includes(x)).map(([st]) => st).join(', '));

  let alleIndenfor = true, ingenOverlap = true, sammeLinje = true, storeNok = true, tætPaa = true;
  const detaljerStart = [];
  maal.forEach(([st, j]) => {
    if (!j || j.synlige !== 1) return;
    const rad = j.knapper.filter(k => k.y > 0);
    rad.forEach(k => {
      if (k.x < 0 || k.x + k.b > j.vindue[0]) { alleIndenfor = false; detaljerStart.push(st + ': "' + k.tekst + '" ude af skærmen'); }
      if (k.h < 40) { storeNok = false; detaljerStart.push(st + ': "' + k.tekst + '" kun ' + k.h + 'px høj'); }
    });
    const skift = rad.find(k => k.tekst.indexOf('Skift spiller') > -1);
    const stat = rad.find(k => k.tekst.indexOf('Statistik') > -1);
    if (skift && stat) {
      const overlap = Math.min(skift.x + skift.b, stat.x + stat.b) - Math.max(skift.x, stat.x);
      const lodret = Math.min(skift.y + skift.h, stat.y + stat.h) - Math.max(skift.y, stat.y);
      if (overlap > 0 && lodret > 0) { ingenOverlap = false; detaljerStart.push(st + ': knapperne overlapper'); }
      if (Math.abs(skift.y - stat.y) > 2) { sammeLinje = false; detaljerStart.push(st + ': knapperne staar ikke pa samme linje'); }
      const luft = stat.x - (skift.x + skift.b);
      if (luft < 6) { tætPaa = false; detaljerStart.push(st + ': kun ' + Math.round(luft) + 'px mellem knapperne'); }
    }
  });
  linje(ingenOverlap && sammeLinje && alleIndenfor && storeNok && tætPaa,
    'BROWSER-MÅLING: skift-spiller og statistik staar pa samme linje, uden overlap, med luft og stor nok til en finger',
    detaljerStart.join(' · '));

  const j = kør('file://' + kopi + '?still=1&screen=hero');
  linje(!!j && j.navne >= 8, 'BROWSER-MÅLING: rygsæk/udstyr er fyldt med navne at måle på', j ? j.navne : 'ingen måling');
}

console.log(fejl === 0 ? '\nHUD-PLADS OK' : '\n' + fejl + ' FEJL');
process.exit(fejl ? 1 : 0);