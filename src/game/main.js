import p5 from "p5";
import { setupPhysics, updatePhysics, getBodies, getWorld, loadBoxSprite } from "./physics";
import {
  createPlayer,
  updatePlayer,
  handleKeyPressed,
  handleKeyReleased,
  drawPlayer,
  handleMousePressed
} from "./player";
import { moveCamera } from "./camera";
import { gameState } from "./state";

import { ChaserEnemy, updateEnemies, drawEnemies } from "./enemies/enemy";

// Nuestro sketch de p5.js
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1800, 810);

    setupPhysics();

    // Cargamos sprites
    loadSprites()

    // enemigo 
    new ChaserEnemy(900, 700, getWorld());
  };

  p.draw = () => {
    if (gameState.isPaused) {
      p.background(200);
      p.textSize(22);
      p.fill(0);
      p.text("Pausado", 20, 110);
      return;
    }

    p.background(200);

    updatePhysics();
    updatePlayer(p);
    //Enemigos
    updateEnemies(); 

    p.textSize(22);
    p.fill(0);
    p.text("Puntos: " + gameState.score, 20, 50);
    p.text("Escala de tiempo: " + gameState.timeScale, 20, 80);

    moveCamera(p);

    drawBodies();
    drawPlayer(p);

    //enemigo
    drawEnemies(p);
    drawPlayer(p);

  };

  function loadSprites() {
    p.noSmooth();
    p.pixelDensity(1);

    // Player
    p.loadImage("/assets/sprites/Zenith.png", (img) => {
      createPlayer(200, 300, getWorld(), img);
    });

    // Cajas
    p.loadImage("/assets/sprites/box-a.png", (img) => {
      loadBoxSprite(img);
    });
  }

  function drawBodies() {
    const bodies = getBodies();
    for (let body of bodies) {
      if (body.isPlayer) continue;
      const pos = body.position;
      const angle = body.angle;

      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);

      if (body.sprite && body.sprite.width > 0) {
        p.imageMode(p.CENTER);
        p.image(body.sprite, 0, 0, body.width || 50, body.height || 50);
      } else {
        p.fill(255, 0, 0);
        p.rectMode(p.CENTER);
        p.rect(0, 0, body.width || 50, body.height || 50);
      }

      p.pop();
    }
  }

  p.mousePressed = (event) => {
    if (event) {
      event.preventDefault();
    }
    handleMousePressed(p);
    return false;
  };

  p.keyPressed = () => {
    handleKeyPressed(p.key);
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };
};

new p5(sketch);
