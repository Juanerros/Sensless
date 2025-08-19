import Matter from "matter-js";
import { getBodies } from "../physics";
import { gameState } from "../state";

// Array para guardar a los enemigos y despues dibujarlos mas facil en el draw
let enemies = [];

// Clase base de enemigo
export class Enemy {
// Se definen atributos basicos generales, con esto cualquier enemigo tiene o basico
  constructor(x, y, w, h, world) {
    this.width = w;
    this.height = h;
    this.health = 100;
    this.damage = 10;
    
    this.body = Matter.Bodies.rectangle(x, y, w, h, {
      frictionAir: 0.05,
      friction: 0.1,
      density: 0.001,
      restitution: 0,
      inertia: Infinity
    });
    //Una etiqueta para que se identifique que es un enemigo. Label
    this.body.label = "enemy";
    this.body.isEnemy = true;
    //Y luego lo mets al mundo 
    Matter.World.add(world, this.body);
    getBodies().push(this.body);

    enemies.push(this);
  }

// Dibuja al enemigo(de momento un rectangulo)
  draw(p) {
    const pos = this.body.position;
    const angle = this.body.angle;
    p.push();
    p.translate(pos.x, pos.y);
    p.rotate(angle);
    p.rectMode(p.CENTER);
    p.fill(255, 0, 0); 
    p.rect(0, 0, this.width, this.height);
    p.pop();
  }

  //Esto es para el futuro cuando los enemigos reciban daño y fallezcan, dolorosamente
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }

  destroy() {
    enemies = enemies.filter(e => e !== this);
    Matter.World.remove(gameState.world, this.body);
  }
}

// Eredamos atributos de enemy y le agregamos la velocidad y el rango de deteccion para la mecanica de persecucion
export class ChaserEnemy extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world); 
    this.detectionRadius = 300;
    this.speed = 0.005;
  }
  
update() {
    // Método base, puede ser sobrescrito por los hijos
    // Agarra al jugador
    const player = gameState.player;
    if (!player) return;

    // Calcula distancia
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Si el jugador entra dentro del rango de detección, se genera una fuerza hacia el jugador 
    if (dist < this.detectionRadius) {
        const angle = Math.atan2(dy, dx);
        const forceX = Math.cos(angle) * this.speed;
        const forceY = Math.sin(angle) * this.speed;

        Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    }
}
}

// Métodos globales para actualizar/dibujar a todos los enemigos
export function updateEnemies() {
  for (let e of enemies) {
    e.update();
  }
}

export function drawEnemies(p) {
  for (let e of enemies) {
    e.draw(p);
  }
}

export function getEnemies() {
  return enemies;
}
