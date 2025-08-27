import Matter from "matter-js";
import { getBodies } from "../physics";
import { gameState } from "../state";

// Array para guardar a los enemigos
export let enemies = [];

/**
 * Clase base para todos los enemigos del juego
 * Proporciona funcionalidad común como salud, daño y métodos básicos
 */
export class Enemy {
  /**
   * Constructor de la clase Enemy
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} w - Ancho del enemigo
   * @param {number} h - Alto del enemigo
   * @param {Matter.World} world - Mundo de Matter.js
   */
  constructor(x, y, w, h, world) {
    // Propiedades básicas  
    this.width = w;
    this.height = h;
    this.health = 100;
    this.damage = 10;
    this.sprite = null;
    this.name = null;
    this.type = "enemy"; // Tipo de enemigo para identificación

    // Crear cuerpo físico
    this.body = Matter.Bodies.rectangle(x, y, w, h, {
      frictionAir: 0.05,
      friction: 0.1,
      density: 0.001,
      restitution: 0,
      inertia: Infinity
    });
    
    // Etiquetas para identificación
    this.body.label = "enemy";
    this.body.isEnemy = true;
    
    // Añadir al mundo físico
    Matter.World.add(world, this.body);
    getBodies().push(this.body);

    // Registrar en la lista de enemigos
    enemies.push(this);
  }

  /**
   * Método para dibujar el enemigo
   * @param {p5} p - Instancia de p5.js
   */
  draw(p) {
    const pos = this.body.position;
    const angle = this.body.angle;
    
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);
    
    // Si tiene sprite, dibujarlo
    if (this.sprite && this.sprite.width > 0) {
      p.imageMode(p.CENTER);
      p.image(this.sprite, 0, 0, this.width, this.height);
    } else {
      // Si no tiene sprite, dibujar un rectángulo rojo
      p.rectMode(p.CENTER);
      p.fill(255, 0, 0);
      p.rect(0, 0, this.width, this.height);
    }
    
    p.pop();
  }

  /**
   * Método para recibir daño
   * @param {number} amount - Cantidad de daño a recibir
   */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }

  /**
   * Método para destruir el enemigo
   */
  destroy() {
    // Remover del array de enemigos
    const index = enemies.indexOf(this);
    if (index > -1) {
      enemies.splice(index, 1);
    }
    
    // Remover del mundo físico
    if (gameState.world && this.body) {
      Matter.World.remove(gameState.world, this.body);
    }
    
    // Remover del array de cuerpos físicos
    const bodies = getBodies();
    const bodyIndex = bodies.indexOf(this.body);
    if (bodyIndex > -1) {
      bodies.splice(bodyIndex, 1);
    }
  }

  /**
   * Método de actualización base (a implementar por subclases)
   */
  update() {
    // Método base a ser sobrescrito por las subclases
  }

  /**
   * Calcula la distancia al jugador
   * @returns {Object} Objeto con distancia y componentes dx, dy
   */
  getDistanceToPlayer() {
    const player = gameState.player;
    if (!player) return { dist: Infinity, dx: 0, dy: 0 };
    
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return { dist, dx, dy };
  }
}

/**
 * Clase para enemigos que persiguen al jugador
 */
export class ChaserEnemy extends Enemy {
  /**
   * Constructor de ChaserEnemy
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {Matter.World} world - Mundo de Matter.js
   */
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 300;
    this.speed = 0.005;
    this.name = 'olvido';
    this.type = "chaser";
  }

  /**
   * Actualización específica para enemigos perseguidores
   */
  update() {
    const { dist, dx, dy } = this.getDistanceToPlayer();
    
    // Si el jugador está dentro del radio de detección, perseguirlo
    if (dist < this.detectionRadius) {
      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * this.speed;
      const forceY = Math.sin(angle) * this.speed;

      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    }
  }
}

/**
 * Asigna sprites a los enemigos según su nombre
 * @param {p5.Image} img - Imagen a asignar como sprite
 * @param {string} name - Nombre del tipo de enemigo
 */
export function loadSpriteEnemies(img, name) {
  enemies.forEach(e => { 
    if (e.name === name) {
      e.sprite = img;
      e.body.sprite = img; // Asignar también al cuerpo físico
    }
  });
}

/**
 * Actualiza todos los enemigos
 */
export function updateEnemies() {
  for (let e of enemies) {
    e.update();
  }
}

/**
 * Dibuja todos los enemigos
 * @param {p5} p - Instancia de p5.js
 */
export function drawEnemies(p) {
  for (let e of enemies) {
    e.draw(p);
  }
}

/**
 * Devuelve el array de enemigos
 * @returns {Array} Array de enemigos
 */
export function getEnemies() {
  return enemies;
}
