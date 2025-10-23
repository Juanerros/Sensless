// ============================
// CONFIGURACIÓN DE SPRITES DE ENEMIGOS
// ============================

let enemyElements = [
  { name: 'olvido', sprite: null },
  { name: 'wanderingBud', sprite: null },
  { name: 'bandit', sprite: null },
  // Sprite para las balas del bandit (placeholder)
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
export function loadEnemySprites(p, onComplete) {
  let loadedCount = 0;
  
  const checkComplete = () => {
    loadedCount++;
    if (loadedCount === enemyElements.length && onComplete) {
      onComplete();
    }
  };

  if (enemyElements.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  const spriteConfigs = [
    { path: 'sprites/enemies/Wendigo/Wendingo_idle.gif', name: 'olvido' },
    { path: 'sprites/enemies/Tronco/tronco_idle.gif', name: 'wanderingBud' },
    { path: 'sprites/enemies/Bandido/bandido_idle.gif', name: 'bandit' },
    { path: 'sprites/enemies/Bandido/bandido_proyectil.png', name: 'banditBullet' }
  ];

  spriteConfigs.forEach(config => {
    p.loadImage(config.path, 
      (img) => {
        loadEnemySprite(img, config.name);
        checkComplete();
      },
      () => checkComplete()
    );
  });
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
  const element = enemyElements.find(e => e.name === name);
  return element ? element.sprite : null;
}

// Obtiene una copia escalada del sprite según el tamaño de la hitbox
// Esto evita mutar el sprite original y permite tamaños por instancia
export function getScaledEnemySpriteByName(name, width, height) {
  const base = getEnemySpriteByName(name);
  if (!base || !width || !height) return base || null;
  const copy = base.get(0, 0, base.width, base.height);
  copy.resize(width, height);
  return copy;
}