import {
  payrollRepository,
  type PayrollRecordCreateParams,
  type PayrollRecordListParams,
} from "@/repositories/payroll.repository";

export type { PayrollRecordCreateParams, PayrollRecordListParams };

export const payrollService = {
  list(params: PayrollRecordListParams = {}) {
    return payrollRepository.list(params);
  },

  create(params: PayrollRecordCreateParams) {
    return payrollRepository.create(params);
  },

  delete(id: string) {
    return payrollRepository.delete(id);
  },
};
