import Matter from "matter-js";
import { gameState } from "./state";

let engine, world;
let boxes = [];
let elements = [
  {
    name: 'box',
    sprite: null,
  },
  {
    name: 'hidrogeno',
    sprite: null,
  },
  {
    name: 'oxigeno',
    sprite: null,
  },
  {
    name: 'agua',
    sprite: null,
  },
]

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

export function loadSprite(img, name) {
  elements.forEach(e => { 
    if (e.name === name) {
      e.sprite = img;
    }
  })
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
  box.sprite = elements[0].sprite;
  box.label = "box";

  boxes.push(box);
}

export function createQuimic(x, y, w, h, index) {
  const box = Matter.Bodies.rectangle(x, y, w, h, {
    timeScale: gameState.timeScale,
    friction: 0.5,
    restitution: 0.01,
    mass: 5,
  });
  Matter.World.add(world, box);

  box.width = w;
  box.height = h;
  box.label = 'element'
  box.sprite = elements[index].sprite;
  box.element = elements[index].name;

  boxes.push(box);
}

export function updatePhysics() {
  checkQuimic();

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

function checkQuimic() {
  boxes.forEach(body => {
    if (body.label === "element") {
      if (body.element === "hidrogeno") {
        body.sprite = elements[1].sprite;
      }
      if (body.element === "oxigeno") {
        body.sprite = elements[2].sprite;
      }
    }
  })

  checkWaterFormation();
}

function checkWaterFormation() {
  const elements = boxes.filter(body => body.label === "element");
  const hydrogens = elements.filter(body => body.element === "hidrogeno");
  const oxygens = elements.filter(body => body.element === "oxigeno");

  if (hydrogens.length >= 2 && oxygens.length >= 1) {
    for (let oxygen of oxygens) {
      let nearbyHydrogens = [];

      for (let hydrogen of hydrogens) {
        const distance = Math.sqrt(
          Math.pow(oxygen.position.x - hydrogen.position.x, 2) +
          Math.pow(oxygen.position.y - hydrogen.position.y, 2)
        );

        if (distance < 100) {
          nearbyHydrogens.push(hydrogen);
        }
      }

      if (nearbyHydrogens.length >= 2) {
        createWater(oxygen, nearbyHydrogens.slice(0, 2));
        break;
      }
    }
  }
}

function createWater(oxygen, hydrogens) {
  const centerX = (oxygen.position.x + hydrogens[0].position.x + hydrogens[1].position.x) / 3;
  const centerY = (oxygen.position.y + hydrogens[0].position.y + hydrogens[1].position.y) / 3;

  for (let i = 0; i < 20; i++) {
    const water = Matter.Bodies.circle(centerX, centerY, 5, {
      timeScale: gameState.timeScale,
      friction: 0.01,
      restitution: 0.2,
      mass: .5,
    });

    water.width = 10;
    water.height = 10;
    water.label = "water";
    water.element = "agua";
    water.shape = 'circle'

    Matter.World.add(world, water);
    boxes.push(water);
  }
  removeElements([oxygen, ...hydrogens]);
}

function removeElements(elementsToRemove) {
  elementsToRemove.forEach(element => {
    Matter.World.remove(world, element);
    const index = boxes.indexOf(element);
    if (index > -1) {
      boxes.splice(index, 1);
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
