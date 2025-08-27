import p5 from 'p5';
import { setupPhysics, updatePhysics, getBodies, getWorld } from './physics.js';
import { loadSpritesAsync } from './sprites.js';
import { loadEnemySprites } from './enemies/enemySprites.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { handleKeyPressed, handleKeyReleased, handleMousePressed } from './controls.js';
import { moveCamera } from './camera.js';
import { updateEnemies, drawEnemies, ChaserEnemy, getEnemies } from './enemies/enemy.js';
import { WanderingBud } from './enemies/wanderingBud.js';
import { drawPersistentActions } from './enemies/persintentActions.js';

let player;
let enemiesCreated = false;
let basicSpritesLoaded = false;
let enemySpritesLoaded = false;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(1800, 900);
    setupPhysics();
    p.noSmooth();

    // Crear jugador PRIMERO
    player = createPlayer(400, 300, getWorld());
    console.log('Jugador creado:', player);

    // Cargar sprites básicos
    loadSpritesAsync(p, () => {
      console.log('Sprites básicos cargados');
      basicSpritesLoaded = true;
      checkAllSpritesLoaded();
    });

    // Cargar sprites de enemigos
    loadEnemySprites(p, () => {
      console.log('Sprites de enemigos cargados');
      enemySpritesLoaded = true;
      checkAllSpritesLoaded();
    });
  };

  // Función para verificar si todos los sprites están cargados
  function checkAllSpritesLoaded() {
    if (basicSpritesLoaded && enemySpritesLoaded && !enemiesCreated) {
      console.log('Todos los sprites cargados, creando enemigos...');
      const chaser = new ChaserEnemy(900, 700, getWorld());
      const wanderer = new WanderingBud(700, 700, getWorld());
      enemiesCreated = true;
      console.log('Enemigos creados:', getEnemies().length);
    }
  }

  p.draw = () => {
    
    // Mostrar progreso de carga
    if (!basicSpritesLoaded || !enemySpritesLoaded) {
      p.background(100, 100, 100);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      let loadingText = 'Cargando';
      if (basicSpritesLoaded) loadingText += ' - Sprites básicos ✓';
      if (enemySpritesLoaded) loadingText += ' - Sprites enemigos ✓';
      p.text(loadingText, p.width/2, p.height/2);
      return;
    }

    p.background(135, 206, 235);
    
    updatePhysics();
    updatePlayer(p);

    p.push();
    moveCamera(p);

    drawBodies(p);
    drawPlayer(p);
    
    updateEnemies();
    drawEnemies(p);
    drawPersistentActions(p);

    p.pop();

    // Debug info
    if (p.frameCount % 120 === 0) {
      console.log('Enemigos activos:', getEnemies().length);
    }
  };

  p.keyPressed = () => {
    handleKeyPressed(p.key);
  };

  p.keyReleased = () => {
    handleKeyReleased(p.key);
  };

  p.mousePressed = () => {
    handleMousePressed(p, player);
  };
};

function drawBodies(p) {
  const bodies = getBodies();

  bodies.forEach(body => {
    // Saltar jugadores Y enemigos (se dibujan por separado)
    if (body.isPlayer || body.isEnemy) return;
    
    const pos = body.position;
    const angle = body.angle;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);

    if (body.sprite && body.sprite.width > 0) {
      p.imageMode(p.CENTER);
      p.image(body.sprite, 0, 0, body.width, body.height);
    } else {
      if (body.label === 'ground') {
        p.fill(139, 69, 19);
        p.stroke(0);
        p.strokeWeight(2);
      } else {
        p.fill(100);
      }
      p.rectMode(p.CENTER);
      p.rect(0, 0, body.width, body.height);
    }

    p.pop();
  });
}

new p5(sketch);
