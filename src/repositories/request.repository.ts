import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import {
  requestAuthenticatedApi,
  requestAuthenticatedBlob,
  type AuthenticatedBlobResponse,
} from "@/helpers/authenticated-api.helper";
import {
  maybeNormalizeRepairRequestResponse,
  normalizeRepairRequestListResponse,
  normalizeRepairRequestResponse,
  normalizeStatusHistoryResponse,
  RepairRequestPayloadModel,
  RequestListQuerySchema,
  RequestRecordsInputSchema,
  type RepairRequest,
  type RepairRequestInput,
  type RepairRequestPatchInput,
  type RepairRequestPriority,
  type RepairRequestStatus,
  type RepairRequestStatusHistoryItem,
  type RepairRequestType,
  type RequestRecordsInput,
} from "@/models/requests/request.model";
import type { Paginated } from "@/repositories/user.repository";

export interface RequestListParams {
  status?: RepairRequestStatus | "all";
  priority?: RepairRequestPriority | "all";
  type?: RepairRequestType | "all";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

function listQuery(params: RequestListParams) {
  return RequestListQuerySchema.parse({
    status: params.status ?? "all",
    priority: params.priority ?? "all",
    type: params.type ?? "all",
    startDate: params.startDate?.trim() || undefined,
    endDate: params.endDate?.trim() || undefined,
    page: params.page ?? 1,
    limit: params.pageSize ?? PAGE_SIZE,
    search: params.search?.trim() || undefined,
  });
}

export const requestRepository = {
  async list(params: RequestListParams = {}): Promise<Paginated<RepairRequest>> {
    const query = listQuery(params);
    const searchParams = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });

    if (query.status !== "all") searchParams.set("status", query.status);
    if (query.priority !== "all") searchParams.set("priority", query.priority);
    if (query.type !== "all") searchParams.set("type", query.type);
    if (query.startDate) searchParams.set("startDate", query.startDate);
    if (query.endDate) searchParams.set("endDate", query.endDate);
    if (query.search) searchParams.set("search", query.search);

    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.requests.root}?${searchParams}`,
      { method: "GET" },
    );
    const result = normalizeRepairRequestListResponse(payload, query);

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
    };
  },

  async getById(id: string): Promise<RepairRequest> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.requests.byId(id), {
      method: "GET",
    });
    return normalizeRepairRequestResponse(payload);
  },

  async create(input: RepairRequestInput): Promise<RepairRequest | null> {
    const body = new RepairRequestPayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.requests.root, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return maybeNormalizeRepairRequestResponse(payload);
  },

  async update(id: string, input: RepairRequestPatchInput): Promise<RepairRequest | null> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.requests.byId(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return maybeNormalizeRepairRequestResponse(payload);
  },

  async downloadReceipt(id: string): Promise<AuthenticatedBlobResponse> {
    return requestAuthenticatedBlob(API_ENDPOINTS.requests.pdf(id), {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });
  },

  async listStatusHistory(id: string): Promise<RepairRequestStatusHistoryItem[]> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.requests.statusHistory(id), {
      method: "GET",
    });
    return normalizeStatusHistoryResponse(payload);
  },

  async uploadRecords(input: RequestRecordsInput): Promise<void> {
    const body = RequestRecordsInputSchema.parse(input);
    await requestAuthenticatedApi(API_ENDPOINTS.requests.records, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
