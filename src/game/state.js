export const gameState = {
  player: null,
  score: 0,
  timeScale: 1,
  isPaused: false,
  cameraX: -225,
  cameraY: 70,
  //Cosa para los enemigos
  world: null ,
  persistentActions: []
};

export function togglePauseGame() {
    gameState.isPaused = !gameState.isPaused;
    gameState.timeScale = gameState.isPaused ? 0 : 1;
}