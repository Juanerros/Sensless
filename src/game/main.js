import p5 from "p5";
import { setupPhysics, updatePhysics, getBodies, getWorld, getEngine } from "./physics";
import { createPlayer, updatePlayer, handleKeyPressed, handleKeyReleased, drawPlayer, getPlayer, handleMousePressed } from "./player";
import { moveCamera } from "./camera";
import { gameState } from "./state";

// Nuestro sketch de p5.js
const sketch = (p) => {
  // Inicializamos las cosas
  p.setup = () => {
    p.createCanvas(1800, 810);
    setupPhysics();
    createPlayer(200, 300, getWorld(), getEngine());
  };

  // Bucle para dibujar en pantalla cada frame
  p.draw = () => {
    if (gameState.isPaused) {
      p.text("Pausado", 20, 110);
      return
    }

    p.background(200);
    updatePhysics();
    updatePlayer();

    p.textSize(22);
    p.fill(0);
    p.text("Puntos: " + gameState.score, 20, 50);
    p.text("Escala de tiempo: " + gameState.timeScale, 20, 80);

    moveCamera(p);

    drawBodies();

    drawPlayer(p);
  };

  // Funcion para dibujar los cuerpos
  function drawBodies() {
    const bodies = getBodies();
    p.fill(255, 0, 0);
    for (let body of bodies) {
      if (body.isPlayer) continue;
      const pos = body.position;
      const angle = body.angle;
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);
      p.rectMode(p.CENTER);
      p.rect(0, 0, body.width || 50, body.height || 50);
      p.pop();
    }
  }

  // Funcion para crear una caja cuando se presiona el mouse
  p.mousePressed = () => {
    handleMousePressed(p);
  };

  // Funcion para manejar cuando se presiona una tecla
  p.keyPressed = () => {
    handleKeyPressed(p.key);
  };

  // Funcion para manejar cuando se suelta una tecla
  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };
};

new p5(sketch);