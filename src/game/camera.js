import { getPlayer } from "./player";
import { gameState } from "./state";

export function moveCamera(p) {
    const player = getPlayer();
    if (!player) return;

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;


    // Dios es el unico que sabe de donde salen estos numeros

    // para cuando el ancho es de 800px
    gameState.cameraX = -500;
    // para cuando el alto es de 1000px
    gameState.cameraX = -400;
    gameState.cameraY = -90



    p.translate(viewportCenterX - player.position.x, viewportCenterY - player.position.y);
}