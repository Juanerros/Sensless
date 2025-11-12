import { getPlayer } from "./player.js";

export function moveCamera(p) {
    const player = getPlayer();
    if (!player) return;

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2 + 80;

    p.translate(viewportCenterX - player.position.x, viewportCenterY - player.position.y);
}

export function screenToWorldCoordinates(screenX, screenY) {
    const player = getPlayer();
    if (!player) return { x: screenX, y: screenY };

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    return {
        x: screenX + player.position.x - viewportCenterX,
        y: screenY + player.position.y - viewportCenterY
    };
}