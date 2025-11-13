// ============================
// GESTIÓN DE EFECTOS DE TIEMPO
// ============================

import { getEffectSpriteByName } from './effectSprites.js';
import { gameState } from '../../state.js';
import assetLoader from '../../assets/assetLoader.js';

// Registro de efectos activos
let activeTimeEffects = [];

// ============================
// CREACIÓN DE EFECTOS
// ============================

// Crea un efecto de nube de cloro
export function createChlorineCloudEffect(x, y, radius, lifeTime = 300) {
  const sprites = generateCloudSprites(x, y, radius);
  
  const effect = {
    type: 'chlorineCloud',
    centerX: x,
    centerY: y,
    radius: radius,
    sprites: sprites,
    lifeTime: lifeTime,
    currentTime: 0
  };
  
  activeTimeEffects.push(effect);
  return effect;
}

// Crea un efecto genérico de impacto que dibuja un sprite/GIF durante su vida útil
export function createSpriteImpactEffect(name, x, y, width = 64, height = 64, lifeTime = 45, options = {}) {
  const effect = {
    type: 'spriteImpact',
    spriteName: name,
    x,
    y,
    width,
    height,
    lifeTime,
    currentTime: 0,
    fadeOut: options.fadeOut ?? true
  };
  activeTimeEffects.push(effect);
  return effect;
}

// Genera sprites para la nube de cloro
function generateCloudSprites(centerX, centerY, radius) {
  const numSprites = Math.floor(Math.random() * 50) + 3;
  const sprites = [];
  
  for (let i = 0; i < numSprites; i++) {
    sprites.push(createCloudSprite(centerX, centerY, radius));
  }
  
  return sprites;
}

// Crea un sprite individual para la nube
function createCloudSprite(centerX, centerY, radius) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * (radius * 0.6);
  
  return {
    x: centerX + Math.cos(angle) * distance,
    y: centerY + Math.sin(angle) * distance,
    spriteNumber: Math.floor(Math.random() * 3) + 1,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    scale: 0.5 + Math.random() * 5
  };
}

// ============================
// ACTUALIZACIÓN Y RENDERIZADO
// ============================

// Actualiza todos los efectos de tiempo
export function updateTimeEffects() {
  for (let i = activeTimeEffects.length - 1; i >= 0; i--) {
    const effect = activeTimeEffects[i];
    effect.currentTime++;
    
    if (effect.currentTime >= effect.lifeTime) {
      activeTimeEffects.splice(i, 1);
    }
  }
}

// Dibuja todos los efectos de tiempo
export function drawTimeEffects(p) {
  activeTimeEffects.forEach(effect => {
    if (effect.type === 'chlorineCloud') {
      drawChlorineCloud(p, effect);
    } else if (effect.type === 'spriteImpact') {
      drawSpriteImpact(p, effect);
    }
  });
}

// Dibuja una nube de cloro
function drawChlorineCloud(p, effect) {
  effect.sprites.forEach(sprite => {
    const spriteImg = getEffectSpriteByName(`chlorineCloud${sprite.spriteNumber}`);
    
    p.push();
    p.translate(sprite.x, sprite.y);
    p.rotate(sprite.rotation + sprite.rotationSpeed * effect.currentTime);
    p.imageMode(p.CENTER);
    
    // Calcular opacidad basada en tiempo de vida
    const alpha = p.map(effect.lifeTime - effect.currentTime, 0, effect.lifeTime, 0, 255);
    p.tint(255, alpha);
    
    const size = sprite.scale * 20;
    try {
      // Dibujar según el tipo o disponibilidad del sprite
      if (spriteImg && spriteImg.gifImage) {
        // Instancia de GifAnimation
        p.image(spriteImg.gifImage, 0, 0, size, size);
      } else if (spriteImg && spriteImg.width > 0 && spriteImg.height > 0) {
        // Imagen p5 normal (PNG)
        p.image(spriteImg, 0, 0, size, size);
      } else {
        // Fallback si el sprite no está disponible o no tiene dimensiones válidas
        p.fill(0, 255, 255, alpha);
        p.noStroke();
        p.ellipse(0, 0, size, size);
      }
    } catch (error) {
      console.warn("Error al dibujar nube de cloro:", error);
      // Fallback si hay error al dibujar
      p.fill(0, 255, 255, alpha);
      p.noStroke();
      p.ellipse(0, 0, size, size);
    }
    p.pop();
  });
}

// ============================
// UTILIDADES
// ============================

// Obtiene todos los efectos activos
export function getActiveTimeEffects() {
  return activeTimeEffects;
}

// Limpia todos los efectos activos
export function clearTimeEffects() {
  activeTimeEffects = [];
}

// Dibuja un impacto de sprite/GIF en una posición fija
function drawSpriteImpact(p, effect) {
  const sprite = assetLoader.getAsset(effect.spriteName);
  const remaining = effect.lifeTime - effect.currentTime;
  const alpha = effect.fadeOut ? p.map(remaining, 0, effect.lifeTime, 0, 255) : 255;

  p.push();
  p.imageMode(p.CENTER);
  p.tint(255, alpha);
  try {
    if (sprite && typeof sprite.draw === 'function') {
      sprite.draw(p, effect.x, effect.y, effect.width, effect.height);
    } else if (sprite && sprite.width > 0) {
      p.image(sprite, effect.x, effect.y, effect.width, effect.height);
    } else {
      // Fallback si no hay sprite válido
      p.noStroke();
      p.fill(255, 200, 0, alpha);
      p.ellipse(effect.x, effect.y, effect.width, effect.height);
    }
  } catch (error) {
    console.warn('Error al dibujar spriteImpact:', error);
  }
  p.pop();
}