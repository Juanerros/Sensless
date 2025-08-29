let elements = [
  {
    name: 'box',
    sprite: null,
  },
  {
    name: 'hidrogeno',
    sprite: null,
  },
  {
    name: 'oxigeno',
    sprite: null,
  },
  {
    name: 'water',
    sprite: null,
  },
  {
    name: 'player',
    sprite: null,
  }
];

export function loadSprite(img, name) {
  elements.forEach(e => { 
    if (e.name === name) {
      e.sprite = img;
    }
  });
}

// Funcion para cargar los sprites
export function loadSpritesAsync(p, onComplete) {
  let loadedCount = 0;
  
  const checkComplete = () => {
    loadedCount++;
    if (loadedCount === elements.length && onComplete) {
      onComplete();
    }
  };

  p.loadImage('/sprites/Zenith.png', (img) => {
    loadSprite(img, 'player');
    checkComplete();
  });
  
  p.loadImage('/sprites/box-a.png', (img) => {
    loadSprite(img, 'box');
    checkComplete();
  });
  
  p.loadImage('/sprites/quimic/hidrogeno-pixel.png', (img) => {
    loadSprite(img, 'hidrogeno');
    checkComplete();
  });
  
  p.loadImage('/sprites/quimic/oxigeno-pixel.png', (img) => {
    loadSprite(img, 'oxigeno');
    checkComplete();
  });

   p.loadImage('/sprites/spells/chispa-agua.png', (img) => {
    loadSprite(img, 'water');
    checkComplete();
  });

}

export function getElements() {
  return elements;
}

export function getSpriteByName(name) {
  const element = elements.find(e => e.name === name);
  return element ? element.sprite : null;
}