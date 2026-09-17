#!/usr/bin/env python3
"""QA-kopier af index.html med et lille script der saetter spillet i den tilstand
skaermbilledet skal vise. Alt kører SYNKRONT (ingen timere der kan naa at ændre
skaermen før skaermbilledet tages). Kopierne ligger i /tmp — index.html røres ikke,
og alt der kaldes er spillets EGNE funktioner."""
import pathlib

SRC = pathlib.Path("/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren/index.html")
html = SRC.read_text(encoding="utf-8")

HELPERS = """
function __igaarKey() {
  const d = new Date(Date.now() - 86400000);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function __goerSvag(w, wrong) { state.stats.words[w] = { tries: wrong + 2, wrong: wrong, weakDay: __igaarKey() }; }
function __seedSvagOrd() { ["kanin","cykel","morgen","fodbold","banan","skole"].forEach((w,i) => __goerSvag(w, 4 - (i % 2))); }
function __vis(sk) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(sk).classList.add("active");
  document.getElementById("hud").classList.remove("hidden");
}
"""

SHOTS = {
    "stavelser": """
// STAVELSES-BLOKKEN: den ÆGTE markup og de ÆGTE klasser, sat paa Hør & Sla.
startGame(0, "hear");
cur.words = ["cykel","kanin","morgen","job","hus","bog","vand","vej","by","sne"];
cur.idx = 3;
renderHear();
__vis("screen-hear");
document.getElementById("hearWord").textContent = "cykel";
document.getElementById("hearStatus").innerHTML =
  "Det rigtige ord var: <span class='big-red'>cykel</span>" +
  syllableFeedbackHtml("cykel") + patternHintFor("cykel");
const __b = [...document.querySelectorAll("#hearChoices .choice")];
__b.forEach(x => x.classList.add(x.textContent === "cykel" ? "correct" : "reveal"));
updateHud();
state.xp = 120 * 2 + 78; state.xpStats = { answers: 40, answerXp: 120 };
renderXpBar();
""",
    "xp-bar": """
// XP-BJÆLKEN MENS MAN SPILLER + XP DER FLYVER OP FRA SVARET
startGame(0, "type");
cur.words = ["kanin","cykel","morgen","fodbold","banan","skole","hus","bog","vand","sol"];
cur.idx = 3;
renderType();
updateHud();
state.xp = 120 * 2 + 78; state.xpStats = { answers: 40, answerXp: 120 };
renderXpBar();
const __inp = document.getElementById("typeInput");
__inp.value = "kanin";
xpFlyFrom(__inp, XP_PER_ANSWER);
xpFlyFrom(__inp, XP_PER_ANSWER);
""",
    "levelup": """
// LEVEL-UP DER FYLDER SKÆRMEN
startGame(0, "type");
cur.idx = 2; updateHud();
state.xp = 130; state.talentPoints = 0;
levelUpShow(4, 1);
""",
    "mester-kort": """
// VERDENSKORTET med Mester-proeven synlig
__seedSvagOrd();
const __p = mesterNyProve();
if (__p.words.length >= 2) { state.mester.erobret.push(__p.words[0]); state.mester.erobret.push(__p.words[1]); }
if (__p.words.length >= 4) state.mester.streak[__p.words[2]] = 1;
state.xp = 120 * 2 + 78; state.xpStats = { answers: 40, answerXp: 120 };
showWorldMap();
""",
    "mester-stats": """
// STATISTIK med Mester-proeven: forvandlingen svag -> staerk
__seedSvagOrd();
const __p2 = mesterNyProve();
if (__p2.words.length >= 2) { state.mester.erobret.push(__p2.words[0]); state.mester.erobret.push(__p2.words[1]); }
if (__p2.words.length >= 4) state.mester.streak[__p2.words[2]] = 1;
state.bag.push(makeItem("helm", "trofe"));
state.xp = 120 * 3 + 110; state.xpStats = { answers: 60, answerXp: 180 };
state.stats.history.push({ t: Date.now(), world: 0, game: "type", stars: 3, total: 10, wrong: [], drill: null });
showStats();
""",
    "hero": """
// HELTESKÆRMEN: trofæ-tavlen, XP-bjælken og det nye navn
state.bag.push(makeItem("helm", "trofe"));
state.bag.push(makeItem("weapon", "trofe"));
state.bag.push(makeItem("shield", "asgard"));
state.xp = 120 * 5 + 40; state.talentPoints = 2;
state.xpStats = { answers: 80, answerXp: 240 };
state.worlds[0] = { hear: 3, type: 2, fill: 3, read: 2, done: [true,true,true,true], boss: true };
state.worlds[1] = { hear: 3, type: 3, fill: null, read: null, done: [true,true,false,false] };
showHero();
""",
}

out = pathlib.Path("/tmp/ordj_shots")
out.mkdir(exist_ok=True)
for name, code in SHOTS.items():
    inj = ("<script>\n" + HELPERS + "\ntry {\n" + code +
           "\n} catch(e) { document.title = 'QA-FEJL: ' + e.message; }\n</script>\n</body>")
    (out / (name + ".html")).write_text(html.replace("</body>", inj, 1), encoding="utf-8")
    print("skrev", out / (name + ".html"))