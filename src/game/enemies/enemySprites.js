let enemyElements = [
  {
    name: 'olvido',
    sprite: null,
  },
  {
    name: 'chlorineCloud1',
    sprite: null,
  },
  {
    name: 'chlorineCloud2',
    sprite: null,
  },
  {
    name: 'chlorineCloud3',
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

  // Cargar sprites de nubes de cloro
  p.loadImage('/sprites/enemies/efects/nubes_de_cloro/1.png', (img) => {
    loadEnemySprite(img, 'chlorineCloud1');
    checkComplete();
  }, (error) => {
    console.error('Error cargando sprite chlorineCloud1:', error);
    checkComplete(); 
  });

  p.loadImage('/sprites/enemies/efects/nubes_de_cloro/2.png', (img) => {
    loadEnemySprite(img, 'chlorineCloud2');
    checkComplete();
  }, (error) => {
    console.error('Error cargando sprite chlorineCloud2:', error);
    checkComplete(); 
  });

  p.loadImage('/sprites/enemies/efects/nubes_de_cloro/3.png', (img) => {
    loadEnemySprite(img, 'chlorineCloud3');
    checkComplete();
  }, (error) => {
    console.error('Error cargando sprite chlorineCloud3:', error);
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