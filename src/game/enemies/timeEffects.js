// ============================
// GESTIÓN DE EFECTOS DE TIEMPO
// ============================

import { getEffectSpriteByName } from './effectSprites.js';
import { gameState } from '../state.js';

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
    }
  });
}

// Dibuja una nube de cloro
function drawChlorineCloud(p, effect) {
  effect.sprites.forEach(sprite => {
    const spriteImg = getEffectSpriteByName(`chlorineCloud${sprite.spriteNumber}`);
    if (!spriteImg) return;
    
    p.push();
    p.translate(sprite.x, sprite.y);
    p.rotate(sprite.rotation + sprite.rotationSpeed * effect.currentTime);
    p.imageMode(p.CENTER);
    
    // Calcular opacidad basada en tiempo de vida
    const alpha = p.map(effect.lifeTime - effect.currentTime, 0, effect.lifeTime, 0, 255);
    p.tint(255, alpha);
    
    const size = sprite.scale * 20;
    try {
      // Verificar si es una instancia de GifAnimation
      if (spriteImg.gifImage) {
        p.image(spriteImg.gifImage, 0, 0, size, size);
      } 
      // Si es una imagen p5 normal
      else if (spriteImg.width > 0 && spriteImg.height > 0) {
        p.image(spriteImg, 0, 0, size, size);
      } else {
        throw new Error("Sprite sin dimensiones válidas");
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