import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import {
  PayrollRecordListQuerySchema,
  PayrollRecordPayloadModel,
  normalizePayrollRecord,
  normalizePayrollRecordListResponse,
  type PayrollAdjustmentFilter,
  type PayrollAdjustment,
  type PayrollAdjustmentInput,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";

export interface PayrollRecordListParams {
  page?: number;
  pageSize?: number;
  type?: PayrollAdjustmentFilter;
  year?: number;
  month?: number;
  search?: string;
}

export interface PayrollRecordCreateParams {
  input: PayrollAdjustmentInput;
  month: string;
}

function listQuery(params: PayrollRecordListParams) {
  return PayrollRecordListQuerySchema.parse({
    page: params.page ?? 1,
    limit: params.pageSize ?? PAGE_SIZE,
    type: params.type ?? "all",
    year: params.year,
    month: params.month,
    search: params.search,
  });
}

export const payrollRepository = {
  async list(params: PayrollRecordListParams = {}) {
    const query = listQuery(params);
    const searchParams = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.type && query.type !== "all") searchParams.set("type", query.type);
    if (query.year) searchParams.set("year", String(query.year));
    if (query.month) searchParams.set("month", String(query.month));
    if (query.search) searchParams.set("search", query.search);
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.payrollRecords.root}?${searchParams}`,
      { method: "GET" },
    );

    return normalizePayrollRecordListResponse(payload, query);
  },

  async create({ input, month }: PayrollRecordCreateParams): Promise<PayrollAdjustment> {
    const body = new PayrollRecordPayloadModel(input, month).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.payrollRecords.root, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return normalizePayrollRecord(payload);
  },

  async delete(id: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.payrollRecords.byId(id), {
      method: "DELETE",
    });
  },
};
