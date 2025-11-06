/**
 * shotManager.js
 * Sistema de gestión de disparos mágicos con pooling de objetos para optimizar el rendimiento.
 * Maneja la creación, reutilización y destrucción de proyectiles.
 */

import Matter from 'matter-js';
import { getBodies, getWorld, removeFromWorld } from './physics.js';
import { gameState } from './state.js';
import { Vector2 } from '../utils/Vector2.js';
import { getShotTypeByName } from './shotTypes.js';

// Registro de disparos activos
let activeShots = [];

// Pool de objetos para reutilización
class ShotPool {
    constructor() {
        this.pools = {};
    }

    /**
     * Obtiene un disparo del pool o crea uno nuevo si no hay disponibles
     * @param {string} shotTypeName - Nombre del tipo de disparo
     * @returns {Matter.Body|null} - Cuerpo físico para el disparo o null si no se pudo crear
     */
    get(shotTypeName) {
        // Inicializar el pool para este tipo si no existe
        if (!this.pools[shotTypeName]) {
            this.pools[shotTypeName] = [];
        }

        // Obtener un objeto del pool o crear uno nuevo
        if (this.pools[shotTypeName].length > 0) {
            return this.pools[shotTypeName].pop();
        }

        // Si no hay objetos disponibles, crear uno nuevo
        return null; // El objeto se creará en createShot
    }

    /**
     * Devuelve un disparo al pool para su reutilización
     * @param {Matter.Body} shot - Cuerpo físico del disparo
     * @param {string} shotTypeName - Nombre del tipo de disparo
     */
    return(shot, shotTypeName) {
        // Inicializar el pool para este tipo si no existe
        if (!this.pools[shotTypeName]) {
            this.pools[shotTypeName] = [];
        }

        // Limitar el tamaño del pool para evitar uso excesivo de memoria
        if (this.pools[shotTypeName].length < 20) {
            // Resetear propiedades del disparo
            Matter.Body.setPosition(shot, { x: 0, y: 0 });
            Matter.Body.setVelocity(shot, { x: 0, y: 0 });
            Matter.Body.setAngle(shot, 0);
            Matter.Body.setAngularVelocity(shot, 0);

            // Devolver al pool
            this.pools[shotTypeName].push(shot);
        }
    }
}

// Instancia del pool de disparos
const shotPool = new ShotPool();

/**
 * Crea un nuevo disparo mágico
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 * @param {number} targetX - Posición X objetivo
 * @param {number} targetY - Posición Y objetivo
 * @param {string} shotTypeName - Nombre del tipo de disparo
 * @param {Object} shooter - Objeto que dispara (generalmente el jugador)
 * @returns {Matter.Body|null} - El cuerpo físico del disparo o null si no se pudo crear
 */
export function createShot(x, y, targetX, targetY, shotTypeName, shooter) {
    const shotType = getShotTypeByName(shotTypeName);
    if (!shotType) {
        console.warn(`Tipo de disparo no encontrado: ${shotTypeName}`);
        return null;
    }

    // Calcular dirección del disparo
    const direction = Vector2.subtract({ x: targetX, y: targetY }, { x, y });
    const normalizedDirection = Vector2.normalize(direction);

    // Crear disparos según la cantidad definida en el tipo
    const shots = [];

    for (let i = 0; i < shotType.count; i++) {
        // Calcular ángulo para disparos múltiples
        let angle = Math.atan2(normalizedDirection.y, normalizedDirection.x);
        if (shotType.count > 1) {
            // Distribuir los disparos en un arco
            const spreadAngle = Math.PI / 8; // 22.5 grados
            angle += spreadAngle * (i - (shotType.count - 1) / 2);
        }

        // Calcular dirección ajustada
        const adjustedDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        // Intentar obtener un disparo del pool
        let shot = shotPool.get(shotType.name);

        // Si no hay disponible, crear uno nuevo
        if (!shot) {
            shot = createNewShot(x, y, shotType, adjustedDirection, shooter);
        } else {
            // Configurar el disparo reutilizado
            resetShot(shot, x, y, shotType, adjustedDirection, shooter);
        }

        if (shot) {
            shots.push(shot);
            activeShots.push(shot);
        }
    }

    return shots.length > 0 ? shots : null;
}

/**
 * Crea un nuevo cuerpo físico para un disparo
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 * @param {Object} shotType - Tipo de disparo
 * @param {Object} direction - Dirección normalizada {x, y}
 * @param {Object} shooter - Objeto que dispara
 * @returns {Matter.Body} - Cuerpo físico del disparo
 */
function createNewShot(x, y, shotType, direction, shooter) {
    const world = getWorld();
    if (!world) return null;

    // Crear cuerpo físico
    const shot = Matter.Bodies.circle(x, y, shotType.size / 2, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        density: 0.001,
        isSensor: true, // Para que no colisione físicamente pero detecte colisiones
    });

    // Configurar propiedades del disparo
    shot.label = 'magicShot';
    shot.isMagicShot = true;
    shot.shotType = shotType.name;
    shot.damage = shotType.damage;
    shot.element = shotType.element;
    shot.lifespan = shotType.lifespan;
    shot.currentLife = shotType.lifespan;
    shot.shooter = shooter;
    shot.width = shotType.size;
    shot.height = shotType.size;
    shot.onHit = shotType.onHit;
    shot.onUpdate = shotType.onUpdate;

    // Asignar sprite
    const sprite = shotType.getSprite();
    if (sprite) {
        shot.sprite = sprite;
    }

    // Establecer velocidad
    const velocity = {
        x: direction.x * shotType.speed,
        y: direction.y * shotType.speed
    };
    Matter.Body.setVelocity(shot, velocity);

    // Añadir al mundo
    Matter.World.add(world, shot);
    getBodies().push(shot);

    return shot;
}

/**
 * Resetea un disparo existente para su reutilización
 * @param {Matter.Body} shot - Cuerpo físico del disparo
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 * @param {Object} shotType - Tipo de disparo
 * @param {Object} direction - Dirección normalizada {x, y}
 * @param {Object} shooter - Objeto que dispara
 */
function resetShot(shot, x, y, shotType, direction, shooter) {
    const world = getWorld();
    if (!world) return;

    // Reposicionar
    Matter.Body.setPosition(shot, { x, y });

    // Actualizar propiedades
    shot.shotType = shotType.name;
    shot.damage = shotType.damage;
    shot.element = shotType.element;
    shot.lifespan = shotType.lifespan;
    shot.currentLife = shotType.lifespan;
    shot.shooter = shooter;
    shot.width = shotType.size;
    shot.height = shotType.size;
    shot.onHit = shotType.onHit;
    shot.onUpdate = shotType.onUpdate;

    // Asignar sprite
    const sprite = shotType.getSprite();
    if (sprite) {
        shot.sprite = sprite;
    }

    // Establecer velocidad
    const velocity = {
        x: direction.x * shotType.speed,
        y: direction.y * shotType.speed
    };
    Matter.Body.setVelocity(shot, velocity);

    // Añadir al mundo si no está ya
    if (!getBodies().includes(shot)) {
        Matter.World.add(world, shot);
        getBodies().push(shot);
    }
}

/**
 * Actualiza todos los disparos activos
 * @param {p5} p - Instancia de p5.js para efectos visuales
 */
export function updateShots(p) {
    const bodies = getBodies();

    // Actualizar cada disparo activo
    for (let i = activeShots.length - 1; i >= 0; i--) {
        const shot = activeShots[i];

        // Verificar si el disparo sigue existiendo
        if (!shot || !bodies.includes(shot)) {
            activeShots.splice(i, 1);
            continue;
        }

        // Decrementar vida
        shot.currentLife--;

        // Ejecutar comportamiento personalizado
        if (shot.onUpdate) {
            shot.onUpdate(shot);
        }

        // Verificar colisiones
        checkShotCollisions(shot, p);

        // Eliminar si ha expirado
        if (shot.currentLife <= 0) {
            removeShot(shot);
            activeShots.splice(i, 1);
        }
    }
}

/**
 * Verifica colisiones de un disparo con otros objetos
 * @param {Matter.Body} shot - Disparo a verificar
 * @param {p5} p - Instancia de p5.js para efectos visuales
 */
function checkShotCollisions(shot, p) {
    const bodies = getBodies();

    for (const body of bodies) {
        // Ignorar colisiones con el propio disparo, su lanzador o el jugador
        if (body === shot ||
            (shot.shooter && body === shot.shooter) ||
            body.isMagicShot ||
            body.isPlayer) {
            continue;
        }

        // Verificar colisión
        if (Matter.Collision.collides(shot, body)) {
            // Ejecutar efecto de impacto (incluye aplicar daño desde el tipo de disparo)
            if (shot.onHit) {
                shot.onHit(shot, body, p);
            } else {
                // Si no hay onHit personalizado, aplicar daño por defecto
                if (body.isEnemy && body.takeDamage) {
                    body.takeDamage(shot.damage);
                }
            }

            // Eliminar el disparo
            removeShot(shot);
            break;
        }
    }
}

/**
 * Elimina un disparo y lo devuelve al pool
 * @param {Matter.Body} shot - Disparo a eliminar
 */
function removeShot(shot) {
    if (!shot) return;

    // Remover del mundo físico
    removeFromWorld(shot);

    // Devolver al pool para reutilización
    if (shot.shotType) {
        shotPool.return(shot, shot.shotType);
    }

    // Eliminar de la lista de disparos activos
    const index = activeShots.indexOf(shot);
    if (index !== -1) {
        activeShots.splice(index, 1);
    }
}

/**
 * Dibuja todos los disparos activos
 * @param {p5} p - Instancia de p5.js
 */
export function drawShots(p) {
    for (const shot of activeShots) {
        drawShot(p, shot);
    }
}

/**
 * Dibuja un disparo individual
 * @param {p5} p - Instancia de p5.js
 * @param {Matter.Body} shot - Disparo a dibujar
 */
function drawShot(p, shot) {
    if (!shot) return;

    const pos = shot.position;
    const size = shot.width || 20;

    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(shot.angle);

    // Dibujar con sprite si está disponible y es válido
    if (shot.sprite && typeof shot.sprite === 'object' && shot.sprite.width && shot.sprite.width > 0 && !shot.sprite.isColorFallback) {
        p.imageMode(p.CENTER);
        p.image(shot.sprite, 0, 0, size, size);
    }
    // Fallback a círculo coloreado si tiene color definido
    else if (shot.sprite && shot.sprite.color && Array.isArray(shot.sprite.color)) {
        p.fill(shot.sprite.color[0], shot.sprite.color[1], shot.sprite.color[2]);
        p.noStroke();
        p.ellipseMode(p.CENTER);
        p.ellipse(0, 0, size, size);
    }
    // Fallback genérico
    else {
        p.fill(255, 255, 0);
        p.noStroke();
        p.ellipseMode(p.CENTER);
        p.ellipse(0, 0, size, size);
    }

    p.pop();
}

/**
 * Limpia todos los disparos activos
 * Útil para reiniciar el juego o cambiar de nivel
 */
export function clearAllShots() {
    for (const shot of activeShots) {
        removeShot(shot);
    }
    activeShots = [];
}

/**
 * Obtiene la lista de disparos activos
 * @returns {Array} - Lista de disparos activos
 */
export function getActiveShots() {
    return activeShots;
}