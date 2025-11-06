import p5 from 'p5';
import { gameState } from "./state.js";
import { setupPhysics, getWorld } from './physics.js';
import { initializeWorldGeneration } from './worldGeneration.js';
import { createPlayer, updatePlayer, drawPlayer, getPlayerHealth } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
import { enemies } from './enemies/core/enemy.js';
import { updateTimeEffects, drawTimeEffects } from './enemies/effects/timeEffects.js';
import SpriteLoader from './spriteLoader.js';
import GameLoop from './gameLoop.js';
import Renderer from './renderer.js';
import GameOverScreen from './gameOverScreen.js';
import HUD from './hud.js';
import EnemySpawner from './enemies/core/spawner.js';
import { updateBullets } from './enemies/types/bandit.js';
import assetLoader from './assets/assetLoader.js';
import { getAllAssets } from './assets/assetList.js';
import { elements } from './sprites.js';
import { initMagicShotsSystem, updateMagicShotsSystem, drawMagicShots } from './magicShotsSystem.js';

let player;
let gameLoop;
let renderer;
let gameOverScreen;
let spriteLoader;
let spritesLoaded = false;
let hud;
let spawner;
let loadingProgress = 0;

const sketch = (p) => {
  p.setup = () => {
    gameState.startAt = Date.now();
    p.createCanvas(1800, 900);
    p.noSmooth();
    setupPhysics();
    initializeWorldGeneration();
    initMagicShotsSystem();
    
    player = createPlayer(400, 200, getWorld(), p);
    
    gameLoop = new GameLoop();
    gameLoop.setPlayer(player);
    
    renderer = new Renderer();
    renderer.setPlayer(player);
    
    gameOverScreen = new GameOverScreen();
    
    hud = new HUD();
    
    // Iniciar la carga de assets en un hilo separado
    loadAssetsAsync(p);
  };

  // Función para cargar assets de forma asíncrona
  const loadAssetsAsync = (p) => {
    // Registrar callback de progreso
    assetLoader.onProgress(progress => {
      loadingProgress = progress.progress;
      console.log(`Cargando asset: ${progress.name} (${Math.floor(progress.progress * 100)}%)`);
    });
    
    // Cargar todos los assets definidos en assetList.js
    assetLoader.loadAssets(getAllAssets(), p)
      .then(() => {
        console.log('Todos los assets cargados correctamente');
        
        // Verificar que los sprites del jugador se cargaron correctamente
        const playerSprites = ['player', 'playerIdleGif', 'playerMoveGif', 'playerJump1', 'playerJump2', 'playerHurt1', 'playerHurt2', 'playerDead'];
        let allPlayerSpritesLoaded = true;
        
        playerSprites.forEach(spriteName => {
          const sprite = assetLoader.getAsset(spriteName);
          if (!sprite || !sprite.width) {
            console.warn(`Sprite del jugador no cargado correctamente: ${spriteName}`);
            allPlayerSpritesLoaded = false;
          } else {
            console.log(`Sprite del jugador cargado correctamente: ${spriteName} (${sprite.width}x${sprite.height})`);
          }
        });
        
        if (!allPlayerSpritesLoaded) {
          console.warn('Algunos sprites del jugador no se cargaron correctamente. Usando fallback.');
          
          // Intentar cargar los sprites críticos directamente con p5
          console.log('Intentando cargar sprites críticos directamente...');
          
          // Crear sprites fallback para casos de emergencia
          const createFallbackSprite = (width, height, color) => {
            const fallbackSprite = p.createGraphics(width, height);
            fallbackSprite.background(color);
            fallbackSprite.stroke(255);
            fallbackSprite.noFill();
            fallbackSprite.rect(0, 0, width-1, height-1);
            fallbackSprite.line(0, 0, width, height);
            fallbackSprite.line(width, 0, 0, height);
            return fallbackSprite;
          };
          
          // Crear sprites fallback para cada tipo
          const fallbackSprites = {
            player: createFallbackSprite(14, 23, [0, 0, 0]),
            playerIdleGif: createFallbackSprite(18, 23, [0, 0, 255]),
            playerMoveGif: createFallbackSprite(15, 24, [0, 255, 0]),
            playerJump1: createFallbackSprite(32, 32, [255, 255, 0]),
            playerJump2: createFallbackSprite(32, 32, [255, 255, 0]),
            playerHurt1: createFallbackSprite(15, 23, [255, 0, 0]),
            playerHurt2: createFallbackSprite(15, 23, [255, 0, 0]),
            playerDead: createFallbackSprite(23, 10, [100, 0, 0])
          };
          
          // Asignar sprites fallback a los elementos que no se cargaron correctamente
          playerSprites.forEach(spriteName => {
            const sprite = assetLoader.getAsset(spriteName);
            if (!sprite || !sprite.width) {
              console.log(`Usando sprite fallback para: ${spriteName}`);
              const element = elements.find(e => e.name === spriteName);
              if (element) {
                element.sprite = fallbackSprites[spriteName];
                // Asegurarse de que el sprite tenga las propiedades necesarias
                if (element.sprite) {
                  console.log(`Sprite fallback asignado para ${spriteName}: ${element.sprite.width}x${element.sprite.height}`);
                }
              }
            }
          });
          
          // Intentar cargar los sprites críticos directamente con p5 desde la ruta correcta
          p.loadImage('./public/sprites/zenith/idle.gif', (img) => {
            console.log('playerIdleGif cargado directamente:', img.width, 'x', img.height);
            const element = elements.find(e => e.name === 'playerIdleGif');
            if (element) element.sprite = img;
          }, (err) => {
            console.error('No se pudo cargar playerIdleGif directamente (ruta 1):', err);
            // Intentar con otra ruta
            p.loadImage('/sprites/zenith/idle.gif', (img) => {
              console.log('playerIdleGif cargado con ruta alternativa:', img.width, 'x', img.height);
              const element = elements.find(e => e.name === 'playerIdleGif');
              if (element) element.sprite = img;
            }, (err) => {
              console.error('No se pudo cargar playerIdleGif directamente (ruta 2):', err);
            });
          });
          
          p.loadImage('./public/sprites/zenith/correr.gif', (img) => {
            console.log('playerMoveGif cargado directamente:', img.width, 'x', img.height);
            const element = elements.find(e => e.name === 'playerMoveGif');
            if (element) element.sprite = img;
          }, (err) => {
            console.error('No se pudo cargar playerMoveGif directamente (ruta 1):', err);
            // Intentar con otra ruta
            p.loadImage('/sprites/zenith/correr.gif', (img) => {
              console.log('playerMoveGif cargado con ruta alternativa:', img.width, 'x', img.height);
              const element = elements.find(e => e.name === 'playerMoveGif');
              if (element) element.sprite = img;
            }, (err) => {
              console.error('No se pudo cargar playerMoveGif directamente (ruta 2):', err);
            });
          });
        }
        
        spritesLoaded = true;
        
        // Inicializar el juego después de cargar los assets
        gameLoop.setEnemies(enemies);
        
        // Inicializamos el spawner cuando ya cargaron los sprites
        spawner = new EnemySpawner();
        spawner.setPlayer(player);
        spawner.setIntervalMs(2500);
        spawner.setMaxEnemies(20);   
        spawner.start();
      })
      .catch(error => {
        console.error('Error cargando assets:', error);
        // Si falla la carga con el nuevo sistema, intentar con el sistema original
        fallbackToOriginalLoader(p);
      });
  };
  
  // Función de fallback al sistema de carga original
  const fallbackToOriginalLoader = (p) => {
    console.log('Usando sistema de carga original como fallback');
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
      drawLoadingScreen(p);
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
    
    // Actualizar y dibujar disparos mágicos
    updateMagicShotsSystem(p);
    drawMagicShots(p);

    if (player) {
      const playerHealth = getPlayerHealth();
      hud.drawAll(p, playerHealth.current, playerHealth.max);
    }
    
    if (gameLoop.isGameOver()) {
      gameOverScreen.show();
    }
    
    gameOverScreen.draw(p);

    // Dibujar barra de progreso de oleadas del spawner por encima de todo
    if (spawner) spawner.draw(p);
  };
  
  // Función para dibujar la pantalla de carga
  const drawLoadingScreen = (p) => {
    p.background(20, 20, 30);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text('Cargando...', p.width / 2, p.height / 2 - 50);
    
    // Barra de progreso
    const barWidth = p.width * 0.6;
    const barHeight = 20;
    const barX = p.width / 2 - barWidth / 2;
    const barY = p.height / 2 + 20;
    
    // Fondo de la barra
    p.fill(50);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Progreso
    p.fill(0, 255, 100);
    p.rect(barX, barY, barWidth * loadingProgress, barHeight);
    
    // Porcentaje
    p.fill(255);
    p.textSize(16);
    p.text(Math.floor(loadingProgress * 100) + '%', p.width / 2, barY + barHeight + 20);
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
