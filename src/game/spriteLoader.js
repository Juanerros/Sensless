import { loadSpritesAsync } from './sprites.js';
import { loadEnemySprites, getEnemySpriteByName } from './enemies/enemySprites.js';
import { ChaserEnemy } from './enemies/enemy.js';
import { WanderingBud } from './enemies/wanderingBud.js';
import { Bandit } from './enemies/bandit.js';
import { getWorld } from './physics.js';

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

    loadEnemySprites(p5Instance, () => {
      this.enemySpritesLoaded = true;
      this.checkAllSpritesLoaded();
    });
  }

  checkAllSpritesLoaded() {
    if (this.basicSpritesLoaded && this.enemySpritesLoaded && !this.enemiesCreated) {
      this.createEnemies();
      this.enemiesCreated = true;
      
      if (this.onAllSpritesLoadedCallback) {
        this.onAllSpritesLoadedCallback();
      }
    }
  }

  createEnemies() {
    const world = getWorld();
    
    const chaser = new ChaserEnemy(900, 700, world);
    const wanderer = new WanderingBud(700, 700, world);
    const bandit = new Bandit(1200, 600, world);
    
    this.assignSpritesToEnemies(chaser, wanderer);
  }

  assignSpritesToEnemies(chaser, wanderer) {
    const olvidoSprite = getEnemySpriteByName('olvido');
    if (olvidoSprite) {
      chaser.sprite = olvidoSprite;
      chaser.body.sprite = olvidoSprite;
    }

    const wanderingBudSprite = getEnemySpriteByName('wanderingBud');
    if (wanderingBudSprite) {
      wanderer.sprite = wanderingBudSprite;
      wanderer.body.sprite = wanderingBudSprite;
    }
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