// Lista de assets que se cargarÃ¡n en el juego
export const gameAssets = [
  // SPrites de hud
  { name: 'cursor', url: 'sprites/Cursores_mouse/Apuntado.png' },

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
  { name: 'wanderingBudMove', url: 'sprites/enemies/Tronco/tronco_correr.gif', type: 'animated' },
  { name: 'wanderingBudHurt', url: 'sprites/enemies/Tronco/tronco_hurt.png' },
  { name: 'bandit', url: 'sprites/enemies/Bandido/bandido_idle.gif', type: 'animated' },
  { name: 'banditAttack', url: 'sprites/enemies/Bandido/bandido_ataque.png' },
  { name: 'banditHurt', url: 'sprites/enemies/Bandido/bandido_hurt.gif', type: 'animated' },
  { name: 'banditDead', url: 'sprites/enemies/Bandido/bandido_dead.png' },
  { name: 'banditCrossbow', url: 'sprites/enemies/Bandido/bandido_ballesta.png' },
  { name: 'banditBullet', url: 'sprites/enemies/Bandido/bandido_proyectil.png', width: 30, height: 5 }
  ,
  // Proyectiles del jugador
  { name: 'basicProjectile', url: 'sprites/Proyectiles_jugador/disparo_1.gif', type: 'animated' },
  { name: 'waterProjectile', url: 'sprites/Proyectiles_jugador/disparo_agua.gif', type: 'animated' },
  { name: 'fireProjectile', url: 'sprites/Proyectiles_jugador/disparo_fuego.gif', type: 'animated' },
  { name: 'earthProjectile', url: 'sprites/Proyectiles_jugador/Proyectil_tierra.gif', type: 'animated' },
  // Iconos de elementos (HUD)
  { name: 'basicIcon', url: 'sprites/Elementos/Base.png' },
  { name: 'waterIcon', url: 'sprites/Elementos/Agua.png' },
  { name: 'fireIcon', url: 'sprites/Elementos/Fuego.png' },
  { name: 'earthIcon', url: 'sprites/Elementos/Tierra.png' },
  // Efectos de impacto de proyectiles
  { name: 'explosionImpact', url: 'sprites/Proyectiles_jugador/disparo_explosion.gif', type: 'animated' },
  { name: 'earthImpact', url: 'sprites/Proyectiles_jugador/proyectil_tierra_roto.gif', type: 'animated' },
  // Efectos (nubes de cloro)
  { name: 'chlorineCloud1', url: 'sprites/enemies/effects/nubes_de_cloro/1.png' },
  { name: 'chlorineCloud2', url: 'sprites/enemies/effects/nubes_de_cloro/2.png' },
  { name: 'chlorineCloud3', url: 'sprites/enemies/effects/nubes_de_cloro/3.png' }
];

// FunciÃ³n para obtener la lista completa de assets
export function getAllAssets() {
  return gameAssets;
}

// FunciÃ³n para obtener assets por categorÃ­a
export function getAssetsByCategory(category) {
  switch (category) {
    case 'player':
      return gameAssets.filter(asset => 
        asset.name.startsWith('player'));
    case 'enemies':
      return gameAssets.filter(asset => 
        ['olvido', 'wanderingBud', 'wanderingBudMove', 'wanderingBudHurt', 'bandit', 'banditBullet'].includes(asset.name));
    case 'items':
      return gameAssets.filter(asset => 
        ['box', 'hidrogeno', 'oxigeno', 'water'].includes(asset.name));
    default:
      return gameAssets;
  }
}
