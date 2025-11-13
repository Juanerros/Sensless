import Matter from "matter-js";
import { Enemy } from "../core/enemy";
import { gameState, addScore } from "../../state";
import { getBodies, getWorld } from "../../physics";
import { takeDamage } from "../../player";
import { getScaledEnemySpriteByName } from "../sprites/enemySprites";

// ============================
// GESTIÓN DE PROYECTILES
// ============================

export let bullets = [];

// ============================
// CLASE PROYECTIL
// ============================

class Bullet {
  constructor(x, y, targetX, targetY, world, shooter = null, options = {}) {
    this.initializeProperties(shooter);
    if (!this.validateParameters(x, y, targetX, targetY)) return;
    this.calculateVelocity(x, y, targetX, targetY);
    this.offsetDistance = typeof options.offsetDistance === 'number' ? options.offsetDistance : 30;
    if (this.isValid) {
      this.createPhysicsBody(x, y, targetX, targetY, world);
    } else {
      return;
    }
    const spr = getScaledEnemySpriteByName('banditBullet', this.width, this.height);
    if (spr) {
      this.sprite = spr;
      if (this.body) this.body.sprite = spr;
    }
  }

  initializeProperties(shooter) {
    this.width = 30;
    this.height = 10;
    this.damage = 20;
    this.speed = 2;
    this.scoreValue = 200 + Math.round(Math.random() * 100);
    this.lifeTime = 360;
    this.shooter = shooter;
    this.invulnerabilityFrames = 5;
    this.isValid = true;

  }

  validateParameters(x, y, targetX, targetY) {
    if (isNaN(x) || isNaN(y) || isNaN(targetX) || isNaN(targetY)) {
      console.error("Parámetros inválidos para crear bala:", { x, y, targetX, targetY });
      this.isValid = false;
      return false;
    }
    return true;
  }

  calculateVelocity(x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      this.isValid = false;
      return;
    }
    
    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
    
    this.angle = Math.atan2(dy, dx);
  }

  createPhysicsBody(x, y, targetX, targetY, world) {
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) {
      this.isValid = false;
      return;
    }
    const offsetX = (dx / distance) * this.offsetDistance;
    const offsetY = (dy / distance) * this.offsetDistance;
    
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

    // Sincroniza dimensiones para que el renderer pueda dibujar la bala
    this.body.width = this.width;
    this.body.height = this.height;

    // Aplicar rotación basada en la dirección del disparo
    if (this.angle !== undefined && this.body) {
      Matter.Body.setAngle(this.body, this.angle);
    }

    Matter.World.add(world, this.body);
    getBodies().push(this.body);

    // Establecer velocidad inicial para evitar caída antes del primer update
    Matter.Body.setVelocity(this.body, {
      x: this.velocityX,
      y: this.velocityY
    });
  }

  update() {
    Matter.Body.setVelocity(this.body, {
      x: this.velocityX,
      y: this.velocityY
    });
    
    this.lifeTime--;
    if (this.invulnerabilityFrames > 0) this.invulnerabilityFrames--;
    
    if (this.invulnerabilityFrames <= 0) {
      if (this.checkCollisions()) return false;
    }
    
    if (this.lifeTime <= 0) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  checkCollisions() {
    if (isCollidingWithPlayer(this)) {
      takeDamage(10);
      this.destroy();
      return true;
    }
    
    if (isCollidingWithEnemies(this)) {
      this.destroy();
      return true;
    }
    
    if (isCollidingWithObject(this, getBodies())) {
      this.destroy();
      return true;
    }
    
    return false;
  }

  draw(p) {
    if (!this.isValidForDrawing()) return;

    // Si tenemos sprite, delegamos al renderer; no dibujamos nada aquí
    if (this.body && this.body.sprite) return;

    p.push();
    p.fill(255, 0, 0);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.body.position.x, this.body.position.y, this.width, this.height);
    p.pop();
  }

  isValidForDrawing() {
    return this.body && 
           this.body.position && 
           this.width !== undefined && 
           this.height !== undefined && 
           this.width > 0 && 
           this.height > 0;
  }

  destroy() {
    if (this.body) {
      Matter.World.remove(getWorld(), this.body);
      
      const bodies = getBodies();
      const index = bodies.indexOf(this.body);
      if (index > -1) bodies.splice(index, 1);
      
      this.body = null;
    }
    
    this.isValid = false;
    this.width = undefined;
    this.height = undefined;
  }
}

// ============================
// ENEMIGO BANDIT
// ============================

export class Bandit extends Enemy {
  constructor(x, y, world) {
    // Aumentamos tamaño para que coincida con el sprite grande
    super(x, y, 60, 90, world);
    this.initializeProperties();
    // Dirección y sprites de estado
    this.direction = 'right';
    if (this.body) this.body.direction = this.direction;
    this.idleSprite = getScaledEnemySpriteByName('bandit', this.width, this.height);
    this.hurtSprite = getScaledEnemySpriteByName('banditHurt', this.width, this.height);
    this.deadSprite = getScaledEnemySpriteByName('banditDead', this.width, this.height);
    // Ballesta pegada al bandido (achicada y centrada)
    this.crossbowSprite = getScaledEnemySpriteByName('banditCrossbow', 28, 18);
    // Bajamos la ballesta hacia el centro/parte baja del cuerpo
    // Usar un valor fijo en píxeles para bajar la ballesta de forma confiable
    this.crossbowOffset = { x: 17, y: 20  };
    this.crossbowSize = { width: 28, height: 18 };
    // Timers
    this.hurtTimer = 0;
    this.isDying = false;
    this.deathTimer = 0;
    // Sprite inicial
    if (this.idleSprite) {
      this.sprite = this.idleSprite;
      if (this.body) this.body.sprite = this.sprite;
    }
    // Exponer ballesta al renderer
    if (this.body) {
      this.body.crossbowSprite = this.crossbowSprite;
      this.body.crossbowWidth = this.crossbowSize.width;
      this.body.crossbowHeight = this.crossbowSize.height;
      this.body.crossbowOffset = this.crossbowOffset;
      // Anclar sprites del bandido al borde inferior de la hitbox
      this.body.drawAnchor = 'bottom';
    }
  }

  initializeProperties() {
    this.detectionRadius = 400; 
    this.shootingRange = 300;
    this.speed = 0.003;
    this.health = 80;
    this.scoreValue = 200 + Math.round(Math.random() * 100);
    this.name = 'bandit';
    this.type = "bandit";
    this.shootCooldown = 0;
    this.shootInterval = 90;
    this.lastShotTime = 0;
  }

  update() {
    super.update();
    const player = gameState.player;
    if (!player) return;
    
    const { dist, dx, dy } = this.getDistanceToPlayer();
    // Dirección hacia el jugador
    if (Math.abs(dx) > 1) {
      this.direction = dx > 0 ? 'right' : 'left';
      if (this.body) this.body.direction = this.direction;
    }
    // Timers
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.isDying && this.deathTimer > 0) this.deathTimer--;
    // Selección de sprite por estado
    if (this.isDying) {
      if (this.deadSprite) {
        this.sprite = this.deadSprite;
        if (this.body) this.body.sprite = this.sprite;
      }
      if (this.deathTimer <= 0) {
        this.destroyFinally();
        return;
      }
      return; // No actuar cuando está muriendo
    } else if (this.hurtTimer > 0) {
      if (this.hurtSprite) {
        this.sprite = this.hurtSprite;
        if (this.body) this.body.sprite = this.sprite;
      }
    } else {
      if (this.idleSprite) {
        this.sprite = this.idleSprite;
        if (this.body) this.body.sprite = this.sprite;
      }
    }
    
    if (dist < this.detectionRadius) {
      this.handleCombatBehavior(player, dist, dx, dy);
    }
    
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Mantener sincronizado overlay de ballesta con el body en cada frame
    if (this.body) {
      this.body.crossbowSprite = this.crossbowSprite;
      this.body.crossbowWidth = this.crossbowSize.width;
      this.body.crossbowHeight = this.crossbowSize.height;
      this.body.crossbowOffset = this.crossbowOffset;
    }
  }

  handleCombatBehavior(player, dist, dx, dy) {
    if (dist < this.shootingRange && this.shootCooldown <= 0) {
      this.shoot(player.position.x, player.position.y);
      this.shootCooldown = this.shootInterval;
    }
    
    if (dist < 100) {
      this.moveAway(dx, dy);
    } else if (dist > this.shootingRange) {
      this.moveTowards(dx, dy);
    }
  }

  moveAway(dx, dy) {
    const angle = Math.atan2(dy, dx);
    const forceX = -Math.cos(angle) * this.speed;
    const forceY = -Math.sin(angle) * this.speed;
    Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
  }

  moveTowards(dx, dy) {
    const angle = Math.atan2(dy, dx);
    const forceX = Math.cos(angle) * this.speed;
    const forceY = Math.sin(angle) * this.speed;
    Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
  }

  shoot(targetX, targetY) {
    // Origen desde ballesta pegada al cuerpo
    if (!this.body || !this.body.position) return;
    const basePos = this.body.position;
    const dir = this.direction === 'right' ? 1 : -1;
    const bw = Number.isFinite(this.width) ? this.width : 0;
    const bh = Number.isFinite(this.height) ? this.height : 0;
    const offX = Number.isFinite(this.crossbowOffset?.x) ? this.crossbowOffset.x : 0;
    const offY = Number.isFinite(this.crossbowOffset?.y) ? this.crossbowOffset.y : 0;
    const originX = basePos.x + dir * (offX);
    const originY = basePos.y + (offY);
    if (!Number.isFinite(originX) || !Number.isFinite(originY) || !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      return;
    }
    const bullet = new Bullet(
      originX,
      originY,
      targetX,
      targetY,
      getWorld(),
      this,
      { offsetDistance: 6 }
    );
    
    if (bullet && bullet.isValid) {
      bullets.push(bullet);
    }
  }

  draw(p) {
    super.draw(p);
    this.drawShootingRange(p);
  }

  drawShootingRange(p) {
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

  takeDamage(amount) {
    const dmg = typeof amount === 'number' ? amount : 0;
    if (dmg <= 0 || this.isDying) return;

    this.health -= dmg;

    if (this.health <= 0) {
      this.isDying = true;
      this.deathTimer = 60; // mostrar sprite de muerte ~1s
      if (this.deadSprite) {
        this.sprite = this.deadSprite;
        if (this.body) {
          this.body.sprite = this.sprite;
          // Achicar más la imagen de muerte, manteniendo proporción del sprite
          const ds = this.deadSprite.gifImage ? this.deadSprite.gifImage : this.deadSprite;
          const dsW = ds && typeof ds === 'object' ? ds.width : this.width;
          const dsH = ds && typeof ds === 'object' ? ds.height : this.height;
          const aspectRatio = (Number.isFinite(dsH) && Number.isFinite(dsW) && dsW > 0)
            ? (dsH / dsW) + 1
            : (this.height / this.width) + 1;
          // Usar valores fijos pequeños para asegurar que se achique bien
          this.body.drawWidth = 50;
          this.body.drawHeight = 40;
          // Alinear usando anclaje en renderer (sin offset manual)
          this.body.drawAnchor = 'bottom';
          // Ocultar ballesta durante la muerte
          this.body.crossbowSprite = null;
        }
      }
      return;
    }

    // Mostrar sprite de daño por un corto periodo
    this.hurtTimer = 20;
    if (this.hurtSprite) {
      this.sprite = this.hurtSprite;
      if (this.body) this.body.sprite = this.sprite;
    }
  }

  destroyFinally() {
    // Eliminar tras mostrar sprite de muerte y sumar puntaje
    addScore(this.scoreValue);
    this.removeFromEnemies();
    this.removeFromPhysics();
  }
}

// ============================
// GESTIÓN DE BALAS
// ============================

export function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    if (!bullet || !bullet.isValid || !bullet.body) {
      bullets.splice(i, 1);
      continue;
    }
    
    const shouldKeep = bullet.update();
    if (!shouldKeep) {
      if (bullet.isValid) bullet.destroy();
      bullets.splice(i, 1);
    }
  }
}

export function drawBullets(p) {
  bullets = bullets.filter(bullet => {
    if (bullet && bullet.isValid && bullet.body && 
        bullet.width !== undefined && bullet.height !== undefined) {
      bullet.draw(p);
      return true;
    }
    return false;
  });
}

// ============================
// DETECCIÓN DE COLISIONES
// ============================

function isCollidingWithObject(bullet, allBodies) {
  const tolerance = 2;
  const bx = bullet.body.position.x;
  const by = bullet.body.position.y;
  const bulletWidth = bullet.width;
  const bulletHeight = bullet.height;

  return allBodies.some(body => {
    if (shouldIgnoreCollision(body, bullet)) return false;
    
    const bounds = body.bounds;
    return isWithinBounds(bx, by, bulletWidth, bulletHeight, bounds, tolerance);
  });
}

function shouldIgnoreCollision(body, bullet) {
  return body === bullet.body || 
         body.isBullet || 
         (bullet.shooter && body === bullet.shooter.body) ||
         body.isEnemy ||
         body.label === 'player';
}

function isWithinBounds(x, y, width, height, bounds, tolerance) {
  return x + width/2 > bounds.min.x - tolerance &&
         x - width/2 < bounds.max.x + tolerance &&
         y + height/2 > bounds.min.y - tolerance &&
         y - height/2 < bounds.max.y + tolerance;
}

function isCollidingWithPlayer(bullet) {
  if (!gameState.player) return false;
  
  const dx = bullet.body.position.x - gameState.player.position.x;
  const dy = bullet.body.position.y - gameState.player.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < 25;
}

function isCollidingWithEnemies(bullet) {
  const enemies = getBodies().filter(body => body.isEnemy);

  return enemies.some(enemy => {
    if (bullet.shooter && enemy === bullet.shooter.body) return false;

    const dx = bullet.body.position.x - enemy.position.x;
    const dy = bullet.body.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 30;
  });
}