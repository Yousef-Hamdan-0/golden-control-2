import type { PayrollAdjustment, PayrollAdjustmentType } from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import type { User } from "@/models/auth/user.model";

/**
 * Settlement types that increase what an employee is owed. Every other type
 * (deduction, and "salary" which represents an advance already paid out)
 * reduces the monthly total — standard net-pay accounting.
 */
const POSITIVE_ADJUSTMENT_TYPES: readonly PayrollAdjustmentType[] = [
  "bonus",
  "overtime",
  "commission",
];

export function isPositiveAdjustment(type: PayrollAdjustmentType): boolean {
  return POSITIVE_ADJUSTMENT_TYPES.includes(type);
}

export function signedAdjustmentAmount(adjustment: PayrollAdjustment): number {
  return isPositiveAdjustment(adjustment.type) ? adjustment.amount : -adjustment.amount;
}

export interface MonthlyUserDue {
  user: User;
  settlements: PayrollAdjustment[];
  adjustmentsNet: number;
  totalDue: number;
}

/** One card's worth of data per user: base salary + this month's settlements. */
export function computeMonthlyDues(
  users: readonly User[],
  settlements: readonly PayrollAdjustment[],
): MonthlyUserDue[] {
  const settlementsByUser = new Map<string, PayrollAdjustment[]>();
  for (const settlement of settlements) {
    const list = settlementsByUser.get(settlement.userId);
    if (list) {
      list.push(settlement);
    } else {
      settlementsByUser.set(settlement.userId, [settlement]);
    }
  }

  return [...users]
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"))
    .map((user) => {
      const userSettlements = settlementsByUser.get(user.id) ?? [];
      const adjustmentsNet = userSettlements.reduce(
        (sum, settlement) => sum + signedAdjustmentAmount(settlement),
        0,
      );

      return {
        user,
        settlements: userSettlements,
        adjustmentsNet,
        totalDue: user.salary + adjustmentsNet,
      };
    });
}

export function sumMonthlyDues(dues: readonly MonthlyUserDue[]): number {
  return dues.reduce((sum, due) => sum + due.totalDue, 0);
}
