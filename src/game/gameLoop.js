import { updatePhysics, getBodies } from './physics.js';
import { updateWorldGeneration } from './worldGeneration.js';
import { moveCamera } from './camera.js';
import { getPlayer } from './player.js';
import { clearAllMagicShots } from './magicShotsSystem.js';
import { gameState } from './state.js';

class GameLoop {
  constructor() {
    this.player = null;
    this.enemies = [];
    this.gameState = {
      cameraX: 0,
      cameraY: 0,
      gameOver: false
    };
  }

  setPlayer(player) {
    this.player = player;
  }

  setEnemies(enemies) {
    this.enemies = enemies;
  }

  update(p) {
    if (this.gameState.gameOver) return;

    this.updatePhysics();
    this.updateCamera(p);
    this.updateEnemies();
    this.updateWorldGeneration();
    this.checkPlayerHealth();
  }

  updatePhysics() {
    updatePhysics();
  }

  updateCamera(p) {
    const player = getPlayer();
    if (player) {
      moveCamera(p);
      this.gameState.cameraX = player.position.x;
      this.gameState.cameraY = player.position.y;
    }
  }

  updateEnemies() {
    this.enemies.forEach(enemy => {
      if (enemy && typeof enemy.update === 'function') {
        enemy.update();
      }
    });
  }

  updateWorldGeneration() {
    const player = getPlayer();
    if (player) {
      updateWorldGeneration(player.position.x, player.position.y);
    }
  }

  saveGame(win, cause) {
    const form = document.createElement('form');
      form.method = 'POST';
      form.action = '../controller/saveScore.php';

      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = 'score';
      hiddenField.value = gameState.score; // Ajusta esto al método real de tu GameLoop
      form.appendChild(hiddenField);

      const time = Date.now() - gameState.startAt;

      const timeField = document.createElement('input');
      timeField.type = 'hidden';
      timeField.name = 'time';
      timeField.value = time;
      form.appendChild(timeField);

      const winField = document.createElement('input');
      winField.type = 'hidden';
      winField.name = 'win';
      winField.value = win;
      form.appendChild(winField);

      const seedField = document.createElement('input');
      seedField.type = 'hidden';
      seedField.name = 'seed';
      seedField.value = gameState.seed;
      form.appendChild(seedField);

      const causeField = document.createElement('input');
      causeField.type = 'hidden';
      causeField.name = 'cause';
      causeField.value = cause;
      form.appendChild(causeField);
      document.body.appendChild(form);
      form.submit();
      return;
  }

  checkPlayerHealth() {
    const player = getPlayer();
    if (player && player.health <= 0) {
      this.gameState.gameOver = true;
    }
  }

  isGameOver() {
    return this.gameState.gameOver;
  }

  resetGame() {
    const player = getPlayer();
    if (player) {
      // Reiniciar posición del jugador
      Matter.Body.setPosition(player, { x: 400, y: 300 });
      Matter.Body.setVelocity(player, { x: 0, y: 0 });
      player.isAlive = true;
    }
    
    // Limpiar disparos mágicos
    clearAllMagicShots();
    
    // Reiniciar estado del juego
    this.gameState.isGameOver = false;
    gameState.isGameOver = false;
  }

  getGameState() {
    return this.gameState;
  }
}

export default GameLoop;