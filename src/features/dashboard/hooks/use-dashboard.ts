"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { dashboardService } from "@/services/dashboard.service";
import type { TechnicianPerformanceParams } from "@/repositories/dashboard.repository";

const DASHBOARD_STALE_MS = 30_000;

export function useDashboardStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.stats(),
    enabled,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: DASHBOARD_STALE_MS,
  });
}

export function useDashboardTechnicianPerformanceQuery(
  params?: TechnicianPerformanceParams,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.dashboard.technicianPerformance(params),
    queryFn: () => dashboardService.technicianPerformance(params),
    enabled,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: DASHBOARD_STALE_MS,
  });
}
