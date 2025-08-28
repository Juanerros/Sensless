import { createQuimic } from './quimic.js';
import { createSpell } from './magic.js';
import { createBox } from './physics.js';
import { getSpriteByName } from './sprites.js';

const INVENTORY_SIZE = 9;

let inventory = {
  slots: [],
  selectedSlot: 0
};

export function initializeInventory() {
  inventory.slots = [null, null, null, null, null, null, null, null, null];
  inventory.selectedSlot = 0;

  inventory.slots[0] = { type: 'box', name: 'box' };
  inventory.slots[1] = { type: 'element', name: 'hidrogeno', index: 1 };
  inventory.slots[2] = { type: 'element', name: 'oxigeno', index: 2 };
}

export function addItemToInventory(item) {
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    if (inventory.slots[i] === null) {
      inventory.slots[i] = item;
      return true;
    }
  }
  return false;
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
  if (!selectedItem) return;

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
    }
  }
}