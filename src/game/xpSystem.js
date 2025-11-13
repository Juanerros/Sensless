// Sistema de experiencia y niveles
import { gameState } from './state.js';
import { activateSkill } from './magicShotsSystem.js';

// Configuración de XP
const PASSIVE_INTERVAL_MS = 10000; // 1 XP cada 10s

// Efectos visuales ligeros (para HUD)
const xpGainEffects = []; // {amount, at}
let levelUpFlashAt = null;

// Curva de experiencia: primeros niveles fáciles, luego crecimiento
export function requiredXpForLevel(level) {
  const l = Math.max(1, level);
  // Base suave para niveles bajos, crecimiento ~ l^1.5
  return 40 + Math.round(20 * Math.pow(l, 1.5));
}

export function initXPSystem(p) {
  if (!gameState.xp) {
    gameState.xp = {
      level: 1,
      current: 0,
      required: requiredXpForLevel(1),
      lastPassiveAt: p ? p.millis() : Date.now(),
      levelUpPending: false,
      pendingOptions: []
    };
  } else {
    // Asegurar campos
    gameState.xp.required = requiredXpForLevel(gameState.xp.level || 1);
    gameState.xp.lastPassiveAt = p ? p.millis() : Date.now();
    gameState.xp.levelUpPending = false;
    gameState.xp.pendingOptions = [];
  }
  if (!Array.isArray(gameState.skillsSelected)) {
    gameState.skillsSelected = [];
  }
}

export function updateXPSystem(p) {
  if (!gameState.xp) return;
  const now = p ? p.millis() : Date.now();
  while (now - gameState.xp.lastPassiveAt >= PASSIVE_INTERVAL_MS) {
    addXP(10, 'passive');
    gameState.xp.lastPassiveAt += PASSIVE_INTERVAL_MS;
  }
  // Limpiar efectos viejos (mostrar ~1.2s)
  const cutoff = (p ? p.millis() : Date.now()) - 1200;
  for (let i = xpGainEffects.length - 1; i >= 0; i--) {
    if (xpGainEffects[i].at < cutoff) xpGainEffects.splice(i, 1);
  }
  if (levelUpFlashAt && (now - levelUpFlashAt > 800)) levelUpFlashAt = null;
}

export function addXP(amount, source = 'unknown') {
  const amt = typeof amount === 'number' ? amount : 0;
  if (!gameState.xp || amt <= 0) return;
  gameState.xp.current += amt;
  xpGainEffects.push({ amount: amt, at: Date.now(), source });
  // Procesar subidas de nivel si aplica
  while (gameState.xp.current >= gameState.xp.required) {
    gameState.xp.current -= gameState.xp.required;
    gameState.xp.level += 1;
    gameState.xp.required = requiredXpForLevel(gameState.xp.level);
    triggerLevelUpSelection();
    levelUpFlashAt = Date.now();
  }
}

// XP por enemigo derrotado
export function addXPForEnemy(enemy) {
  if (!enemy) return;
  const type = enemy.type || enemy.name || 'enemy';
  const mapping = {
    chaser: 10,
    olvido: 10,
    wanderingBud: 8,
    bandit: 15,
    enemy: 10
  };
  const xp = mapping[type] ?? 10;
  addXP(xp, `kill:${type}`);
}

// Selección de habilidades (integradas con magicShotsSystem)
// Los nombres son visibles en la UI; se mapean a keys internas.
const skillPool = [
  'Visión doble',
  'Canibalismo',
  'Explosión',
  'Rebote',
  'Agrandado',
  'Piernas veloces',
  'Stonks'
];

// Mapeo de nombre mostrado -> clave interna del gestor de habilidades
function resolveSkillKeyFromName(name) {
  const n = String(name).toLowerCase();
  if (n.includes('visión doble') || n.includes('vision doble')) return 'doubleVision';
  if (n.includes('canibalismo')) return 'cannibalism';
  if (n.includes('explosión') || n.includes('explosion')) return 'explosion';
  if (n.includes('rebote')) return 'bounce';
  if (n.includes('agrandado')) return 'enlarged';
  if (n.includes('piernas veloces')) return 'fastLegs';
  if (n.includes('stonks')) return 'stonks';
  return null;
}

function triggerLevelUpSelection() {
  const opts = pickTwoRandom(skillPool);
  if(gameState.xp.pendingOptions.includes(opts[0]) || gameState.xp.pendingOptions.includes(opts[1])) return
  gameState.xp.levelUpPending = true;
  gameState.xp.pendingOptions = opts;
}

function pickTwoRandom(pool) {
  if (!Array.isArray(pool) || pool.length < 2) return ['Opción A', 'Opción B'];
  const i = Math.floor(Math.random() * pool.length);
  let j = Math.floor(Math.random() * pool.length);
  if (j === i) j = (j + 1) % pool.length;
  return [pool[i], pool[j]];
}

export function isLevelUpPending() {
  return !!(gameState.xp && gameState.xp.levelUpPending);
}

export function getLevelUpOptions() {
  return (gameState.xp && gameState.xp.pendingOptions) || [];
}

export function selectSkillOption(index) {
  if (!isLevelUpPending()) return false;
  const opts = getLevelUpOptions();
  const choice = opts[index];
  if (!choice) return false;
  const key = resolveSkillKeyFromName(choice);
  // Persistencia de la selección
  gameState.skillsSelected.push({ name: choice, key, atLevel: gameState.xp.level });
  // Activación inmediata en el sistema de habilidades (si está soportado)
  if (key) activateSkill(key);
  gameState.xp.levelUpPending = false;
  gameState.xp.pendingOptions = [];
  return true;
}

// Datos para HUD
export function getXPVisualState() {
  if (!gameState.xp) return {
    level: 1, current: 0, required: requiredXpForLevel(1), fraction: 0
  };
  const { level, current, required } = gameState.xp;
  const fraction = required > 0 ? current / required : 0;
  return { level, current, required, fraction };
}

export function getXPEffects() {
  return { xpGainEffects, levelUpFlashAt };
}