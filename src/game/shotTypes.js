/**
 * shotTypes.js
 * Define los diferentes tipos de disparos mágicos disponibles en el juego.
 * Cada tipo de disparo tiene propiedades específicas como daño, velocidad, etc.
 */

import { getSpriteByName } from './sprites.js';

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
export const SHOT_TYPES = {
    // Disparo básico de fuego
    FIRE: {
        name: 'fire',
        damage: 15,
        speed: 22,
        size: 20,
        count: 1,
        cooldown: 400,
        element: 'fire',
        lifespan: 360,
        hasColission: true,
        getSprite: () => getSpriteByName('fire') || createColoredCircle([255, 100, 0]),
        onHit: (shot, target, p) => {
            // Efecto visual al impactar
            createFireImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            
        }
    },
    
    // Disparo de agua
    WATER: {
        name: 'water',
        damage: 10,
        speed: 10,
        size: 25,
        count: 5,
        cooldown: 600,
        element: 'water',
        lifespan: 45,
        hasColission: true,
        // getSpriteByName('water') ||
        getSprite: () => createColoredCircle([0, 100, 255]),
        onHit: (shot, target, p) => {
            // Efecto visual al impactar
            createWaterImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            // Comportamiento estándar, movimiento lineal
        }
    },
    
    // Disparo de rayo
    LIGHTNING: {
        name: 'lightning',
        damage: 25,
        speed: 25,
        size: 35,
        count: 1,
        cooldown: 800,
        element: 'lightning',
        lifespan: 30,
        hasColission: true,
        getSprite: () => getSpriteByName('lightning') || createColoredCircle([255, 255, 0]),
        onHit: (shot, target, p) => {
            // Efecto visual al impactar
            createLightningImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            // Comportamiento estándar, movimiento lineal
        }
    },
    
    // Disparo múltiple
    MULTI: {
        name: 'multi',
        damage: 8,
        speed: 15,
        size: 12,
        count: 3,
        cooldown: 1000,
        element: 'multi',
        lifespan: 40,
        hasColission: false,
        getSprite: () => getSpriteByName('multi') || createColoredCircle([255, 0, 255]),
        onHit: (shot, target, p) => {
            // Efecto visual al impactar
            //createMultiImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            // Comportamiento estándar, movimiento lineal
        }
    },
    
    // Disparo de tierra
    EARTH: {
        name: 'earth',
        damage: 20,
        speed: 10,
        size: 40,
        count: 1,
        cooldown: 700,
        element: 'earth',
        lifespan: 50,
        hasColission: true,
        getSprite: () => getSpriteByName('earth') || createColoredCircle([139, 69, 19]),
        onHit: (shot, target, p) => {
            // Efecto visual al impactar
            createEarthImpactEffect(shot.position.x, shot.position.y, p);
        },
        onUpdate: (shot) => {
            // Comportamiento estándar, movimiento lineal
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