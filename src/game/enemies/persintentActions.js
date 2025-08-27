import { gameState } from "../state";

export function drawPersistentActions(p) {
  if (!gameState.persistentActions) return;

  for (let i = gameState.persistentActions.length - 1; i >= 0; i--) {
    const action = gameState.persistentActions[i];

    // Dibujar círculo rojo
    p.push();
    for (let j = action.radius * 2; j > 0; j -= 5) {
      let alpha = p.map(j, 0, action.radius * 2, 0, 50);
      p.fill(255, 0, 0, alpha);
      p.noStroke();
      p.circle(action.x, action.y, j);
    }
    p.noFill();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.circle(action.x, action.y, action.radius * 2);
    p.pop();

    // Reducir tiempo de vida
    action.lifeTime--;
    if (action.lifeTime <= 0) {
      gameState.persistentActions.splice(i, 1); // eliminar cuando muere
    }
  }
}
