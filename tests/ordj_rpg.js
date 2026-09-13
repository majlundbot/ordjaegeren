// RPG-features test: talenter, potions, kritisk hit, achievements
const fs = require('fs');
const src = fs.readFileSync('/tmp/ordj_script.js', 'utf-8');

global.fakeCanvas = { getContext: () => ({ clearRect(){}, beginPath(){}, arc(){}, fill(){}, fillRect(){}, fillStyle:'', createRadialGradient(){ return { addColorStop(){} }; }, ellipse(){}, stroke(){}, strokeStyle:'', lineWidth:0, save(){}, restore(){}, translate(){}, rotate(){}, drawImage(){}, measureText: () => ({width: 10}) }), width:0, height:0 };
const els = {};
const stubEl = id => els[id] || (els[id] = { classList:{add(){},remove(){},contains:()=>false}, textContent:'', innerHTML:'', appendChild(){}, addEventListener(){}, focus(){}, style:{}, value:'', disabled:false, getAnimations: () => [], animate(){}, querySelectorAll: () => [], offsetWidth:0, setProperty(){}, remove(){}, title:'' });
global.document = { getElementById: id => stubEl(id), querySelectorAll: () => [], querySelector: () => stubEl(), createElement: () => stubEl(), body: { appendChild(){} } };
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
const tests = `
function check(label, cond, extra) { console.log((cond ? 'OK   ' : 'FEJL ') + label + (extra && !cond ? ' :: ' + extra : '')); }
let fails = 0;

// --- TALENTER ---
check('talenter findes: 3 grene', TALENTS.length === 3, TALENTS.length);
check('talentLevel starter på 0', talentLevel('hp') === 0 && talentLevel('power') === 0 && talentLevel('crit') === 0);
check('talentHpBonus 0 fra start', talentHpBonus() === 0);
state.talentPoints = 2;
state.talents = { hp: 0, power: 0, crit: 0 };
spendTalent('hp');
check('spendTalent giver +1 og bruger point', state.talents.hp === 1 && state.talentPoints === 1, JSON.stringify({hp: state.talents.hp, pts: state.talentPoints}));
check('talentHpBonus +20', talentHpBonus() === 20);
check('spendTalent uden point virker ikke', (state.talentPoints = 0, spendTalent('power'), state.talents.power === 0));
state.talents.crit = 5;
spendTalent('crit');
check('maxed talent kan ikke overskrides', state.talents.crit === 5);
state.talents = { hp: 0, power: 0, crit: 0 };

// --- KRITISK HIT ---
check('critChance basis 10%', critChance() === 0.10, critChance());
state.talents.crit = 3;
check('critChance med talent 25%', Math.abs(critChance() - 0.25) < 0.001, critChance());
state.heroClass = 'paladin';
check('critChance med paladin-bonus', Math.abs(critChance() - 0.35) < 0.001, critChance());
state.heroClass = 'kriger'; state.talents = { hp: 0, power: 0, crit: 0 };

// --- POTIONS ---
state.potions = 2;
check('usePotion uden bossState = ingen ændring', (usePotion(), state.potions === 2));
bossState = { playerMax: 100, playerHp: 50, dragonMax: 100, dragonHp: 100, over: false };
document.getElementById('potionBtn').disabled = false;
usePotion();
check('usePotion heler 50%', bossState.playerHp === 100, bossState.playerHp);
check('usePotion bruger én potion', state.potions === 1, state.potions);
usePotion();
check('fuldt liv → potion bruges ikke', bossState.playerHp === 100 && state.potions === 1);
bossState.playerHp = 40;
usePotion();
check('tredje brug heler igen', bossState.playerHp === 90 && state.potions === 0, bossState.playerHp + '/' + state.potions);
usePotion();
check('ingen potions → ingen ændring', state.potions === 0 && bossState.playerHp === 90);
bossState = null;

// --- ACHIEVEMENTS ---
state.achievements = [];
state.worlds = { 0: { boss: true } };
state.stats = { words: {}, games: {}, days: {}, history: [] };
unlockAchievement('first_dragon');
check('unlockAchievement virker', state.achievements.includes('first_dragon'));
unlockAchievement('first_dragon');
check('ingen dubletter', state.achievements.length === 1, state.achievements.length);
state.achievements = [];
checkAchievements();
check('checkAchievements låser first_dragon op', state.achievements.includes('first_dragon'));
check('achievementCount tæller', achievementCount() === 1);

console.log('RPG-TESTS DONE');
`;
const combined = patched + '\n' + tests;
try {
  new Function(combined)();
} catch(e) {
  console.log('RUNTIME FEJL: ' + e.message + ' @ ' + (e.stack.split('\n')[1] || ''));
  process.exit(1);
}
