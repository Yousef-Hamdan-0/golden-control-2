"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "@/config/constants";
import { queryKeys } from "@/hooks/query-keys";
import { inventoryService } from "@/services/inventory.service";
import type {
  DailyInventory,
  DailyInventoryCreateInput,
} from "@/models/technician/daily-inventory.model";
import type { InventoryDailyLog } from "@/models/inventory/inventory.model";

function toDailyInventory(log: InventoryDailyLog): DailyInventory {
  return {
    id: log.id,
    technicianId: log.technicianId,
    technicianName: log.technicianName,
    technicianPhone: log.technicianPhone,
    createdAt: log.createdAt,
    tools: log.toolsGiven,
    notes: log.notes,
    usedTools: log.usedParts.map((part) => ({ name: part.name, qty: part.quantity })),
  };
}

export function useDailyInventoryQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.inventory.daily({ page, pageSize: PAGE_SIZE }),
    queryFn: async () => {
      const result = await inventoryService.listDaily({ page, pageSize: PAGE_SIZE });
      return {
        items: result.items.map(toDailyInventory),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      };
    },
  });
}

export function useDailyInventoryAllQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.dailyAll(),
    queryFn: async () => {
      const firstPage = await inventoryService.listDaily({ page: 1, pageSize: PAGE_SIZE });
      const dailyById = new Map(firstPage.items.map((item) => [item.id, item]));
      const pages = Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize));

      for (let page = 2; page <= pages; page += 1) {
        const result = await inventoryService.listDaily({ page, pageSize: PAGE_SIZE });
        result.items.forEach((item) => dailyById.set(item.id, item));
      }

      const result = Array.from(dailyById.values());
      return {
        items: result.map(toDailyInventory),
        total: firstPage.total,
        page: 1,
        pageSize: result.length,
      };
    },
  });
}

export function useDailyInventoryMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.inventory.all });

  const create = useMutation({
    mutationFn: (input: DailyInventoryCreateInput) =>
      inventoryService.createDaily({
        technicianId: input.technicianId,
        toolsGiven: input.tools,
        notes: input.notes,
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => inventoryService.deleteDaily(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
