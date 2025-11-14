import { Wendigo } from '../types/wendigo.js';
import { Olvido } from '../types/olvido.js';
import { WanderingBud } from '../types/wanderingBud.js';
import { Bandit } from '../types/bandit.js';
import { getWorld } from '../../physics.js';
import { getScaledEnemySpriteByName } from '../sprites/enemySprites.js';
import { enemies } from './enemy.js';
import { getVisitedProgress, getVisitedChunksCount, getTerrainHeightAt } from '../../worldGeneration.js';
import { addScore, gameState } from '../../state.js';

class EnemySpawner {
  constructor() {
    this.world = getWorld();
    this.player = null;
    this.intervalMs = 3000; 
    this.lastSpawnAt = 0;
    this.maxEnemies = 1;
    this.active = true;
    this.spawnRadiusX = { min: 300, max: 650 }; 
    this.spawnOffsetY = -40; 
    // Tipos activos en spawns regulares (sin Olvido)
    this.enemyTypes = ['wendigo', 'wanderingBud', 'bandit'];
    // Pesos iniciales: Wendigo > Tronco (wanderingBud) > Bandido
    this.spawnWeights = { wendigo: 0.6, wanderingBud: 0.3, bandit: 0.1 };
    this.hasScoreAdded = false;
    
    // Progreso basado en chunks visitados
    this.progressGoalChunks = 20; // meta para 100%
    this.progressPercent = 0; // 0..1
    // Chunks necesarios por cada 3% de progreso (ajustable)
    this.chunksPerStep = 1; // antes: 5
    this.milestones = [0.2, 0.4, 0.6, 0.8, 1.0];
    this.triggeredMilestones = new Set();

    // Configuración de oleadas por hito (se calculará dinámicamente)
    this.waveConfigs = {};

    // Control de oleadas
    this.inWave = false;
    this.waveCooldownMs = 6000;
    this.lastWaveAt = 0;
    this.waveCount = 0;
    this.approachLeadMs = 2500; // cartel previo a la oleada
    this.pendingWave = null; // { startAt, cfg }
    this.waveBannerText = 'Oleada aproximándose...';
    this.waveBannerUntil = 0;

    // Final del ciclo
    this.endgameTriggered = false;
    this.endgameOlvidoSpawnAt = 0;
    this.olvidoActive = false;
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
    // Permitir lógica de final incluso si el spawner está inactivo
    if (!this.player) return;
    if (!this.active && !this.endgameTriggered) return;

    // Actualizar progreso de chunks visitados
    // Escala acelerada: 12% por cada chunk (ajustado por this.chunksPerStep)
    const visitedCount = getVisitedChunksCount();
    this.progressPercent = Math.max(0, Math.min(1, visitedCount * (0.08 / this.chunksPerStep)));

    if(!this.hasScoreAdded && (this.progressPercent === 0.5)) {
      addScore(1000);
      this.hasScoreAdded = true;
    }

    // Verificar hitos y programar oleadas (con banner)
    this.checkAndTriggerWaves(p);

    const now = p.millis();

    // Ejecutar oleada pendiente cuando llegue el momento
    if (this.pendingWave && now >= this.pendingWave.startAt) {
      this.spawnWave(this.pendingWave.cfg);
      this.pendingWave = null;
      this.inWave = true;
      this.lastWaveAt = now;
      this.waveCount++;
      // Aumentar ritmo y probabilidades tras cada oleada
      this.intervalMs = Math.max(1200, Math.floor(this.intervalMs * 0.9));
      this.scaleSpawnWeights(1.08);
    }
    if (now - this.lastSpawnAt < this.intervalMs) return;

    if (enemies.length >= this.maxEnemies) return;

    // Spawning aleatorio se mantiene, pero se pausa si hay oleada activa reciente
    const waveRecentlyTriggered = (now - this.lastWaveAt) < this.waveCooldownMs;
    if (!waveRecentlyTriggered) {
      // Reducir spawns ambientales (50% menos)
      const ambientBatch = 1;
      for (let i = 0; i < ambientBatch; i++) {
        if (enemies.length >= this.maxEnemies) break;
        this.spawnRandomOutsideScreenOnGround();
      }
    }
    this.lastSpawnAt = now;

    // Final: al 100% detener spawns, limpiar enemigos y preparar Olvido + banner
    if (!this.endgameTriggered && this.progressPercent >= 1.0) {
      this.endgameTriggered = true;
      this.active = false;
      this.killAllEnemies();
      this.endgameOlvidoSpawnAt = now + 4000; // 4 segundos
      this.waveBannerText = 'Jefe aproximándose...';
      this.waveBannerUntil = now + 4000;
    }

    // Spawn de Olvido tras 4 segundos
    if (this.endgameTriggered && !this.olvidoActive && now >= this.endgameOlvidoSpawnAt) {
      this.spawnSpecificType('olvido', true);
      this.olvidoActive = true;
    }

    // Game Over cuando Olvido muera
    if (this.olvidoActive) {
      const boss = enemies.find(e => e && (e.name === 'olvido' || e.type === 'olvido'));
      if (!boss) {
        gameState.isGameOver = true;
        this.olvidoActive = false;
      }
    }
  }

  // Dibuja una barra de progreso basada en chunks visitados y marcas de hitos
  draw(p) {
    p.push();
    p.resetMatrix();
    p.rectMode(p.CORNER);
    p.textAlign(p.LEFT, p.TOP);

    const barWidth = 280;
    const barHeight = 14;
    const margin = 20;
    const viewportW = window.innerWidth;
    const y = 50; // arriba a la derecha, sobre HUD
    const x = Math.max(margin, viewportW - margin - barWidth);

    // Fondo con sombra suave
    p.noStroke();
    p.fill(0, 0, 0, 80);
    p.rect(x - 4, y - 4, barWidth + 8, barHeight + 8, 10);
    p.fill(0, 0, 0, 180);
    p.rect(x - 2, y - 2, barWidth + 4, barHeight + 4, 10);

    // Barra base con ligero gradiente oscuro
    const ctx = p.drawingContext;
    const baseGrad = ctx.createLinearGradient(x, y, x, y + barHeight);
    baseGrad.addColorStop(0, 'rgba(25,25,35,1)');
    baseGrad.addColorStop(1, 'rgba(45,45,65,1)');
    const prevFill = ctx.fillStyle;
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    // usar path para esquinas redondeadas del canvas
    const r = 8;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, y + barHeight - r);
    ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
    ctx.lineTo(x + r, y + barHeight);
    ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Progreso con gradiente azul y brillo
    const pct = Number.isFinite(this.progressPercent) ? this.progressPercent : 0;
    const w = Math.max(0, Math.min(barWidth, barWidth * pct));
    const progGrad = ctx.createLinearGradient(x, y, x + w, y);
    progGrad.addColorStop(0, 'rgba(0,160,255,1)');
    progGrad.addColorStop(0.5, 'rgba(0,210,255,1)');
    progGrad.addColorStop(1, 'rgba(80,240,255,1)');
    ctx.fillStyle = progGrad;
    ctx.beginPath();
    const pr = 8;
    const wRounded = Math.max(0, w);
    // forma con esquinas redondeadas a la izquierda y a la derecha solo si llena toda la barra
    ctx.moveTo(x + pr, y);
    ctx.lineTo(x + wRounded - (pct >= 1 ? pr : 0), y);
    if (pct >= 1) {
      ctx.quadraticCurveTo(x + wRounded, y, x + wRounded, y + pr);
      ctx.lineTo(x + wRounded, y + barHeight - pr);
      ctx.quadraticCurveTo(x + wRounded, y + barHeight, x + wRounded - pr, y + barHeight);
    } else {
      ctx.lineTo(x + wRounded, y);
      ctx.lineTo(x + wRounded, y + barHeight);
      ctx.lineTo(x + pr, y + barHeight);
    }
    ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - pr);
    ctx.lineTo(x, y + pr);
    ctx.quadraticCurveTo(x, y, x + pr, y);
    ctx.closePath();
    ctx.fill();

    // Brillo superior sutil
    const shineGrad = ctx.createLinearGradient(x, y, x, y + barHeight);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = shineGrad;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, y + barHeight * 0.55);
    ctx.lineTo(x, y + barHeight * 0.55);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Contorno
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(x, y, barWidth, barHeight, 8);

    // Marcas de hitos como pequeñas muescas
    p.stroke(255, 255, 255, 180);
    p.strokeWeight(2);
    for (const m of this.milestones) {
      const mx = x + (barWidth * m);
      p.line(mx, y - 4, mx, y + barHeight + 4);
    }

    // Pico de progreso con pulso (indicador al frente)
    const tipX = x + w;
    const pulse = Math.max(0, Math.sin(p.millis() * 0.008));
    p.noStroke();
    p.fill(80, 240, 255, 120 + 60 * pulse);
    if (w > 4) p.circle(tipX, y + barHeight / 2, 6 + 2 * pulse);

    // Etiqueta y porcentaje
    p.noStroke();
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Spawn ${Math.floor(pct * 100)}%`, x - 8, y + barHeight / 2);

    // Restaurar fillStyle original del canvas
    ctx.fillStyle = prevFill;

    p.pop();

    // Banner de oleada
    this.drawWaveBanner(p);
  }

  checkAndTriggerWaves(p) {
    const now = p.millis();
    for (const milestone of this.milestones) {
      if (this.progressPercent >= milestone && !this.triggeredMilestones.has(milestone)) {
        // No programar oleada en el 100% ni si el final está activado
        if (milestone >= 1.0 || this.endgameTriggered) {
          this.triggeredMilestones.add(milestone);
          continue;
        }
        const cfg = this.getWaveConfigForMilestone(milestone);
        // Programar oleada con aviso previo
        this.waveBannerText = 'Oleada aproximándose...';
        this.pendingWave = { startAt: now + this.approachLeadMs, cfg };
        this.waveBannerUntil = now + this.approachLeadMs;
        this.triggeredMilestones.add(milestone);
      }
    }
  }

  spawnWave(cfg) {
    if (!cfg || !Array.isArray(cfg.entries)) return;
    // Respetar el límite actual de enemigos
    const spawnable = Math.max(0, this.maxEnemies - enemies.length);
    if (spawnable <= 0) return;
    const target = Math.min(spawnable, cfg.total || spawnable);
    let spawned = 0;
    outer: for (const entry of cfg.entries) {
      const count = Math.max(0, entry.count || 0);
      for (let i = 0; i < count; i++) {
        if (spawned >= target) break outer;
        this.spawnSpecificType(entry.type, true);
        spawned++;
      }
    }
  }

  spawnRandomOutsideScreenOnGround() {
    const type = this.pickWeightedType();
    this.spawnSpecificType(type, true);
  }

  spawnSpecificType(type, forceOutside = false) {
    const { x, y } = this.getGroundSpawnPosition(forceOutside);
    let enemy;
    if (type === 'olvido') {
      enemy = new Olvido(x, y, this.world);
      // Asegurar vida completa del jefe final
      enemy.health = enemy.maxHealth || 200;
    } else if (type === 'wendigo') {
      enemy = new Wendigo(x, y, this.world);
    } else if (type === 'wanderingBud') {
      enemy = new WanderingBud(x, y, this.world);
    } else {
      enemy = new Bandit(x, y, this.world);
    }

    if (enemy) {
      // Permitir alias 'olvido' para compatibilidad con assets existentes
      const spriteName = type;
      const sprite = getScaledEnemySpriteByName(spriteName);
      if (sprite) {
        enemy.sprite = sprite;
        if (enemy.body) enemy.body.sprite = sprite;
      }
    }
  }

  getGroundSpawnPosition(forceOutside = true) {
    const baseX = this.player.position.x;
    const viewportW = window.innerWidth || 1280;
    const margin = 120;
    const off = Math.round(viewportW / 2) + margin;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const x = (forceOutside) ? (baseX + dir * off) : (baseX + dir * off);
    const terrainY = getTerrainHeightAt(x);
    const y = terrainY - 40; // "sobre" el suelo
    return { x, y };
  }

  pickWeightedType() {
    const entries = Object.entries(this.spawnWeights);
    const sum = entries.reduce((acc, [, w]) => acc + w, 0) || 1;
    let r = Math.random() * sum;
    for (const [type, w] of entries) {
      if ((r -= w) <= 0) return type;
    }
    return this.enemyTypes[0];
  }

  scaleSpawnWeights(factor = 1.1) {
    const types = Object.keys(this.spawnWeights);
    for (const t of types) {
      this.spawnWeights[t] = Math.max(0.01, this.spawnWeights[t] * factor);
    }
    const sum = types.reduce((acc, t) => acc + this.spawnWeights[t], 0);
    for (const t of types) {
      this.spawnWeights[t] /= sum;
    }
  }

  getWaveConfigForMilestone(milestone) {
    // Tamaño de oleadas: 10, 15, 20, ... sumando de 5 en 5
    const baseTotal = 10 + this.waveCount * 5;
    // Reducir tamaño de oleadas en 50%
    const reduced = Math.max(1, Math.floor(baseTotal * 0.5));
    const total = Math.min(reduced, 25);
    const wW = this.spawnWeights.wendigo || 0.5;
    const wB = this.spawnWeights.bandit || 0.2;
    const wT = this.spawnWeights.wanderingBud || 0.3;
    const cntW = Math.max(1, Math.floor(total * wW));
    const cntT = Math.max(1, Math.floor(total * wT));
    const cntB = Math.max(0, total - cntW - cntT);
    return {
      total,
      entries: [
        { type: 'wendigo', count: cntW },
        { type: 'wanderingBud', count: cntT },
        { type: 'bandit', count: cntB }
      ]
    };
  }

  killAllEnemies() {
    try {
      for (const e of enemies.slice()) {
        if (e && typeof e.destroy === 'function') e.destroy();
      }
    } catch (_) {}
  }

  drawWaveBanner(p) {
    const now = p.millis();
    if (this.waveBannerUntil && now < this.waveBannerUntil) {
      p.push();
      p.resetMatrix();
      const cx = (window.innerWidth || 1280) / 2;
      // Bajar el banner un poco y hacerlo más minimalista
      const y = 110;
      const padX = 10;
      const padY = 6;
      const text = this.waveBannerText || 'Oleada aproximándose...';
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);

      // Medir texto de forma aproximada
      const w = p.textWidth(text) + padX * 2;
      const h = 26;
      const x = cx - w / 2;
      const r = 8;

      // Fondo minimalista: rectángulo semitransparente sin efectos
      p.noStroke();
      p.fill(20, 25, 35, 180);
      p.rect(x, y - h / 2, w, h, r);

      // Texto simple
      p.fill(255);
      p.text(text, cx, y);
      p.pop();
    }
  }
}

export default EnemySpawner;