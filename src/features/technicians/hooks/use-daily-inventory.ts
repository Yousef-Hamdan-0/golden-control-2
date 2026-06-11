"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { queryKeys } from "@/hooks/query-keys";
import type { DailyInventoryCreateInput } from "@/models/technician/daily-inventory.model";

export function useDailyInventoryQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.technicians.inventory(page),
    queryFn: () => technicianService.listDailyInventory(page),
  });
}

export function useDailyInventoryMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.technicians.all });

  const create = useMutation({
    mutationFn: (input: DailyInventoryCreateInput) =>
      technicianService.createDailyInventory(input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => technicianService.deleteDailyInventory(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
