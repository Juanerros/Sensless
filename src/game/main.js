import p5 from 'p5';
import { setupPhysics, getWorld } from './physics.js';
import { initializeWorldGeneration } from './worldGeneration.js';
import { createPlayer, updatePlayer, drawPlayer, getPlayerHealth } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
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
      gameLoop.setEnemies([]);
    });
  };

  // Función para verificar si todos los sprites están cargados
  // En checkAllSpritesLoaded(), agregar:
  function checkAllSpritesLoaded() {
    if (basicSpritesLoaded && enemySpritesLoaded && !enemiesCreated) {
      const chaser = new ChaserEnemy(900, 700, getWorld());
      const wanderer = new WanderingBud(700, 700, getWorld());
      const bandit = new Bandit(1200, 600, getWorld()); // Nuevo bandit
      
      // Asignar sprites después de crear los enemigos
      const olvidoSprite = getEnemySpriteByName('olvido');
      if (olvidoSprite) {
        chaser.sprite = olvidoSprite;
        chaser.body.sprite = olvidoSprite;
      }

      const wanderingBud = getEnemySpriteByName('wanderingBud');
      if(wanderingBud){

        wanderer.sprite = wanderingBud;
        wanderer.body.sprite = wanderingBud;

      }
      
      enemiesCreated = true;
    }
  }

  p.draw = () => {
    if (!spritesLoaded) return;
    
    renderer.drawBackground(p);
    
    gameLoop.update(p);
    
    if (player) {
      updatePlayer(p);
      drawPlayer(p);
    }
    
    renderer.drawBodies(p);
    
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

// Actualizar función drawBodies para manejar terreno procedural
function drawBodies(p) {
  const bodies = getBodies();
  
  // Obtener posición real de la cámara basada en el jugador
  const cameraX = player ? player.position.x : 0;
  const cameraY = player ? player.position.y : 0;
  const screenWidth = p.width;
  const screenHeight = p.height;
  const margin = -50;
  
  // Calcular bounds de la pantalla
  const leftBound = cameraX - screenWidth / 2 - margin;
  const rightBound = cameraX + screenWidth / 2 + margin;
  const topBound = cameraY - screenHeight / 2 - margin;
  const bottomBound = cameraY + screenHeight / 2 + margin;

  bodies.forEach(body => {
    if (body.isPlayer || body.isEnemy || body.label === 'bullet') return;
    
    const pos = body.position;
    
    // Culling: solo dibujar si está en pantalla
    if (pos.x < leftBound || pos.x > rightBound || 
        pos.y < topBound || pos.y > bottomBound) {
      return;
    }
    
    const angle = body.angle;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);

    if (body.sprite && body.sprite.width > 0) {
      p.imageMode(p.CENTER);
      p.image(body.sprite, 0, 0, body.width, body.height);
    } else {
      // Colores específicos para diferentes tipos de terreno
      if (body.label === 'terrain') {
        // Aplicar oscurecimiento por capas subterráneas
        const baseColor = [101, 67, 33];
        if (body.layer > 0) {
          const darkenAmount = Math.min(body.layer * 15, 60);
          const r = Math.max(baseColor[0] - darkenAmount, 0);
          const g = Math.max(baseColor[1] - darkenAmount, 0);
          const b = Math.max(baseColor[2] - darkenAmount, 0);
          p.fill(r, g, b);
          p.stroke(r, g, b);
        } else {
          p.fill(101, 67, 33);
          p.stroke(101, 67, 33);
        }
        p.strokeWeight(1);
      } else if (body.label === 'ground') {
        p.fill(139, 69, 19);
        p.stroke(0);
        p.strokeWeight(2);
      } else {
        p.fill(100);
      }
      p.rectMode(p.CENTER);
      // Validar que width y height estén definidos antes de dibujar
      if (body.width !== undefined && body.height !== undefined && 
          body.width > 0 && body.height > 0) {
        p.rect(0, 0, body.width, body.height);
      } else {
        console.log("Cuerpo con dimensiones inválidas:", {
          label: body.label,
          width: body.width,
          height: body.height
        });
      }
    }

    p.pop();
  });
}

// Variable para cargar el logo
let logoImage = null;
let logoLoaded = false;

// Función para dibujar la pantalla de muerte
function drawGameOverScreen(p) {
  // Cargar logo si no está cargado
  if (!logoImage && !logoLoaded) {
    logoLoaded = true; 
    p.loadImage('sprites/interfas/logo.png', (img) => {
      logoImage = img;
      console.log('Logo cargado exitosamente');
    }, () => {
      console.error('Error al cargar el logo');
      logoLoaded = false;
    });
  }
  
  // Fondo semitransparente con blur
  p.push();
  p.fill(255, 255, 255, 200); 
  p.noStroke();
  p.rect(0, 0, p.width, p.height);
  p.pop();
  
  // Usar dimensiones de la ventana para centrado correcto
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Dibujar logo centrado
  if (logoImage) {
    p.push();
    p.imageMode(p.CENTER);
    const logoWidth = 300;
    // Usar dimensiones fijas si las dimensiones de la imagen no están disponibles
    const logoHeight = logoImage.height && logoImage.width ? 
      (logoImage.height / logoImage.width) * logoWidth : logoWidth;
    p.image(logoImage, centerX, centerY - 80, logoWidth, logoHeight);
    p.pop();
  }
  
  // Dibujar botón centrado debajo del logo
  p.push();
  p.fill(100, 100, 100);
  p.stroke(0);
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  const buttonY = centerY + 100;
  p.rect(centerX, buttonY, 300, 60);
  
  // Texto del botón
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("REINICIAR", centerX, buttonY);
  p.pop();
}

new p5(sketch);
