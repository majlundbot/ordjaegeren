/* Ordjægeren — PC-UX: Mester-prøvens tomme tilstand + swipe-hintet.
 *
 * HVORFOR DENNE TEST FINDES:
 * Kenneths skaermbillede fra PC viste "Mester-prøven — 0 af 0 svære ord
 * erobrede" med en stor, lysende GULD-KNAP der sagde "Ingen ord endnu".
 * Knappen var deaktiveret, men så stadig ud som skaermens vigtigste handling.
 * En død knap er vaerre end ingen knap: den inviterer til et klik der ikke goer
 * noget. Det er samme fejl som "Fedt!"-knappen der blev fjernet tidligere.
 *
 * Testen tjekker derfor FORMÅLET — "kan et barn trykke på noget der ikke virker?"
 * — ikke bare at elementerne findes.
 */
const fs = require("fs");
const path = require("path");

const D = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(D, "index.html"), "utf-8");

let ok = 0, fejl = [];

function t(navn, fn) {
  try {
    const r = fn();
    if (r === true) { ok++; console.log("  OK   " + navn); }
    else { fejl.push(navn + " :: " + r); console.log("  FEJL " + navn + " :: " + r); }
  } catch (e) {
    fejl.push(navn + " :: " + e.message);
    console.log("  FEJL " + navn + " :: " + e.message);
  }
}

console.log("ordj_pcux — Mester-prøvens tomme tilstand + swipe-hint");

// ---------- 1. Ingen "0 af 0" i titlen ----------
t("titlen viser IKKE '0 af 0' naar proeven er tom", () => {
  // Find den linje der saetter titlen
  const m = html.match(/if \(t\) t\.textContent = total[\s\S]{0,220}?;/);
  if (!m) return "fandt ikke titel-tildelingen";
  const kode = m[0];
  if (kode.includes('"0 af 0"')) return "der staar bogstaveligt '0 af 0' i koden";
  if (!/total\s*\?/.test(kode)) return "titlen er ikke gjort betinget af total — ved 0 ord bliver den '0 af 0'";
  if (!/:\s*"Mester-prøven"/.test(kode)) return "der mangler et tomt-tilfaelde der bare viser 'Mester-prøven'";
  return true;
});

// ---------- 2. Knappen SKJULES naar der ikke er ord ----------
t("KRAV: knappen skjules helt ved 0 ord (ikke bare deaktiveret)", () => {
  // Den gamle kode satte en tekst og disabled = !total. En deaktiveret men
  // SYNLIG guld-knap er praecis den doede knap Kenneth fangede.
  if (/btn\.textContent\s*=\s*total\s*\?[^;]*:\s*"Ingen ord endnu"/.test(html))
    return "den gamle kode staar der endnu: teksten 'Ingen ord endnu' paa en synlig knap";
  const m = html.match(/const harOrd = total > 0;[\s\S]{0,400}?\}/);
  if (!m) return "fandt ikke harOrd-blokken i mesterRenderPanel";
  const kode = m[0];
  if (!/btn\.classList\.toggle\("skjult",\s*!harOrd\)/.test(kode))
    return "knappen faar ikke .skjult naar der ikke er ord";
  if (!/aria-hidden/.test(kode))
    return "knappen skjules visuelt, men skaermlaesere faar den stadig — aria-hidden mangler";
  return true;
});

// ---------- 3. .skjult findes i CSS med display:none ----------
t("CSS: .skjult skjuler faktisk (display: none)", () => {
  const m = html.match(/\.skjult\s*\{[^}]*\}/);
  if (!m) return ".skjult findes ikke i CSS — saa skjules knappen ikke";
  if (!/display:\s*none/.test(m[0])) return ".skjult saetter ikke display: none";
  return true;
});

// ---------- 4. Tomt kort er daempet ----------
t("tom prøve giver et daempet kort (konkurrerer ikke med verdenskortet)", () => {
  if (!/panel\.classList\.toggle\("mp-tom",\s*total === 0\)/.test(html))
    return "panelet faar ikke .mp-tom naar proeven er tom";
  if (!/\.mester-panel\.mp-tom\s*\{/.test(html)) return ".mp-tom findes ikke i CSS";
  return true;
});

// ---------- 5. Ingen swipe-instruktion tilbage ----------
t("ingen 'Swipe til …' tilbage (mobilgestus virker ikke med mus)", () => {
  const fundet = html.match(/Swipe til (venstre|højre)/g) || [];
  if (fundet.length) return "der staar stadig: " + fundet.join(", ");
  return true;
});

// ---------- 6. Hintet naevner de pile der findes ----------
t("hintet henviser til ◀ ▶ (som virker med mus)", () => {
  const m = html.match(/hint:\s*"([^"]*)"/g) || [];
  if (m.length < 3) return "fandt kun " + m.length + " kort-hints, forventede 3";
  const uden = m.filter(h => !/◀/.test(h) && !/▶/.test(h));
  if (uden.length) return "hint uden pile: " + uden.join(" | ");
  return true;
});

// ---------- 7. Pile-knapperne findes stadig og kalder swipeMap ----------
t("pile-knapperne findes og virker med mus (onclick)", () => {
  if (!/onclick="swipeMap\(-1\)"/.test(html)) return "venstre-pil mangler";
  if (!/onclick="swipeMap\(1\)"/.test(html)) return "hoejre-pil mangler";
  if (!/function swipeMap\(/.test(html)) return "swipeMap() findes ikke";
  return true;
});

console.log("");
console.log("════════════════════════════════════");
if (fejl.length === 0) {
  console.log("ordj_pcux.js            ✅ " + ok + " tests");
  process.exit(0);
} else {
  console.log("ordj_pcux.js            ❌ " + fejl.length + " fejl af " + (ok + fejl.length));
  fejl.forEach(f => console.log("   - " + f));
  process.exit(1);
}
