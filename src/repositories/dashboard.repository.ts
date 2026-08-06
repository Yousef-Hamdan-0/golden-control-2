import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  requestAuthenticatedApi,
  requestAuthenticatedBlob,
  type AuthenticatedBlobResponse,
} from "@/helpers/authenticated-api.helper";
import {
  normalizeDashboardStatsResponse,
  normalizeDashboardTechnicianPerformanceResponse,
  type DashboardStats,
  type DashboardTechnicianPerformance,
} from "@/models/dashboard/dashboard.model";

export interface TechnicianPerformanceParams {
  year: number;
  month: number;
  /** Omitted to cover the whole month. */
  day?: number;
}

export const dashboardRepository = {
  async stats(): Promise<DashboardStats> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.dashboard.stats, {
      method: "GET",
    });
    return normalizeDashboardStatsResponse(payload);
  },

  async technicianPerformance(
    params?: TechnicianPerformanceParams,
  ): Promise<DashboardTechnicianPerformance> {
    const search = new URLSearchParams();
    if (params) {
      search.set("year", String(params.year));
      search.set("month", String(params.month));
      if (params.day) search.set("day", String(params.day));
    }
    const query = search.toString();
    const payload = await requestAuthenticatedApi(
      query
        ? `${API_ENDPOINTS.dashboard.technicianPerformance}?${query}`
        : API_ENDPOINTS.dashboard.technicianPerformance,
      { method: "GET" },
    );
    return normalizeDashboardTechnicianPerformanceResponse(payload);
  },

  async downloadFinancialReport(format: string): Promise<AuthenticatedBlobResponse> {
    return requestAuthenticatedBlob(API_ENDPOINTS.dashboard.financialReport(format), {
      method: "GET",
      headers: {
        Accept: format.toLowerCase() === "pdf" ? "application/pdf" : "*/*",
      },
    });
  },
};
