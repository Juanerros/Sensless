import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";
import { getBodies, getWorld } from "../physics";

/**
 * Clase para proyectiles del bandit
 */
class Bullet {
  constructor(x, y, targetX, targetY, world) {
    this.width = 8;
    this.height = 8;
    this.damage = 20;
    this.speed = 0.3;
    this.lifeTime = 360; // 3 segundos a 60fps
    
    // Calcular dirección hacia el objetivo
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
    
    // Crear cuerpo físico
    this.body = Matter.Bodies.rectangle(x, y, this.width, this.height, {
      frictionAir: 0,
      friction: 0,
      density: 0.001,
      restitution: 0,
      isSensor: true // Para que no colisione físicamente
    });
    
    this.body.label = "bullet";
    this.body.isBullet = true;
    
    // Añadir al mundo
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
    
    // Verificar colisión con jugador
    if (gameState.player) {
      const dx = this.body.position.x - gameState.player.position.x;
      const dy = this.body.position.y - gameState.player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) {
        // Aplicar daño al jugador (puedes implementar esto según tu sistema)
        console.log("¡Jugador recibió daño de bala!");
        this.destroy();
        return false; // Indica que debe ser removido
      }
    }
    
    return this.lifeTime > 0;
  }
  
  draw(p) {
    p.push();
    p.fill(255, 0, 0); // Cuadrado rojo
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

/**
 * Array global para manejar todas las balas
 */
export let bullets = [];

/**
 * Clase para el enemigo Bandit que dispara proyectiles
 */
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
    this.shootInterval = 90; // Dispara cada 1.5 segundos (90 frames a 60fps)
    this.lastShotTime = 0;
  }
  
  update() {
    const player = gameState.player;
    if (!player) return;
    
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
  
  shoot(targetX, targetY) {
    const bullet = new Bullet(
      this.body.position.x,
      this.body.position.y,
      targetX,
      targetY,
      getWorld()
    );
    
    bullets.push(bullet);
    console.log("Bandit disparó!");
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

/**
 * Actualiza todas las balas
 */
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

/**
 * Dibuja todas las balas
 */
export function drawBullets(p) {
  for (let bullet of bullets) {
    bullet.draw(p);
  }
}