import Matter from 'matter-js';
import { Vector2 } from '../utils/Vector2.js';
import { gameState } from './state.js';
import { screenToWorldCoordinates } from './camera.js';
import { selectInventorySlot, useSelectedItem } from './inventory.js';

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
  if (!player || gameState.isPaused || !player.isAlive) return;

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

  for (let i = 1; i <= 9; i++) {
    if (keys[i.toString()] && !keysPressed[i.toString()]) {
      selectInventorySlot(i - 1);
      keysPressed[i.toString()] = true;
    }
  }

  if (player.velocity.x > playerVelocity) {
    Matter.Body.setVelocity(player, { x: playerVelocity, y: player.velocity.y });
  }

  if (player.velocity.x < -playerVelocity) {
    Matter.Body.setVelocity(player, { x: -playerVelocity, y: player.velocity.y });
  }
}

export function handleMousePressed(p, player) {
  if (!player || !player.isAlive) return;
  
  const worldCoords = screenToWorldCoordinates(p.mouseX, p.mouseY);
  const worldX = worldCoords.x;
  const worldY = worldCoords.y;

  if (p.mouseButton.left) {
    useSelectedItem(worldX, worldY);
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
    const bounds = body.bounds;
    return (
      px > bounds.min.x &&
      px < bounds.max.x &&
      Math.abs(py - bounds.min.y) <= tolerance
    );
  });
}

function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
}