import { ChaserEnemy } from './enemy.js';
import { WanderingBud } from '../types/wanderingBud.js';
import { Bandit } from '../types/bandit.js';
import { getWorld } from '../../physics.js';
import { getScaledEnemySpriteByName } from '../sprites/enemySprites.js';
import { enemies } from './enemy.js';
import { getVisitedProgress } from '../../worldGeneration.js';

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

    // Progreso basado en chunks visitados
    this.progressGoalChunks = 20; // meta para 100%
    this.progressPercent = 0; // 0..1
    this.milestones = [0.2, 0.4, 0.6, 0.8, 1.0];
    this.triggeredMilestones = new Set();

    // Configuración de oleadas por hito
    // Puedes ajustar libremente los tipos y cantidades
    this.waveConfigs = {
      0.2: { total: 5, entries: [ { type: 'olvido', count: 3 }, { type: 'wanderingBud', count: 2 } ] },
      0.4: { total: 8, entries: [ { type: 'bandit', count: 3 }, { type: 'olvido', count: 5 } ] },
      0.6: { total: 10, entries: [ { type: 'wanderingBud', count: 4 }, { type: 'bandit', count: 6 } ] },
      0.8: { total: 12, entries: [ { type: 'olvido', count: 6 }, { type: 'bandit', count: 6 } ] },
      1.0: { total: 15, entries: [ { type: 'bandit', count: 8 }, { type: 'wanderingBud', count: 7 } ] },
    };

    // Control de oleadas
    this.inWave = false;
    this.waveCooldownMs = 6000;
    this.lastWaveAt = 0;
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

    // Actualizar progreso de chunks visitados
    const prog = getVisitedProgress(this.progressGoalChunks);
    this.progressPercent = prog.percent;

    // Verificar hitos y disparar oleadas
    this.checkAndTriggerWaves(p);

    const now = p.millis();
    if (now - this.lastSpawnAt < this.intervalMs) return;

    if (enemies.length >= this.maxEnemies) return;

    // Spawning aleatorio se mantiene, pero se pausa si hay oleada activa reciente
    const waveRecentlyTriggered = (now - this.lastWaveAt) < this.waveCooldownMs;
    if (!waveRecentlyTriggered) {
      this.spawnRandomNearPlayer();
    }
    this.lastSpawnAt = now;
  }

  // Dibuja una barra de progreso basada en chunks visitados y marcas de hitos
  draw(p) {
    p.push();
    p.resetMatrix();
    p.rectMode(p.CORNER);
    p.textAlign(p.LEFT, p.TOP);

    const barWidth = 240;
    const barHeight = 12;
    const margin = 20;
    // Usar tamaño del viewport para anclar a la esquina visible (como hace HUD/GameOver)
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const y = 50; // un poco más arriba que la barra de vida del HUD
    const x = Math.max(margin, viewportW - margin - barWidth); // arriba a la derecha dentro del viewport

    // Fondo contenedor
    p.noStroke();
    p.fill(0, 0, 0, 160);
    p.rect(x - 6, y - 6, barWidth + 12, barHeight + 12, 6);

    // Barra base
    p.fill(40);
    p.rect(x, y, barWidth, barHeight, 4);

    // Progreso
    const pct = Number.isFinite(this.progressPercent) ? this.progressPercent : 0;
    p.fill(0, 220, 255);
    const w = Math.max(0, Math.min(barWidth, barWidth * pct));
    p.rect(x, y, w, barHeight, 4);

    // Borde para visibilidad
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(x, y, barWidth, barHeight, 4);

    // Marcas de hitos
    p.stroke(255, 255, 255, 180);
    p.strokeWeight(2);
    for (const m of this.milestones) {
      const mx = x + (barWidth * m);
      p.line(mx, y - 3, mx, y + barHeight + 3);
    }

    // Texto
    p.noStroke();
    p.fill(255);
    p.textSize(12);
    p.text(`Progreso: ${Math.floor(pct * 100)}%`, x, y + barHeight + 6);

    p.pop();
  }

  checkAndTriggerWaves(p) {
    const now = p.millis();
    for (const milestone of this.milestones) {
      if (this.progressPercent >= milestone && !this.triggeredMilestones.has(milestone)) {
        const cfg = this.waveConfigs[milestone];
        this.spawnWave(cfg);
        this.triggeredMilestones.add(milestone);
        this.lastWaveAt = now;
      }
    }
  }

  spawnWave(cfg) {
    if (!cfg || !Array.isArray(cfg.entries)) return;
    let spawned = 0;
    for (const entry of cfg.entries) {
      for (let i = 0; i < (entry.count || 0); i++) {
        if (enemies.length >= this.maxEnemies) return;
        this.spawnSpecificType(entry.type);
        spawned++;
        if (spawned >= cfg.total) return;
      }
    }
  }

  spawnRandomNearPlayer() {
    const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    this.spawnSpecificType(type);
  }

  spawnSpecificType(type) {
    const { x, y } = this.getSpawnPosition();
    let enemy;
    if (type === 'olvido') {
      enemy = new ChaserEnemy(x, y, this.world);
    } else if (type === 'wanderingBud') {
      enemy = new WanderingBud(x, y, this.world);
    } else {
      enemy = new Bandit(x, y, this.world);
    }

    if (enemy) {
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