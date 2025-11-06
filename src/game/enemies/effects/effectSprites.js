// ============================
// CONFIGURACIÓN DE SPRITES DE EFECTOS (centralizado en assets)
// ============================
// Ahora delegamos completamente en el sistema de assets para cargar y obtener
// las imágenes de los efectos. Este módulo sólo provee funciones de acceso.

import { getSpriteByName } from '../../sprites.js';

// ============================
// GESTIÓN DE SPRITES DE EFECTOS
// ============================

// Ya no asignamos manualmente sprites; el assetLoader gestiona el caché.
export function loadEffectSprite(img, name) {
  // Mantener la firma por compatibilidad (no hace nada).
}

// Carga todos los sprites de efectos desde sus archivos
export function loadEffectSprites(p, onComplete) {
  // Centralizado en assetLoader a través de assetList.js y main.js.
  // Esta función ahora sólo dispara el callback inmediatamente para indicar
  // que los "effect sprites" están disponibles a través de getSpriteByName.
  if (typeof onComplete === 'function') {
    onComplete();
  }
}

// ============================
// UTILIDADES
// ============================

// Obtiene la lista completa de elementos de efectos
export function getEffectElements() {
  // Ya no mantenemos un registro local; retornamos nombres esperados.
  return [
    { name: 'chlorineCloud1' },
    { name: 'chlorineCloud2' },
    { name: 'chlorineCloud3' }
  ];
}

// Obtiene el sprite de un efecto por su nombre
export function getEffectSpriteByName(name) {
  // Obtener directamente del sistema central de assets
  return getSpriteByName(name);
}