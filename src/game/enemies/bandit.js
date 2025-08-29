import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";
import { getBodies, getWorld } from "../physics";
import { takeDamage } from "../player";


// Clase para proyectiles del bandit
class Bullet {
  constructor(x, y, targetX, targetY, world, shooter = null) {
    // Asegurar que las propiedades se inicialicen ANTES de crear el cuerpo
    this.width = 8;
    this.height = 8;
    this.damage = 20;
    this.speed = 0.3;
    this.lifeTime = 360;
    this.shooter = shooter;
    this.invulnerabilityFrames = 5;
    this.isValid = true; // Flag para indicar si la bala es válida
    
    // Validar parámetros de entrada
    if (isNaN(x) || isNaN(y) || isNaN(targetX) || isNaN(targetY)) {
      console.error("Parámetros inválidos para crear bala:", { x, y, targetX, targetY });
      this.isValid = false;
      return;
    }
    
    // Calcular dirección hacia el objetivo
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      console.error("Distancia cero entre origen y objetivo");
      return;
    }
    
    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
    
    // Crear la bala con un offset inicial
    const offsetDistance = 30;
    const offsetX = (dx / distance) * offsetDistance;
    const offsetY = (dy / distance) * offsetDistance;
    
    // Crear cuerpo físico con offset
    this.body = Matter.Bodies.rectangle(
      x + offsetX, 
      y + offsetY, 
      this.width, 
      this.height, 
      {
        frictionAir: 0,
        friction: 0,
        density: 0.001,
        restitution: 0,
        isSensor: true
      }
    );
    
    this.body.label = "bullet";
    this.body.isBullet = true;
    
    Matter.World.add(world, this.body);
    getBodies().push(this.body);
    
  }
  
  update() {
    // Mover el proyectil
    Matter.Body.setVelocity(this.body, {
      x: this.velocityX,
      y: this.velocityY
    });
    
    // Reducir tiempo de vida
    this.lifeTime--;
    
    // Reducir frames de invulnerabilidad
    if (this.invulnerabilityFrames > 0) {
      this.invulnerabilityFrames--;
    }
    
    // Obtener todos los cuerpos para verificar colisiones
    const allBodies = getBodies();
    
    // Solo verificar colisiones después del período de invulnerabilidad
    if (this.invulnerabilityFrames <= 0) {
      // Verificar colisión con el jugador
      if (isCollidingWithPlayer(this)) {
        console.log("¡Bala impactó al jugador!");
        takeDamage(10);
        this.destroy();
        return false;
      }
      
      // Verificar colisión con enemigos (friendly fire)
      if (isCollidingWithEnemies(this)) {
        console.log("¡Bala impactó a un enemigo!");
        this.destroy();
        return false;
      }
      
      // Verificar colisión con objetos del mundo (paredes, terreno, etc.)
      if (isCollidingWithObject(this, allBodies)) {
        console.log("¡Bala impactó contra un objeto!");
        this.destroy();
        return false;
      }
    }
    
    // Si el tiempo de vida se agotó
    if (this.lifeTime <= 0) {
      this.destroy();
      return false;
    }
    
    return true; // La bala sigue activa
  }
  
  draw(p) {
    // Verificación más robusta con logging detallado
    if (!this.body || !this.body.position) {
      console.log("Bala sin body o position válida");
      return;
    }
    
    if (this.width === undefined || this.height === undefined) {
      console.log("Bala con width o height undefined:", {
        width: this.width,
        height: this.height,
        isValid: this.isValid
      });
      return;
    }
    
    if (this.width <= 0 || this.height <= 0) {
      console.log("Bala con dimensiones inválidas:", this.width, "x", this.height);
      return;
    }
    
    p.push();
    p.fill(255, 0, 0); 
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.body.position.x, this.body.position.y, this.width, this.height);
    p.pop();
  }
  
  destroy() {
    // Remover del mundo físico PRIMERO
    if (this.body) {
      Matter.World.remove(getWorld(), this.body);
      
      // Remover del array de cuerpos
      const bodies = getBodies();
      const index = bodies.indexOf(this.body);
      if (index > -1) {
        bodies.splice(index, 1);
      }
      
      this.body = null;
    }
    
    // Marcar como inválida DESPUÉS de remover del mundo
    this.isValid = false;
    
    // Limpiar propiedades para evitar errores
    this.width = undefined;
    this.height = undefined;
  }
}

//Array global para manejar todas las balas

export let bullets = [];

//Clase para el enemigo Bandit que dispara proyectiles
export class Bandit extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 400;
    this.shootingRange = 300;
    this.speed = 0.003;
    this.health = 80;
    this.name = 'bandit';
    this.type = "bandit";
    
    // Propiedades de disparo
    this.shootCooldown = 0;
    this.shootInterval = 90;
    this.lastShotTime = 0;
    
    console.log("Bandit creado en posición:", x, y);
  }
  
  update() {
    const player = gameState.player;
    if (!player) {
      console.log("No hay jugador disponible");
      return;
    }
    
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    
    // Si el jugador está en rango de detección
    if (dist < this.detectionRadius) {
      
      // Si está en rango de disparo, disparar
      if (dist < this.shootingRange && this.shootCooldown <= 0) {
        this.shoot(player.position.x, player.position.y);
        this.shootCooldown = this.shootInterval;
      }
      
      // Si está muy cerca, alejarse un poco
      if (dist < 100) {
        const angle = Math.atan2(dy, dx);
        const forceX = -Math.cos(angle) * this.speed;
        const forceY = -Math.sin(angle) * this.speed;
        Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
      }

      // Si está muy lejos, acercarse
      else if (dist > this.shootingRange) {
        const angle = Math.atan2(dy, dx);
        const forceX = Math.cos(angle) * this.speed;
        const forceY = Math.sin(angle) * this.speed;
        Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
      }
    }
    
    // Reducir cooldown de disparo
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }
  
  // Modificar el método shoot del Bandit
  shoot(targetX, targetY) {
    const bullet = new Bullet(
      this.body.position.x,
      this.body.position.y,
      targetX,
      targetY,
      getWorld(),
      this // Pasar referencia del bandit como shooter
    );
    
    // Solo agregar la bala si es válida
    if (bullet && bullet.isValid) {
      bullets.push(bullet);
    } else {
      console.log("No se pudo crear la bala - parámetros inválidos");
    }
  }
  
  draw(p) {
    // Dibujar el enemigo base
    super.draw(p);
    
    // Dibujar indicador de rango de disparo si el jugador está cerca
    const { dist } = this.getDistanceToPlayer();
    if (dist < this.detectionRadius) {
      p.push();
      p.noFill();
      p.stroke(255, 100, 100, 100);
      p.strokeWeight(1);
      p.circle(this.body.position.x, this.body.position.y, this.shootingRange * 2);
      p.pop();
    }
  }
}

//Actualiza todas las balas
export function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Verificar que la bala sea válida
    if (!bullet || !bullet.isValid || !bullet.body) {
      console.log("Removiendo bala inválida durante update");
      bullets.splice(i, 1);
      continue;
    }
    
    const shouldKeep = bullet.update();
    
    if (!shouldKeep) {
      // Solo destruir si aún no ha sido destruida
      if (bullet.isValid) {
        bullet.destroy();
      }
      bullets.splice(i, 1);
    }
  }
}

//Dibuja todas las balas
export function drawBullets(p) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Verificar que la bala sea válida antes de dibujar
    if (bullet && bullet.isValid && bullet.body && bullet.width !== undefined && bullet.height !== undefined) {
      bullet.draw(p);
    } else {
      // Remover balas inválidas del array
      console.log("Removiendo bala inválida del array");
      bullets.splice(i, 1);
    }
  }
}

/**
 * Detecta si una bala está colisionando con algún objeto
 * Similar a isOnGround en controls.js
 */
function isCollidingWithObject(bullet, allBodies) {
  const tolerance = 2; // Reducir tolerancia para mayor precisión
  const bx = bullet.body.position.x;
  const by = bullet.body.position.y;
  const bulletWidth = bullet.width;
  const bulletHeight = bullet.height;

  return allBodies.some((body) => {
    // Ignorar la propia bala
    if (body === bullet.body) return false;
    
    // Ignorar otros proyectiles
    if (body.isBullet) return false;
    
    // Ignorar el enemigo que disparó la bala
    if (bullet.shooter && body === bullet.shooter.body) return false;
    
    // Ignorar otros enemigos
    if (body.isEnemy) return false;
    
    // Ignorar el jugador (se maneja por separado)
    if (body.label === 'player') return false;
    
    const bounds = body.bounds;
    
    // Verificar si la bala está dentro de los límites del objeto
    return (
      bx + bulletWidth/2 > bounds.min.x - tolerance &&
      bx - bulletWidth/2 < bounds.max.x + tolerance &&
      by + bulletHeight/2 > bounds.min.y - tolerance &&
      by - bulletHeight/2 < bounds.max.y + tolerance
    );
  });
}

/**
 * Detecta colisión específica con el jugador
 */
function isCollidingWithPlayer(bullet) {
  if (!gameState.player) return false;
  
  const dx = bullet.body.position.x - gameState.player.position.x;
  const dy = bullet.body.position.y - gameState.player.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < 25; 
}

// MOVER ESTA FUNCIÓN FUERA DE LA CLASE - debe ser una función global
/**
 * Detecta colisión con enemigos
 */
function isCollidingWithEnemies(bullet) {
  const enemies = getBodies().filter(body => body.isEnemy);
  
  return enemies.some(enemy => {
    // No colisionar con el enemigo que disparó la bala
    if (bullet.shooter && enemy === bullet.shooter.body) {
      return false;
    }
    
    const dx = bullet.body.position.x - enemy.position.x;
    const dy = bullet.body.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < 30; // Radio de colisión con enemigos
  });
}