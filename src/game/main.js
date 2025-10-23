import p5 from 'p5';
import { gameState } from "./state.js";
import { setupPhysics, getWorld } from './physics.js';
import { initializeWorldGeneration } from './worldGeneration.js';
import { createPlayer, updatePlayer, drawPlayer, getPlayerHealth } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
import { enemies } from './enemies/enemy.js';
import { updateTimeEffects, drawTimeEffects } from './enemies/timeEffects.js';
import SpriteLoader from './spriteLoader.js';
import GameLoop from './gameLoop.js';
import Renderer from './renderer.js';
import GameOverScreen from './gameOverScreen.js';
import HUD from './hud.js';
import EnemySpawner from './enemies/spawner.js';
import { updateBullets } from './enemies/bandit.js';

let player;
let gameLoop;
let renderer;
let gameOverScreen;
let spriteLoader;
let spritesLoaded = false;
let hud;
let spawner;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1800, 900);
    p.noSmooth();
    setupPhysics();
    initializeWorldGeneration();
    
    player = createPlayer(400, 200, getWorld(), p);
    
    gameLoop = new GameLoop();
    gameLoop.setPlayer(player);
    
    renderer = new Renderer();
    renderer.setPlayer(player);
    
    gameOverScreen = new GameOverScreen();
    
    hud = new HUD();
    
    spriteLoader = new SpriteLoader();
    spriteLoader.loadAllSprites(p, () => {
      spritesLoaded = true;

      gameLoop.setEnemies(enemies);

      // Inicializamos el spawner cuando ya cargaron los sprites
      spawner = new EnemySpawner();
      spawner.setPlayer(player);
      spawner.setIntervalMs(2500);
      spawner.setMaxEnemies(20);   
      spawner.start();

    });
  };

  p.draw = () => {
    if (!spritesLoaded) {
      spriteLoader.drawLoadingScreen(p);
      return;
    }
    
    renderer.drawBackground(p);
    
    gameLoop.update(p);
    updateTimeEffects();
    
    if (player) {
      updatePlayer(p);
      drawPlayer(p);
    }

    // Actualización de balas (necesaria para que no caigan por gravedad)
    updateBullets();
    
    // Spawner: genera enemigos de forma gradual
    if (spawner) spawner.update(p);

    renderer.drawBodies(p);
    // Enemigos se dibujan solo desde el renderer
    drawTimeEffects(p);
    
    if (player) {
      const playerHealth = getPlayerHealth();
      hud.drawAll(p, playerHealth.current, playerHealth.max);
    }
    
    if (gameLoop.isGameOver()) {
      gameOverScreen.show();
    }
    
    gameOverScreen.draw(p);
  };

  p.keyPressed = () => {
    handleKeyPressed(p.key);
    
    if (p.key === 'r' || p.key === 'R') {
      gameLoop.resetGame();
    }
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };

  p.mousePressed = () => {
    // Si el Game Over está visible, priorizamos sus clics
    const action = gameOverScreen.handleMousePressed(p);
    if (action === 'restart') {
      gameLoop.resetGame();
      return;
    } else if (action === 'save') {
      gameLoop.saveGame(false, 'Murio');
    }

    // Si no hubo acción en Game Over, delegar al control normal
    handleMousePressed(p, player);
  };
};

new p5(sketch);
