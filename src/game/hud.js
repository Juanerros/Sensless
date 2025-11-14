import { drawInventoryUI } from './inventory.js';
import assetLoader from './assets/assetLoader.js';
import { gameState } from './state.js';
import { getEnemies } from './enemies/core/enemy.js';
import { getSelectedShotType } from './magicShotsSystem.js';
import { getShotTypeByName } from './shotTypes.js';
import { getXPVisualState, getXPEffects, getLevelUpOptions, isLevelUpPending } from './xpSystem.js';

class HUD {
  constructor() {
    this.showBorderBox = true;
  }

  drawInventory(p) {
    p.push();
    p.resetMatrix();
    drawInventoryUI(p);
    p.pop();
  }

  drawHealthBar(p, playerHealth, maxHealth) {
    p.push();
    p.resetMatrix();

    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 100;

    const healthPercentage = playerHealth / maxHealth;

    p.fill(255, 0, 0);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(barX, barY, barWidth, barHeight);

    p.fill(0, 255, 0);
    p.rect(barX, barY, barWidth * healthPercentage, barHeight);

    p.stroke(255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(barX, barY, barWidth, barHeight);

    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(`${playerHealth}/${maxHealth}`, barX + barWidth + 10, barY + barHeight / 2);

    p.pop();
  }

  drawBorderBox(p) {
    if (!this.showBorderBox) return;

    p.push();
    p.resetMatrix();

    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(p.mouseX, p.mouseY, 50, 50);

    p.pop();
  }

  drawAll(p, playerHealth, maxHealth) {
    this.drawInventory(p);
    this.drawHealthBar(p, playerHealth, maxHealth);
    this.drawBossHealthBar(p);
    this.drawXPBar(p);
    this.drawScore(p);
    this.drawShotIcon(p);
    // if (this.isPosiblyToShowBorderBox(p, getBodies())) this.drawBorderBox(p);
    this.drawCursor(p);
    if (isLevelUpPending()) this.drawLevelUpSelection(p);
  }

  drawBossHealthBar(p) {
    p.push();
    p.resetMatrix();
    const enemies = getEnemies();
    const boss = enemies.find(e => e && (e.name === 'olvido' || e.type === 'olvido'));
    if (!boss) { p.pop(); return; }

    const barWidth = 480;
    const barHeight = 20;
    const canvasW = (typeof p.width === 'number' && p.width > 0) ? p.width : 1280;
    const barX = Math.round((canvasW - barWidth) / 2) - 200; // mover un poco a la derecha
    const barY = 520; // parte media baja
    const maxHealth = boss.maxHealth || 100;
    const healthPercentage = Math.max(0, Math.min(1, boss.health / maxHealth));

    // Fondo
    p.noStroke();
    p.fill(40, 0, 0);
    p.rectMode(p.CORNER);
    p.rect(barX, barY, barWidth, barHeight, 8);

    // Progreso
    p.fill(200, 40, 40);
    p.rect(barX, barY, Math.round(barWidth * healthPercentage), barHeight, 8);

    // Contorno
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight, 8);

    // Texto del boss
    p.noStroke();
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text('OLVIDO', barX + barWidth / 2, barY + barHeight + 6);

    p.pop();
  }

  drawScore(p) {
    p.push();
    p.resetMatrix();
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, 1300, 20);
    p.pop();
  }

  drawShotIcon(p) {
    p.push();
    p.resetMatrix();
    p.noSmooth();

    const selectedName = getSelectedShotType();
    const shotType = getShotTypeByName(selectedName);
    const iconSize = 42;
    const posX = 580;
    const posY = 25;

    if (shotType && shotType.icon) {
      const iconAsset = assetLoader.getScaledAsset(shotType.icon, iconSize, iconSize);
      if (iconAsset) {
        p.stroke(1)
        p.imageMode(p.CORNER);
        p.image(iconAsset, posX, posY);
        p.pop();
        return;
      }
    }

    // Fallback si no existe el asset
    p.noStroke();
    const colorMap = {
      basic: [255, 255, 255],
      fire: [255, 140, 0],
      water: [0, 100, 255],
      earth: [139, 69, 19]
    };
    const c = (shotType && colorMap[shotType.name]) || [200, 200, 200];
    p.fill(c[0], c[1], c[2]);
    p.rectMode(p.CORNER);
    p.rect(posX, posY, iconSize, iconSize, 6);
    p.pop();
  }

  drawCursor(p) {
    p.push();
    p.resetMatrix();

    const cursor = assetLoader.getAsset('cursor');
    if (!cursor) return;

    p.noCursor()


    p.imageMode(p.CENTER);
    p.image(cursor, Math.round(p.mouseX), Math.round(p.mouseY), 25, 25);

    p.pop();
  }

  // ============================
  // HUD de Experiencia
  // ============================
  drawXPBar(p) {
    p.push();
    p.resetMatrix();

    const { level, current, required, fraction } = getXPVisualState();

    const barWidth = 240;
    const barHeight = 16;
    const barX = 20;
    const barY = 580;

    // Fondo
    p.noStroke();
    p.fill(30, 30, 50);
    p.rectMode(p.CORNER);
    p.rect(barX, barY, barWidth, barHeight, 4);

    // Progreso (animado simple con lerp visual)
    const fillWidth = barWidth * fraction;
    p.fill(80, 160, 255);
    p.rect(barX, barY, fillWidth, barHeight, 4);

    // Contorno
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight, 4);

    // Texto nivel y XP
    p.noStroke();
    p.fill(255);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(14);
    p.text(`Nivel ${level}`, barX, barY - 6);

    p.textAlign(p.LEFT, p.TOP);
    p.text(`${current}/${required} XP`, barX, barY + barHeight + 4);

    // Efectos: flashes y popups de XP
    const { xpGainEffects, levelUpFlashAt } = getXPEffects();
    if (levelUpFlashAt) {
      // Flash sutil alrededor de la barra
      const alpha = Math.max(0, 200 - (Date.now() - levelUpFlashAt));
      p.noFill();
      p.stroke(0, 255, 100, alpha);
      p.strokeWeight(3);
      p.rect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6);
    }

    // Popups XP ganada
    xpGainEffects.forEach(e => {
      const dt = Math.min(1200, Date.now() - e.at);
      const t = dt / 1200; // 0..1
      const yOff = -20 * (1 - t);
      const alpha = 255 * (1 - t);
      p.fill(0, 255, 100, alpha);
      p.noStroke();
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(12);
      p.text(`+${e.amount} XP`, barX + barWidth + 10, barY + yOff);
    });

    p.pop();
  }

  // ============================
  // Selección de habilidades al subir de nivel
  // ============================
  drawLevelUpSelection(p) {
    p.push();
    p.resetMatrix();

    // Fondo semitransparente
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, window.innerWidth, window.innerHeight);

    const options = getLevelUpOptions();
    const cardW = 260;
    const cardH = 140;
    const gap = 60;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const leftX = centerX - cardW - gap / 2;
    const rightX = centerX + gap / 2;
    const topY = centerY - cardH / 2;

    // Tarjeta izquierda
    p.fill(240);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(leftX, topY, cardW, cardH, 8);
    p.fill(30);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(options[0] || 'Opción A', leftX + cardW / 2, topY + cardH / 2);

    // Tarjeta derecha
    p.fill(240);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(rightX, topY, cardW, cardH, 8);
    p.fill(30);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(options[1] || 'Opción B', rightX + cardW / 2, topY + cardH / 2);

    // Indicaciones
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text('Has subido de nivel. Elige una habilidad:', centerX, topY - 40);
    p.textSize(12);
    p.text('Pulsa Q (izquierda) o E (derecha) para seleccionar', centerX, topY + cardH + 20);

    p.pop();
  }

  isPosiblyToShowBorderBox(p, allBodies) {
    const boxBounds = {
      minX: p.mouseX - 25,
      maxX: p.mouseX + 25,
      minY: p.mouseY - 25,
      maxY: p.mouseY + 25
    };

    for (const body of allBodies) {
      if (!body || !body.bounds || body.isSensor || body.label === 'spell') continue;

      const overlapsHorizontally =
        boxBounds.maxX > body.bounds.min.x &&
        boxBounds.minX < body.bounds.max.x;

      const overlapsVertically =
        boxBounds.maxY > body.bounds.min.y &&
        boxBounds.minY < body.bounds.max.y;

      if (overlapsHorizontally && overlapsVertically) return false;
    }

    return true;
  }

  setBorderBoxVisibility(visible) {
    this.showBorderBox = visible;
  }
}

export default HUD;