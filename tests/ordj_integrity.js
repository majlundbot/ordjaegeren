// STATISK INTEGRITET: fanger "knappen virker ikke"-fejl uden at klikke.
// 1) Hver onclick-handler skal pege på en funktion der findes
// 2) Hvert getElementById skal pege på et id der findes (ellers null-crash)
// 3) Ingen dublerede id'er i HTML (getElementById tager den første — stille fejl)
// 4) Ingen dublerede funktionsnavne (den sidste vinder stille)
// 5) CSS-klasser brugt i JS skal være defineret (ellers usynlig styling)
const fs = require('fs');
const path = require('path');
const DIR = '/Users/kennethmajlund/.openclaw/workspace/Projects/Ordjægeren';
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf-8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];

let F = 0;
const check = (l, c, e) => { if (!c) F++; console.log((c ? 'OK   ' : 'FEJL ') + l + (e !== undefined && !c ? ' :: ' + e : '')); };

/* ===== 1) onclick-handlere ===== */
const handlers = new Set();
for (const m of html.matchAll(/on(?:click|input|change|submit)\s*=\s*"([^"]+)"/g)) {
  for (const h of m[1].matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) handlers.add(h[1]);
}
const defined = new Set();
for (const m of js.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) defined.add(m[1]);
for (const m of js.matchAll(/(?:const|let|var|window\.)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:\(|function|async)/g)) defined.add(m[1]);
const BUILTIN = new Set(['alert','confirm','prompt','parseInt','parseFloat','String','Number','Boolean','isNaN','isFinite','setTimeout','setInterval','encodeURIComponent','decodeURIComponent']);
const missingHandlers = [...handlers].filter(h => !defined.has(h) && !BUILTIN.has(h));
console.log(`--- onclick-handlere: ${handlers.size} unikke · ${defined.size} funktioner defineret ---`);
check('alle onclick-handlere peger på en defineret funktion', missingHandlers.length === 0, JSON.stringify(missingHandlers));

/* ===== 2) getElementById mod faktiske id'er ===== */
const idsInHtml = new Set();
const idCount = {};
for (const m of html.matchAll(/\sid\s*=\s*"([^"]+)"/g)) { idsInHtml.add(m[1]); idCount[m[1]] = (idCount[m[1]] || 0) + 1; }
const refs = new Set();
for (const m of js.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) refs.add(m[1]);
const dynamic = new Set();
for (const m of js.matchAll(/\.id\s*=\s*"([^"]+)"/g)) dynamic.add(m[1]);
const missingIds = [...refs].filter(id => !idsInHtml.has(id) && !dynamic.has(id));
console.log(`--- id-referencer: ${refs.size} i JS · ${idsInHtml.size} id'er i HTML ---`);
check('alle getElementById-referencer findes (ellers null-crash)', missingIds.length === 0, JSON.stringify(missingIds));

/* ===== 3) dublerede id'er ===== */
const dupeIds = Object.entries(idCount).filter(([, n]) => n > 1);
check('ingen dublerede id-attributter i HTML', dupeIds.length === 0, JSON.stringify(dupeIds));

/* ===== 4) dublerede funktionsdefinitioner ===== */
const fnCount = {};
for (const m of js.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) fnCount[m[1]] = (fnCount[m[1]] || 0) + 1;
const allFn = {};
for (const m of js.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) allFn[m[1]] = (allFn[m[1]] || 0) + 1;
const dupeFns = Object.entries(allFn).filter(([, n]) => n > 1);
check('ingen dublerede funktionsnavne (den sidste vinder stille)', dupeFns.length === 0, JSON.stringify(dupeFns));

/* ===== 5) CSS-klasser brugt i JS ===== */
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(m => m[1]));
const jsClasses = new Set();
for (const m of js.matchAll(/classList\.(?:add|remove|toggle)\(\s*"([^"]+)"/g)) jsClasses.add(m[1]);
// kun hele, færdige klassenavne (spring strengkonkatenering som "rarity-" over)
const real = [...jsClasses].filter(c => !c.endsWith('-') && !c.includes(' '));
const missingCss = real.filter(c => !cssClasses.has(c));
console.log(`--- CSS-klasser: ${real.length} brugt i JS · ${cssClasses.size} defineret ---`);
check('alle CSS-klasser brugt i JS er defineret', missingCss.length === 0, JSON.stringify(missingCss));

/* ===== 6) døde referencer i HTML: id'er der hverken bruges i JS eller har en klasse der styles ===== */
// (fanger glemt markup — men tillader rent dekorative elementer)
const orphans = [...idsInHtml].filter(id => !refs.has(id) && !dynamic.has(id));
console.log(`--- id'er i HTML uden JS-reference: ${orphans.length} (ikke nødvendigvis en fejl) ---`);
if (orphans.length) console.log('     ' + orphans.join(', '));

console.log(F === 0 ? '\nALLE INTEGRITETS-TJEK GRØNNE' : `\n${F} FEJL`);
process.exit(F ? 1 : 0);
