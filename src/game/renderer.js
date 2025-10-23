import { getBodies } from './physics.js';
import { getPlayer } from './player.js';

class Renderer {
  constructor() {
    this.player = null;
  }

  setPlayer(player) {
    this.player = player;
  }

  drawBodies(p) {
    const bodies = getBodies();
    const player = getPlayer();
    
    const cameraX = player ? player.position.x : 0;
    const cameraY = player ? player.position.y : 0;
    const screenWidth = p.width;
    const screenHeight = p.height;
    const margin = -50;
    
    const leftBound = cameraX - screenWidth / 2 - margin;
    const rightBound = cameraX + screenWidth / 2 + margin;
    const topBound = cameraY - screenHeight / 2 - margin;
    const bottomBound = cameraY + screenHeight / 2 + margin;

    bodies.forEach(body => {
      if (body.isPlayer) return; // Solo excluimos al jugador, permitimos enemigos y balas
      
      const pos = body.position;
      
      if (pos.x < leftBound || pos.x > rightBound || 
          pos.y < topBound || pos.y > bottomBound) {
        return;
      }
      
      this.drawSingleBody(p, body);
    });
  }

  drawSingleBody(p, body) {
    const pos = body.position;
    const angle = body.angle;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);

    if (body.sprite && body.sprite.width > 0) {
      this.drawBodyWithSprite(p, body);
    } else {
      this.drawBodyWithColor(p, body);
    }

    // Contorno de hitbox para enemigos (fallback desde el renderer)
    if (body.isEnemy && body.width && body.height) {
      p.rectMode(p.CENTER);
      p.noFill();
      p.stroke(0, 255, 0);
      p.strokeWeight(2);
      p.rect(0, 0, body.width, body.height);
    }

    p.pop();
  }

  drawBodyWithSprite(p, body) {
    p.imageMode(p.CENTER);
    p.image(body.sprite, 0, 0, body.width, body.height);
  }

  drawBodyWithColor(p, body) {
    if (body.label === 'terrain') {
      this.drawTerrainBody(p, body);
    } else if (body.label === 'ground') {
      this.drawGroundBody(p, body);
    } else {
      this.drawDefaultBody(p, body);
    }
  }

  drawTerrainBody(p, body) {
    const baseColor = [101, 67, 33];
    if (body.layer > 0) {
      const darkenAmount = Math.min(body.layer * 15, 60);
      const r = Math.max(baseColor[0] - darkenAmount, 0);
      const g = Math.max(baseColor[1] - darkenAmount, 0);
      const b = Math.max(baseColor[2] - darkenAmount, 0);
      p.fill(r, g, b);
      p.stroke(r, g, b);
    } else {
      p.fill(101, 67, 33);
      p.stroke(101, 67, 33);
    }
    p.strokeWeight(1);
    this.drawBodyRect(p, body);
  }

  drawGroundBody(p, body) {
    p.fill(139, 69, 19);
    p.stroke(0);
    p.strokeWeight(2);
    this.drawBodyRect(p, body);
  }

  drawDefaultBody(p, body) {
    p.fill(100);
    this.drawBodyRect(p, body);
  }

  drawBodyRect(p, body) {
    p.rectMode(p.CENTER);
    if (body.width !== undefined && body.height !== undefined && 
        body.width > 0 && body.height > 0) {
      p.rect(0, 0, body.width, body.height);
    }
  }

  drawBackground(p) {
    p.background(135, 206, 235);
  }
}

export default Renderer;