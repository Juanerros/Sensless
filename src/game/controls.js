import Matter from 'matter-js';
import { Vector2 } from '../utils/Vector2.js';
import { createBox } from './physics.js';
import { createQuimic } from './quimic.js';
import { gameState } from './state.js';

let keys = {};
let keysPressed = {};

export function handleKeyPressed(key) {
  keys[key] = true;
}

export function handleKeyReleased(key) {
  keys[key] = false;
  keysPressed[key.toLowerCase()] = false;
}

export function updateControls(player, getBodies) {
  if (!player || gameState.isPaused) return;

  const force = 0.02;
  const jumpForce = 0.03;
  const playerVelocity = 7;

  if (keys['g'] && !keysPressed['g']) {
    toggleTimeScale(0.25);
    keysPressed['g'] = true;
  }

  if (keys['a']) {
    Matter.Body.applyForce(player, player.position, { x: -force, y: 0 });
    player.direction = 'left';
  }

  if (keys['d']) {
    Matter.Body.applyForce(player, player.position, { x: force, y: 0 });
    player.direction = 'right';
  }

  if (keys[' '] && isOnGround(player, getBodies())) {
    Matter.Body.applyForce(player, player.position, { x: 0, y: -jumpForce });
  }

  if (keys['1']) {
    setInventory(player, 0);
  }

  if (keys['2']) {
    setInventory(player, 1);
  }

  if (keys['3']) {
    setInventory(player, 2);
  }

  if (player.velocity.x > playerVelocity) {
    Matter.Body.setVelocity(player, { x: playerVelocity, y: player.velocity.y });
  }

  if (player.velocity.x < -playerVelocity) {
    Matter.Body.setVelocity(player, { x: -playerVelocity, y: player.velocity.y });
  }
}

export function handleMousePressed(p, player) {
  const camX = (p.width / 2 + gameState.cameraX) - player.position.x;
  const camY = (p.height / 2 + gameState.cameraY) - player.position.y;
  const worldX = p.mouseX - camX;
  const worldY = p.mouseY - camY;

  if (p.mouseButton.left) {
    if (player.inventory === 0) {
      createBox(worldX, worldY, 50, 50);
    } else {
      createQuimic(worldX, worldY, 33, 45, player.inventory);
    }
  }

  if (p.mouseButton.right) {
    dash(player, worldX, worldY);
  }
}

function dash(player, worldX, worldY) {
  const dashForce = 0.5;
  const direction = Vector2.subtract({ x: worldX, y: worldY }, player.position);
  const normalized = Vector2.normalize(direction);

  Matter.Body.applyForce(player, player.position, {
    x: normalized.x * dashForce,
    y: normalized.y * dashForce
  });
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

function setInventory(player, index) {
  player.inventory = index;
}

function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
}