import { updatePhysics, getBodies } from './physics.js';
import { updateWorldGeneration } from './worldGeneration.js';
import { moveCamera } from './camera.js';
import { getPlayer } from './player.js';

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
    this.gameState.gameOver = false;
    window.location.reload();
  }

  getGameState() {
    return this.gameState;
  }
}

export default GameLoop;