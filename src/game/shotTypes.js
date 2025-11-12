/**
 * shotTypes.js
 * Define los diferentes tipos de disparos mágicos disponibles en el juego.
 * Cada tipo de disparo tiene propiedades específicas como daño, velocidad, etc.
 */

import Matter from 'matter-js';
import { getSpriteByName } from './sprites.js';
import assetLoader from './assets/assetLoader.js';
import { getBodies } from './physics.js';

/**
 * Tipos de disparos elementales disponibles
 * @typedef {Object} ShotType
 * @property {string} name - Nombre del tipo de disparo
 * @property {number} damage - Daño base que causa el disparo
 * @property {number} speed - Velocidad en píxeles por frame
 * @property {number} size - Tamaño del proyectil (ancho y alto)
 * @property {number} count - Cantidad de proyectiles por disparo
 * @property {number} cooldown - Tiempo de espera entre disparos (ms)
 * @property {string} element - Tipo elemental (fuego, agua, etc.)
 * @property {number} lifespan - Duración del proyectil en frames
 * @property {Function} getSprite - Función para obtener el sprite del proyectil
 * @property {Function} onHit - Función que se ejecuta al impactar (efectos especiales)
 * @property {Function} onUpdate - Función que se ejecuta en cada frame (comportamiento)
 */

/**
 * Definición de los tipos de disparos disponibles
 */
// Utilidad para sprite del tipo básico (GIF)
function getBasicSprite() {
    const asset = assetLoader.getAsset('basicProjectile');
    if (asset && (asset.gifImage || asset.width)) return asset;
    return createColoredCircle([255, 255, 255]);
}

const WATER_GRAVITY = 0.35;
const KNOCKBACK_SMALL = 0.05;
const KNOCKBACK_MEDIUM = 0.1;
const KNOCKBACK_STRONG = 0.2;

export const SHOT_TYPES = {
    // Tipo Básico: recto, velocidad media, daño básico, sprite GIF
    BASIC: {
        name: 'basic',
        damage: 12,
        speed: 14,
        size: 28,
        count: 1,
        cooldown: 300,
        element: 'basic',
        icon: 'basicProjectile',
        lifespan: 240,
        ignoreGravity: true,
        hasColission: true,
        getSprite: () => getBasicSprite(),
        onHit: (shot, target, p) => {
            if (target && target.isEnemy && typeof target.takeDamage === 'function') {
                target.takeDamage(shot.damage);
            }
        },
        onUpdate: (shot) => {
            // sin gravedad, trayectoria recta
        }
    },

    // Tipo Fuego: recto, explosión con AoE y quemadura leve
    FIRE: {
        name: 'fire',
        damage: 22,
        speed: 15,
        size: 26,
        count: 1,
        cooldown: 350,
        element: 'fire',
        icon: 'fire',
        lifespan: 300,
        ignoreGravity: true,
        hasColission: true,
        getSprite: () => getSpriteByName('fire') || createColoredCircle([255, 100, 0]),
        onHit: (shot, target, p) => {
            // Explosión con área de efecto
            const origin = shot.position;
            const radius = 60;
            const bodies = getBodies();
            for (const b of bodies) {
                if (!b || !b.isEnemy || !b.position) continue;
                const dx = b.position.x - origin.x;
                const dy = b.position.y - origin.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= radius) {
                    if (typeof b.takeDamage === 'function') {
                        b.takeDamage(shot.damage * 0.7, { type: 'fire', source: shot });
                    }
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    Matter.Body.applyForce(b, b.position, { x: nx * KNOCKBACK_MEDIUM, y: ny * KNOCKBACK_MEDIUM });
                }
            }
            // quemadura leve al objetivo directo
            if (target && typeof target.takeDamage === 'function') {
                target.takeDamage(4, { type: 'burn', source: shot });
            }
            createFireImpactEffect(origin.x, origin.y, p);
        },
        onUpdate: (shot) => {
            // movimiento recto
        }
    },

    // Tipo Agua: ráfaga con trayectoria parabólica y knockback leve
    WATER: {
        name: 'water',
        damage: 6,
        speed: 18,
        size: 14,
        count: 5,
        cooldown: 180,
        element: 'water',
        icon: 'water',
        lifespan: 80,
        hasColission: true,
        getSprite: () => getSpriteByName('water') || createColoredCircle([0, 100, 255]),
        onHit: (shot, target, p) => {
            if (target && target.isEnemy && typeof target.takeDamage === 'function') {
                target.takeDamage(shot.damage);
            }
            if (target && target.isEnemy) {
                const dir = Math.sign(shot.velocity.x) || 0;
                Matter.Body.applyForce(target, target.position, { x: dir * KNOCKBACK_SMALL, y: -KNOCKBACK_SMALL * 0.5 });
            }
            createWaterImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            const v = shot.velocity;
            Matter.Body.setVelocity(shot, { x: v.x, y: v.y + WATER_GRAVITY });
        }
    },

    // Tipo Tierra: grande y pesado, parabólico con caída pronunciada, knockback fuerte
    EARTH: {
        name: 'earth',
        damage: 35,
        speed: 10,
        size: 50,
        count: 1,
        cooldown: 500,
        element: 'earth',
        icon: 'earth',
        lifespan: 120,
        hasColission: true,
        getSprite: () => getSpriteByName('earth') || createColoredCircle([139, 69, 19]),
        onHit: (shot, target, p) => {
            if (target && target.isEnemy && typeof target.takeDamage === 'function') {
                target.takeDamage(shot.damage);
            }
            if (target) {
                const dir = Math.sign(shot.velocity.x) || 0;
                Matter.Body.applyForce(target, target.position, { x: dir * KNOCKBACK_STRONG, y: -KNOCKBACK_MEDIUM });
            }
            createEarthImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
        }
    }
};

/**
 * Crea un círculo coloreado como fallback si no hay sprite disponible
 * @param {Array<number>} color - Color RGB [r, g, b]
 * @returns {Object} - Objeto con propiedades para simular un sprite
 */
function createColoredCircle(color) {
    // Crear un objeto que sea compatible con la verificación en drawShot
    return {
        width: 0, // Establecer a 0 para que no intente usar image()
        height: 0,
        color: color,
        isColorFallback: true // Indicador para identificar que es un fallback
    };
}

/**
 * Efectos visuales al impactar
 * Estas funciones se implementarán en el sistema de efectos visuales
 */
function createFireImpactEffect(x, y, p) {
    // Implementación de efecto visual de fuego
}

function createWaterImpactEffect(x, y, p) {
    // Implementación de efecto visual de agua
}

function createLightningImpactEffect(x, y, p) {
    // Implementación de efecto visual de rayo
}

function createEarthImpactEffect(x, y, p) {
    // Implementación de efecto visual de tierra
}

/**
 * Obtiene un tipo de disparo por su nombre
 * @param {string} name - Nombre del tipo de disparo
 * @returns {ShotType|null} - Tipo de disparo o null si no existe
 */
export function getShotTypeByName(name) {
    return Object.values(SHOT_TYPES).find(type => type.name === name) || null;
}

/**
 * Obtiene todos los tipos de disparos disponibles
 * @returns {Array<ShotType>} - Array con todos los tipos de disparos
 */
export function getAllShotTypes() {
    return Object.values(SHOT_TYPES);
}