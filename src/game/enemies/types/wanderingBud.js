import Matter from "matter-js";
import { Enemy } from "../core/enemy";
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
  }

  initializeProperties() {
    this.detectionRadius = 300;
    this.circleRadius = 150;
    this.speed = 0.005;
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
    const player = gameState.player;
    if (!player) return;

    this.handleMovement();
    this.handlePlayerCollision(player);
  }

  handleMovement() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    if (dist < this.detectionRadius) {
    
      this.updateJumpState();
      
      if (this.detectObstacle()) {
        this.jump();
      }
      
      // Movimiento normal hacia el jugador
      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * this.speed;
      const forceY = Math.sin(angle) * this.speed;
      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
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
}
