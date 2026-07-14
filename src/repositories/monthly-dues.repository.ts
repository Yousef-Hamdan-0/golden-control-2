import { API_ENDPOINTS } from "@/config/api-endpoints";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import {
  normalizeMonthlyDuesArrestResponse,
  normalizeMonthlyDuesResponse,
  type MonthlyDuesArrestResult,
  type MonthlyDuesResult,
} from "@/features/monthly-dues/models/monthly-dues.model";

export interface MonthlyDuesParams {
  year: number;
  month: number;
}

export const monthlyDuesRepository = {
  async list(params: MonthlyDuesParams): Promise<MonthlyDuesResult> {
    const searchParams = new URLSearchParams({
      year: String(params.year),
      month: String(params.month),
    });
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.finance.monthlyDues}?${searchParams}`,
      { method: "GET" },
    );

    return normalizeMonthlyDuesResponse(payload);
  },

  async arrest(id: string): Promise<MonthlyDuesArrestResult> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.finance.monthlyDuesArrest(id), {
      method: "PATCH",
    });

    return normalizeMonthlyDuesArrestResponse(payload);
  },
};
