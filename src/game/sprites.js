import assetLoader from './assets/assetLoader.js';

// Lista de nombres de sprites para mantener compatibilidad
export const elements = [
  { name: 'box', sprite: null },
  { name: 'hidrogeno', sprite: null },
  { name: 'oxigeno', sprite: null },
  { name: 'water', sprite: null },
  { name: 'player', sprite: null },
  { name: 'playerIdleGif', sprite: null },
  { name: 'playerMoveGif', sprite: null },
  { name: 'playerJump1', sprite: null },
  { name: 'playerJump2', sprite: null },
  { name: 'playerHurt1', sprite: null },
  { name: 'playerHurt2', sprite: null },
  { name: 'playerDead', sprite: null },
  { name: 'gameLogo', sprite: null }
];

// Función para asignar un sprite al caché local
export function loadSprite(img, name) {
  elements.forEach(e => { 
    if (e.name === name) {
      e.sprite = img;
    }
  });
}

// Esta función ahora es un adaptador que mantiene compatibilidad con el código existente
// pero no carga realmente los sprites, ya que eso lo hace assetLoader
export function loadSpritesAsync(p, onComplete) {
  // Simulamos la carga para mantener compatibilidad
  setTimeout(() => {
    if (onComplete) {
      onComplete();
    }
  }, 100);
}

// Obtener la lista de elementos (para compatibilidad)
export function getElements() {
  return elements;
}

// Obtener un sprite por su nombre
// Primero busca en el caché local, luego en assetLoader
export function getSpriteByName(name) {
  // Buscar en el caché local primero
  const element = elements.find(e => e.name === name);
  if (element && element.sprite) {
    return element.sprite;
  }
  
  // Si no está en el caché local, intentar obtenerlo del assetLoader
  try {
    const sprite = assetLoader.getAsset(name);
    
    // Si se encontró en assetLoader, guardarlo en el caché local
    if (sprite && element) {
      element.sprite = sprite;
    }
    
    return sprite;
  } catch (error) {
    console.error(`Error al obtener sprite ${name}:`, error);
    return null;
  }
}