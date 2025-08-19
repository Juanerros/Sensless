import Matter from "matter-js";
import { gameState } from "./state";

let engine, world;
let boxes = [];
let boxSprite;

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

export function loadBoxSprite(img) {
  boxSprite = img
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
  box.label = "box";
  box.sprite = boxSprite;

  boxes.push(box);
}

export function updatePhysics() {
  updateTimeScale();
  Matter.Engine.update(engine);
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
