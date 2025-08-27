import Matter from "matter-js";
import { gameState } from "./state";
import { getElements, getSpriteByName } from './sprites.js';
import { checkQuimic } from "./quimic.js";

let engine, world;
let boxes = [];

export function setupPhysics() {
  engine = Matter.Engine.create();
  world = engine.world;

  //Cosa de los enemigos
  gameState.world = world;

  // Crear un suelo
  const ground = Matter.Bodies.rectangle(900, 790, 1800, 80, { isStatic: true });
  Matter.World.add(world, ground);
  ground.width = 1800;
  ground.height = 80;
  ground.label = "ground";

  boxes.push(ground);
}

export function addToWorld(body) {
  Matter.World.add(world, body);
  boxes.push(body);
}

export function removeFromWorld(body) {
  Matter.World.remove(world, body);
  boxes = boxes.filter(b => b !== body);
}

export function updatePhysics() {
  checkQuimic(boxes);

  updateTimeScale();
  Matter.Engine.update(engine);
}

export function createBox(x, y, w, h) {
  const box = Matter.Bodies.rectangle(x, y, w, h, {
    timeScale: gameState.timeScale,
    friction: 0.3,
    restitution: 0.2,
    mass: 5,
  });
  Matter.World.add(world, box);
  box.width = w;
  box.height = h;
  box.sprite = getSpriteByName('box');
  box.label = "box";

  boxes.push(box);
}

function updateTimeScale() {
  boxes.forEach(body => {
    if (!body.isPlayer) {
      body.timeScale = gameState.timeScale;
    }
  });
}

export function getBodies() {
  return boxes;
}

export function getWorld() {
  return world;
}

export function getEngine() {
  return engine;
}
