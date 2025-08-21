import p5 from "p5";
import { setupPhysics, updatePhysics, getBodies, getWorld, loadSprite } from "./physics";
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

import { ChaserEnemy, updateEnemies, drawEnemies, loadSpriteEnemies } from "./enemies/enemy";
import { WanderingBud } from "./enemies/wanderingBud";

 
// Nuestro sketch de p5.js
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1800, 810);

    setupPhysics();

    // Cargamos sprites
    loadSprites()

    // enemigo 
    new ChaserEnemy(900, 700, getWorld());
    new WanderingBud(700, 700, getWorld());
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
    drawPersistentActions(p);

  };

  //Enemigos
  function drawPersistentActions(p) {
    // Actualizar y dibujar círculos persistentes
    for (let i = gameState.persistentActions.length - 1; i >= 0; i--) {
      const circle = gameState.persistentActions[i];
      
      p.push();
      // Crear un gradiente radial
      for (let j = circle.radius * 2; j > 0; j -= 5) {
        let alpha = p.map(j, 0, circle.radius * 2, 0, 50);
        p.fill(255, 0, 0, alpha);
        p.noStroke();
        p.circle(circle.x, circle.y, j);
      }
      
      p.noFill();
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.circle(circle.x, circle.y, circle.radius * 2);
      p.pop();
      
     
      circle.lifeTime--;
      
      // Eliminar círculos que han expirado
      if (circle.lifeTime <= 0) {
        gameState.persistentActions.splice(i, 1);
      }
    }
  }


  function loadSprites() {
    p.noSmooth();
    p.pixelDensity(1);

    // Player
    p.loadImage("/assets/sprites/Zenith.png", (img) => {
      createPlayer(200, 300, getWorld(), img);
    });

    // Cajas
    p.loadImage("/assets/sprites/box-a.png", (img) => {
      loadSprite(img, 'box');
    });

    p.loadImage("/assets/sprites/hidrogeno-pixel.png", (img) => {
      loadSprite(img, 'hidrogeno');
    });

    p.loadImage("/assets/sprites/oxigeno-pixel.png", (img) => {
      loadSprite(img, 'oxigeno');
    });

    //Enemigos
    p.loadImage("/assets/sprites/enemies/olvido.png", (img) => {
      loadSpriteEnemies(img, 'olvido');
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
        if (body.element === "agua") {
          p.fill(0, 100, 255);
        } else {
          p.fill(0, 0, 0);
        }

        if (body.shape === 'circle') {
          p.ellipse(0, 0, body.width || 5, body.height || 5);
        } else {
          p.rectMode(p.CENTER);
          p.rect(0, 0, body.width || 50, body.height || 50);
        }
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
