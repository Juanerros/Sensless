import p5 from "p5";
import { setupPhysics, updatePhysics, getBodies, createBox, getWorld, getEngine } from "./physics";
import { createPlayer, updatePlayer, handleKeyPressed, handleKeyReleased, drawPlayer } from "./player";

// Nuestro sketch de p5.js
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1300, 700);
    setupPhysics(p);
    const player = createPlayer(200, 300, getWorld(), getEngine());
    getBodies().push(player);
  };

  p.draw = () => {
    p.background(200);
    updatePhysics();
    updatePlayer();

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

    drawPlayer(p);
  };

  p.mousePressed = () => {
    createBox(p.mouseX, p.mouseY, 50, 50);
  };

  p.keyPressed = () => {
    handleKeyPressed(p.key);
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };
};

new p5(sketch);