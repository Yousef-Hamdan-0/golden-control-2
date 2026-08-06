"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { technicianCustodyService } from "@/services/technician-custody.service";
import type {
  CustodyPartsInput,
  WalletMovementInput,
} from "@/models/technician/custody.model";

export function useTechnicianCustodyQuery(technicianId: string) {
  return useQuery({
    queryKey: queryKeys.technicians.custody(technicianId),
    queryFn: () => technicianCustodyService.get(technicianId),
    enabled: Boolean(technicianId),
  });
}

export function useWalletMovementsQuery(technicianId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.technicians.walletMovements(technicianId, page),
    queryFn: () => technicianCustodyService.listWalletMovements(technicianId, { page }),
    placeholderData: keepPreviousData,
  });
}

export function usePartMovementsQuery(technicianId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.technicians.partMovements(technicianId, page),
    queryFn: () => technicianCustodyService.listPartMovements(technicianId, { page }),
    placeholderData: keepPreviousData,
  });
}

export function useTechnicianCustodyMutations() {
  const qc = useQueryClient();
  const invalidateCustody = () =>
    qc.invalidateQueries({ queryKey: queryKeys.technicians.all });

  const updateWallet = useMutation({
    mutationFn: ({
      technicianId,
      input,
    }: {
      technicianId: string;
      input: WalletMovementInput;
    }) => technicianCustodyService.createWalletMovement(technicianId, input),
    onSuccess: invalidateCustody,
  });

  const updateParts = useMutation({
    mutationFn: ({
      technicianId,
      input,
    }: {
      technicianId: string;
      input: CustodyPartsInput;
    }) => technicianCustodyService.updateParts(technicianId, input),
    onSuccess: invalidateCustody,
  });

  const updateTools = useMutation({
    mutationFn: ({ technicianId, tools }: { technicianId: string; tools: string }) =>
      technicianCustodyService.updateTools(technicianId, tools),
    onSuccess: invalidateCustody,
  });

  return { updateWallet, updateParts, updateTools };
}
