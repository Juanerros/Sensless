import Matter from "matter-js";
import { Vector2 } from "../utils/Vector2";
import { getElements, getSpriteByName } from "./sprites";
import { gameState } from "./state";
import { addToWorld } from "./physics";

const world = null;
const boxes = [];

export function checkQuimic(world, boxes) {
    world = world;
    boxes = boxes;

    boxes.forEach(body => {
        if (body.label === "element") {
            if (body.element === "hidrogeno") {
                body.sprite = getSpriteByName('hidrogeno');
            }
            if (body.element === "oxigeno") {
                body.sprite = getSpriteByName('oxigeno');
            }
        }
    })

    checkWaterFormation();
}

export function createQuimic(x, y, w, h, index) {
    const box = Matter.Bodies.rectangle(x, y, w, h, {
        timeScale: gameState.timeScale,
        friction: 0.5,
        restitution: 0.01,
        mass: 5,
    });

    addToWorld(box)

    box.width = w;
    box.height = h;
    box.label = 'element'
    box.sprite = getElements()[index].sprite;
    box.element = getElements()[index].name;
}

function checkWaterFormation() {
    const elements = boxes.filter(body => body.label === "element");
    const hydrogens = elements.filter(body => body.element === "hidrogeno");
    const oxygens = elements.filter(body => body.element === "oxigeno");

    if (hydrogens.length >= 2 && oxygens.length >= 1) {
        for (let oxygen of oxygens) {
            let nearbyHydrogens = [];

            for (let hydrogen of hydrogens) {
                const distance = Vector2.distance(oxygen.position, hydrogen.position);

                console.log('Distancia: ', distance);

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

        addToWorld(water);
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