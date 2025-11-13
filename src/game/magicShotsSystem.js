/**
 * magicShotsSystem.js
 * Módulo principal del sistema de disparos mágicos.
 * Coordina la creación, actualización y renderizado de los disparos mágicos.
 * Proporciona una API para que otros módulos puedan interactuar con el sistema.
 */

import { createShot, updateShots, drawShots, clearAllShots, getActiveShots } from './shotManager.js';
import { getShotTypeByName, getAllShotTypes, SHOT_TYPES } from './shotTypes.js';
import { screenToWorldCoordinates } from './camera.js';
import { getPlayer } from './player.js';

// Registro de cooldowns por tipo de disparo
const shotCooldowns = {};

// Tipo de disparo actualmente seleccionado
let selectedShotType = SHOT_TYPES.BASIC.name;

// ============================
// Skill Manager
// ============================
// Todas las habilidades son independientes y combinables.
// Este gestor expone activación/desactivación y parámetros.
const activeSkills = {
  doubleVision: false,    // Visión doble: dispara doble
  cannibalism: false,     // Canibalismo: curación al matar enemigo
  explosion: false,       // Explosión: AOE al impactar
  bounce: false,          // Rebote: física de rebote con límite
  enlarged: false,        // Agrandado: tamaño 1.5x
  fastLegs: false,        // Piernas veloces: velocidad del jugador
  stonks: false           // Stonks: multiplicador de puntos
};

const skillParams = {
  cannibalismChance: 0.25,       // 25% (entre 20-30%)
  healOnCannibalism: 10,
  sizeMultiplier: 1.5,           // Agrandado
  playerSpeedMultiplier: 1.4,    // 40% (entre 30-50%)
  scoreMultiplier: 1.7,          // x1.7 (entre x1.5-x2)
  doubleVisionCooldownScale: 1.5,// evitar spam: aumenta cooldown
  bounceLimit: 4,                // entre 3-5
  explosionRadius: 120,          // radio AOE
  explosionDamageScale: 0.5      // 50% del daño base
};

export function activateSkill(skillKey) {
  if (skillKey in activeSkills) {
    activeSkills[skillKey] = true;
  }
}

export function deactivateSkill(skillKey) {
  if (skillKey in activeSkills) {
    activeSkills[skillKey] = false;
  }
}

export function isSkillActive(skillKey) {
  return !!activeSkills[skillKey];
}

// Parámetros expuestos
export function getCannibalismChance() { return skillParams.cannibalismChance; }
export function getHealOnCannibalism() { return skillParams.healOnCannibalism; }
export function getSizeMultiplier() { return activeSkills.enlarged ? skillParams.sizeMultiplier : 1; }
export function getPlayerSpeedMultiplier() { return activeSkills.fastLegs ? skillParams.playerSpeedMultiplier : 1; }
export function getScoreMultiplier() { return activeSkills.stonks ? skillParams.scoreMultiplier : 1; }
export function getDoubleVisionCooldownScale() { return activeSkills.doubleVision ? skillParams.doubleVisionCooldownScale : 1; }
export function getBounceLimit() { return activeSkills.bounce ? skillParams.bounceLimit : 0; }
export function getExplosionParams() { return activeSkills.explosion ? { radius: skillParams.explosionRadius, scale: skillParams.explosionDamageScale } : null; }


/**
 * Inicializa el sistema de disparos mágicos
 */
export function initMagicShotsSystem() {
    // Inicializar cooldowns para todos los tipos de disparos
    const allTypes = getAllShotTypes();
    allTypes.forEach(type => {
        shotCooldowns[type.name] = 0;
    });
    // La activación de habilidades ahora se realiza desde xpSystem.selectSkillOption
    
}

/**
 * Actualiza el sistema de disparos mágicos
 * @param {p5} p - Instancia de p5.js para efectos visuales
 */
export function updateMagicShotsSystem(p) {
    // Actualizar cooldowns
    Object.keys(shotCooldowns).forEach(type => {
        if (shotCooldowns[type] > 0) {
            shotCooldowns[type] -= 16.67; // Aproximadamente 60 FPS (1000ms / 60)
        }
    });
    
    // Actualizar disparos existentes
    updateShots(p);
}

/**
 * Dibuja todos los disparos mágicos activos
 * @param {p5} p - Instancia de p5.js
 */
export function drawMagicShots(p) {
    drawShots(p);
    // Efectos visuales de movimiento para Piernas veloces (placeholder)
    if (isSkillActive('fastLegs')) {
      const player = getPlayer();
      if (player && player.velocity) {
        p.push();
        p.noFill();
        p.stroke(0, 255, 255, 120);
        p.strokeWeight(2);
        // Dibuja pequeñas estelas detrás del jugador basadas en su velocidad
        const vx = player.velocity.x;
        const vy = player.velocity.y;
        const len = Math.min(40, Math.sqrt(vx*vx+vy*vy) * 2);
        p.line(player.position.x, player.position.y,
               player.position.x - vx * 0.6,
               player.position.y - vy * 0.6);
        p.pop();
      }
    }
}

/**
 * Dispara un proyectil mágico desde la posición del jugador hacia la posición del mouse
 * @param {p5} p - Instancia de p5.js
 * @param {string} shotTypeName - Nombre del tipo de disparo (opcional, usa el seleccionado si no se especifica)
 * @returns {boolean} - true si se realizó el disparo, false si está en cooldown
 */
export function firePlayerShot(p, shotTypeName = null) {
    const player = getPlayer();
    if (!player || !player.isAlive) return false;
    
    // Usar el tipo seleccionado si no se especifica uno
    const typeToUse = shotTypeName || selectedShotType;
    const shotType = getShotTypeByName(typeToUse);
    
    if (!shotType) {
        console.warn(`Tipo de disparo no encontrado: ${typeToUse}`);
        return false;
    }
    
    // Verificar cooldown
    if (shotCooldowns[shotType.name] > 0) {
        return false;
    }
    
    // Obtener posición del mouse en coordenadas del mundo
    const mousePos = screenToWorldCoordinates(p.mouseX, p.mouseY);
    
    // Crear el disparo (habilidades pueden duplicar)
    const shotsPrimary = createShot(
        player.position.x,
        player.position.y,
        mousePos.x,
        mousePos.y,
        shotType.name,
        player
    );
    let allShots = shotsPrimary || [];
    if (isSkillActive('doubleVision')) {
      const shotsSecondary = createShot(
        player.position.x,
        player.position.y,
        mousePos.x,
        mousePos.y,
        shotType.name,
        player
      );
      if (shotsSecondary) allShots = allShots.concat(shotsSecondary);
    }
    
    // Establecer cooldown
    if (allShots && allShots.length) {
        const cooldownScale = getDoubleVisionCooldownScale();
        shotCooldowns[shotType.name] = shotType.cooldown * cooldownScale;
        return true;
    }
    
    return false;
}

/**
 * Selecciona un tipo de disparo para usar
 * @param {string} shotTypeName - Nombre del tipo de disparo
 * @returns {boolean} - true si se seleccionó correctamente, false si no existe
 */
export function selectShotType(shotTypeName) {
    const shotType = getShotTypeByName(shotTypeName);
    if (!shotType) {
        console.warn(`Tipo de disparo no encontrado: ${shotTypeName}`);
        return false;
    }
    
    selectedShotType = shotTypeName;
    return true;
}

/**
 * Obtiene el tipo de disparo actualmente seleccionado
 * @returns {string} - Nombre del tipo de disparo seleccionado
 */
export function getSelectedShotType() {
    return selectedShotType;
}

/**
 * Obtiene el tiempo de cooldown restante para un tipo de disparo
 * @param {string} shotTypeName - Nombre del tipo de disparo
 * @returns {number} - Tiempo restante en milisegundos, 0 si está listo
 */
export function getShotCooldown(shotTypeName) {
    return shotCooldowns[shotTypeName] || 0;
}

/**
 * Verifica si un tipo de disparo está listo para usar
 * @param {string} shotTypeName - Nombre del tipo de disparo
 * @returns {boolean} - true si está listo, false si está en cooldown
 */
export function isShotReady(shotTypeName) {
    return (shotCooldowns[shotTypeName] || 0) <= 0;
}

/**
 * Limpia todos los disparos activos
 * Útil para reiniciar el juego o cambiar de nivel
 */
export function clearAllMagicShots() {
    clearAllShots();
    
    // Resetear cooldowns
    Object.keys(shotCooldowns).forEach(type => {
        shotCooldowns[type] = 0;
    });
}

/**
 * Obtiene la lista de disparos activos
 * @returns {Array} - Lista de disparos activos
 */
export function getActiveMagicShots() {
    return getActiveShots();
}

/**
 * Crea un disparo mágico desde una posición específica
 * Útil para que otros objetos (no solo el jugador) puedan disparar
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 * @param {number} targetX - Posición X objetivo
 * @param {number} targetY - Posición Y objetivo
 * @param {string} shotTypeName - Nombre del tipo de disparo
 * @param {Object} shooter - Objeto que dispara (opcional)
 * @returns {Array|null} - Array de disparos creados o null si falló
 */
export function createMagicShot(x, y, targetX, targetY, shotTypeName, shooter = null) {
    return createShot(x, y, targetX, targetY, shotTypeName, shooter);
}