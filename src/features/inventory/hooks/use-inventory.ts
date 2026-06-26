"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { inventoryService } from "@/services/inventory.service";
import type {
  InventoryDailyCreateInput,
  InventoryMovementInput,
  InventoryPartInput,
} from "@/models/inventory/inventory.model";
import type {
  InventoryDailyListParams,
  InventoryPartListParams,
} from "@/repositories/inventory.repository";

export function useInventoryDailyQuery(params: InventoryDailyListParams = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.daily(params),
    queryFn: () => inventoryService.listDaily(params),
  });
}

export function useInventoryPartsQuery(params: InventoryPartListParams = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.parts(params),
    queryFn: () => inventoryService.listParts(params),
  });
}

export function useInventoryAllPartsQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.partsAll(),
    queryFn: () => inventoryService.listAllParts(),
  });
}

export function useInventoryMovementsQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.movements(),
    queryFn: () => inventoryService.listMovements(),
  });
}

export function useInventoryMutations() {
  const qc = useQueryClient();
  const invalidateInventory = () => qc.invalidateQueries({ queryKey: queryKeys.inventory.all });

  const createDaily = useMutation({
    mutationFn: (input: InventoryDailyCreateInput) => inventoryService.createDaily(input),
    onSuccess: invalidateInventory,
  });

  const deleteDaily = useMutation({
    mutationFn: (id: string) => inventoryService.deleteDaily(id),
    onSuccess: invalidateInventory,
  });

  const createPart = useMutation({
    mutationFn: (input: InventoryPartInput) => inventoryService.createPart(input),
    onSuccess: invalidateInventory,
  });

  const updatePart = useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryPartInput }) =>
      inventoryService.updatePart(id, input),
    onSuccess: invalidateInventory,
  });

  const deletePart = useMutation({
    mutationFn: (id: string) => inventoryService.deletePart(id),
    onSuccess: invalidateInventory,
  });

  const createMovement = useMutation({
    mutationFn: (input: InventoryMovementInput) => inventoryService.createMovement(input),
    onSuccess: invalidateInventory,
  });

  return {
    createDaily,
    deleteDaily,
    createPart,
    updatePart,
    deletePart,
    createMovement,
  };
}
