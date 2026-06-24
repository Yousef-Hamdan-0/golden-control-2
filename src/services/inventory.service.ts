import {
  inventoryRepository,
  type InventoryDailyListParams,
  type InventoryPartListParams,
} from "@/repositories/inventory.repository";
import type {
  InventoryDailyCreateInput,
  InventoryMovementInput,
  InventoryPartInput,
} from "@/models/inventory/inventory.model";

export const inventoryService = {
  listDaily(params: InventoryDailyListParams = {}) {
    return inventoryRepository.listDaily(params);
  },

  createDaily(input: InventoryDailyCreateInput) {
    return inventoryRepository.createDaily(input);
  },

  deleteDaily(id: string) {
    return inventoryRepository.deleteDaily(id);
  },

  listParts(params: InventoryPartListParams = {}) {
    return inventoryRepository.listParts(params);
  },

  getPartById(id: string) {
    return inventoryRepository.getPartById(id);
  },

  createPart(input: InventoryPartInput) {
    return inventoryRepository.createPart(input);
  },

  updatePart(id: string, input: InventoryPartInput) {
    return inventoryRepository.updatePart(id, input);
  },

  deletePart(id: string) {
    return inventoryRepository.deletePart(id);
  },

  listMovements() {
    return inventoryRepository.listMovements();
  },

  createMovement(input: InventoryMovementInput) {
    return inventoryRepository.createMovement(input);
  },
};
