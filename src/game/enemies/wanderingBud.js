import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";

export class WanderingBud extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 300; // Radio de detección para perseguir
    this.circleRadius = 150;    // Radio para dibujar el círculo
    this.speed = 0.005;
    this.health = 50;
    this.name = 'olvido';
    
  }

  draw(p) {
    // Dibuja el enemigo base
    super.draw(p);

    // Obtiene el jugador
    const player = gameState.player;
    if (!player) return;

    // Calcula la distancia al jugador
    const dx = player.position.x - this.body.position.x;
    const dy = player.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Si el jugador está dentro del radio del círculo, dibuja un círculo rojo
    if (dist < this.circleRadius) {

      this.drawCircle(p);

    }
  }

  drawCircle(p){

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
    // Método base, puede ser sobrescrito por los hijos
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
    
    // Si el jugador está dentro del círculo, aplicar una fuerza de repulsión
    if (dist < this.circleRadius) {
      // Calcular el ángulo desde el jugador hacia el enemigo (dirección opuesta)
      const angle = Math.atan2(dy, dx);
      // Crear una fuerza para empujar al jugador hacia afuera
      const repulsionForce = 0.7; 
      const forceX = Math.cos(angle) * repulsionForce;
      const forceY = Math.sin(angle) * repulsionForce;
      
      // Aplicar la fuerza al jugador para alejarlo
      Matter.Body.applyForce(player, player.position, { x: forceX, y: forceY });

      if(!this.playerInCircle){

        this.playerInCircle = true;

        //generar el ciculo cuando muere
        gameState.persistentActions.push({

          x: this.body.position.x,
          y: this.body.position.y,
          radius: this.circleRadius,
          lifeTime: 300

        })

        //Aplicar daño
        this.takeDamage(this.health);

      }
    }
  }
}
