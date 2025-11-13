import { getBodies } from './physics.js';
import { getPlayer } from './player.js';
import { getTerrainSpriteManager, initializeTerrainSprites } from './terrainSprites.js';

class Renderer {
  constructor() {
    this.player = null;
    this.terrainSpriteManager = null;
    this.terrainSpritesInitStarted = false;
    this.backgroundLayers = [];
    this.backgroundLoaded = false;
    this.backgroundInitStarted = false;
    this.parallaxFactors = [0.05, 0.12, 0.25];
  }

  setPlayer(player) {
    this.player = player;
  }

  drawBodies(p) {
    const bodies = getBodies();
    const player = getPlayer();

    const cameraX = player ? player.position.x : 0;
    const cameraY = player ? player.position.y : 0;
    const screenWidth = p.width;
    const screenHeight = p.height;
    const margin = -50;

    const leftBound = cameraX - screenWidth / 2 - margin;
    const rightBound = cameraX + screenWidth / 2 + margin;
    const topBound = cameraY - screenHeight / 2 - margin;
    const bottomBound = cameraY + screenHeight / 2 + margin;

    bodies.forEach(body => {
      if (body.isPlayer) return;

      const pos = body.position;

      if (pos.x < leftBound || pos.x > rightBound ||
        pos.y < topBound || pos.y > bottomBound) {
        return;
      }

      this.drawSingleBody(p, body);
    });
  }

  drawSingleBody(p, body) {
    const pos = body.position;
    const angle = body.angle;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);
    // Voltear horizontalmente enemigos según su dirección
    if (body.isEnemy && body.direction === 'left') {
      p.scale(-1, 1);
    }

    // Verificar que el sprite existe y es válido antes de intentar dibujarlo
    if (this.isValidSprite(body.sprite)) {
      this.drawBodyWithSprite(p, body);
    } else {
      this.drawBodyWithColor(p, body);
    }

    // Dibujar ballesta overlay si existe en enemigos
    if (body.isEnemy && this.isValidSprite(body.crossbowSprite)) {
      try {
        const bw = typeof body.width === 'number' ? body.width : 40;
        const bh = typeof body.height === 'number' ? body.height : 40;
        const owner = body.owner;
        const offSource = (body.crossbowOffset ?? owner?.crossbowOffset) ?? { x: 0, y: 0 };
        const cwRaw = body.crossbowWidth ?? Math.max(20, bw * 0.6);
        const chRaw = body.crossbowHeight ?? Math.max(12, bh * 0.4);
        const oxRaw = offSource?.x;
        const oyRaw = offSource?.y;
        const cw = Number.isFinite(cwRaw) ? cwRaw : Math.max(20, bw * 0.6);
        const ch = Number.isFinite(chRaw) ? chRaw : Math.max(12, bh * 0.4);
        const ox = Number.isFinite(oxRaw) ? oxRaw : 0;
        const oy = Number.isFinite(oyRaw) ? oyRaw : 0;
        p.imageMode(p.CENTER);
        const spr = body.crossbowSprite.gifImage ? body.crossbowSprite.gifImage : body.crossbowSprite;
        p.image(spr, ox, oy, cw, ch);
      } catch (e) {
        // Si falla, ignoramos overlay
      }
    }

    // Dibujar láser de puntería para Bandit desde el renderer
    if (body.isEnemy && body.owner && body.owner.type === 'bandit' && body.owner.isAiming) {
      try {
        const owner = body.owner;
        const offSource = (body.crossbowOffset ?? owner?.crossbowOffset) ?? { x: 0, y: 0 };
        const ox = Number.isFinite(offSource?.x) ? offSource.x : 0;
        const oy = Number.isFinite(offSource?.y) ? offSource.y : 0;
        const target = owner.aimTarget ?? { x: body.position.x, y: body.position.y };
        const isPrefire = Number.isFinite(owner.prefireFrames) && Number.isFinite(owner.aimTimer)
          ? owner.aimTimer <= owner.prefireFrames
          : false;

        p.push();
        p.stroke(isPrefire ? 255 : 0, isPrefire ? 0 : 255, 0);
        p.strokeWeight(2);
        // El renderer ya trasladó a la posición del body; dibujar línea en coords locales hasta target en coords globales
        // Necesitamos convertir el target a coords locales actuales
        let localTargetX = target.x - body.position.x;
        const localTargetY = target.y - body.position.y;
        // Compensar el flip horizontal aplicado a enemigos mirando a la izquierda
        if (body.isEnemy && body.direction === 'left') {
          localTargetX = -localTargetX;
        }
        p.line(ox, oy, localTargetX, localTargetY);
        p.pop();
      } catch (e) {
        // Si falla, omitimos el láser sin romper el render
      }
    }

    // (Destello de impacto removido a pedido del usuario)

    // Contorno de hitbox para enemigos (solo si está habilitado)
    if (body.isEnemy && body.width && body.height && body.showHitbox) {
      p.rectMode(p.CENTER);
      p.noFill();
      p.stroke(0, 255, 0);
      p.strokeWeight(2);
      p.rect(0, 0, body.width, body.height);
    }

    p.pop();
  }

  // Método para verificar si un sprite es válido para dibujar
  isValidSprite(sprite) {
    if (!sprite) return false;

    // Verificar si es una instancia de GifAnimation
    if (sprite.gifImage) {
      return sprite.gifImage && typeof sprite.gifImage === 'object' && sprite.gifImage.width > 0;
    }

    // Verificar si es una imagen p5 normal
    return typeof sprite === 'object' && sprite.width > 0;
  }

  drawBodyWithSprite(p, body) {
    try {
      const drawW = Number.isFinite(body.drawWidth) ? body.drawWidth : body.width;
      const drawH = Number.isFinite(body.drawHeight) ? body.drawHeight : body.height;
      const offX = Number.isFinite(body.drawOffsetX) ? body.drawOffsetX : 0;
      let offY = Number.isFinite(body.drawOffsetY) ? body.drawOffsetY : 0;
      // Anclaje opcional: dibujar pegado al borde inferior de la hitbox
      if (body.drawAnchor === 'bottom' && Number.isFinite(body.height)) {
        offY += (body.height - drawH) / 2;
      }
      // Verificar si es una instancia de GifAnimation
      if (body.sprite.gifImage) {
        p.imageMode(p.CENTER);
        p.image(body.sprite.gifImage, offX, offY, drawW, drawH);
      }
      // Si es una imagen p5 normal
      else {
        p.imageMode(p.CENTER);
        p.image(body.sprite, offX, offY, drawW, drawH);
      }
    } catch (error) {
      console.error("Error dibujando sprite:", error, "Body:", body.label);
      // Si hay un error al dibujar el sprite, usamos el color como fallback
      this.drawBodyWithColor(p, body);
    }
  }

  drawBodyWithColor(p, body) {
    if (body.label === 'terrain') {
      this.drawTerrainBody(p, body);
    } else if (body.label === 'ground') {
      this.drawGroundBody(p, body);
    } else {
      this.drawDefaultBody(p, body);
    }
  }

  drawTerrainBody(p, body) {
    if (!this.terrainSpriteManager) {
      this.terrainSpriteManager = getTerrainSpriteManager();
    }
    if (!this.terrainSpriteManager.isLoaded() && !this.terrainSpritesInitStarted) {
      this.terrainSpritesInitStarted = true;
      initializeTerrainSprites(p).finally(() => {
        this.terrainSpritesInitStarted = false;
      });
    }
    const sprite = this.terrainSpriteManager.getSpriteForLayer(body.layer || 0);
    if (sprite) {
      this.terrainSpriteManager.drawTerrainSprite(p, body, sprite);
    } else {
      this.terrainSpriteManager.drawFallbackTerrain(p, body);
    }
  }

  drawGroundBody(p, body) {
    p.fill(139, 69, 19);
    p.stroke(0);
    p.strokeWeight(2);
    this.drawBodyRect(p, body);
  }

  drawDefaultBody(p, body) {
    p.fill(100);
    this.drawBodyRect(p, body);
  }

  drawBodyRect(p, body) {
    p.rectMode(p.CENTER);
    if (body.width !== undefined && body.height !== undefined &&
      body.width > 0 && body.height > 0) {
      p.rect(0, 0, body.width, body.height);
    }
  }

  drawBackground(p) {
    const player = getPlayer();
    const cameraX = player ? player.position.x : 0;
    const cameraY = player ? player.position.y : 0;

    if (!this.backgroundLoaded && !this.backgroundInitStarted) {
      this.backgroundInitStarted = true;
      this.initializeBackgroundSprites(p).finally(() => {
        this.backgroundInitStarted = false;
      });
    }

    if (!this.backgroundLoaded || this.backgroundLayers.length === 0) {
      p.background(135, 206, 235);
      return;
    }

    p.imageMode(p.CORNER);
    for (let i = 0; i < this.backgroundLayers.length; i++) {
      const layer = this.backgroundLayers[i];
      const factor = this.parallaxFactors[i] ?? this.parallaxFactors[this.parallaxFactors.length - 1];
      const offsetX = ((cameraX * factor) % p.width + p.width) % p.width;
      const x1 = -offsetX;
      const x2 = x1 + p.width;
      const y = 0; // anclado verticalmente
      p.image(layer, x2, y - 250, p.width, p.height);
      p.image(layer, x1, y - 250, p.width, p.height);
    }
  }

  setParallaxFactors(factors) {
    if (Array.isArray(factors) && factors.length > 0) {
      this.parallaxFactors = factors;
    }
  }

  async initializeBackgroundSprites(p) {
    const paths = [
      'sprites/Fondo/arboleda_1/fondo_1.png',
      'sprites/Fondo/arboleda_1/fondo_2.png',
      'sprites/Fondo/arboleda_1/fondo_3.png',
    ];
    const loaders = paths.map(path => new Promise(resolve => {
      p.loadImage(path, img => resolve(img), () => resolve(null));
    }));
    return Promise.all(loaders).then(images => {
      this.backgroundLayers = images.filter(Boolean);
      this.backgroundLoaded = this.backgroundLayers.length > 0;
    });
  }
}

export default Renderer;