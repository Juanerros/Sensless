// ============================
// CONFIGURACIÓN DE SPRITES DE EFECTOS
// ============================

let effectElements = [
  { name: 'chlorineCloud1', sprite: null },
  { name: 'chlorineCloud2', sprite: null },
  { name: 'chlorineCloud3', sprite: null }
];

// ============================
// GESTIÓN DE SPRITES DE EFECTOS
// ============================

// Asigna una imagen como sprite a un efecto específico
export function loadEffectSprite(img, name) {
  effectElements.forEach(e => { 
    if (e.name === name) e.sprite = img;
  });
}

// Carga todos los sprites de efectos desde sus archivos
export function loadEffectSprites(p, onComplete) {
  let loadedCount = 0;
  
  const checkComplete = () => {
    loadedCount++;
    if (loadedCount === effectElements.length && onComplete) {
      onComplete();
    }
  };

  if (effectElements.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  const spriteConfigs = [
    { path: 'sprites/enemies/efects/nubes_de_cloro/1.png', name: 'chlorineCloud1' },
    { path: 'sprites/enemies/efects/nubes_de_cloro/2.png', name: 'chlorineCloud2' },
    { path: 'sprites/enemies/efects/nubes_de_cloro/3.png', name: 'chlorineCloud3' }
  ];

  spriteConfigs.forEach(config => {
    p.loadImage(config.path, 
      (img) => {
        loadEffectSprite(img, config.name);
        checkComplete();
      },
      () => checkComplete()
    );
  });
}

// ============================
// UTILIDADES
// ============================

// Obtiene la lista completa de elementos de efectos
export function getEffectElements() {
  return effectElements;
}

// Obtiene el sprite de un efecto por su nombre
export function getEffectSpriteByName(name) {
  const element = effectElements.find(e => e.name === name);
  return element ? element.sprite : null;
}