import Matter from "matter-js";
import { Enemy } from "../core/enemy.js";
import { gameState } from "../../state.js";
import { getScaledEnemySpriteByName } from "../sprites/enemySprites.js";
import { getTerrainHeightAt } from "../../worldGeneration.js";
import { getBodies, getWorld } from "../../physics.js";
import { bullets } from "./bandit.js";
import { takeDamage } from "../../player.js";

// Enemigo Olvido: no se mueve, se teletransporta periódicamentr.
// Estados: idle -> teleportOut (desaparece) -> teleportIn (aparece) -> idle
export class Olvido extends Enemy {
  constructor(x, y, world) {
    const defaultW = 160;
    const defaultH = 160;
    super(x, y, defaultW, defaultH, world);
    this.name = 'olvido';
    this.type = 'olvido';
    this.scoreValue = 1000 + Math.round(Math.random() * 500);

    // Sprites
    this.idleSprite = null;
    this.teleportOutSprite = null;
    this.teleportInSprite = null;
    this.attackStartSprite = null;
    this.attackingSprite = null;
    this.hurtSprite = null;

    // Estado y temporizadores (basados en tiempo, no frames)
    this.state = 'idle';
    this.teleportIntervalMs = 6000; // 6s entre teletransportes
    this.nextTeleportAt = Date.now() + this.teleportIntervalMs;
    this.teleportOutDurationMs = 320; // acortar para evitar segunda repetición
    this.teleportInDurationMs = 360;
    this.attackStartDurationMs = 600; // inicio de ataque
    this.projectileIntervalMs = 700;  // intervalo más lento de disparo durante 'attacking'
    this.lastShotAt = 0;
    this.stateEndAt = 0;
    this.hurtDurationMs = 240;
    this.hurtUntil = 0;
    this.maxHealth = 200;
    this.health = this.maxHealth;

    // Fase y transición
    this.phase = 1; // 1 -> comportamiento original, 2 -> embestidas/ataque alterno
    this.isTransitioningToPhase2 = false;
    this.invulnerableUntil = 0;
    this.flashIntervalMs = 200;
    this.nextFlashAt = 0;
    // Bandera para obligar retorno a persecución tras cada ataque
    this.forceChaseAfterAttack = false;

    // Sprites Fase 2
    this.phase2HeadSprite = null;       // quieto
    this.phase2HeadTurnSprite = null;   // en movimiento
    this.phase2HeadAttackSprite = null; // ataque

    // Configuración Fase 2
    this.phase2DashSpeed = 18; // velocidad alta para embestida larga
    this.phase2DashDurationMs = 900; // valor base, pero se ajusta dinámicamente por distancia
    this.phase2IdleDurationMs = 500;
    this.phase2AttackDurationMs = 4500; // más tiempo disparando en Fase 2
    this.phase2AttackChance = 0.3; // probabilidad de entrar en ataque desde idle
    this.lastDashStartAt = 0;
    this.lastPushAt = 0;
    this.pushCooldownMs = 700;
    this.pushDamage = 12;
    this.pushForce = 0.7; // fuerza fuerte, similar a explosión de cloro

    // Seguimiento y ciclo de ataques en Fase 2
    this.phase2ChaseSpeed = 4.8; // seguimiento más evidente
    this.phase2NextCycleAt = Date.now() + 3000; // cada 3s abre una ventana de ataques
    this.attacksRemainingInCycle = 0; // ejecuta 2 ataques por ciclo
    this.dashCountRemaining = 0; // para series de embestidas 3-7

    // Daño por contacto en cualquier fase
    this.contactDamage = 8;
    this.contactDamageCooldownMs = 800;
    this.lastContactHitAt = 0;
    this.phase2BlockRadius = 60;

    // No se mueve con fuerzas; mantener quieto
    this.body.frictionAir = 0.2;
    Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    // En Fase 1 NO vuela: mantener colisión normal
    if (this.body) {
      this.body.isSensor = false;
    }

    // Asegurar que inicia en el suelo cercano a x
    this.placeOnGroundAtX(this.body.position.x);

    // Cargar sprites lazy en el primer update
  }

  lazyLoadSprites() {
    if (!this.idleSprite) {
      this.idleSprite = getScaledEnemySpriteByName('olvido', this.width, this.height);
    }
    if (!this.teleportOutSprite) {
      this.teleportOutSprite = getScaledEnemySpriteByName('olvidoTeleport', this.width, this.height);
    }
    if (!this.teleportInSprite) {
      this.teleportInSprite = getScaledEnemySpriteByName('olvidoTeleportBack', this.width, this.height);
    }
    if (!this.attackStartSprite) {
      this.attackStartSprite = getScaledEnemySpriteByName('olvidoAttackStart', this.width, this.height);
    }
    if (!this.attackingSprite) {
      this.attackingSprite = getScaledEnemySpriteByName('olvidoAttacking', this.width, this.height);
    }
    if (!this.hurtSprite) {
      this.hurtSprite = getScaledEnemySpriteByName('olvidoHurt', this.width, this.height);
    }
    if (!this.phase2HeadSprite) {
      this.phase2HeadSprite = getScaledEnemySpriteByName('olvidoPhase2Head', this.width, this.height);
    }
    if (!this.phase2HeadTurnSprite) {
      this.phase2HeadTurnSprite = getScaledEnemySpriteByName('olvidoPhase2HeadTurn', this.width, this.height);
    }
    if (!this.phase2HeadAttackSprite) {
      this.phase2HeadAttackSprite = getScaledEnemySpriteByName('olvidoPhase2HeadAttack', this.width, this.height);
    }
    // Inicializar sprite actual
    if (!this.sprite && this.idleSprite) {
      this.sprite = this.idleSprite;
      this.body.sprite = this.idleSprite;
    }
  }

  placeOnGroundAtX(x) {
    // worldGeneration genera el terreno con centro en surfaceY = getTerrainHeightAt(x) + 40
    // Altura del segmento superior: 50 -> top = surfaceY - 25
    const terrainTopY = getTerrainHeightAt(x) + 15; // 40 - 25 = 15
    const targetY = terrainTopY - (this.height / 2);
    Matter.Body.setPosition(this.body, { x, y: targetY });
  }

  update() {
    // Evitar destrucción por caída si teletransporta fuera de terreno por un frame
    // (omitimos checkFallDeath de la base)

    // Cargar sprites si aún no
    this.lazyLoadSprites();

    // Reset rotación
    if (this.body) {
      Matter.Body.setAngularVelocity(this.body, 0);
    }

    // Mirar siempre hacia el jugador
    const player = gameState.player;
    if (player && this.body && player.position) {
      const dx = player.position.x - this.body.position.x;
      if (Math.abs(dx) > 1) {
        // Fase 1: mantener flip original (perfecto antes)
        // Fase 2: usar flip corregido
        if (this.phase === 1) {
          this.direction = dx > 0 ? 'left' : 'right';
        } else {
          this.direction = dx > 0 ? 'right' : 'left';
        }
        this.body.direction = this.direction;
      }
    }

    const now = Date.now();
    const hurting = this.hurtUntil && now < this.hurtUntil;

    // Transición a Fase 2 (invulnerable y parpadeo)
    if (this.isTransitioningToPhase2) {
      // inmóvil durante la transición
      if (this.body) {
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
      }

      // Parpadeo del sprite de daño
      if (now >= this.nextFlashAt) {
        const showHurt = Math.floor((now - (this.invulnerableUntil - 3000)) / this.flashIntervalMs) % 2 === 0;
        const spriteToShow = showHurt ? (this.hurtSprite || this.sprite) : (this.idleSprite || this.sprite);
        this.sprite = spriteToShow;
        if (this.body) this.body.sprite = spriteToShow;
        this.nextFlashAt = now + this.flashIntervalMs;
      }

      if (now >= this.invulnerableUntil) {
        // Termina invulnerabilidad: entrar en Fase 2
        this.isTransitioningToPhase2 = false;
        this.phase = 2;
        // En Fase 2 vuela pero NO atraviesa el suelo: colisiona
        if (this.body) this.body.isSensor = false;
        this.state = 'phase2Idle';
        this.stateEndAt = now + this.phase2IdleDurationMs;
        const s = this.phase2HeadSprite || this.sprite;
        this.sprite = s;
        if (this.body) this.body.sprite = s;
      }
      return; // no continuar con lógica de otras fases
    }

    // FASE 2: embestidas y ataques alternos
    if (this.phase === 2) {
      // Mirar al jugador (orientación base: derecha)
      const player = gameState.player;
      if (player && this.body && player.position) {
        const dx = player.position.x - this.body.position.x;
        if (Math.abs(dx) > 1) {
          this.direction = dx > 0 ? 'right' : 'left';
          this.body.direction = this.direction;
        }
      }

      switch (this.state) {
        case 'phase2Idle': {
          // Seguir al jugador en reposo (chase con vuelo: en X e Y)
          if (this.body && player && player.position) {
            const dx = player.position.x - this.body.position.x;
            const dy = player.position.y - this.body.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 2) {
              const nx = dx / dist;
              const ny = dy / dist;
              const vx = nx * this.phase2ChaseSpeed;
              const vy = ny * this.phase2ChaseSpeed;
              Matter.Body.setVelocity(this.body, { x: vx, y: vy });
            } else {
              Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
            }
          }
          const s = this.phase2HeadSprite || this.sprite;
          this.sprite = s;
          if (this.body) this.body.sprite = s;

          // Scheduler: 2 ataques aleatorios cada 3s
          // Respetar retorno forzado a persecución antes de lanzar nuevo ataque
          if (this.forceChaseAfterAttack) {
            // mantener persecución por al menos un pequeño margen
            this.forceChaseAfterAttack = false;
            this.phase2NextCycleAt = now + 3000;
            this.attacksRemainingInCycle = 0;
          } else if (now >= this.phase2NextCycleAt && this.attacksRemainingInCycle <= 0) {
            this.phase2NextCycleAt = now + 3000;
            this.attacksRemainingInCycle = 2;
            this.startRandomPhase2Attack();
          }
          break;
        }
        case 'phase2Dash': {
          // mantener velocidad y comprobar empuje/daño
          const vel = this.body ? this.body.velocity : { x: 0, y: 0 };
          const sm = Math.abs(vel.x) > 0.1 ? (this.phase2HeadTurnSprite || this.sprite) : (this.phase2HeadSprite || this.sprite);
          this.sprite = sm;
          if (this.body) this.body.sprite = sm;

          const playerBody = gameState?.player;
          if (playerBody && playerBody.position && this.body && this.body.position) {
            // Ajustar trayectoria en tiempo real (homing) para alcanzar al jugador
            const dx = playerBody.position.x - this.body.position.x;
            const dy = playerBody.position.y - this.body.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 2) {
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);
              const speed = Math.max(this.phase2DashSpeed, 18);
              const vx = nx * speed;
              const vy = ny * speed;
              try { Matter.Body.setVelocity(this.body, { x: vx, y: vy }); } catch (e) {}
              // actualizar orientación
              this.direction = dx > 0 ? 'right' : 'left';
              this.body.direction = this.direction;
            }
            if (dist < 60 && (now - this.lastPushAt) >= this.pushCooldownMs) {
              // daño y knockback fuerte al embestir
              try { takeDamage(this.pushDamage); } catch (e) {}
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);
              const knockSpeed = 18;
              try { Matter.Body.setVelocity(playerBody, { x: nx * knockSpeed, y: ny * knockSpeed }); } catch (e) {}
              this.lastPushAt = now;
            }
          }

          const playerBody2 = gameState?.player;
          const distToPlayer = (playerBody2 && this.body) ? Math.hypot(playerBody2.position.x - this.body.position.x, playerBody2.position.y - this.body.position.y) : Infinity;
          // Terminar si alcanzó al jugador o superó un máximo de tiempo
          const maxDashMs = 5000;
          if (now >= this.stateEndAt || now - this.lastDashStartAt >= maxDashMs || distToPlayer < 36) {
            if (this.dashCountRemaining > 1) {
              this.dashCountRemaining -= 1;
              // iniciar siguiente embestida larga hacia el jugador
              this.beginDashToPlayer();
            } else {
              // serie terminada: obligar retorno a persecución
              this.attacksRemainingInCycle = Math.max(0, this.attacksRemainingInCycle - 1);
              this.state = 'phase2Idle';
              this.forceChaseAfterAttack = true;
              this.phase2NextCycleAt = now + 3000;
              this.stateEndAt = now + this.phase2IdleDurationMs;
              if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
              const s2 = this.phase2HeadSprite || this.sprite;
              this.sprite = s2;
              if (this.body) this.body.sprite = s2;
            }
          }
          break;
        }
        case 'phase2AttackStart': {
          // preparar ataque
          const sa = this.phase2HeadAttackSprite || this.sprite;
          this.sprite = sa;
          if (this.body) this.body.sprite = sa;
          if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
          if (now >= this.stateEndAt) {
            this.state = 'phase2Attacking';
            this.stateEndAt = now + this.phase2AttackDurationMs;
            this.lastShotAt = now;
          }
          break;
        }
        case 'phase2Attacking': {
          const sa = this.phase2HeadAttackSprite || this.sprite;
          this.sprite = sa;
          if (this.body) this.body.sprite = sa;
          if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });

          if (now - this.lastShotAt >= this.projectileIntervalMs) {
            this.fireBellyProjectileToward(gameState.player);
            this.lastShotAt = now;
          }
          if (now >= this.stateEndAt) {
            // fin del ataque de disparos: obligar retorno a persecución
            this.attacksRemainingInCycle = Math.max(0, this.attacksRemainingInCycle - 1);
            this.state = 'phase2Idle';
            this.forceChaseAfterAttack = true;
            this.phase2NextCycleAt = now + 3000;
            this.stateEndAt = now + this.phase2IdleDurationMs;
            const s = this.phase2HeadSprite || this.sprite;
            this.sprite = s;
            if (this.body) this.body.sprite = s;
          }
          break;
        }
        default: {
          // fallback
          this.state = 'phase2Idle';
          this.stateEndAt = now + this.phase2IdleDurationMs;
          const s = this.phase2HeadSprite || this.sprite;
          this.sprite = s;
          if (this.body) this.body.sprite = s;
        }
      }
      // Daño por contacto también activo en Fase 2
      this.applyContactDamage();
      // Pseudo-hitbox: evitar que el jugador atraviese a Olvido en vuelo
      this.resolvePlayerOverlapPhase2();
      return;
    }

    // FASE 1: comportamiento original (teleport + disparo)
    if (this.body) {
      Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    }
    switch (this.state) {
      case 'idle':
        // Si no toca teletransportar aún, iniciar ataque
        if (now >= this.nextTeleportAt) {
          // Iniciar desaparición
          this.state = 'teleportOut';
          this.stateEndAt = now + this.teleportOutDurationMs;
          if (!hurting) {
            this.sprite = this.teleportOutSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        } else {
          this.state = 'attackStart';
          this.stateEndAt = now + this.attackStartDurationMs;
          if (!hurting) {
            this.sprite = this.attackStartSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        }
        break;
      case 'attackStart':
        if (!hurting) {
          this.sprite = this.attackStartSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        if (now >= this.stateEndAt) {
          // Pasar a atacar continuamente hasta el próximo teleport
          this.state = 'attacking';
          this.stateEndAt = 0;
          this.lastShotAt = now;
          if (!hurting) {
            this.sprite = this.attackingSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        }
        break;
      case 'attacking':
        if (!hurting) {
          this.sprite = this.attackingSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        if (now - this.lastShotAt >= this.projectileIntervalMs) {
          this.fireBellyProjectileToward(gameState.player);
          this.lastShotAt = now;
        }
        if (now >= this.nextTeleportAt) {
          // Iniciar desaparición
          this.state = 'teleportOut';
          this.stateEndAt = now + this.teleportOutDurationMs;
          if (!hurting) {
            this.sprite = this.teleportOutSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        }
        break;
      case 'teleportOut':
        if (!hurting) {
          this.sprite = this.teleportOutSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        if (now >= this.stateEndAt) {
          // Elegir nueva posición y teletransportar
          const { x: newX } = this.getNewTeleportX();
          this.placeOnGroundAtX(newX);
          // Pasar a animación de aparición
          this.state = 'teleportIn';
          this.stateEndAt = now + this.teleportInDurationMs;
          if (!hurting) {
            this.sprite = this.teleportInSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        }
        break;
      case 'teleportIn':
        if (!hurting) {
          this.sprite = this.teleportInSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        if (now >= this.stateEndAt) {
          // Volver a idle y reiniciar cooldown en ms
          this.state = 'idle';
          this.nextTeleportAt = now + this.teleportIntervalMs;
          if (!hurting) {
            this.sprite = this.idleSprite || this.sprite;
            if (this.body) this.body.sprite = this.sprite;
          }
        }
        break;
      default:
        this.state = 'idle';
        break;
    }
    // Daño por contacto en cualquier fase (si cerca)
    this.applyContactDamage();
  }

  // Inicia un ataque aleatorio en Fase 2 (embestidas en serie o disparos)
  startRandomPhase2Attack() {
    const now = Date.now();
    if (Math.random() < 0.5) {
      // Serie de embestidas: 3 a 7
      this.dashCountRemaining = Math.floor(Math.random() * (7 - 3 + 1)) + 3;
      this.state = 'phase2Dash';
      this.beginDashToPlayer();
    } else {
      // Ráfaga de disparos prolongada
      this.state = 'phase2AttackStart';
      this.stateEndAt = now + 400;
      const sa = this.phase2HeadAttackSprite || this.sprite;
      this.sprite = sa;
      if (this.body) this.body.sprite = sa;
    }
  }

  // Evita que el jugador atraviese a Olvido en Fase 2 manteniendo vuelo (sin colisionar con terreno)
  resolvePlayerOverlapPhase2() {
    if (this.phase !== 2) return;
    const player = gameState?.player;
    if (!player || !player.position || !this.body || !this.body.position) return;
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.hypot(dx, dy);
    const radius = this.phase2BlockRadius || 60;
    if (dist > 0 && dist <= radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      const newPx = this.body.position.x + nx * (radius + 2);
      const newPy = this.body.position.y + ny * (radius + 2);
      try { Matter.Body.setPosition(player, { x: newPx, y: newPy }); } catch (_) {}
      const v = player.velocity || { x: 0, y: 0 };
      const toward = v.x * nx + v.y * ny;
      if (toward < 0) {
        const vx = v.x - nx * toward * 1.2;
        const vy = v.y - ny * toward * 1.2;
        try { Matter.Body.setVelocity(player, { x: vx, y: vy }); } catch (_) {}
      }
    }
  }

  // Calcula una embestida que alcance al jugador sin importar la distancia
  beginDashToPlayer() {
    const now = Date.now();
    const player = gameState.player;
    if (!this.body || !player || !player.position) {
      this.stateEndAt = now + this.phase2DashDurationMs;
      return;
    }
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.hypot(dx, dy);
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    const speed = Math.max(this.phase2DashSpeed, 16); // velocidad alta para embestida larga
    const vx = nx * speed;
    const vy = ny * speed;
    try { Matter.Body.setVelocity(this.body, { x: vx, y: vy }); } catch (e) {}
    const sm = this.phase2HeadTurnSprite || this.sprite;
    this.sprite = sm;
    if (this.body) this.body.sprite = sm;
    // Duración proporcional a distancia (cap para evitar excesos)
    const ms = Math.min(Math.max((dist / speed) * 1000, 600), 2500);
    this.stateEndAt = now + ms;
  }

  // Daño por contacto (todas las fases) con knockback
  applyContactDamage() {
    const now = Date.now();
    if ((now - this.lastContactHitAt) < this.contactDamageCooldownMs) return;
    const playerBody = gameState?.player;
    if (!playerBody || !this.body) return;
    const dx = playerBody.position.x - this.body.position.x;
    const dy = playerBody.position.y - this.body.position.y;
    // Detección AABB para contacto sólido
    const halfWEnemy = (this.width || 160) / 2;
    const halfHEnemy = (this.height || 160) / 2;
    const halfWPlayer = (playerBody.width || 42) / 2;
    const halfHPlayer = (playerBody.height || 80) / 2;
    const overlapX = Math.abs(dx) <= (halfWEnemy + halfWPlayer);
    const overlapY = Math.abs(dy) <= (halfHEnemy + halfHPlayer);
    if (overlapX && overlapY) {
      try { takeDamage(this.contactDamage); } catch (e) {}
      // knockback inmediato con setVelocity
      const dist = Math.hypot(dx, dy);
      let nx = 0, ny = -1; // fallback hacia arriba
      if (dist > 0) { nx = dx / dist; ny = dy / dist; }
      const knockSpeed = 14;
      try { Matter.Body.setVelocity(playerBody, { x: nx * knockSpeed, y: ny * knockSpeed }); } catch (e) {}
      this.lastContactHitAt = now;
    }
  }

  takeDamage(amount) {
    const dmg = typeof amount === 'number' && amount > 0 ? amount : 0;
    if (dmg <= 0) return;

    const now = Date.now();
    // Ignorar daño si invulnerable en transición
    if (this.isTransitioningToPhase2 && now < this.invulnerableUntil) {
      return;
    }

    this.health -= dmg;
    // Inicializar maxHealth si no está
    if (!this.maxHealth) this.maxHealth = 100;
    if (this.health <= 0) {
      this.destroy();
      return;
    }
    // Activar flash de daño sin romper el ciclo de ataque/teleport
    this.hurtUntil = now + this.hurtDurationMs;
    if (this.hurtSprite) {
      this.sprite = this.hurtSprite;
      if (this.body) this.body.sprite = this.hurtSprite;
    }

    // Disparar transición a Fase 2 al 50%
    if (this.phase === 1 && this.health <= (this.maxHealth * 0.5)) {
      this.isTransitioningToPhase2 = true;
      this.invulnerableUntil = now + 3000; // 3 segundos
      this.nextFlashAt = now; // comenzar parpadeo inmediato
      // Detener acciones en curso
      this.state = 'idle';
      this.stateEndAt = 0;
      this.nextTeleportAt = Number.POSITIVE_INFINITY; // desactivar teleports en transición
    }
  }

  getNewTeleportX() {
    const player = gameState.player;
    const min = 300, max = 650;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const offset = min + Math.random() * (max - min);
    const baseX = player ? player.position.x : this.body.position.x;
    const x = baseX + dir * offset;
    return { x };
  }

  fireBellyProjectileToward(player) {
    if (!player || !player.position) return;
    const origin = { x: this.body.position.x, y: this.body.position.y + 18 };
    const dx = player.position.x - origin.x;
    const dy = player.position.y - origin.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const speed = 4.5; // más lento
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;
    // Aplicar pequeño offset para que el proyectil nazca un poco fuera del cuerpo
    const offset = 6;
    const spawnX = origin.x + (dx / len) * offset;
    const spawnY = origin.y + (dy / len) * offset;
    const shot = new OlvidoShot(this.world, spawnX, spawnY, vx, vy);
    bullets.push(shot);
  }
}

class OlvidoShot {
  constructor(world, x, y, vx, vy) {
    // Si no nos pasan el world, usamos el global
    this.world = world || getWorld();
    this.width = 22;
    this.height = 22;
    // Sin TTL: el proyectil no desaparece por tiempo/distancia
    this.lifeMs = null;
    this.spawnAt = Date.now();
    this.vx = vx;
    this.vy = vy;
    this.isValid = true;
    // Rectángulo sensor, sin fricción ni aire, similar al Bandit
    this.body = Matter.Bodies.rectangle(
      x,
      y,
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
    this.body.label = 'olvidoShot';
    this.body.isBullet = true;
    // Definir ángulo visual según la dirección del disparo
    const angle = Math.atan2(this.vy, this.vx);
    Matter.Body.setAngle(this.body, angle);
    // Sprite
    const spr = getScaledEnemySpriteByName('olvidoShot', this.width, this.height);
    if (spr) {
      this.sprite = spr;
      this.body.sprite = spr;
    }
    // Sincroniza dimensiones para que el renderer pueda dibujar la bala
    this.body.width = this.width;
    this.body.height = this.height;
    // Añadir al mundo y lista de cuerpos
    Matter.World.add(this.world, this.body);
    getBodies().push(this.body);
    // Velocidad inicial
    Matter.Body.setVelocity(this.body, { x: this.vx, y: this.vy });
  }

  update() {
    const now = Date.now();
    if (this.lifeMs && (now - this.spawnAt >= this.lifeMs)) {
      this.destroy();
      return false;
    }

    // Mantener velocidad constante para evitar caída por gravedad
    Matter.Body.setVelocity(this.body, { x: this.vx, y: this.vy });

    // Colisión con jugador (rádio aproximado)
    const playerBody = gameState?.player;
    if (playerBody) {
      const dx = playerBody.position.x - this.body.position.x;
      const dy = playerBody.position.y - this.body.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 25) {
        try { takeDamage(8); } catch (e) {}
        this.destroy();
        return false;
      }
    }
    return true;
  }

  destroy() {
    try { Matter.World.remove(this.world, this.body); } catch (e) {}
    const bodies = getBodies();
    const idx = bodies.indexOf(this.body);
    if (idx > -1) bodies.splice(idx, 1);
    this.isValid = false;
  }
}

export default Olvido;