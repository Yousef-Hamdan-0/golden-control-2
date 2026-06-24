import {
  DailyInventorySchema,
  type DailyInventory,
  type DailyInventoryCreateInput,
} from "@/models/technician/daily-inventory.model";
import { MOCK_DAILY_INVENTORY } from "@/mocks/daily-inventory.mock";
import { MOCK_USERS } from "@/mocks/users.mock";
import type { Paginated } from "@/repositories/user.repository";
import { PAGE_SIZE } from "@/config/constants";

/** MOCK repository — replace bodies with Axios + Zod parse to go live. */

let store: DailyInventory[] = [...MOCK_DAILY_INVENTORY];

const latency = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const technicianRepository = {
  async listDailyInventory(
    page = 1,
    pageSize = PAGE_SIZE,
  ): Promise<Paginated<DailyInventory>> {
    const total = store.length;
    const start = (page - 1) * pageSize;
    const items = store
      .slice(start, start + pageSize)
      .map((d) => DailyInventorySchema.parse(d));
    return latency({ items, total, page, pageSize });
  },

  async createDailyInventory(input: DailyInventoryCreateInput): Promise<DailyInventory> {
    const tech = MOCK_USERS.find((u) => u.id === input.technicianId);
    const entry: DailyInventory = {
      id: `INV-${Math.floor(2000 + Math.random() * 8000)}`,
      technicianId: input.technicianId,
      technicianName: tech?.fullName ?? "فني",
      technicianPhone: tech?.phone ?? "",
      createdAt: new Date().toISOString(),
      tools: input.tools,
      notes: input.notes,
      usedTools: [],
    };
    store = [entry, ...store];
    return latency(DailyInventorySchema.parse(entry));
  },

  async deleteDailyInventory(id: string): Promise<{ id: string }> {
    store = store.filter((d) => d.id !== id);
    return latency({ id });
  },
};
