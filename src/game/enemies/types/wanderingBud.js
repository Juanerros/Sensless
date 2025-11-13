import Matter from "matter-js";
import { Enemy } from "../core/enemy";
import assetLoader from '../../assets/assetLoader.js';
import { gameState } from "../../state";
import { takeDamage } from "../../player";
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
    // Reintentar carga si aún no estaban disponibles en el constructor
    if (!this.idleSprite) {
      this.idleSprite = assetLoader.getScaledAsset('wanderingBud', this.width, this.height);
    }
    if (!this.moveSprite) {
      this.moveSprite = assetLoader.getScaledAsset('wanderingBudMove', this.width, this.height);
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

    this.handleMovement();
    this.handlePlayerCollision(player);
  }

  handleMovement() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    if (dist < this.detectionRadius) {
      // Forzar sprite de correr cuando está persiguiendo
      if (this.moveImg || this.moveSprite) {
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
      // Forzar sprite idle cuando no persigue
      if (this.idleImg || this.idleSprite) {
        this.sprite = this.idleImg || (this.idleSprite.getImage ? this.idleSprite.getImage() : this.idleSprite);
      }
      if (this.body) this.body.sprite = this.sprite;
    }
  }

  handlePlayerCollision(player) {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    if (dist < this.circleRadius && !this.hasExploded) {
      this.applyDamageAndKnockback(player, dx, dy);
      
      if (!this.playerInCircle) {
        this.triggerExplosion();
      }
    }
  }

  applyDamageAndKnockback(player, dx, dy) {
    takeDamage(0);
    
    const angle = Math.atan2(dy, dx);
    const repulsionForce = 0.7;
    const forceX = Math.cos(angle) * repulsionForce;
    const forceY = Math.sin(angle) * repulsionForce;
    
    Matter.Body.applyForce(player, player.position, { x: forceX, y: forceY });
  }

  triggerExplosion() {
    this.playerInCircle = true;
    this.hasExploded = true;
    
    // Usar el nuevo sistema de efectos de tiempo
    createChlorineCloudEffect(
      this.body.position.x,
      this.body.position.y,
      this.circleRadius,
      300
    );
    
    this.destroy();
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
    }
    super.destroy();
  }
}


