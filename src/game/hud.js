import { drawInventoryUI } from './inventory.js';

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
    this.drawBorderBox(p);
  }

  setBorderBoxVisibility(visible) {
    this.showBorderBox = visible;
  }
}

export default HUD;