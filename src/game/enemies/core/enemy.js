import Matter from "matter-js";
import { getBodies } from "../../physics";
import { gameState } from "../../state";

// ============================
// REGISTRO DE ENEMIGOS
// ============================

export let enemies = [];

// ============================
// CLASE BASE DE ENEMIGOS
// ============================

export class Enemy {
  constructor(x, y, w, h, world) {
    this.initializeProperties(w, h);
    this.createPhysicsBody(x, y, w, h, world);
    this.registerEnemy();
  }

  initializeProperties(w, h) {
    this.width = w;
    this.height = h;
    this.health = 100;
    this.damage = 10;
    this.sprite = null;
    this.name = null;
    this.type = "enemy";
    
    this.canJump = true;
    this.jumpCooldown = 0;
    this.jumpForce = 0.1;
    this.maxJumpCooldown = 60; 
    this.isOnGround = true;
    this.jumpDetectionDistance = 100; 

    this.showHitbox = true;
  }

  createPhysicsBody(x, y, w, h, world) {
    this.body = Matter.Bodies.rectangle(x, y, w, h, {
      frictionAir: 0.05,
      friction: 0.1,
      density: 0.001,
      restitution: 0,
      inertia: Infinity
    });
    
    // Sincroniza dimensiones en el body para que el renderer pueda dibujar correctamente
    this.body.width = w;
    this.body.height = h;
    
    this.body.label = "enemy";
    this.body.isEnemy = true;

    // Vincular el body con la instancia para utilidades futuras
    this.body.owner = this;

    // Exponer método de daño en el cuerpo para que el sistema de disparos pueda llamarlo
    this.body.takeDamage = (amount) => {
      // Validar entrada
      const dmg = typeof amount === 'number' && amount > 0 ? amount : 0;
      if (dmg <= 0) return;
      this.takeDamage(dmg);
    };
    
    Matter.World.add(world, this.body);
    getBodies().push(this.body);
  }

  registerEnemy() {
    enemies.push(this);
  }

  draw(p) {
    const pos = this.body.position;
    const angle = this.body.angle;
    
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);
    
    if (this.sprite && this.sprite.width > 0) {
      this.drawWithSprite(p);
    } else {
      this.drawFallback(p);
    }

    // Contorno de hitbox para depuración
    if (this.showHitbox && this.hasValidDimensions()) {
      p.rectMode(p.CENTER);
      p.noFill();
      p.stroke(0, 255, 0);
      p.strokeWeight(2);
      p.rect(0, 0, this.width, this.height);
    }
    
    p.pop();
  }

  drawWithSprite(p) {
    p.imageMode(p.CENTER);
    p.image(this.sprite, 0, 0, this.width, this.height);
  }

  drawFallback(p) {
    if (this.hasValidDimensions()) {
      p.rectMode(p.CENTER);
      p.fill(255, 0, 0);
      p.rect(0, 0, this.width, this.height);
    }
  }

  // (Efecto visual de impacto removido a pedido del usuario)

  hasValidDimensions() {
    return this.width !== undefined && 
           this.height !== undefined && 
           this.width > 0 && 
           this.height > 0;
  }

  takeDamage(amount) {
    // Aplicar daño
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.removeFromEnemies();
    this.removeFromPhysics();
  }

  removeFromEnemies() {
    const index = enemies.indexOf(this);
    if (index > -1) {
      enemies.splice(index, 1);
    }
  }

  removeFromPhysics() {
    if (gameState.world && this.body) {
      Matter.World.remove(gameState.world, this.body);
      
      const bodies = getBodies();
      const bodyIndex = bodies.indexOf(this.body);
      if (bodyIndex > -1) {
        bodies.splice(bodyIndex, 1);
      }
    }
  }

  update() {
    // Método base para ser sobrescrito
  }

  getDistanceToPlayer() {
    const player = gameState.player;
    if (!player) return { dist: Infinity, dx: 0, dy: 0 };
    
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return { dist, dx, dy };
  }
  
  // Detecta si hay un obstáculo o el jugador está en una posición elevada
  detectObstacle() {
    const player = gameState.player;
    if (!player) return false;
    
    if (player.position.y < this.body.position.y - this.height/2) {
      const dx = player.position.x - this.body.position.x;
      if (Math.abs(dx) < this.jumpDetectionDistance) {
        return true;
      }
    }
    return false;
  }

  jump() {
    if (this.canJump && this.isOnGround) {
      Matter.Body.applyForce(this.body, this.body.position, { x: 0, y: -this.jumpForce });
      this.canJump = false;
      this.jumpCooldown = this.maxJumpCooldown;
      this.isOnGround = false;
    }
  }
  
  updateJumpState() {
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
      if (this.jumpCooldown <= 0) {
        this.canJump = true;
      }
    }
    
    if (this.body.velocity.y < 0.01 && this.body.velocity.y > -0.01) {
      this.isOnGround = true;
    }
  }
}

// ============================
// ENEMIGO PERSEGUIDOR
// ============================

export class ChaserEnemy extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 300;
    this.speed = 0.005;
    this.name = 'olvido';
    this.type = "chaser";
  }

  update() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    // Base update (p.ej. destello)
    super.update();
    
    if (dist < this.detectionRadius) {
      this.chasePlayer(dx, dy);
    }
  }

  chasePlayer(dx, dy) {
  
    const angle = Math.atan2(dy, dx);
    const forceX = Math.cos(angle) * this.speed;
    const forceY = 0; 

    this.updateJumpState();
    const onGround = this.isOnGround === true;
    const appliedX = onGround ? forceX : forceX * 0.2;

    Matter.Body.applyForce(this.body, this.body.position, { x: appliedX, y: forceY });

    // Si el jugador está arriba y cerca en X, intentamos un salto en vez de empujar hacia arriba
    if (this.detectObstacle()) {
      this.jump();
    }
  }
}

// ============================
// GESTIÓN GLOBAL DE ENEMIGOS
// ============================

export function updateEnemies() {
  enemies.forEach(enemy => enemy.update());
}

export function drawEnemies(p) {
  enemies.forEach(enemy => enemy.draw(p));
}

export function getEnemies() {
  return enemies;
}
