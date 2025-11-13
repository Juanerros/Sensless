import Matter from 'matter-js';
import { Vector2 } from '../utils/Vector2.js';
import { gameState } from './state.js';
import { screenToWorldCoordinates } from './camera.js';
import { selectInventorySlot, useSelectedItem } from './inventory.js';
import { firePlayerShot, selectShotType } from './magicShotsSystem.js';

// ===== Variables Globales =====
let keys = {};
let keysPressed = {};
let lastHorizontalKey = null;
let lastJumpPressedTime = 0;
let lastGroundedTime = 0;

// ===== Configuración =====
const jumpBufferMs = 140;
const coyoteTimeMs = 140;
const smoothingAlpha = 0.45; // Aumentado para respuesta más inmediata
const airControlMultiplier = 0.8; // Control en el aire
const groundAcceleration = 0.85 // Aceleración en suelo
const airAcceleration = 0.7; // Aceleración en aire

// ===== Gestión de Input =====
function normalizeKey(key) {
  if (!key) return '';
  const k = String(key).toLowerCase();
  if (k === ' ' || k === 'spacebar') return 'space';
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) return k;
  return k;
}

export function handleKeyPressed(key) {
  const k = normalizeKey(key);
  keys[k] = true;

  if (k === 'a' || k === 'arrowleft' || k === 'left') {
    lastHorizontalKey = 'left';
    keys['d'] = keys['arrowright'] = keys['right'] = false;
  } else if (k === 'd' || k === 'arrowright' || k === 'right') {
    lastHorizontalKey = 'right';
    keys['a'] = keys['arrowleft'] = keys['left'] = false;
  }

  if (k === 'e') {
    selectShotType('basic')
  } else if (k === 'r') {
    selectShotType('fire')
  } else if (k === 't') {
    selectShotType('water')
  } else if (k === 'y') {
    selectShotType('earth')
  }
}

export function handleKeyReleased(key) {
  const k = normalizeKey(key);
  keys[k] = keysPressed[k] = false;

  if ((k === 'a' || k === 'arrowleft' || k === 'left') && lastHorizontalKey === 'left') {
    lastHorizontalKey = null;
  } else if ((k === 'd' || k === 'arrowright' || k === 'right') && lastHorizontalKey === 'right') {
    lastHorizontalKey = null;
  }
}

// ===== Movimiento y Física =====
export function updateControls(player, getBodies) {
  if (!player || gameState.isPaused || !player.isAlive) return;

  const jumpForce = 0.2;
  const playerVelocity = 10;
  const bodies = getBodies();
  const onGround = isOnGround(player, bodies);

  if (keys['g'] && !keysPressed['g']) {
    toggleTimeScale(0.25);
    keysPressed['g'] = true;
  }

  updateHorizontalMovement(player, playerVelocity, onGround);
  attemptStepUp(player, bodies, getMovementAxis());
  updateJump(player, bodies, jumpForce);
  updateInventorySelection();
  clampVelocity(player, playerVelocity);
}

function updateHorizontalMovement(player, playerVelocity, onGround) {
  const axis = getMovementAxis();
  const currentVx = player.velocity.x;
  const targetVx = axis * playerVelocity;
  
  const acceleration = onGround ? groundAcceleration : airAcceleration;
  const velocityMultiplier = onGround ? 1 : airControlMultiplier;
  
  let newVx;
  if (axis !== 0) {
    const maxSpeed = playerVelocity * velocityMultiplier;
    const accelerationForce = acceleration * (axis > 0 ? 1 : -1);
    newVx = currentVx + accelerationForce;
    newVx = axis > 0 ? Math.min(newVx, maxSpeed) : Math.max(newVx, -maxSpeed);
  } else {
    const friction = onGround ? 0.85 : 0.95;
    newVx = currentVx * friction;
    if (Math.abs(newVx) < 0.1) newVx = 0;
  }

  if (axis < 0) player.direction = 'left';
  else if (axis > 0) player.direction = 'right';

  Matter.Body.setVelocity(player, { x: newVx, y: player.velocity.y });
}

function getMovementAxis() {
  const leftActive = keys['a'] || keys['arrowleft'] || keys['left'];
  const rightActive = keys['d'] || keys['arrowright'] || keys['right'];

  if (leftActive && rightActive) {
    return lastHorizontalKey === 'left' ? -1 : lastHorizontalKey === 'right' ? 1 : 0;
  }
  return leftActive ? -1 : rightActive ? 1 : 0;
}

function attemptStepUp(player, allBodies, axis) {
  if (axis === 0 || !Array.isArray(allBodies)) return false;

  const onGround = isOnGround(player, allBodies);
  if (!onGround) return false;

  const moving = Math.abs(player.velocity.x) > 0.25;
  if (!moving) return false;

  const stepMax = Math.max(22, Math.min(player.height * 0.3, 24));
  const horizontalGap = Math.max(6, Math.min(player.width * 0.35, 14));

  const playerBounds = {
    minX: player.bounds?.min?.x ?? player.position.x - player.width / 2,
    maxX: player.bounds?.max?.x ?? player.position.x + player.width / 2,
    bottomY: player.bounds?.max?.y ?? player.position.y + player.height / 2,
    topY: player.bounds?.min?.y ?? player.position.y - player.height / 2
  };

  let stepDelta = 0;

  for (const body of allBodies) {
    if (!body || body === player || !body.bounds || body.isSensor || body.label === 'spell') continue;

    const nearFront = axis > 0 ?
      body.bounds.min.x - playerBounds.maxX :
      playerBounds.minX - body.bounds.max.x;

    if (nearFront < 0 || nearFront > horizontalGap) continue;

    const neededRise = playerBounds.bottomY - body.bounds.min.y;
    if (neededRise <= 0 || neededRise > stepMax) continue;

    const predicted = {
      minX: playerBounds.minX,
      maxX: playerBounds.maxX,
      topY: playerBounds.topY - neededRise,
      bottomY: playerBounds.bottomY - neededRise
    };

    let blocked = false;
    for (const other of allBodies) {
      if (!other || other === player || !other.bounds || other.isSensor || other.label === 'spell') continue;
      const overlapsX = predicted.maxX > other.bounds.min.x && predicted.minX < other.bounds.max.x;
      const overlapsY = predicted.bottomY > other.bounds.min.y && predicted.topY < other.bounds.max.y;
      if (overlapsX && overlapsY) { blocked = true; break; }
    }
    if (blocked) continue;

    const newTopY = playerBounds.topY - neededRise;
    if (newTopY <= body.bounds.min.y - 2) {
      stepDelta = Math.max(stepDelta, neededRise);
    }
  }

  if (stepDelta > 0) {
    Matter.Body.setPosition(player, {
      x: player.position.x,
      y: player.position.y - stepDelta
    });
    return true;
  }
  return false;
}

function updateJump(player, bodies, jumpForce) {
  const now = Date.now();
  const onGround = isOnGround(player, bodies);
  
  if (onGround) lastGroundedTime = now;

  // Cambiado de space a 'w' para salto
  const jumpActive = keys['w'] || keys['space'];
  if (jumpActive && !keysPressed['w'] && !keysPressed['space']) {
    lastJumpPressedTime = now;
    keysPressed['w'] = true;
    keysPressed['space'] = true;
  } else if (!jumpActive) {
    keysPressed['w'] = false;
    keysPressed['space'] = false;
  }

  const canJumpFromBuffer = (now - lastJumpPressedTime) <= jumpBufferMs;
  const hasCoyoteTime = (now - lastGroundedTime) <= coyoteTimeMs;

  if (canJumpFromBuffer && (onGround || hasCoyoteTime)) {
    Matter.Body.applyForce(player, player.position, { x: 0, y: -jumpForce });
    lastJumpPressedTime = 0;
  }
}

function clampVelocity(player, maxVelocity) {
  const maxAirVelocity = maxVelocity * airControlMultiplier;
  const currentMax = isOnGround(player, []) ? maxVelocity : maxAirVelocity;
  
  if (player.velocity.x > currentMax) {
    Matter.Body.setVelocity(player, { x: currentMax, y: player.velocity.y });
  }
  if (player.velocity.x < -currentMax) {
    Matter.Body.setVelocity(player, { x: -currentMax, y: player.velocity.y });
  }
}

// ===== Interacción =====
export function handleMousePressed(p, player) {
  if (!player || !player.isAlive) return;
  
  const { x: worldX, y: worldY } = screenToWorldCoordinates(p.mouseX, p.mouseY);

  if (p.mouseButton.left) {
    firePlayerShot(p);
  }

  if (p.mouseButton.right)  {
    useSelectedItem(worldX, worldY);
  }
}

// ===== Utilidades =====
export function isOnGround(player, allBodies) {
  if (!Array.isArray(allBodies)) return false;

  const playerBounds = {
    minX: player.bounds?.min?.x ?? player.position.x - player.width / 2,
    maxX: player.bounds?.max?.x ?? player.position.x + player.width / 2,
    bottomY: player.bounds?.max?.y ?? player.position.y + player.height / 2
  };

  const verticalTolerance = Math.max(8, Math.min(player.height * 0.15, 18));

  for (const body of allBodies) {
    if (!body || body === player || !body.bounds || body.isSensor || body.label === 'spell') continue;

    const horizontallyOverlaps = 
      playerBounds.maxX > body.bounds.min.x && 
      playerBounds.minX < body.bounds.max.x;

    const isJustAbove = 
      Math.abs(body.bounds.min.y - playerBounds.bottomY) <= verticalTolerance;

    if (horizontallyOverlaps && isJustAbove) return true;
  }

  return false;
}

function updateInventorySelection() {
  for (let i = 1; i <= 9; i++) {
    if (keys[i.toString()] && !keysPressed[i.toString()]) {
      selectInventorySlot(i - 1);
      keysPressed[i.toString()] = true;
    }
  }
}

function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
}
