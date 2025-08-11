import Matter from "matter-js";

let engine, world;
let boxes = [];

export function setupPhysics(p) {
    engine = Matter.Engine.create();
    world = engine.world;

    // Crear un suelo
    const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true });
    Matter.World.add(world, ground);
    ground.width = 810;
    ground.height = 40;
    ground.label = "ground";

    createBox(400, 300, 50, 50);

    boxes.push(ground);
}

export function createBox(x, y, w, h) {
    const box = Matter.Bodies.rectangle(x, y, w, h);
    Matter.World.add(world, box);
    box.width = w;
    box.height = h;
    box.label = "box";

    boxes.push(box);
}

export function updatePhysics() {
    Matter.Engine.update(engine);
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
