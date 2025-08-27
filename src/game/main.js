import p5 from 'p5';
import { setupPhysics, updatePhysics, getBodies, getWorld } from './physics.js';
import { loadSpritesAsync } from './sprites.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
import { moveCamera } from './camera.js';

let player;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1800, 900);
    setupPhysics();

    p.textFont('Arial');

    p.noSmooth();
    loadSpritesAsync(p, () => {
      console.log('Todos los sprites cargados');
    });

    player = createPlayer(400, 300, getWorld());
  };

  p.draw = () => {
    p.background(100, 100, 100);

    updatePhysics();
    updatePlayer(p);

    p.push();
    moveCamera(p);

    drawBodies(p);
    drawPlayer(p);

    p.pop();
  };

  p.keyPressed = () => {
    handleKeyPressed(p.key);
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };

  p.mousePressed = () => {
    handleMousePressed(p, player);
  };
};

function drawBodies(p) {
  const bodies = getBodies();

  bodies.forEach(body => {
    if (body.isPlayer) return;

    const pos = body.position;
    const angle = body.angle;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);

    if (body.sprite && body.sprite.width > 0) {
      p.imageMode(p.CENTER);
      p.image(body.sprite, 0, 0, body.width, body.height);
    } else {
      if (body.label === 'ground') {
        p.fill(139, 69, 19);
        p.stroke(0);
        p.strokeWeight(2);
      } else {
        p.fill(100);
      }
      p.rectMode(p.CENTER);
      p.rect(0, 0, body.width, body.height);
    }

    p.pop();
  });
}

new p5(sketch);
