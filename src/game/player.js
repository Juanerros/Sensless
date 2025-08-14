import Matter from "matter-js";
import { createBox, getBodies } from "./physics";
import { gameState, togglePauseGame } from "./state";

let player;
let world;
let keys = {};
let keysPressed = {};
const force = 0.02;
const jumpForce = 0.1;

export function createPlayer(x, y, worldRef, playerSprite) {
  world = worldRef;
  player = Matter.Bodies.rectangle(x, y, 40, 60, {
    frictionAir: 0.01,
    friction: 0.1,
    density: 0.001,
    restitution: 0,
    inertia: Infinity
  });
  player.width = 40;
  player.height = 60;
  player.isPlayer = true;
  player.label = "player";
  // player.sprite = playerSprite;

  // Se guarda en el estado global
  gameState.player = player;

  getBodies().push(player);
  Matter.World.add(world, player);
  return player;
}

export function updatePlayer() {
  if (!player) return;

  // Funcion de pause (no funciona como es debido)
  // if(keys['p'] && !keysPressed['p']) {
  //   togglePauseGame();
  //   keysPressed['p'] = true;
  // }

  if (gameState.isPaused) return;

  if (keys['g'] && !keysPressed['g']) {
    toggleTimeScale(0.25);
    keysPressed['g'] = true;
  }

  if (keys['a'] || keys['ArrowLeft']) {
    Matter.Body.applyForce(player, player.position, { x: -force, y: 0 });
  }

  if (keys['d'] || keys['ArrowRight']) {
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

export function toggleTimeScale(newTimeScale) {
  gameState.timeScale = gameState.timeScale === 1 ? newTimeScale : 1;
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

export function handleMousePressed(p) {
  // Lo que movimos la camara
  const camX = (p.width / 2 - 225) - gameState.player.position.x;
  const camY = (p.height / 2 + 70) - gameState.player.position.y;

  // Transformar mouseX/mouseY a coordenadas del mundo movido
  const worldX = p.mouseX - camX;
  const worldY = p.mouseY - camY;
  createBox(worldX, worldY, 50, 50);
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
  const pos = player.position;
  const angle = player.angle;

  p.push();
  p.translate(pos.x, pos.y);
  p.rotate(angle);

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