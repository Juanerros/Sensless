import Matter from "matter-js";
import { getBodies } from "../physics";
import { gameState } from "../state";

let enemies = [];
const speed = 0.02;
const detectionRadius = 300;

export function createEnemy(x, y, world){

    const enemy = Matter.Bodies.rectangle(x, y, 40, 60, {

        frictionAir: 0.01,
        friction: 0.1,
        density: 0.001,
        restitution: 0,
        inertia: Infinity

    });

    enemy.width = 40;
    enemy.height = 60;
    enemy.isEnemy = true;
    enemy.label = "enemy";

    enemies.push(enemy);
    getBodies().push(enemy);
    Matter.World.add(world, enemy);

    return enemy;
}


export function updateEnemies() {
  if (!gameState.player) return;

  for (let enemy of enemies) {
    const dx = gameState.player.position.x - enemy.position.x;
    const dy = gameState.player.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < detectionRadius) {
      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * speed;
      const forceY = Math.sin(angle) * speed;
      Matter.Body.applyForce(enemy, enemy.position, { x: forceX, y: forceY });
    }
  }
}


export function drawEnemies(p) {
  for (let enemy of enemies) {
    const pos = enemy.position;
    const angle = enemy.angle;
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);
    p.rectMode(p.CENTER);
    p.fill(255, 0, 0);
    p.rect(0, 0, enemy.width, enemy.height);
    p.pop();
  }
}