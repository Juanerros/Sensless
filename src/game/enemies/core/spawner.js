import { ChaserEnemy } from './enemy.js';
import { WanderingBud } from '../types/wanderingBud.js';
import { Bandit } from '../types/bandit.js';
import { getWorld } from '../../physics.js';
import { getScaledEnemySpriteByName } from '../sprites/enemySprites.js';
import { enemies } from './enemy.js';

class EnemySpawner {
  constructor() {
    this.world = getWorld();
    this.player = null;
    this.intervalMs = 3000; 
    this.lastSpawnAt = 0;
    this.maxEnemies = 15;
    this.active = true;
    this.spawnRadiusX = { min: 300, max: 650 }; 
    this.spawnOffsetY = -40; 
    this.enemyTypes = ['olvido', 'wanderingBud', 'bandit'];
  }

  setPlayer(player) {
    this.player = player;
  }

  setIntervalMs(ms) {
    this.intervalMs = ms;
  }

  setMaxEnemies(n) {
    this.maxEnemies = n;
  }

  start() { this.active = true; }
  stop() { this.active = false; }

  update(p) {
    if (!this.active || !this.player) return;

    const now = p.millis();
    if (now - this.lastSpawnAt < this.intervalMs) return;

    if (enemies.length >= this.maxEnemies) return;

    this.spawnRandomNearPlayer();
    this.lastSpawnAt = now;
  }

  spawnRandomNearPlayer() {
    const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    const { x, y } = this.getSpawnPosition();

    let enemy;
    if (type === 'olvido') {
      enemy = new ChaserEnemy(x, y, this.world);
    } else if (type === 'wanderingBud') {
      enemy = new WanderingBud(x, y, this.world);
    } else {
      enemy = new Bandit(x, y, this.world);
    }

    // Verificar que enemy y sus propiedades existen antes de asignar sprite
    if (enemy) {
      // asignar sprite preescalado
      const sprite = getScaledEnemySpriteByName(type);
      if (sprite) {
        enemy.sprite = sprite;
        if (enemy.body) enemy.body.sprite = sprite;
      }
    }
  }

  getSpawnPosition() {
    const baseX = this.player.position.x;
    const baseY = this.player.position.y + this.spawnOffsetY;
    const range = this.spawnRadiusX;

    const dir = Math.random() < 0.5 ? -1 : 1;
    const offset = range.min + Math.random() * (range.max - range.min);
    return { x: baseX + dir * offset, y: baseY };
  }
}

export default EnemySpawner;