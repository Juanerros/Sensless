import Matter from "matter-js";
import { Enemy } from "../core/enemy.js";
import { gameState } from "../../state.js";
import { getScaledEnemySpriteByName } from "../sprites/enemySprites.js";
import { getTerrainHeightAt } from "../../worldGeneration.js";

// Enemigo Olvido: no se mueve, se teletransporta periódicamente.
// Estados: idle -> teleportOut (desaparece) -> teleportIn (aparece) -> idle
export class Olvido extends Enemy {
  constructor(x, y, world) {
    const defaultW = 160;
    const defaultH = 160;
    super(x, y, defaultW, defaultH, world);
    this.name = 'olvido';
    this.type = 'olvido';
    this.scoreValue = 150;

    // Sprites
    this.idleSprite = null;
    this.teleportOutSprite = null;
    this.teleportInSprite = null;

    // Estado y temporizadores (basados en tiempo, no frames)
    this.state = 'idle';
    this.teleportIntervalMs = 3000; // ~3s entre teletransportes
    this.nextTeleportAt = Date.now() + this.teleportIntervalMs;
    this.teleportOutDurationMs = 320; // acortar para evitar segunda repetición
    this.teleportInDurationMs = 360;
    this.stateEndAt = 0;

    // No se mueve con fuerzas; mantener quieto
    this.body.frictionAir = 0.2;
    Matter.Body.setVelocity(this.body, { x: 0, y: 0 });

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

    // Mantener quieto
    if (this.body) {
      Matter.Body.setAngularVelocity(this.body, 0);
      Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
    }

    const now = Date.now();
    switch (this.state) {
      case 'idle':
        this.sprite = this.idleSprite || this.sprite;
        if (this.body) this.body.sprite = this.sprite;
        if (now >= this.nextTeleportAt) {
          // Iniciar desaparición
          this.state = 'teleportOut';
          this.stateEndAt = now + this.teleportOutDurationMs;
          this.sprite = this.teleportOutSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        break;
      case 'teleportOut':
        this.sprite = this.teleportOutSprite || this.sprite;
        if (this.body) this.body.sprite = this.sprite;
        if (now >= this.stateEndAt) {
          // Elegir nueva posición y teletransportar
          const { x: newX } = this.getNewTeleportX();
          this.placeOnGroundAtX(newX);
          // Pasar a animación de aparición
          this.state = 'teleportIn';
          this.stateEndAt = now + this.teleportInDurationMs;
          this.sprite = this.teleportInSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        break;
      case 'teleportIn':
        this.sprite = this.teleportInSprite || this.sprite;
        if (this.body) this.body.sprite = this.sprite;
        if (now >= this.stateEndAt) {
          // Volver a idle y reiniciar cooldown en ms
          this.state = 'idle';
          this.nextTeleportAt = now + this.teleportIntervalMs;
          this.sprite = this.idleSprite || this.sprite;
          if (this.body) this.body.sprite = this.sprite;
        }
        break;
      default:
        this.state = 'idle';
        break;
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
}

export default Olvido;