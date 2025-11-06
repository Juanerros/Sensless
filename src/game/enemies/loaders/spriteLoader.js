// ============================
// CARGADOR CENTRAL DE SPRITES
// ============================

import { loadEnemySprites } from '../sprites/enemySprites.js';
import { loadEffectSprites } from '../effects/effectSprites.js';

// Registro del estado de carga
let spritesLoaded = {
  enemies: false,
  effects: false
};

// Callback global para cuando todos los sprites estén cargados
let onAllSpritesLoadedCallback = null;

// ============================
// CARGA DE SPRITES
// ============================

// Carga todos los sprites necesarios para el juego
export function loadAllGameSprites(p5Instance, onComplete) {
  onAllSpritesLoadedCallback = onComplete;
  
  // Cargar sprites de enemigos
  loadEnemySprites(p5Instance, () => {
    spritesLoaded.enemies = true;
    checkAllSpritesLoaded();
  });
  
  // Cargar sprites de efectos
  loadEffectSprites(p5Instance, () => {
    spritesLoaded.effects = true;
    checkAllSpritesLoaded();
  });
}

// Verifica si todos los sprites han sido cargados
function checkAllSpritesLoaded() {
  if (spritesLoaded.enemies && spritesLoaded.effects) {
    if (onAllSpritesLoadedCallback) {
      onAllSpritesLoadedCallback();
    }
  }
}

// ============================
// UTILIDADES
// ============================

// Verifica si todos los sprites están cargados
export function areAllSpritesLoaded() {
  return spritesLoaded.enemies && spritesLoaded.effects;
}

// Obtiene el estado de carga de los sprites
export function getSpritesLoadingStatus() {
  return spritesLoaded;
}