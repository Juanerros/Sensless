import Matter from "matter-js";
import { getBodies } from "./physics.js";
import { gameState } from "./state.js";
import { updateControls } from "./controls.js";
import { getSpriteByName } from "./sprites.js";

let player;
let world;

export function createPlayer(x, y, worldRef) {
  const playerWidth = 42;
  const playerHeight = 80;

  world = worldRef;
  player = Matter.Bodies.rectangle(x, y, playerWidth, playerHeight, {
    frictionAir: 0.02,
    friction: 0.1,
    density: 0.001,
    restitution: 0,
    inertia: Infinity
  });
  player.width = playerWidth;
  player.height = playerHeight;
  player.isPlayer = true;
  player.label = "player";
  player.sprite = getSpriteByName('player');
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

  drawBorderBox(p);
  updateControls(player, getBodies);
}

function drawBorderBox(p) {
  p.noFill();
  p.stroke(0);
  p.rect(p.mouseX - 25, p.mouseY - 25, 50, 50);
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

  player.sprite = getSpriteByName('player');

  if (player.sprite && player.sprite.width > 0) {
    p.imageMode(p.CENTER);
    p.image(player.sprite, 0, 0, player.width, player.height);
  } else {
    p.fill(0, 0, 0);
    p.rectMode(p.CENTER);
    p.rect(0, 0, player.width, player.height);
  }

  p.pop();
}

export function getPlayer() {
  return player;
}