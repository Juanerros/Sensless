import p5 from 'p5';
import { setupPhysics, getWorld } from './physics.js';
import { initializeWorldGeneration } from './worldGeneration.js';
import { createPlayer, updatePlayer, drawPlayer, getPlayerHealth } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
import { enemies, drawEnemies } from './enemies/enemy.js';
import { updateTimeEffects, drawTimeEffects } from './enemies/timeEffects.js';
import SpriteLoader from './spriteLoader.js';
import GameLoop from './gameLoop.js';
import Renderer from './renderer.js';
import GameOverScreen from './gameOverScreen.js';
import HUD from './hud.js';

let player;
let gameLoop;
let renderer;
let gameOverScreen;
let spriteLoader;
let spritesLoaded = false;
let hud;

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
      spriteLoader.createEnemies();
      gameLoop.setEnemies(enemies);
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
    
    renderer.drawBodies(p);
    drawEnemies(p);
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
    
    if (gameOverScreen.handleKeyPressed(p.key)) {
      gameLoop.resetGame();
    }
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };

  p.mousePressed = () => {
    handleMousePressed(p, player);
  };
};

new p5(sketch);
