"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { requestService } from "@/services/request.service";
import type { RequestListParams } from "@/repositories/request.repository";
import type {
  RepairRequestInput,
  RequestRecordsInput,
} from "@/models/requests/request.model";

export function useRequestsQuery(params: RequestListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => requestService.list(params),
    enabled,
  });
}

export function useRequestQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id ?? ""),
    queryFn: () => requestService.getById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useRequestStatusHistoryQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.statusHistory(id ?? ""),
    queryFn: () => requestService.listStatusHistory(id ?? ""),
    enabled: Boolean(id) && enabled,
  });
}

export function useRequestMutations() {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: queryKeys.requests.all });

  const create = useMutation({
    mutationFn: (input: RepairRequestInput) => requestService.create(input),
    onSuccess: invalidateList,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RepairRequestInput }) =>
      requestService.update(id, input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.requests.detail(vars.id) }),
        qc.invalidateQueries({ queryKey: queryKeys.requests.statusHistory(vars.id) }),
        invalidateList(),
      ]);
    },
  });

  const uploadRecords = useMutation({
    mutationFn: ({ input }: { input: RequestRecordsInput; requestId?: string }) =>
      requestService.uploadRecords(input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.requests.all }),
        qc.invalidateQueries({
          queryKey: queryKeys.requests.detail(vars.requestId ?? vars.input.requestNumber),
        }),
      ]);
    },
  });

  return { create, update, uploadRecords };
}
