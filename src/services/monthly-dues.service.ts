import {
  monthlyDuesRepository,
  type MonthlyDuesParams,
} from "@/repositories/monthly-dues.repository";
import type {
  MonthlyDuesArrestResult,
  MonthlyDuesResult,
} from "@/features/monthly-dues/models/monthly-dues.model";

export type { MonthlyDuesParams, MonthlyDuesArrestResult, MonthlyDuesResult };

export const monthlyDuesService = {
  list(params: MonthlyDuesParams): Promise<MonthlyDuesResult> {
    return monthlyDuesRepository.list(params);
  },

  arrest(id: string): Promise<MonthlyDuesArrestResult> {
    return monthlyDuesRepository.arrest(id);
  },
};
