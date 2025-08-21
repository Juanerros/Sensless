import Matter from "matter-js";
import { Enemy } from "./enemy";
import { gameState } from "../state";

export class WanderingBud extends Enemy {
  constructor(x, y, world) {
    super(x, y, 40, 60, world);
    this.detectionRadius = 300; // Radio de detección para perseguir
    this.circleRadius = 150;    // Radio para dibujar el círculo
    this.speed = 0.005;
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
      p.push();
      p.noFill();
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.circle(this.body.position.x, this.body.position.y, this.circleRadius * 2);
      p.pop();
    }
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
  }
}
