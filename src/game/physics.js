import Matter from "matter-js";
import { gameState } from "./state";
import { getSpriteByName } from './sprites.js';
import { checkQuimic } from "./quimic.js";
import { initializeWorldGeneration } from './worldGeneration.js';

let engine, world;
let boxes = [];

export function setupPhysics() {
  engine = Matter.Engine.create();
  world = engine.world;

  gameState.world = world;

  // Inicializar sistema de generación procedural
  initializeWorldGeneration();
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

export function createBox(x, y) {
  const box = Matter.Bodies.rectangle(x, y, 50, 50, {
    timeScale: gameState.timeScale,
    friction: 0.3,
    restitution: 0.2,
    mass: 5,
  });
  Matter.World.add(world, box);
  box.width = 50;
  box.height = 50;
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


// Pool de objetos reutilizables
class ObjectPool {
  constructor() {
    this.terrainPool = [];
    this.elementPool = [];
  }

  getTerrainBody(x, y, width, height, options = {}) {
    let body = this.terrainPool.pop();
    
    if (!body) {
      body = Matter.Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        friction: 0.8,
        restitution: 0.1,
        ...options
      });
    } else {
      // Reutilizar cuerpo existente
      Matter.Body.setPosition(body, { x, y });
      Matter.Body.setAngle(body, 0);
      Object.assign(body, options);
    }
    
    body.width = width;
    body.height = height;
    return body;
  }

  getElementBody(x, y, width, height, options = {}) {
    let body = this.elementPool.pop();
    
    if (!body) {
      body = Matter.Bodies.rectangle(x, y, width, height, {
        friction: 0.3,
        restitution: 0.4,
        density: 0.001,
        ...options
      });
    } else {
      Matter.Body.setPosition(body, { x, y });
      Matter.Body.setAngle(body, 0);
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Object.assign(body, options);
    }
    
    body.width = width;
    body.height = height;
    return body;
  }

  returnTerrainBody(body) {
    if (this.terrainPool.length < 100) { // Limitar tamaño del pool
      this.terrainPool.push(body);
    }
  }

  returnElementBody(body) {
    if (this.elementPool.length < 50) {
      this.elementPool.push(body);
    }
  }
}

const objectPool = new ObjectPool();

export function getObjectPool() {
  return objectPool;
}
