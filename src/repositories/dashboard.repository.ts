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

export const dashboardRepository = {
  async stats(): Promise<DashboardStats> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.dashboard.stats, {
      method: "GET",
    });
    return normalizeDashboardStatsResponse(payload);
  },

  async technicianPerformance(): Promise<DashboardTechnicianPerformance> {
    const payload = await requestAuthenticatedApi(
      API_ENDPOINTS.dashboard.technicianPerformance,
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
