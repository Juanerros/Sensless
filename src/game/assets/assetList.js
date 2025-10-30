// Lista de assets que se cargarán en el juego
export const gameAssets = [
  // SPrites de hud
  { name: 'cursor', url: 'sprites/Cursores_mouse/Cursor.png' },

  // Sprites del jugador
  { name: 'player', url: 'sprites/Zenith.png' },
  { name: 'playerIdleGif', url: 'sprites/zenith/idle.gif', type: 'animated' },
  { name: 'playerMoveGif', url: 'sprites/zenith/correr.gif', type: 'animated' },
  { name: 'playerJump1', url: 'sprites/zenith/salto 1.png' },
  { name: 'playerJump2', url: 'sprites/zenith/salto 2.png' },
  { name: 'playerHurt1', url: 'sprites/zenith/zenith_hurt_1.png' },
  { name: 'playerHurt2', url: 'sprites/zenith/zenith_hurt_2.png' },
  { name: 'playerDead', url: 'sprites/zenith/dead.png' },
  
  // Sprites de elementos del juego
  { name: 'box', url: 'sprites/box-a.png' },
  { name: 'hidrogeno', url: 'sprites/quimic/hidrogeno-pixel.png' },
  { name: 'oxigeno', url: 'sprites/quimic/oxigeno-pixel.png' },
  { name: 'water', url: 'sprites/spells/chispa-agua.png' },
  
  // Sprites de enemigos
  { name: 'olvido', url: 'sprites/enemies/Wendigo/Wendingo_idle.gif', type: 'animated' },
  { name: 'wanderingBud', url: 'sprites/enemies/Tronco/tronco_idle.gif', type: 'animated' },
  { name: 'bandit', url: 'sprites/enemies/Bandido/bandido_idle.gif', type: 'animated' },
  { name: 'banditBullet', url: 'sprites/enemies/Bandido/bandido_proyectil.png', width: 30, height: 5 }
];

// Función para obtener la lista completa de assets
export function getAllAssets() {
  return gameAssets;
}

// Función para obtener assets por categoría
export function getAssetsByCategory(category) {
  switch (category) {
    case 'player':
      return gameAssets.filter(asset => 
        asset.name.startsWith('player'));
    case 'enemies':
      return gameAssets.filter(asset => 
        ['olvido', 'wanderingBud', 'bandit', 'banditBullet'].includes(asset.name));
    case 'items':
      return gameAssets.filter(asset => 
        ['box', 'hidrogeno', 'oxigeno', 'water'].includes(asset.name));
    default:
      return gameAssets;
  }
}