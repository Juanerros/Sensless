import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";
import { takeDamage } from "../player";
/**
 * Clase para enemigos que vagan y crean círculos de daño
 */
export class WanderingBud extends Enemy {
  /**
   * Constructor de WanderingBud
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {Matter.World} world - Mundo de Matter.js
   */
  constructor(x, y, world) {
    super(x, y, 70, 80, world);
    this.detectionRadius = 300; // Radio de detección para perseguir
    this.circleRadius = 150;    // Radio para dibujar el círculo
    this.speed = 0.005;
    this.health = 50;
    this.name = 'olvido';
    this.type = "wanderer";
    this.playerInCircle = false;
    this.hasExploded = false; // Nueva bandera para evitar múltiples explosiones
  }

  /**
   * Dibuja el enemigo y su círculo si el jugador está cerca
   * @param {p5} p - Instancia de p5.js
   */
  draw(p) {
    // Dibuja el enemigo base
    super.draw(p);

    // Calcula la distancia al jugador
    const { dist } = this.getDistanceToPlayer();

    // Si el jugador está dentro del radio del círculo, dibuja el círculo
    if (dist < this.circleRadius) {
      this.drawCircle(p);
    }
  }

  /**
   * Dibuja el círculo de efecto con gradiente
   * @param {p5} p - Instancia de p5.js
   */
  drawCircle(p) {
    p.push();
    // Crear un gradiente radial
    for (let i = this.circleRadius * 2; i > 0; i -= 5) {
      let alpha = p.map(i, 0, this.circleRadius * 2, 0, 50);
      p.fill(255, 0, 0, alpha);
      p.noStroke();
      p.circle(this.body.position.x, this.body.position.y, i);
    }
    // Dibujar el borde
    p.noFill();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.circle(this.body.position.x, this.body.position.y, this.circleRadius * 2);
    p.pop();
  }

  update() {

    const player = gameState.player;
    if (!player) return;

    // Obtiene la distancia al jugador
    const { dist, dx, dy } = this.getDistanceToPlayer();

    // Si el jugador entra dentro del rango de detección, perseguirlo
    if (dist < this.detectionRadius) {
      const angle = Math.atan2(dy, dx);
      const forceX = Math.cos(angle) * this.speed;
      const forceY = Math.sin(angle) * this.speed;

      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    }
    
    // Si el jugador está dentro del círculo, aplicar efectos
    if (dist < this.circleRadius && !this.hasExploded) {
      takeDamage(90);
      // Calcular el ángulo desde el jugador hacia el enemigo (dirección opuesta)
      const angle = Math.atan2(dy, dx);
      // Crear una fuerza para empujar al jugador hacia afuera
      const repulsionForce = 0.7; 
      const forceX = Math.cos(angle) * repulsionForce;
      const forceY = Math.sin(angle) * repulsionForce;
      
      // Aplicar la fuerza al jugador para alejarlo
      Matter.Body.applyForce(player, player.position, { x: forceX, y: forceY });

      // Si es la primera vez que el jugador entra al círculo
      if (!this.playerInCircle) {

        this.playerInCircle = true;
        this.hasExploded = true; 

        // Generar múltiples sprites de nubes de cloro cuando explota
        const numSprites = Math.floor(Math.random() * 50) + 3; 
        const sprites = [];
        
        for (let i = 0; i < numSprites; i++) {

          // Generar posición aleatoria dentro del radio
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (this.circleRadius * 0.6); 
          const spriteX = this.body.position.x + Math.cos(angle) * distance;
          const spriteY = this.body.position.y + Math.sin(angle) * distance;
          
          // Seleccionar sprite aleatorio (1, 2, o 3)
          const spriteNumber = Math.floor(Math.random() * 3) + 1;
          
          sprites.push({
            x: spriteX,
            y: spriteY,
            spriteNumber: spriteNumber,
            rotation: Math.random() * Math.PI * 2, 
            rotationSpeed: (Math.random() - 0.5) * 0.03, 
            scale: 0.5 + Math.random() * 5 
          });
        }
        
        gameState.persistentActions.push({
          type: 'chlorineCloud',
          centerX: this.body.position.x,
          centerY: this.body.position.y,
          radius: this.circleRadius,
          sprites: sprites,
          lifeTime: 300
        });

        // Destruir el enemigo después de explotar
        this.destroy();
      }
    }
  }
}
