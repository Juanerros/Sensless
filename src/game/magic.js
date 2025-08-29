import Matter from 'matter-js';
import { gameState } from "./state";
import { addToWorld } from "./physics";
import { getSpriteByName } from './sprites';

export function createSpell(x, y, element) {
    const box = Matter.Bodies.rectangle(x, y, 30, 40, {
        timeScale: gameState.timeScale,
        friction: 0.5,
        restitution: 0.01,
        mass: 5,
    });

    box.width = 30;
    box.height = 40;
    box.label = 'spell';
    box.element = element;
    box.sprite = getSpriteByName(element);

    addToWorld(box);
}