let enemyElements = [
  {
    name: 'olvido',
    sprite: null,
  }
  // Puedes agregar más tipos de enemigos aquí
];

export function loadEnemySprite(img, name) {
  enemyElements.forEach(e => { 
    if (e.name === name) {
      e.sprite = img;
    }
  });
}

// Función para cargar los sprites de enemigos
export function loadEnemySprites(p, onComplete) {
  let loadedCount = 0;
  
  const checkComplete = () => {
    loadedCount++;
    console.log(`Sprite de enemigo cargado: ${loadedCount}/${enemyElements.length}`);
    if (loadedCount === enemyElements.length && onComplete) {
      console.log('Todos los sprites de enemigos cargados');
      onComplete();
    }
  };

  // Si no hay sprites que cargar, completar inmediatamente
  if (enemyElements.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  p.loadImage('/sprites/enemies/olvido.png', (img) => {
    loadEnemySprite(img, 'olvido');
    checkComplete();
  }, (error) => {
    console.error('Error cargando sprite olvido:', error);
    checkComplete(); 
  });
}

export function getEnemyElements() {
  return enemyElements;
}

export function getEnemySpriteByName(name) {
  const element = enemyElements.find(e => e.name === name);
  return element ? element.sprite : null;
}