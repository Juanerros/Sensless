import Matter from "matter-js";
import { Vector2 } from "../utils/Vector2";
import { getElements, getSpriteByName } from "./sprites";
import { gameState } from "./state";
import { addToWorld, removeFromWorld } from "./physics";
import { createSpell } from "./magic";

let boxes = [];

export function checkQuimic(boxs) {
    boxes = boxs;

    checkWaterFormation();
}

export function createQuimic(x, y, element) {
    const box = Matter.Bodies.rectangle(x, y, 33, 45, {
        timeScale: gameState.timeScale,
        friction: 0.5,
        restitution: 0.01,
        mass: 5,
    });

    addToWorld(box)

    box.width = 33;
    box.height = 45;
    box.label = 'element'
    box.sprite = getSpriteByName(element);
    box.element = element;
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

    createSpell(centerX, centerY, 'water');

    removeElements([oxygen, ...hydrogens]);
}

function removeElements(elementsToRemove) {
    elementsToRemove.forEach(element => {
        removeFromWorld(element);
    });
}