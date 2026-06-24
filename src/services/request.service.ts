import {
  requestRepository,
  type RequestListParams,
} from "@/repositories/request.repository";
import type { AuthenticatedBlobResponse } from "@/helpers/authenticated-api.helper";
import type { Paginated } from "@/repositories/user.repository";
import type {
  RepairRequest,
  RepairRequestInput,
  RepairRequestStatusHistoryItem,
  RequestRecordsInput,
} from "@/models/requests/request.model";

export const requestService = {
  list(params: RequestListParams): Promise<Paginated<RepairRequest>> {
    return requestRepository.list(params);
  },

  getById(id: string): Promise<RepairRequest> {
    return requestRepository.getById(id);
  },

  create(input: RepairRequestInput): Promise<RepairRequest | null> {
    return requestRepository.create(input);
  },

  update(id: string, input: RepairRequestInput): Promise<RepairRequest | null> {
    return requestRepository.update(id, input);
  },

  downloadReceipt(id: string): Promise<AuthenticatedBlobResponse> {
    return requestRepository.downloadReceipt(id);
  },

  listStatusHistory(id: string): Promise<RepairRequestStatusHistoryItem[]> {
    return requestRepository.listStatusHistory(id);
  },

  uploadRecords(input: RequestRecordsInput): Promise<void> {
    return requestRepository.uploadRecords(input);
  },
};
