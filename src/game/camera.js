import { getPlayer } from "./player";
import { gameState } from "./state";

export function moveCamera(p) {
    const player = getPlayer();
    if (!player) return;

    const heightCamera = 70

    p.translate((p.width / 2 + gameState.fixedCamera) - player.position.x, p.height / 2 - player.position.y + heightCamera);
}