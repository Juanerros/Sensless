import Matter from "matter-js";
import { getBodies } from "./physics";

let player;
let world;
let keys = {};

export function createPlayer(x, y, worldRef) {
  world = worldRef;
  player = Matter.Bodies.rectangle(x, y, 40, 60, {
    frictionAir: 0.01,
    friction: 0.1,
    density: 0.001,
    inertia: Infinity
  });
  player.width = 40;
  player.height = 60;
  player.isPlayer = true;
  player.label = "player";
  
  Matter.World.add(world, player);
  return player;
}

export function updatePlayer() {
  if (!player) return;
  
  const force = 0.01;
  const jumpForce = 0.1;
  
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
    Matter.Body.applyForce(player, player.position, { x: -force, y: 0 });
  }
  if (keys['d'] || keys['D'] || keys['ArrowRight']) {
    Matter.Body.applyForce(player, player.position, { x: force, y: 0 });
  }

  if ((keys[' ']) && isOnGround(player, getBodies())) {
    Matter.Body.applyForce(player, player.position, { x: 0, y: -jumpForce });
  }
  
  if (player.velocity.x > 10) {
    Matter.Body.setVelocity(player, { x: 10, y: player.velocity.y });
  }
  if (player.velocity.x < -10) {
    Matter.Body.setVelocity(player, { x: -10, y: player.velocity.y });
  }
}

function isOnGround(player, allBodies) {
  const offset = 30;
  const tolerance = 5;
  const px = player.position.x;
  const py = player.position.y + offset;

  return allBodies.some((body) => {
    if (body.label === "ground" || body.label === "box") {
      const bounds = body.bounds;
      return (
        px > bounds.min.x &&
        px < bounds.max.x &&
        Math.abs(py - bounds.min.y) <= tolerance
      );
    }
    return false;
  });
}


export function handleKeyPressed(key) {
  keys[key] = true;
}

export function handleKeyReleased(key) {
  keys[key] = false;
}

export function getPlayer() {
  return player;
}

export function drawPlayer(p) {
  if (!player) return;
  
  const pos = player.position;
  
  p.push();
  p.translate(pos.x, pos.y);
  p.rectMode(p.CENTER);
  p.fill(0, 150, 255);
  p.rect(0, 0, player.width, player.height);
  p.pop();
}