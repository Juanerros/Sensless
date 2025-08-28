import { loadSpriteEnemies } from './enemy';

// Registro de sprites de enemigos
const enemySprites = [
  {
    name: 'olvido',
    path: '/assets/sprites/enemies/olvido.png',
    sprite: null
  },
  // Puedes agregar más tipos de enemigos aquí
];

/**
 * Carga todos los sprites de enemigos
 * @param {p5} p - Instancia de p5.js
 * @param {Function} onComplete - Callback cuando se completa la carga
 */
export function loadEnemySprites(p, onComplete) {
  let loadedCount = 0;
  
  const checkComplete = () => {
    loadedCount++;
    if (loadedCount === enemySprites.length && onComplete) {
      onComplete();
    }
  };

  // Si no hay sprites que cargar, completar inmediatamente
  if (enemySprites.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  // Cargar cada sprite de enemigo
  enemySprites.forEach((enemyType, index) => {
    
    p.loadImage(
      enemyType.path,
      // Callback de éxito
      (img) => {
        enemyType.sprite = img;
        loadSpriteEnemies(img, enemyType.name);
        checkComplete();
      },
      // Callback de error
      (error) => {
        console.error(`Error cargando sprite ${enemyType.name}:`, error);
        console.error(`Ruta: ${enemyType.path}`);
        // Aún así contar como "cargado" para no bloquear el juego
        checkComplete();
      }
    );
  });
}

/**
 * Obtiene un sprite de enemigo por nombre
 * @param {string} name - Nombre del enemigo
 * @returns {p5.Image|null} - Sprite del enemigo o null si no existe
 */
export function getEnemySpriteByName(name) {
  const enemyType = enemySprites.find(e => e.name === name);
  return enemyType ? enemyType.sprite : null;
}