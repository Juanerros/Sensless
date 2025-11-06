// ============================
// CONFIGURACIÓN DE SPRITES DE ENEMIGOS
// ============================

import assetLoader from '../../assets/assetLoader.js';

let enemyElements = [
  { name: 'olvido', sprite: null },
  { name: 'wanderingBud', sprite: null },
  { name: 'bandit', sprite: null },
  { name: 'banditBullet', sprite: null }
];

// ============================
// GESTIÓN DE SPRITES DE ENEMIGOS
// ============================

// Asigna una imagen como sprite a un enemigo específico
export function loadEnemySprite(img, name) {
  enemyElements.forEach(e => { 
    if (e.name === name) e.sprite = img;
  });
}

// Carga todos los sprites de enemigos desde sus archivos
// Esta función se mantiene por compatibilidad, pero ahora los sprites
// se cargan a través del assetLoader
export function loadEnemySprites(p, onComplete) {
  // Los sprites ya deberían estar cargados por el assetLoader
  // Asignamos los sprites desde el caché del assetLoader
  enemyElements.forEach(element => {
    const sprite = assetLoader.getAsset(element.name);
    if (sprite) {
      element.sprite = sprite;
    }
  });
  
  // Llamar al callback de completado inmediatamente
  if (onComplete) {
    onComplete();
  }
}

// ============================
// UTILIDADES
// ============================

// Obtiene la lista completa de elementos de enemigos
export function getEnemyElements() {
  return enemyElements;
}

// Obtiene el sprite de un enemigo por su nombre
export function getEnemySpriteByName(name) {
  // Primero intentamos obtener del caché local
  const element = enemyElements.find(e => e.name === name);
  if (element && element.sprite && typeof element.sprite === 'object' && element.sprite.width > 0) {
    return element.sprite;
  }
  
  // Si no está en el caché local, lo obtenemos del assetLoader
  const sprite = assetLoader.getAsset(name);
  
  // Verificar que el sprite es válido
  if (sprite && typeof sprite === 'object' && (sprite.width > 0 || (sprite.gifImage && sprite.gifImage.width > 0))) {
    // Actualizar el caché local
    if (element) {
      element.sprite = sprite;
    }
    return sprite;
  }
  
  console.warn(`Sprite no encontrado o inválido para: ${name}`);
  return null;
}

// Obtiene una copia escalada del sprite según el tamaño de la hitbox
// Esto evita mutar el sprite original y permite tamaños por instancia
export function getScaledEnemySpriteByName(name, width, height) {
  // Verificar parámetros
  if (!name) {
    console.warn(`Parámetros inválidos para getScaledEnemySpriteByName: nombre faltante`);
    return null;
  }
  
  // Valores por defecto para width y height si no se proporcionan
  const defaultSizes = {
    'olvido': { width: 160, height: 160 },
    'wanderingBud': { width: 160, height: 160 },
    'bandit': { width: 70, height: 105 },
    'banditBullet': { width: 30, height: 5 }
  };
  
  // Si width o height no están definidos, usar valores por defecto
  if (!width || !height) {
    const defaultSize = defaultSizes[name];
    if (defaultSize) {
      width = defaultSize.width;
      height = defaultSize.height;
      console.log(`Usando tamaño por defecto para ${name}: ${width}x${height}`);
    } else {
      console.warn(`Parámetros inválidos para getScaledEnemySpriteByName: ${name}, ${width}, ${height}`);
      return null;
    }
  }
  
  try {
    // Usamos directamente el assetLoader para obtener una copia escalada
    const scaledSprite = assetLoader.getScaledAsset(name, width, height);
    
    // Verificar que el sprite escalado es válido
    if (scaledSprite && typeof scaledSprite === 'object' && 
        (scaledSprite.width > 0 || (scaledSprite.gifImage && scaledSprite.gifImage.width > 0))) {
      return scaledSprite;
    } else {
      console.warn(`Sprite escalado inválido para: ${name}`);
      return null;
    }
  } catch (error) {
    console.error(`Error al escalar sprite ${name}:`, error);
    return null;
  }
}