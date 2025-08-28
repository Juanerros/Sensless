import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";
import { getBodies, getWorld } from "../physics";


// Clase para proyectiles del bandit
class Bullet {
  constructor(x, y, targetX, targetY, world, shooter = null) {
    this.width = 56;
    this.height = 56;
    this.damage = 20;
    this.speed = 0.3;
    this.lifeTime = 360;
    this.shooter = shooter;
    this.framesSinceCreation = 0; // Nuevo: contador de frames
    
    // Calcular dirección hacia el objetivo
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
    
    // Crear la bala un poco adelante del bandit para evitar colisión inmediata
    const offsetDistance = 25; // Distancia de offset
    const startX = x + (dx / distance) * offsetDistance;
    const startY = y + (dy / distance) * offsetDistance;
    
    // Crear cuerpo físico
    this.body = Matter.Bodies.rectangle(startX, startY, this.width, this.height, {
      frictionAir: 0,
      friction: 0,
      density: 0.001,
      restitution: 0,
      isSensor: true
    });
    
    this.body.label = "bullet";
    this.body.isBullet = true;
    
    Matter.World.add(world, this.body);
    getBodies().push(this.body);
  }
  
  update() {
    // Incrementar contador de frames
    this.framesSinceCreation++;
    
    // Mover el proyectil
    Matter.Body.setVelocity(this.body, {
      x: this.velocityX,
      y: this.velocityY
    });
    
    // Reducir tiempo de vida
    this.lifeTime--;
    
    // Solo verificar colisiones después de algunos frames para evitar destrucción inmediata
    if (this.framesSinceCreation > 5) {
      // Obtener todos los cuerpos para verificar colisiones
      const allBodies = getBodies();
      
      // Verificar colisión con el jugador
      if (isCollidingWithPlayer(this)) {
        console.log("¡Bala impactó al jugador!");
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
    p.push();
    p.fill(255, 0, 0); 
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.body.position.x, this.body.position.y, this.width, this.height);
    p.pop();
  }
  
  destroy() {
    // Remover del mundo físico
    if (this.body) {
      Matter.World.remove(getWorld(), this.body);
      
      // Remover del array de cuerpos
      const bodies = getBodies();
      const index = bodies.indexOf(this.body);
      if (index > -1) {
        bodies.splice(index, 1);
      }
    }
  }
}

//Array global para manejar todas las balas

export let bullets = [];

//Clase para el enemigo Bandit que dispara proyectiles
export class Bandit extends Enemy {
  constructor(x, y, world) {
    super(x, y, 70, 70, world);
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
    
    // Log de depuración cada 60 frames (1 segundo aprox)
    if (Math.floor(Math.random() * 60) === 0) {
      console.log(`Bandit - Distancia al jugador: ${dist.toFixed(2)}, Cooldown: ${this.shootCooldown}`);
    }
    
    // Si el jugador está en rango de detección
    if (dist < this.detectionRadius) {
      console.log(`Jugador detectado a distancia: ${dist.toFixed(2)}`);
      
      // Si está en rango de disparo, disparar
      if (dist < this.shootingRange && this.shootCooldown <= 0) {
        console.log("¡Intentando disparar!");
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
    console.log(`Bandit disparando hacia: ${targetX.toFixed(2)}, ${targetY.toFixed(2)}`);
    const bullet = new Bullet(
      this.body.position.x,
      this.body.position.y,
      targetX,
      targetY,
      getWorld(),
      this // Pasar referencia del bandit como shooter
    );
    
    bullets.push(bullet);
    console.log("Bandit disparó! Total de balas:", bullets.length);
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
    const shouldKeep = bullet.update();
    
    if (!shouldKeep) {
      bullet.destroy();
      bullets.splice(i, 1);
    }
  }
}

//Dibuja todas las balas
export function drawBullets(p) {
  for (let bullet of bullets) {
    bullet.draw(p);
  }
}

/**
 * Detecta si una bala está colisionando con algún objeto
 * Similar a isOnGround en controls.js
 */
// También mejorar la función de detección de colisiones para ser menos sensible
function isCollidingWithObject(bullet, allBodies) {
  const tolerance = 2; // Reducir tolerancia para ser menos sensible
  const bx = bullet.body.position.x;
  const by = bullet.body.position.y;
  const bulletWidth = bullet.width;
  const bulletHeight = bullet.height;

  return allBodies.some((body) => {
    // Ignorar la propia bala
    if (body === bullet.body) return false;
    
    // Ignorar otros proyectiles
    if (body.isBullet) return false;
    
    // Ignorar enemigos (se maneja por separado)
    if (body.isEnemy) return false;
    
    // Ignorar el jugador (se maneja por separado)
    if (body.isPlayer) return false;
    
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