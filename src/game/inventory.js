import { createQuimic } from './quimic.js';
import { createSpell } from './magic.js';
import { createBox } from './physics.js';
import { getSpriteByName } from './sprites.js';

const INVENTORY_SIZE = 9;

// Límites máximos por tipo de item
const MAX_QUANTITIES = {
  'box': 10,
  'element': 10,
  'spell': 1
};

let inventory = {
  slots: [],
  selectedSlot: 0
};

export function initializeInventory() {
  inventory.slots = [null, null, null, null, null, null, null, null, null];
  inventory.selectedSlot = 0;

  inventory.slots[0] = { type: 'box', name: 'box', quantity: 5 };
  inventory.slots[1] = { type: 'element', name: 'hidrogeno', index: 1, quantity: 2 };
  inventory.slots[2] = { type: 'element', name: 'oxigeno', index: 2, quantity: 1 };
}

export function addItemToInventory(item) {
  // Asegurar que el item tenga una cantidad (por defecto 1)
  if (!item.quantity) {
    item.quantity = 1;
  }

  const maxQuantity = MAX_QUANTITIES[item.type] || 1;

  // Primero, intentar apilar con items existentes del mismo tipo y nombre
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const slot = inventory.slots[i];
    if (slot && slot.type === item.type && slot.name === item.name) {
      const spaceAvailable = maxQuantity - slot.quantity;
      if (spaceAvailable > 0) {
        const amountToAdd = Math.min(spaceAvailable, item.quantity);
        slot.quantity += amountToAdd;
        item.quantity -= amountToAdd;
        
        // Si se agregó todo el item, retornar true
        if (item.quantity <= 0) {
          return true;
        }
      }
    }
  }

  // Si queda cantidad por agregar, buscar slots vacíos
  while (item.quantity > 0) {
    let emptySlotFound = false;
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      if (inventory.slots[i] === null) {
        const amountToAdd = Math.min(maxQuantity, item.quantity);
        inventory.slots[i] = {
          type: item.type,
          name: item.name,
          quantity: amountToAdd,
          ...(item.index !== undefined && { index: item.index }),
          ...(item.element !== undefined && { element: item.element })
        };
        item.quantity -= amountToAdd;
        emptySlotFound = true;
        break;
      }
    }
    
    // Si no se encontró slot vacío, no se puede agregar más
    if (!emptySlotFound) {
      return item.quantity <= 0;
    }
  }

  return true;
}

export function removeItemFromSlot(slotIndex) {
  if (slotIndex >= 0 && slotIndex < INVENTORY_SIZE) {
    inventory.slots[slotIndex] = null;
  }
}

export function selectInventorySlot(slotIndex) {
  if (slotIndex >= 0 && slotIndex < INVENTORY_SIZE) {
    inventory.selectedSlot = slotIndex;
  }
}

export function getSelectedSlot() {
  return inventory.selectedSlot;
}

export function getInventorySlots() {
  return inventory.slots;
}

export function getSelectedItem() {
  return inventory.slots[inventory.selectedSlot];
}

export function useSelectedItem(worldX, worldY) {
  const selectedItem = getSelectedItem();
  if (!selectedItem || selectedItem.quantity <= 0) return;

  switch (selectedItem.type) {
    case 'box':
      createBox(worldX, worldY);
      break;
    case 'element':
      createQuimic(worldX, worldY, selectedItem.name);
      break;
    case 'spell':
      createSpell(worldX, worldY, selectedItem.element);
      break;
  }

  // Decrementar la cantidad del item usado
  selectedItem.quantity--;
  
  // Si la cantidad llega a 0, remover el item del slot
  if (selectedItem.quantity <= 0) {
    inventory.slots[inventory.selectedSlot] = null;
  }
}

export function drawInventoryUI(p) {
  const slotSize = 50;
  const padding = 10;
  const startX = 20;
  const startY = 20;

  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const x = startX + i * (slotSize + padding);
    const y = startY;

    if (i === inventory.selectedSlot) {
      p.fill(0)
      p.strokeWeight(0)
      if (inventory?.slots[i]?.name) {
        p.textSize(18)
        p.text(inventory.slots[i].name, x + 10, y + 70);
      }
      p.fill(255, 255, 250, 200);
    } else {
      p.fill(250, 250, 250, 100);
    }

    p.stroke(255);
    p.strokeWeight(2);
    p.rect(x, y, slotSize, slotSize);

    p.fill(255);

    if (inventory.slots[i]) {
      const sprite = getSpriteByName(inventory.slots[i].name);
      if (sprite) {
        p.image(sprite, x + 7, y + 5, slotSize - 14, slotSize - 10);
      } else {
        p.fill(0);
      }

      // Mostrar la cantidad en la esquina inferior derecha del slot
      if (inventory.slots[i].quantity > 1) {
        p.fill(255, 255, 255);
        p.stroke(1);
        p.strokeWeight(1);
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.textSize(22);
        p.text(inventory.slots[i].quantity, x + slotSize - 5, y + slotSize - 5);
        p.textAlign(p.LEFT, p.BASELINE); // Resetear alineación
      }
    }
  }
}