import Matter from "matter-js";
import { getBodies, removeFromWorld } from "./physics.js";
import { gameState } from "./state.js";
import { updateControls } from "./controls.js";
import { getSpriteByName } from "./sprites.js";
import { initializeInventory, drawInventoryUI, addItemToInventory } from "./inventory.js";
import { Vector2 } from "../utils/Vector2.js";

let player;
let world;
let playerHealth = 100;
let maxHealth = 100;

export function createPlayer(x, y, worldRef, p5Instance = null) {
  const playerWidth = 42;
  const playerHeight = 80;

  world = worldRef;

  player = Matter.Bodies.rectangle(x, y, playerWidth, playerHeight, {
    frictionAir: 0.02,
    friction: 0.1,
    density: 0.001,
    restitution: 0,
    inertia: Infinity
  });

  player.width = playerWidth;
  player.height = playerHeight;
  player.isPlayer = true;
  
  // Precargar sprite de muerte
  player.deadSprite = null;

  if (p5Instance) {

    p5Instance.loadImage('./sprites/zenithTakeDamage/dead.png', (img) => {
      player.deadSprite = img;
      
    });
  }
  player.label = "player";
  player.sprite = getSpriteByName('player');
  player.direction = 'right';
  player.health = playerHealth;
  player.maxHealth = maxHealth;
  player.isAlive = true;

  initializeInventory();

  // Se guarda en el estado global
  gameState.player = player;

  getBodies().push(player);
  Matter.World.add(world, player);
  return player;
}

//Funciones para manejar la vida:
//Funciones 
export function takeDamage(damage){

  if(!player || !player.isAlive) return false;
  //Esto resta la vida del jugador con el daño que recibe, y el Math.max Evita que el numero se vaya a negativo
  playerHealth = Math.max(0, playerHealth - damage);
  player.health = playerHealth;
  console.log(playerHealth);

  if(playerHealth <= 0){

    player.isAlive = false;
    console.log("Jugador ripeo");
    
    player.sprite = null; // Resetear sprite para forzar recarga
    
    gameState.isGameOver = true;
    
  }

  return playerHealth > 0;

}

//Funcion para el sistema de curacion
export function heal(amount){

  if(!player) return;
  //Esto suma la vida del jugador con la curacion y evita que se exeda de su vida maxima
  playerHealth = Math.min(maxHealth, playerHealth + amount);
  player.health = playerHealth;

};

//Funcion para devolver el estado de vida del jugador 
export function getPlayerHealth(){

  return {
    
    current: playerHealth, 
    max: maxHealth,
    isAlive: player?.isAlive || false

  };

}

export function updatePlayer(p) {
  if (!player) return;

  drawBorderBox(p);
  updateControls(player, getBodies);
  drawInventoryUI(p);
  grabObject();
}

function grabObject() {
  const bodies = getBodies();

  const spells = bodies.filter(body => body.label === 'spell')
  for (const spell of spells) {
    const distance = Vector2.distance(player.position, spell.position);
    if (distance < 50 && addItemToInventory({ type: 'spell', name: spell.name })) {
      removeFromWorld(spell);
    }
  }
}

function drawBorderBox(p) {
  p.noFill();
  p.stroke(0);
  p.rect(p.mouseX - 25, p.mouseY - 25, 50, 50);
}

export function drawPlayer(p) {
  if (!player) return;

  const pos = player.position;
  const angle = player.angle;

  p.push();
  p.translate(pos.x, pos.y);
  p.rotate(angle);
  if (player.direction === 'left') {
    p.scale(-1, 1);
  } else {
    p.scale(1, 1);
  }

  if (!player.isAlive) {
    // Usar sprite de muerte si está disponible
    if (player.deadSprite) {
      player.sprite = player.deadSprite;
    } else {
      return; // No dibujar si el sprite de muerte no está cargado
    }

  } else {
    player.sprite = getSpriteByName('player');
  }

  if (player.sprite && player.sprite.width > 0) {
    p.imageMode(p.CENTER);
    
    // Ajustar tamaño para sprite de muerte
    if (!player.isAlive && player.deadSprite) {

      // Calcular dimensiones proporcionales para el sprite de muerte
      const aspectRatio = player.deadSprite.height / player.deadSprite.width + 1;
      const deadWidth = player.width;
      const deadHeight = deadWidth * aspectRatio;
      p.image(player.sprite, 0, 0, deadWidth, deadHeight);

    } else {

      p.image(player.sprite, 0, 0, player.width, player.height);

    }
  } else {
    p.fill(0, 0, 0);
    p.rectMode(p.CENTER);
    // Validar dimensiones antes de dibujar
    if (player.width !== undefined && player.height !== undefined && 
        player.width > 0 && player.height > 0) {
      p.rect(0, 0, player.width, player.height);
    } else {
      console.log("Jugador con dimensiones inválidas:", {
        width: player.width,
        height: player.height
      });
    }
  }

  p.pop();
}

// Función para dibujar la barra de vida
export function drawHealthBar(p) {

  if (!player || !player.isAlive) return;
  
  const barWidth = 200;
  const barHeight = 20;
  const barX = 20;
  const barY = 100;
  
  // Calcular el porcentaje de vida
  const healthPercentage = playerHealth / maxHealth;
  
  // Dibujar el fondo de la barra (rojo)
  p.fill(255, 0, 0);
  p.noStroke();
  p.rectMode(p.CORNER);
  p.rect(barX, barY, barWidth, barHeight);
  
  // Dibujar la barra de vida (verde)
  p.fill(0, 255, 0);
  p.rect(barX, barY, barWidth * healthPercentage, barHeight);
  
  // Dibujar el borde de la barra
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight);
  
  // Mostrar texto de vida
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`${playerHealth}/${maxHealth}`, barX + barWidth + 10, barY + barHeight/2);
}

export function getPlayer() {
  return player;
}