export const gameState = {
  player: null,
  score: 0,
  timeScale: 1,
  isPaused: false,
  isGameOver: false,
  cameraX: -225,
  cameraY: 70,
  seed: 0,
  //Cosa para los enemigos
  world: null ,
  persistentActions: [],
  startAt: Date.now()
};

export function togglePauseGame() {
    gameState.isPaused = !gameState.isPaused;
    gameState.timeScale = gameState.isPaused ? 0 : 1;
}

export function  restartGame() {
    // Reiniciar el estado del juego
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.timeScale = 1;
    gameState.score = 0;
    
    // Recargar la página para reiniciar completamente el juego
    window.location.reload();
}