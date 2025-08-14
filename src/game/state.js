export const gameState = {
  player: null,
  score: 0,
  timeScale: 1,
  isPaused: false,
  fixedCamera: -225
};

export function togglePauseGame() {
    gameState.isPaused = !gameState.isPaused;
    gameState.timeScale = gameState.isPaused ? 0 : 1;
}