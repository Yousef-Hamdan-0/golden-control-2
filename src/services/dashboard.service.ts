import {
  dashboardRepository,
  type TechnicianPerformanceParams,
} from "@/repositories/dashboard.repository";
import type { AuthenticatedBlobResponse } from "@/helpers/authenticated-api.helper";
import type {
  DashboardStats,
  DashboardTechnicianPerformance,
} from "@/models/dashboard/dashboard.model";

export const dashboardService = {
  stats(): Promise<DashboardStats> {
    return dashboardRepository.stats();
  },

  technicianPerformance(
    params?: TechnicianPerformanceParams,
  ): Promise<DashboardTechnicianPerformance> {
    return dashboardRepository.technicianPerformance(params);
  },

  downloadFinancialReport(format: string): Promise<AuthenticatedBlobResponse> {
    return dashboardRepository.downloadFinancialReport(format);
  },
};
