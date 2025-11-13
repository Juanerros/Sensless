import Matter from "matter-js";
import { Enemy } from "../core/enemy";
import assetLoader from '../../assets/assetLoader.js';
import { gameState } from "../../state";
import { takeDamage } from "../../player";
import { getBodies } from "../../physics.js";
import { createChlorineCloudEffect } from "../effects/timeEffects";

// ============================
// ENEMIGO WANDERING BUD
// ============================

export class WanderingBud extends Enemy {
  constructor(x, y, world) {
    // Aumentamos el tamaño de la hitbox y del sprite
    super(x, y, 60, 70, world);
    this.initializeProperties();
    // Dirección inicial
    this.direction = 'right';
    if (this.body) this.body.direction = this.direction;
    // Cache de sprites (idle y correr) desde assetLoader
    this.idleSprite = assetLoader.getScaledAsset('wanderingBud', this.width, this.height);
    this.moveSprite = assetLoader.getScaledAsset('wanderingBudMove', this.width, this.height);
    // Usar el asset original para evitar problemas de resize si aún no está listo
    this.hurtSprite = assetLoader.getAsset('wanderingBudHurt');
    // Asegurar que el sprite usado sea una imagen p5 compatible
    const idleImg = (this.idleSprite && typeof this.idleSprite.getImage === 'function')
      ? this.idleSprite.getImage()
      : this.idleSprite;
    this.sprite = idleImg || this.sprite;
    if (this.body) this.body.sprite = this.sprite;
  }
initializeProperties() {
    this.detectionRadius = 300;
    this.circleRadius = 150;
    this.speed = 0.005;
    this.scoreValue = 100 + Math.round(Math.random() * 100);
    this.health = 50;
    this.name = 'wanderingBud';
    this.type = "wanderingBud";
    this.playerInCircle = false;
    this.hasExploded = false;
    this.hurtTimer = 0;
    this.pendingDestroyTimer = 0;
    // Configuración de explosión
    this.explosionPlayerDamage = 10; // daño para el jugador
    this.explosionEnemyDamage = 6;   // daño menor para otros enemigos
    this.explosionKnockbackPlayer = 0.7;
    this.explosionKnockbackEnemy = 0.4;
  }

  draw(p) {
    // Dibuja primero el efecto para que el contorno quede por encima
    this.drawEffectCircle(p);
    super.draw(p);
  }

  drawEffectCircle(p) {
    const { dist } = this.getDistanceToPlayer();
    if (dist < this.circleRadius) {
      this.drawGradientCircle(p);
    }
  }

  drawGradientCircle(p) {
    p.push();
    this.drawGradientLayers(p);
    this.drawCircleBorder(p);
    p.pop();
  }

  drawGradientLayers(p) {
    for (let i = this.circleRadius * 2; i > 0; i -= 5) {
      let alpha = p.map(i, 0, this.circleRadius * 2, 0, 50);
      p.fill(255, 0, 0, alpha);
      p.noStroke();
      p.circle(this.body.position.x, this.body.position.y, i);
    }
  }

  drawCircleBorder(p) {
    p.noFill();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.circle(this.body.position.x, this.body.position.y, this.circleRadius * 2);
  }

  update() {
    // Asegurar comportamiento base (p.ej. decremento de destello)
    super.update();
    const player = gameState.player;
    if (!player) return;
    // Destrucción diferida para poder mostrar sprite hurt
    if (this.pendingDestroyTimer > 0) {
      this.pendingDestroyTimer--;
      if (this.pendingDestroyTimer === 0) {
        this.destroy();
        return;
      }
    }
    // Reintentar carga si aún no estaban disponibles en el constructor
    if (!this.idleSprite) {
      this.idleSprite = assetLoader.getScaledAsset('wanderingBud', this.width, this.height);
    }
    if (!this.moveSprite) {
      this.moveSprite = assetLoader.getScaledAsset('wanderingBudMove', this.width, this.height);
    }
    if (!this.hurtSprite) {
      this.hurtSprite = assetLoader.getAsset('wanderingBudHurt');
    }

    // Selección de sprite según estado (persiguiendo vs quieto)
    const { dist, dx, dy } = this.getDistanceToPlayer();
    // Actualizar dirección según posición del jugador
    if (Math.abs(dx) > 1) {
      this.direction = dx > 0 ? 'right' : 'left';
      if (this.body) this.body.direction = this.direction;
    }
    this.idleImg = (this.idleSprite && typeof this.idleSprite.getImage === 'function')
      ? this.idleSprite.getImage()
      : this.idleSprite;
    this.moveImg = (this.moveSprite && typeof this.moveSprite.getImage === 'function')
      ? this.moveSprite.getImage()
      : this.moveSprite;
    this.sprite = dist < this.detectionRadius
      ? (this.moveImg || this.idleImg || this.sprite)
      : (this.idleImg || this.moveImg || this.sprite);
    if (this.body) this.body.sprite = this.sprite;

    // Mostrar sprite de daño si está activo
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      const hurtImg = (this.hurtSprite && typeof this.hurtSprite.getImage === 'function')
        ? this.hurtSprite.getImage()
        : this.hurtSprite;
      if (hurtImg) {
        this.sprite = hurtImg;
        if (this.body) this.body.sprite = this.sprite;
      }
    }

    this.handleMovement();
    this.handlePlayerCollision(player);
  }

  handleMovement() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    // Si está mostrando daño, no cambiar el sprite aquí
    const isHurting = this.hurtTimer > 0;

    if (dist < this.detectionRadius) {
      // Forzar sprite de correr cuando está persiguiendo, salvo estado hurt
      if (!isHurting && (this.moveImg || this.moveSprite)) {
        this.sprite = this.moveImg || (this.moveSprite.getImage ? this.moveSprite.getImage() : this.moveSprite);
      }
      // Actualizar dirección en persecución
      if (Math.abs(dx) > 1) {
        this.direction = dx > 0 ? 'right' : 'left';
        if (this.body) this.body.direction = this.direction;
      }
    
      this.updateJumpState();
      
      if (this.detectObstacle()) {
        this.jump();
      }
      
      // Movimiento normal hacia el jugador
      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * this.speed;
      const forceY = Math.sin(angle) * this.speed;
      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
      if (this.body) this.body.sprite = this.sprite;
    } else {
      // Forzar sprite idle cuando no persigue, salvo estado hurt
      if (!isHurting && (this.idleImg || this.idleSprite)) {
        this.sprite = this.idleImg || (this.idleSprite.getImage ? this.idleSprite.getImage() : this.idleSprite);
      }
      if (this.body) this.body.sprite = this.sprite;
    }
  }

  handlePlayerCollision(player) {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    if (dist < this.circleRadius && !this.hasExploded) {
      // Solo aplicar empuje inmediato; el daño se aplicará con la explosión AoE
      this.applyDamageAndKnockback(player, dx, dy);
      
      if (!this.playerInCircle) {
        this.triggerExplosion();
      }
    }
  }

  applyDamageAndKnockback(player, dx, dy) {
    const angle = Math.atan2(dy, dx);
    const repulsionForce = this.explosionKnockbackPlayer;
    const forceX = Math.cos(angle) * repulsionForce;
    const forceY = Math.sin(angle) * repulsionForce;
    
    Matter.Body.applyForce(player, player.position, { x: forceX, y: forceY });
  }

  // Aplica daño y empuje en área a jugador y enemigos
  applyExplosionAoE() {
    const origin = this.body && this.body.position ? this.body.position : null;
    if (!origin) return;

    const bodies = getBodies();
    for (const b of bodies) {
      if (!b || !b.position) continue;
      if (b === this.body) continue; // no auto-efecto

      const dx = b.position.x - origin.x;
      const dy = b.position.y - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist > this.circleRadius) continue;

      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Jugador
      if (b.isPlayer) {
        takeDamage(this.explosionPlayerDamage);
        Matter.Body.applyForce(b, b.position, {
          x: nx * this.explosionKnockbackPlayer,
          y: ny * this.explosionKnockbackPlayer
        });
        continue;
      }

      // Otros enemigos
      if (b.isEnemy && typeof b.takeDamage === 'function') {
        b.takeDamage(this.explosionEnemyDamage);
        Matter.Body.applyForce(b, b.position, {
          x: nx * this.explosionKnockbackEnemy,
          y: ny * this.explosionKnockbackEnemy
        });
      }
    }
  }

  triggerExplosion() {
    this.playerInCircle = true;
    this.hasExploded = true;
    
    // Mostrar sprite hurt brevemente antes de desaparecer
    this.hurtTimer = Math.max(this.hurtTimer, 12);
    const hurtImg = (this.hurtSprite && typeof this.hurtSprite.getImage === 'function')
      ? this.hurtSprite.getImage()
      : this.hurtSprite;
    if (hurtImg) {
      this.sprite = hurtImg;
      if (this.body) this.body.sprite = this.sprite;
    }

    // Usar el nuevo sistema de efectos de tiempo de inmediato
    createChlorineCloudEffect(
      this.body.position.x,
      this.body.position.y,
      this.circleRadius,
      300
    );
    // Aplicar daño y empuje en área
    this.applyExplosionAoE();
    
    // Programar destrucción para permitir ver el sprite hurt
    this.pendingDestroyTimer = 8;
    return;
  }

  // Explosión también al morir (no solo al acercarse el jugador)
  destroy() {
    if (!this.hasExploded && this.body && this.body.position) {
      this.hasExploded = true;
      createChlorineCloudEffect(
        this.body.position.x,
        this.body.position.y,
        this.circleRadius,
        300
      );
      // Aplicar daño y empuje en área también al morir
      this.applyExplosionAoE();
    }
    super.destroy();
  }

  // Al recibir daño: activar sprite hurt unas cuantas frames
  takeDamage(amount) {
    const dmg = typeof amount === 'number' && amount > 0 ? amount : 0;
    if (dmg <= 0) return;
    this.hurtTimer = 20;

    const hurtImg = (this.hurtSprite && typeof this.hurtSprite.getImage === 'function')
      ? this.hurtSprite.getImage()
      : this.hurtSprite;
    if (hurtImg) {
      this.sprite = hurtImg;
      if (this.body) this.body.sprite = this.sprite;
    }

    // Si el golpe sería letal, retrasar destrucción para mostrar hurt
    if (this.health - dmg <= 0) {
      this.pendingDestroyTimer = Math.max(this.pendingDestroyTimer, 8);
      this.health = 1; // mantener vivo temporalmente hasta destruir
    } else {
      // Aplicar el daño real y continuar
      super.takeDamage(dmg);
    }
  }
}


