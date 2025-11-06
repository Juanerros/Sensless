import { loadSpritesAsync } from './sprites.js';
import { loadAllGameSprites } from './enemies/loaders/spriteLoader.js';
import { getEnemySpriteByName, getScaledEnemySpriteByName } from './enemies/sprites/enemySprites.js';

class SpriteLoader {
  constructor() {
    this.basicSpritesLoaded = false;
    this.enemySpritesLoaded = false;
    this.enemiesCreated = false;
    this.onAllSpritesLoadedCallback = null;
  }

  loadAllSprites(p5Instance, onComplete) {
    this.onAllSpritesLoadedCallback = onComplete;

    loadSpritesAsync(p5Instance, () => {
      this.basicSpritesLoaded = true;
      this.checkAllSpritesLoaded();
    });

    loadAllGameSprites(p5Instance, () => {
      this.enemySpritesLoaded = true;
      this.checkAllSpritesLoaded();
    });
  }

  checkAllSpritesLoaded() {
    if (this.basicSpritesLoaded && this.enemySpritesLoaded && !this.enemiesCreated) {
      // Ya no creamos enemigos iniciales aquí; el Spawner se encargará de hacerlo poco a poco
      this.enemiesCreated = true;
      
      if (this.onAllSpritesLoadedCallback) {
        this.onAllSpritesLoadedCallback();
      }
    }
  }

  // Mantener API por compatibilidad, pero sin crear enemigos
  createEnemies() {
    // Intencionalmente vacío: los enemigos se crearán con el Spawner
  }

  areSpritesLoaded() {
    return this.basicSpritesLoaded && this.enemySpritesLoaded;
  }

  drawLoadingScreen(p) {
    p.background(100, 100, 100);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    let loadingText = 'Cargando';
    if (this.basicSpritesLoaded) loadingText += ' - Sprites básicos ✓';
    if (this.enemySpritesLoaded) loadingText += ' - Sprites enemigos ✓';
    p.text(loadingText, p.width/2, p.height/2);
  }
}

export default SpriteLoader;