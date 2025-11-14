import Matter from "matter-js";
import { Enemy } from "../core/enemy.js";
import assetLoader from '../../assets/assetLoader.js';
import { getScaledEnemySpriteByName } from "../sprites/enemySprites.js";
import { addScore, gameState } from '../../state.js';
import { takeDamage } from '../../player.js';

export class Wendigo extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 300;
    this.baseSpeed = 0.005;
    this.speedBoostMultiplier = 1.8; // corre más rápido al ser dañado
    this.speed = this.baseSpeed;
    this.scoreValue = 100 + Math.round(Math.random() * 100);
    this.name = 'wendigo';
    this.type = 'wendigo';

    // Dirección inicial
    this.direction = 'right';
    if (this.body) this.body.direction = this.direction;

    // Estado y timers
    this.state = 'idle'; // 'idle' | 'alert' | 'chase'
    this.alertTimer = 0;
    this.alertDuration = 45; // ~3/4 segundo a 60fps
    this.hurtTimer = 0; // frames para mostrar hurt
    this.hurtRunTimer = 0; // frames para usar counterRun y speed boost
    this.isDying = false;
    this.deathTimer = 0;

    // Sprites por estado (usando nodo de carga)
    this.idleSprite = assetLoader.getScaledAsset('wendigo', 160, 160) || getScaledEnemySpriteByName('wendigo', 160, 160);
    this.moveSprite = assetLoader.getScaledAsset('wendigoMove', 160, 160) || getScaledEnemySpriteByName('wendigoMove', 160, 160);
    this.alertSprite = assetLoader.getScaledAsset('wendigoAlert', 160, 160) || getScaledEnemySpriteByName('wendigoAlert', 160, 160);
    this.chargeSprite = assetLoader.getScaledAsset('wendigoCharge', 160, 160) || getScaledEnemySpriteByName('wendigoCharge', 160, 160);
    this.hurtSprite = assetLoader.getScaledAsset('wendigoHurt', 160, 160) || getScaledEnemySpriteByName('wendigoHurt', 160, 160);
    this.counterRunSprite = assetLoader.getScaledAsset('wendigoCounterRun', 160, 160) || getScaledEnemySpriteByName('wendigoCounterRun', 160, 160);
    this.deadSprite = assetLoader.getScaledAsset('wendigoDeath', 160, 160) || getScaledEnemySpriteByName('wendigoDeath', 160, 160);

    // Asegurar imagen p5 si es GifAnimation
    this.idleImg = (this.idleSprite && typeof this.idleSprite.getImage === 'function')
      ? this.idleSprite.getImage()
      : this.idleSprite;
    this.moveImg = (this.moveSprite && typeof this.moveSprite.getImage === 'function')
      ? this.moveSprite.getImage()
      : this.moveSprite;
    this.alertImg = (this.alertSprite && typeof this.alertSprite.getImage === 'function')
      ? this.alertSprite.getImage()
      : this.alertSprite;
    this.chargeImg = (this.chargeSprite && typeof this.chargeSprite.getImage === 'function')
      ? this.chargeSprite.getImage()
      : this.chargeSprite;
    this.hurtImg = (this.hurtSprite && typeof this.hurtSprite.getImage === 'function')
      ? this.hurtSprite.getImage()
      : this.hurtSprite;
    this.counterRunImg = (this.counterRunSprite && typeof this.counterRunSprite.getImage === 'function')
      ? this.counterRunSprite.getImage()
      : this.counterRunSprite;
    this.deadImg = (this.deadSprite && typeof this.deadSprite.getImage === 'function')
      ? this.deadSprite.getImage()
      : this.deadSprite;

    // Sprite inicial
    this.sprite = this.idleImg || this.idleSprite || this.sprite;
    if (this.body) this.body.sprite = this.sprite;
    if (this.body) this.body.drawAnchor = 'bottom';

    // Daño por contacto
    this.contactDamage = 6;
    this.contactDamageCooldownMs = 800;
    this.lastContactHitAt = 0;
  }

  update() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    super.update();

    // Si está muriendo, mostrar animación de muerte y terminar
    if (this.isDying) {
      if (this.deadImg || this.deadSprite) {
        this.sprite = this.deadImg || this.deadSprite;
        if (this.body) this.body.sprite = this.sprite;
      }
      if (this.deathTimer > 0) {
        this.deathTimer--;
      } else {
        this.destroyFinally();
      }
      return;
    }

    // Lazy load por si los assets no estaban disponibles en el constructor
    if (!this.idleSprite) {
      this.idleSprite = assetLoader.getScaledAsset('wendigo', 160, 160) || getScaledEnemySpriteByName('wendigo', 160, 160);
      this.idleImg = (this.idleSprite && typeof this.idleSprite.getImage === 'function') ? this.idleSprite.getImage() : this.idleSprite;
    }
    if (!this.moveSprite) {
      this.moveSprite = assetLoader.getScaledAsset('wendigoMove', 160, 160) || getScaledEnemySpriteByName('wendigoMove', 160, 160);
      this.moveImg = (this.moveSprite && typeof this.moveSprite.getImage === 'function') ? this.moveSprite.getImage() : this.moveSprite;
    }
    if (!this.alertSprite) {
      this.alertSprite = assetLoader.getScaledAsset('wendigoAlert', 160, 160) || getScaledEnemySpriteByName('wendigoAlert', 160, 160);
      this.alertImg = (this.alertSprite && typeof this.alertSprite.getImage === 'function') ? this.alertSprite.getImage() : this.alertSprite;
    }
    if (!this.chargeSprite) {
      this.chargeSprite = assetLoader.getScaledAsset('wendigoCharge', 160, 160) || getScaledEnemySpriteByName('wendigoCharge', 160, 160);
      this.chargeImg = (this.chargeSprite && typeof this.chargeSprite.getImage === 'function') ? this.chargeSprite.getImage() : this.chargeSprite;
    }
    if (!this.hurtSprite) {
      this.hurtSprite = assetLoader.getScaledAsset('wendigoHurt', 160, 160) || getScaledEnemySpriteByName('wendigoHurt', 160, 160);
      this.hurtImg = (this.hurtSprite && typeof this.hurtSprite.getImage === 'function') ? this.hurtSprite.getImage() : this.hurtSprite;
    }
    if (!this.counterRunSprite) {
      this.counterRunSprite = assetLoader.getScaledAsset('wendigoCounterRun', 160, 160) || getScaledEnemySpriteByName('wendigoCounterRun', 160, 160);
      this.counterRunImg = (this.counterRunSprite && typeof this.counterRunSprite.getImage === 'function') ? this.counterRunSprite.getImage() : this.counterRunSprite;
    }
    if (!this.deadSprite) {
      this.deadSprite = assetLoader.getScaledAsset('wendigoDeath', 160, 160) || getScaledEnemySpriteByName('wendigoDeath', 160, 160);
      this.deadImg = (this.deadSprite && typeof this.deadSprite.getImage === 'function') ? this.deadSprite.getImage() : this.deadSprite;
    }

    // Actualizar dirección según el jugador
    if (Math.abs(dx) > 1) {
      this.direction = dx > 0 ? 'right' : 'left';
      if (this.body) this.body.direction = this.direction;
    }

    // Mostrar sprite de daño si está activo (toma prioridad)
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      const spr = this.hurtImg || this.hurtSprite;
      if (spr) {
        this.sprite = spr;
        if (this.body) this.body.sprite = this.sprite;
      }
      // Durante hurt, no se mueve
      return;
    }

    // Ajustar velocidad si está en modo contraembestida
    if (this.hurtRunTimer > 0) {
      this.hurtRunTimer--;
      this.speed = this.baseSpeed * this.speedBoostMultiplier;
    } else {
      this.speed = this.baseSpeed;
    }

    // Lógica de estados: idle -> alert -> chase
    if (dist < this.detectionRadius) {
      if (this.state === 'idle') {
        // Entró en rango: mostrar alerta antes de correr
        this.state = 'alert';
        this.alertTimer = this.alertDuration;
      }
    } else {
      // Fuera de rango: volver a idle
      this.state = 'idle';
      this.alertTimer = 0;
    }

    // Selección de sprite por estado y control de movimiento
    if (this.state === 'alert' && this.alertTimer > 0) {
      // Mostrar animación de alerta y no moverse
      const spr = this.alertImg || this.alertSprite || this.idleImg || this.sprite;
      this.sprite = spr;
      if (this.body) this.body.sprite = this.sprite;
      this.alertTimer--;
      if (this.alertTimer <= 0) {
        this.state = 'chase';
      }
    } else if (this.state === 'chase') {
      // Animación de correr y persecución activa
      // Prioridad: contraembestida si está activo, si no elegir por salud
      let spr = null;
      if (this.hurtRunTimer > 0) {
        spr = this.counterRunImg || this.counterRunSprite;
      } else {
        const below30 = this.health <= 30;
        spr = below30
          ? (this.moveImg || this.moveSprite)
          : (this.chargeImg || this.chargeSprite);
      }
      spr = spr || this.moveImg || this.moveSprite || this.idleImg || this.sprite;
      this.sprite = spr;
      if (this.body) this.body.sprite = this.sprite;
      this.chasePlayer(dx, dy);
    } else {
      // Estado idle
      const spr = this.idleImg || this.idleSprite || this.sprite;
      this.sprite = spr;
      if (this.body) this.body.sprite = this.sprite;
    }

    // Aplicar daño por contacto al jugador
    this.applyContactDamage();
  }

  chasePlayer(dx, dy) {
    const angle = Math.atan2(dy, dx);
    const forceX = Math.cos(angle) * this.speed;
    const forceY = 0;

    this.updateJumpState();
    const onGround = this.isOnGround === true;
    const appliedX = onGround ? forceX : forceX * 0.2;

    Matter.Body.applyForce(this.body, this.body.position, { x: appliedX, y: forceY });

    if (this.detectObstacle()) {
      this.jump();
    }
  }

  takeDamage(amount) {
    const dmg = typeof amount === 'number' ? amount : 0;
    if (dmg <= 0 || this.isDying) return;

    this.health -= dmg;

    // Si muere, activar animación de muerte y terminar luego
    if (this.health <= 0) {
      this.isDying = true;
      this.deathTimer = 60; // ~1s de animación
      if (this.deadImg || this.deadSprite) {
        this.sprite = this.deadImg || this.deadSprite;
        if (this.body) this.body.sprite = this.sprite;
      }
      return;
    }

    // Mostrar hurt corto y activar contraembestida
    this.hurtTimer = Math.max(this.hurtTimer, 12);
    this.hurtRunTimer = Math.max(this.hurtRunTimer, 120); // ~2s de boost
    // Forzar estado de persecución si fue golpeado
    this.state = 'chase';

    if (this.hurtImg || this.hurtSprite) {
      this.sprite = this.hurtImg || this.hurtSprite;
      if (this.body) this.body.sprite = this.sprite;
    }
  }

  destroyFinally() {
    addScore(this.scoreValue);
    this.removeFromEnemies();
    this.removeFromPhysics();
  }

  // Daño por contacto al jugador con knockback (igual a Olvido)
  applyContactDamage() {
    const now = Date.now();
    if ((now - this.lastContactHitAt) < this.contactDamageCooldownMs) return;
    const playerBody = gameState?.player;
    if (!playerBody || !this.body) return;

    const dx = playerBody.position.x - this.body.position.x;
    const dy = playerBody.position.y - this.body.position.y;
    // Detección AABB para contacto sólido
    const halfWEnemy = (this.width || 40) / 2;
    const halfHEnemy = (this.height || 60) / 2;
    const halfWPlayer = (playerBody.width || 42) / 2;
    const halfHPlayer = (playerBody.height || 80) / 2;
    const overlapX = Math.abs(dx) <= (halfWEnemy + halfWPlayer);
    const overlapY = Math.abs(dy) <= (halfHEnemy + halfHPlayer);
    if (overlapX && overlapY) {
      try { takeDamage(this.contactDamage); } catch (_) {}
      const dist = Math.hypot(dx, dy);
      let nx = 0, ny = -1; // fallback hacia arriba
      if (dist > 0) { nx = dx / dist; ny = dy / dist; }
      const knockSpeed = 14;
      try { Matter.Body.setVelocity(playerBody, { x: nx * knockSpeed, y: ny * knockSpeed }); } catch (_) {}
      this.lastContactHitAt = now;
    }
  }
}

export default Wendigo;