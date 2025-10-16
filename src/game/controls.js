import Matter from 'matter-js';
import { Vector2 } from '../utils/Vector2.js';
import { gameState } from './state.js';
import { screenToWorldCoordinates } from './camera.js';
import { selectInventorySlot, useSelectedItem } from './inventory.js';

let keys = {};
let keysPressed = {};
let lastHorizontalKey = null; // 'left' | 'right' | null
// Salto más fluido: jump buffer y coyote time
let lastJumpPressedTime = 0;
let lastGroundedTime = 0;
const jumpBufferMs = 140; // aceptar salto poco antes de tocar suelo
const coyoteTimeMs = 140; // permitir salto poco después de dejar el suelo
// Suavizado de movimiento horizontal
const smoothingAlpha = 0.35; // respuesta más rápida (0.15-0.45 recomendado)

// Normaliza las teclas para evitar inconsistencias (mayúsculas, alias)
function normalizeKey(key) {
  if (!key) return '';
  const k = String(key).toLowerCase();
  if (k === ' ') return 'space';
  if (k === 'spacebar') return 'space';
  if (k === 'arrowleft') return 'arrowleft';
  if (k === 'arrowright') return 'arrowright';
  if (k === 'arrowup') return 'arrowup';
  if (k === 'arrowdown') return 'arrowdown';
  return k;
}

export function handleKeyPressed(key) {
  const k = normalizeKey(key);
  keys[k] = true;

  // Registrar última dirección horizontal pulsada
  if (k === 'a' || k === 'arrowleft' || k === 'left') {
    lastHorizontalKey = 'left';
    // Al presionar izquierda, desactivar derecha para evitar estados pegados
    keys['d'] = false;
    keys['arrowright'] = false;
    keys['right'] = false;
  } else if (k === 'd' || k === 'arrowright' || k === 'right') {
    lastHorizontalKey = 'right';
    // Al presionar derecha, desactivar izquierda para evitar estados pegados
    keys['a'] = false;
    keys['arrowleft'] = false;
    keys['left'] = false;
  }
}

export function handleKeyReleased(key) {
  const k = normalizeKey(key);
  keys[k] = false;
  keysPressed[k] = false;

  // Actualizar última dirección horizontal según teclas aún activas
  const leftActive = keys['a'] || keys['arrowleft'] || keys['left'];
  const rightActive = keys['d'] || keys['arrowright'] || keys['right'];

  // Si se suelta la tecla correspondiente a la última dirección, limpiar prioridad
  if ((k === 'a' || k === 'arrowleft' || k === 'left') && lastHorizontalKey === 'left') {
    lastHorizontalKey = null;
  } else if ((k === 'd' || k === 'arrowright' || k === 'right') && lastHorizontalKey === 'right') {
    lastHorizontalKey = null;
  }
}

export function updateControls(player, getBodies) {
  if (!player || gameState.isPaused || !player.isAlive) return;

  const force = 0.02;
  const jumpForce = 0.2;
  const playerVelocity = 10; // más velocidad para evitar sensación de lentitud

  if (keys['g'] && !keysPressed['g']) {
    toggleTimeScale(0.25);
    keysPressed['g'] = true;
  }

  // Movimiento horizontal suavizado (lerp) con prioridad a la última tecla
  const leftActive = keys['a'] || keys['arrowleft'] || keys['left'];
  const rightActive = keys['d'] || keys['arrowright'] || keys['right'];
  let axis = 0;
  if (leftActive && rightActive) {
    axis = lastHorizontalKey === 'left' ? -1 : lastHorizontalKey === 'right' ? 1 : 0;
  } else if (leftActive) {
    axis = -1;
  } else if (rightActive) {
    axis = 1;
  }
  // Calcular nueva velocidad suavizada
  const currentVx = player.velocity.x;
  const targetVx = axis * playerVelocity;
  const newVx = currentVx + (targetVx - currentVx) * smoothingAlpha;
  // Intento de “step-up” para pequeños salientes
  const bodies = getBodies();
  attemptStepUp(player, bodies, axis);
  // Dirección para sprites
  if (axis < 0) player.direction = 'left';
  else if (axis > 0) player.direction = 'right';
  // Aplicar velocidad suavizada y cancelar deriva si está casi en reposo
  if (axis === 0 && Math.abs(newVx) < 0.2) {
    Matter.Body.setVelocity(player, { x: 0, y: player.velocity.y });
  } else {
    Matter.Body.setVelocity(player, { x: newVx, y: player.velocity.y });
  }

  // Salto con jump buffer y coyote time (más responsivo)
  const now = Date.now();
  const onGround = isOnGround(player, bodies);
  if (onGround) {
    lastGroundedTime = now;
  }
  const spaceActive = keys['space'] || keys[' '];
  // Registrar transición de pulsación para crear buffer de salto
  if (spaceActive && !keysPressed['space']) {
    lastJumpPressedTime = now;
    keysPressed['space'] = true;
  } else if (!spaceActive && keysPressed['space']) {
    keysPressed['space'] = false;
  }
  const canJumpFromBuffer = (now - lastJumpPressedTime) <= jumpBufferMs;
  const hasCoyoteTime = (now - lastGroundedTime) <= coyoteTimeMs;
  if (canJumpFromBuffer && (onGround || hasCoyoteTime)) {
    Matter.Body.applyForce(player, player.position, { x: 0, y: -jumpForce });
    lastJumpPressedTime = 0; // consumir buffer para evitar saltos repetidos si se mantiene pulsado
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

// Intenta subir pequeños salientes automáticamente cuando estás muy cerca del borde frontal
function attemptStepUp(player, allBodies, axis) {
  if (axis === 0 || !Array.isArray(allBodies)) return false;

  const stepMax = Math.max(12, Math.min(player.height * 0.3, 24));
  const horizontalGap = 8; // distancia mínima al frente para considerar escalón

  const playerMinX = player.bounds?.min?.x ?? player.position.x - player.width / 2;
  const playerMaxX = player.bounds?.max?.x ?? player.position.x + player.width / 2;
  const playerBottomY = player.bounds?.max?.y ?? player.position.y + player.height / 2;
  const playerTopY = player.bounds?.min?.y ?? player.position.y - player.height / 2;

  let stepDelta = 0;

  for (let i = 0; i < allBodies.length; i++) {
    const body = allBodies[i];
    if (!body || body === player || !body.bounds) continue;
    if (body.isSensor) continue;
    if (body.label === 'spell') continue;

    const bodyMinX = body.bounds.min.x;
    const bodyMaxX = body.bounds.max.x;
    const bodyTopY = body.bounds.min.y;

    const nearFront = axis > 0 ? bodyMinX - playerMaxX : playerMinX - bodyMaxX;
    if (nearFront < 0 || nearFront > horizontalGap) continue;

    const neededRise = playerBottomY - bodyTopY; // cuánto hay que subir
    if (neededRise <= 0 || neededRise > stepMax) continue;

    // Comprobar que no golpearemos con la “cabeza” al subir
    const newTopY = playerTopY - neededRise;
    if (newTopY <= bodyTopY - 2) {
      stepDelta = Math.max(stepDelta, neededRise);
    }
  }

  if (stepDelta > 0) {
    Matter.Body.setPosition(player, { x: player.position.x, y: player.position.y - stepDelta });
    return true;
  }
  return false;
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

export function isOnGround(player, allBodies) {
  // Verificar que allBodies sea un array
  if (!Array.isArray(allBodies)) {
    console.warn('isOnGround: allBodies no es un array', allBodies);
    return false;
  }

  // Usar los bounds del jugador para mayor precisión
  const playerMinX = player.bounds?.min?.x ?? player.position.x - player.width / 2;
  const playerMaxX = player.bounds?.max?.x ?? player.position.x + player.width / 2;
  const playerBottomY = player.bounds?.max?.y ?? player.position.y + player.height / 2;
  const verticalTolerance = Math.max(8, Math.min(player.height * 0.15, 18));

  // Verificar si hay algún cuerpo justo debajo del jugador
  for (let i = 0; i < allBodies.length; i++) {
    const body = allBodies[i];
    if (!body || body === player || !body.bounds) continue;
    if (body.isSensor) continue; // ignorar sensores
    if (body.label === 'spell') continue; // ignorar hechizos/objetos no sólidos

    const bodyMinX = body.bounds.min.x;
    const bodyMaxX = body.bounds.max.x;
    const bodyTopY = body.bounds.min.y;

    const horizontallyOverlaps = playerMaxX > bodyMinX && playerMinX < bodyMaxX;
    // Aceptar ligera penetración o pequeño espacio por diferencias numéricas
    const isJustAbove = Math.abs(bodyTopY - playerBottomY) <= verticalTolerance;

    if (horizontallyOverlaps && isJustAbove) {
      return true;
    }
  }

  return false;
}

function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
}