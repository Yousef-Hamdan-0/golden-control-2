import type { PayrollAdjustment } from "@/features/payroll-adjustments/models/payroll-adjustment.model";

export const DEFAULT_PAYROLL_MONTH = "2026-06";

export const INITIAL_PAYROLL_ADJUSTMENTS: readonly PayrollAdjustment[] = [
  {
    id: "PAY-1009",
    userId: "#USR-723",
    type: "advance",
    amount: 1_500_000,
    note: "سلفة شخصية",
    date: "2026-06-18",
  },
  {
    id: "PAY-1008",
    userId: "#USR-612",
    type: "deduction",
    amount: 200_000,
    note: "عهدة أدوات ناقصة",
    date: "2026-06-16",
  },
  {
    id: "PAY-1007",
    userId: "#USR-481",
    type: "increase",
    amount: 450_000,
    note: "مكافأة أداء",
    date: "2026-06-14",
  },
  {
    id: "PAY-1006",
    userId: "#USR-555",
    type: "advance",
    amount: 1_000_000,
    note: "",
    date: "2026-06-12",
  },
  {
    id: "PAY-1005",
    userId: "#USR-902",
    type: "increase",
    amount: 750_000,
    note: "بدل مسؤولية",
    date: "2026-06-10",
  },
  {
    id: "PAY-1004",
    userId: "#USR-841",
    type: "deduction",
    amount: 300_000,
    note: "تسوية دوام",
    date: "2026-06-08",
  },
  {
    id: "PAY-1003",
    userId: "#USR-612",
    type: "advance",
    amount: 600_000,
    note: "سلفة طارئة",
    date: "2026-06-05",
  },
  {
    id: "PAY-1002",
    userId: "#USR-555",
    type: "increase",
    amount: 400_000,
    note: "مكافأة شهرية",
    date: "2026-05-20",
  },
  {
    id: "PAY-1001",
    userId: "#USR-723",
    type: "advance",
    amount: 900_000,
    note: "",
    date: "2026-05-08",
  },
];
