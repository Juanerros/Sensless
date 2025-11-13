import Matter from "matter-js";
import { getBodies, removeFromWorld } from "./physics.js";
import { gameState } from "./state.js";
import { updateControls, isOnGround } from "./controls.js";
import { getSpriteByName } from "./sprites.js";
import { initializeInventory, drawInventoryUI, addItemToInventory } from "./inventory.js";
import { Vector2 } from "../utils/Vector2.js";

// ============================
// VARIABLES GLOBALES
// ============================
let player;
let world;
let playerHealth = 100;
let maxHealth = 100;

// ============================
// INICIALIZACIÓN DEL JUGADOR
// ============================

// Función para crear y configurar el jugador
export function createPlayer(x, y, worldRef, p5Instance = null) {
  const playerWidth = 42;
  const playerHeight = 80;

  world = worldRef;

  player = Matter.Bodies.rectangle(x, y, playerWidth, playerHeight, {
    frictionAir: 0.02,
    friction: 0.1,
    density: 0.001,
    restitution: 0,
    inertia: Infinity
  });

  player.width = playerWidth;
  player.height = playerHeight;
  player.isPlayer = true;
  
  // Depuración: mostrar contorno de hitbox
  player.showHitbox = true;

  player.label = "player";
  player.sprite = getSpriteByName('player');
  player.direction = 'right';
  player.health = playerHealth;
  player.maxHealth = maxHealth;
  player.isAlive = true;

  initializeInventory();
  gameState.player = player;

  getBodies().push(player);
  Matter.World.add(world, player);
  return player;
}

// Función para obtener la referencia al jugador
export function getPlayer() {
  return player;
}

// ============================
// FUNCIONES DE VIDA
// ============================

// Función para aplicar daño al jugador
export function takeDamage(damage) {
  if (!player || !player.isAlive) return false;

  playerHealth = Math.max(0, playerHealth - damage);
  player.health = playerHealth;

  // Usar los sprites de daño desde el sistema centralizado
  player.takingDamage = true;
  const hurtSprite2 = getSpriteByName('playerHurt2');
  if (hurtSprite2 && hurtSprite2.width > 0) {
    player.sprite = hurtSprite2;
  }

  setTimeout(() => {
    const hurtSprite1 = getSpriteByName('playerHurt1');
    if (hurtSprite1 && hurtSprite1.width > 0) {
      player.sprite = hurtSprite1;
    }

    setTimeout(() => {
      player.takingDamage = false;
      if (player.isAlive) {
        const defaultSprite = getSpriteByName('player');
        if (defaultSprite && defaultSprite.width > 0) {
          player.sprite = defaultSprite;
        }
      }
    }, 200);
  }, 150);


  if (playerHealth <= 0) {
    player.isAlive = false;
    const deadSprite = getSpriteByName('playerDead');
    if (deadSprite && deadSprite.width > 0) {
      player.sprite = deadSprite;
    }
    gameState.isGameOver = true;
  }

  return playerHealth > 0;
}

// Función para curar al jugador
export function heal(amount) {
  if (!player) return;
  playerHealth = Math.min(maxHealth, playerHealth + amount);
  player.health = playerHealth;
}

// Función para obtener el estado de salud del jugador
export function getPlayerHealth() {
  return {
    current: playerHealth,
    max: maxHealth
  };
}

// Función para dibujar la barra de vida
export function drawHealthBar(p) {
  if (!player || !player.isAlive) return;

  const barWidth = 200;
  const barHeight = 20;
  const barX = 20;
  const barY = 100;

  const healthPercentage = playerHealth / maxHealth;

  p.fill(255, 0, 0);
  p.noStroke();
  p.rectMode(p.CORNER);
  p.rect(barX, barY, barWidth, barHeight);

  p.fill(0, 255, 0);
  p.rect(barX, barY, barWidth * healthPercentage, barHeight);

  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight);

  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`${playerHealth}/${maxHealth}`, barX + barWidth + 10, barY + barHeight / 2);
}

// ============================
// FUNCIONES DE MOVIMIENTO Y ACTUALIZACIÓN
// ============================

// Función principal de actualización del jugador
export function updatePlayer(p) {
  if (!player) return;

  updateControls(player, getBodies);
  grabObject();

  const velocity = player.velocity;
  const isMoving = Math.abs(velocity.x) > 0.1;
  
  if (velocity.x > 0.1) {
    player.direction = 'right';
  } else if (velocity.x < -0.1) {
    player.direction = 'left';
  }

  if (!player.takingDamage) {
    const isJumping = velocity.y < -0.5;
    const isFalling = velocity.y > 0.5;

    if (isJumping) {
      const jumpSprite = getSpriteByName('playerJump1');
      if (jumpSprite && jumpSprite.width > 0) {
        player.sprite = jumpSprite;
      }
      player.isJumping = true;
    } else if (isFalling || (player.isJumping && !isOnGround(player, getBodies()))) {
      const fallSprite = getSpriteByName('playerJump2');
      if (fallSprite && fallSprite.width > 0) {
        player.sprite = fallSprite;
      }
    } else {
      player.isJumping = false;

      if (isMoving) {
        const moveSprite = getSpriteByName('playerMoveGif');
        if (moveSprite && moveSprite.width > 0) {
          player.sprite = moveSprite;
        }
      } else {
        const idleSprite = getSpriteByName('playerIdleGif');
        if (idleSprite && idleSprite.width > 0) {
          player.sprite = idleSprite;
        }
      }
    }
  }

  player.lastVelocity = { x: velocity.x };
  player.isMoving = isMoving;
}

// Función para recoger objetos cercanos
function grabObject() {
  const bodies = getBodies();

  const spells = bodies.filter(body => body.label === 'spell')
  for (const spell of spells) {
    const distance = Vector2.distance(player.position, spell.position);
    if (distance < 50 && addItemToInventory({ type: 'spell', name: spell.name })) {
      removeFromWorld(spell);
    }
  }
}

// ============================
// FUNCIONES DE RENDERIZADO
// ============================

// Función para dibujar el borde de interacción
function drawBorderBox(p) {
  p.noFill();
  p.stroke(0);
  p.rect(p.mouseX - 25, p.mouseY - 25, 50, 50);
}

// Función para renderizar el jugador
export function drawPlayer(p) {
  if (!player) return;

  const pos = player.position;
  const angle = player.angle;

  p.push();
  p.translate(pos.x, pos.y);
  p.rotate(angle);

  if (!player.isAlive) {
    const deadSprite = getSpriteByName('playerDead');
    if (deadSprite && deadSprite.width && deadSprite.height) {
      player.sprite = deadSprite;

      if (player.direction === 'left') {
        p.scale(-1, 1);
      } else {
        p.scale(1, 1);
      }

      p.imageMode(p.CENTER);
      const aspectRatio = deadSprite.height / deadSprite.width + 1;
      const deadWidth = player.width;
      const deadHeight = deadWidth * aspectRatio;
      p.image(player.sprite, 0, 0, deadWidth, deadHeight);
    } else {
      // Fallback si el sprite de muerte no está disponible
      p.fill(255, 0, 0);
      p.rectMode(p.CENTER);
      p.rect(0, 0, player.width, player.height);
    }
  } else {
    if (player.direction === 'left') {
      p.scale(-1, 1);
    } else {
      p.scale(1, 1);
    }


    const velocity = player.velocity;
    const isMoving = Math.abs(velocity.x) > 0.1;

    if (player.sprite && player.sprite.width > 0) {
      p.imageMode(p.CENTER);

      if (player.sprite === getSpriteByName('playerJump1') ||
        player.sprite === getSpriteByName('playerJump2')) {
        const spriteWidth = player.width * 2.3;
        const spriteHeight = player.height * 1.5;
        
        try {
          // Verificar si es una instancia de GifAnimation
          if (player.sprite.gifImage) {
            p.imageMode(p.CENTER);
            p.image(player.sprite.gifImage, 0, 0, spriteWidth, spriteHeight);
          } 
          // Si es una imagen p5 normal
          else if (player.sprite.width > 0 && player.sprite.height > 0) {
            p.imageMode(p.CENTER);
            p.image(player.sprite, 0, 0, spriteWidth, spriteHeight);
          } else {
            throw new Error("Sprite sin dimensiones válidas");
          }
        } catch (error) {
          console.warn("Error al dibujar sprite de salto:", error);
          // Fallback si hay error al dibujar
          p.fill(255, 255, 0);
          p.rectMode(p.CENTER);
          p.rect(0, 0, spriteWidth, spriteHeight);
        }
      } else if (player.sprite === getSpriteByName('playerIdleGif')) {
        // Obtener el sprite de idle directamente para comparación
        const idleSprite = getSpriteByName('playerIdleGif');
        
        // Verificar que el sprite de idle existe y tiene dimensiones válidas
        if (idleSprite && typeof idleSprite === 'object') {
          const spriteWidth = player.width * 1.3;
          const spriteHeight = player.height * 1;
          
          try {
            // Verificar si es una instancia de GifAnimation
            if (idleSprite.gifImage) {
              p.imageMode(p.CENTER);
              p.image(idleSprite.gifImage, 0, 0, spriteWidth, spriteHeight);
            } 
            // Si es una imagen p5 normal
            else if (idleSprite.width > 0 && idleSprite.height > 0) {
              p.imageMode(p.CENTER);
              p.image(idleSprite, 0, -8, spriteWidth, spriteHeight);
            } else {
              throw new Error("Sprite sin dimensiones válidas");
            }
          } catch (error) {
            console.warn("Error al dibujar sprite idle:", error);
            // Fallback si hay error al dibujar
            p.fill(0, 0, 255);
            p.rectMode(p.CENTER);
            p.rect(0, 0, spriteWidth, spriteHeight);
          }
        } else {
          // Si el sprite de idle no existe, usar un rectángulo como fallback
          const spriteWidth = player.width * 1.1;
          const spriteHeight = player.height * 1.1;
          p.fill(0, 0, 255);
          p.rectMode(p.CENTER);
          p.rect(0, 0, spriteWidth, spriteHeight);
        }

      } else if (isMoving) {
        const spriteWidth = player.width * 1.1;
        const spriteHeight = player.height * 1.1;
        
        try {
          // Verificar si es una instancia de GifAnimation
          if (player.sprite.gifImage) {
            p.imageMode(p.CENTER);
            p.image(player.sprite.gifImage, 0, 0, spriteWidth, spriteHeight);
          } 
          // Si es una imagen p5 normal
          else if (player.sprite.width > 0 && player.sprite.height > 0) {
            p.imageMode(p.CENTER);
            p.image(player.sprite, 0, 0, spriteWidth, spriteHeight);
          } else {
            throw new Error("Sprite sin dimensiones válidas");
          }
        } catch (error) {
          console.warn("Error al dibujar sprite de movimiento:", error);
          // Fallback si hay error al dibujar
          p.fill(0, 255, 0);
          p.rectMode(p.CENTER);
          p.rect(0, 0, spriteWidth, spriteHeight);
        }
      } else {
        // Verificar que player.sprite existe y tiene dimensiones válidas
        if (player.sprite && player.sprite.width > 0 && player.sprite.height > 0) {
          p.image(player.sprite, 0, 0, player.width, player.height);
        } else {
          // Fallback si player.sprite no es válido
          p.fill(0, 0, 0);
          p.rectMode(p.CENTER);
          p.rect(0, 0, player.width, player.height);
        }
      }
    } else {
      // Si el sprite no está disponible o no es válido, dibujar un rectángulo como fallback
      p.fill(0, 0, 0);
      p.rectMode(p.CENTER);
      if (player.width !== undefined && player.height !== undefined &&
        player.width > 0 && player.height > 0) {
        p.rect(0, 0, player.width, player.height);
      } else {
        // Usar dimensiones por defecto si las del jugador no son válidas
        p.rect(0, 0, 42, 80);
      }
    }
  }

  // Contorno de hitbox del jugador
  if (player.showHitbox && player.width && player.height) {
    p.rectMode(p.CENTER);
    p.noFill();
    p.stroke(0, 255, 0);
    p.strokeWeight(2);
    p.rect(0, 0, player.width, player.height);
  }

  p.pop();
}