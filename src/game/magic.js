import Matter from 'matter-js';
import { gameState } from "./state";
import { addToWorld } from "./physics";
import { getSpriteByName } from './sprites';

export function createSpell(x, y, w, h, element) {
    const box = Matter.Bodies.rectangle(x, y, w, h, {
        timeScale: gameState.timeScale,
        friction: 0.5,
        restitution: 0.01,
        mass: 5,
    });

    box.width = w;
    box.height = h;
    box.label = 'spell';
    box.element = element;
    box.sprite = getSpriteByName(element);

    addToWorld(box);
}