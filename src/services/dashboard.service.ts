import {
  dashboardRepository,
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

  technicianPerformance(): Promise<DashboardTechnicianPerformance> {
    return dashboardRepository.technicianPerformance();
  },

  downloadFinancialReport(format: string): Promise<AuthenticatedBlobResponse> {
    return dashboardRepository.downloadFinancialReport(format);
  },
};
