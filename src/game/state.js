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
  startAt: null,
  // solicitud de reset desde controles
  resetRequested: false,
  // Progreso del jugador: experiencia y habilidades
  xp: {
    level: 1,
    current: 0,
    required: 60, // se recalcula al iniciar el sistema
    lastPassiveAt: 0,
    levelUpPending: false,
    pendingOptions: []
  },
  skillsSelected: []
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

export function addScore(points) {
  const value = typeof points === 'number' ? points : 0;
  if (value <= 0) return;
  gameState.score += value;
}