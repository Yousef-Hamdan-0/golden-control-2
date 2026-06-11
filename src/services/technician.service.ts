import { technicianRepository } from "@/repositories/technician.repository";
import type { DailyInventoryCreateInput } from "@/models/technician/daily-inventory.model";

export const technicianService = {
  listDailyInventory(page: number, pageSize?: number) {
    return technicianRepository.listDailyInventory(page, pageSize);
  },
  createDailyInventory(input: DailyInventoryCreateInput) {
    return technicianRepository.createDailyInventory(input);
  },
  deleteDailyInventory(id: string) {
    return technicianRepository.deleteDailyInventory(id);
  },
};
