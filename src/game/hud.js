import { drawInventoryUI } from './inventory.js';
import assetLoader from './assets/assetLoader.js';
import { getBodies } from './physics.js';
import { gameState } from './state.js';
import { getSelectedShotType } from './magicShotsSystem.js';
import { getShotTypeByName } from './shotTypes.js';

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
    this.drawScore(p);
    this.drawShotIcon(p);
    if (this.isPosiblyToShowBorderBox(p, getBodies())) this.drawBorderBox(p);
    this.drawCursor(p);
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
    const selectedName = getSelectedShotType();
    const shotType = getShotTypeByName(selectedName);
    const iconSize = 32;
    const posX = 600 - iconSize;
    const posY = 30;

    // if (shotType && shotType.icon) {
    //   const iconAsset = assetLoader.getScaledAsset(shotType.icon, iconSize, iconSize);
    //   if (iconAsset) {
    //     p.imageMode(p.CORNER);
    //     p.image(iconAsset, posX, posY);
    //     p.pop();
    //     return;
    //   }
    // }

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

    const cursor = assetLoader.getScaledAsset('cursor', 25, 25);
    if (!cursor) return;

    p.noCursor()

    p.image(cursor, p.mouseX, p.mouseY);

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