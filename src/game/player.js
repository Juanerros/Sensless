import Matter from "matter-js";
import { createBox, getBodies } from "./physics";
import { gameState, togglePauseGame } from "./state";

let player;
let world;
let keys = {};
let keysPressed = {};
const force = 0.02;
const jumpForce = 0.03;
const dashForce = .5;
const playerVelocity = 7;

export function createPlayer(x, y, worldRef, playerSprite) {
  world = worldRef;
  player = Matter.Bodies.rectangle(x, y, 42, 72, {
    frictionAir: 0.02,
    friction: 0.1,
    density: 0.001,
    restitution: 0,
    inertia: Infinity
  });
  player.width = 42;
  player.height = 72;
  player.isPlayer = true;
  player.label = "player";
  player.sprite = playerSprite;
  player.inventory = 0;
  player.direction = 'right';

  // Se guarda en el estado global
  gameState.player = player;

  getBodies().push(player);
  Matter.World.add(world, player);
  return player;
}

export function updatePlayer(p) {
  if (!player) return;

  // Funcion de pause (no funciona como es debido)
  // if(keys['p'] && !keysPressed['p']) {
  //   togglePauseGame();
  //   keysPressed['p'] = true;
  // }

  if (gameState.isPaused) return;

  drawBorderBox(p)

  if (keys['g'] && !keysPressed['g']) {
    toggleTimeScale(0.25);
    keysPressed['g'] = true;
  }

  if (keys['a']) {
    Matter.Body.applyForce(player, player.position, { x: -force, y: 0 });
    player.direction = 'left'
  }

  if (keys['d']) {
    Matter.Body.applyForce(player, player.position, { x: force, y: 0 });
    player.direction = 'right'
  }

  if ((keys[' ']) && isOnGround(player, getBodies())) {
    Matter.Body.applyForce(player, player.position, { x: 0, y: -jumpForce });
  }

  if (keys['1']) {
    setInventory(0);
  }

  if (keys['2']) {
    setInventory(1);
  }

  if (keys['3']) {
    setInventory(2);
  }

  if (player.velocity.x > playerVelocity) {
    Matter.Body.setVelocity(player, { x: playerVelocity, y: player.velocity.y });
  }

  if (player.velocity.x < -playerVelocity) {
    Matter.Body.setVelocity(player, { x: -playerVelocity, y: player.velocity.y });
  }
}

export function setInventory(index) {
  player.inventory = index;
}


function isOnGround(player, allBodies) {
  const offset = 50;
  const tolerance = 15;
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

function dash(worldX, worldY) {
  const directionX = worldX - player.position.x;
  const directionY = worldY - player.position.y;

  const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

  if (magnitude === 0) {
    return;
  }

  const normalizedX = directionX / magnitude;
  const normalizedY = directionY / magnitude;

  Matter.Body.applyForce(player, player.position, {
    x: normalizedX * dashForce,
    y: normalizedY * dashForce
  });
}

function drawBorderBox(p) {
  p.noFill();
  p.stroke(0);
  p.rect(p.mouseX - 25, p.mouseY - 25, 50, 50);
}

export function handleMousePressed(p) {
  // Lo que movimos la camara
  const camX = (p.width / 2 - 225) - player.position.x;
  const camY = (p.height / 2 + 70) - player.position.y;
  // Transformar mouseX/mouseY a coordenadas del mundo movido
  const worldX = p.mouseX - camX;
  const worldY = p.mouseY - camY;

  if (p.mouseButton.left) {
    createBox(worldX, worldY, 50, 50, player.inventory);
  }

  if (p.mouseButton.right) {
    dash(worldX, worldY);
  }
}

export function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
}

export function handleKeyPressed(key) {
  keys[key] = true;
}

export function handleKeyReleased(key) {
  keys[key] = false;
  keysPressed[key.toLowerCase()] = false;
}

export function getPlayer() {
  return player;
}

export function drawPlayer(p) {
  if (!player) return;

  const pos = player.position;
  const angle = player.angle;

  p.push();
  p.translate(pos.x, pos.y);
  p.rotate(angle);
  if (player.direction === 'left') {
    p.scale(-1, 1);
  } else {
    p.scale(1, 1);
  }

  if (player.sprite && player.sprite.width > 0) {
    p.imageMode(p.CENTER);
    p.image(player.sprite, 0, 0, player.width, player.height);
  } else {
    p.fill(0, 255, 0);
    p.rectMode(p.CENTER);
    p.rect(0, 0, player.width, player.height);
  }

  p.pop();
}