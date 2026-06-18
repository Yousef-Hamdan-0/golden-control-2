import type { TechnicianDailyPerformance } from "@/features/performance/models/performance.model";

export const PERFORMANCE_REPORT_DATE = "2026-06-18";

export const DAILY_TECHNICIAN_PERFORMANCE = [
  {
    id: "TEC-01",
    name: "رامي سمير",
    orders: [
      {
        id: "ORD-5621",
        status: "completed",
        maintenanceHours: 2.5,
        completionHours: 3,
        startTime: "08:00",
        endTime: "11:00",
        revenue: { syp: 650_000, usd: 45 },
      },
      {
        id: "ORD-5624",
        status: "active",
        maintenanceHours: 1.5,
        completionHours: null,
        startTime: "12:30",
        endTime: null,
        revenue: { syp: 0, usd: 0 },
      },
      {
        id: "ORD-5618",
        status: "returned",
        maintenanceHours: 3,
        completionHours: 4.5,
        startTime: "07:15",
        endTime: "11:45",
        revenue: { syp: 180_000, usd: 12 },
      },
    ],
  },
  {
    id: "TEC-02",
    name: "هاني خالد",
    orders: [
      {
        id: "ORD-5620",
        status: "completed",
        maintenanceHours: 1.75,
        completionHours: 2.25,
        startTime: "09:10",
        endTime: "11:25",
        revenue: { syp: 420_000, usd: 28 },
      },
      {
        id: "ORD-5619",
        status: "incomplete",
        maintenanceHours: 4.25,
        completionHours: 5,
        startTime: "08:20",
        endTime: "13:20",
        revenue: { syp: 250_000, usd: 16 },
      },
      {
        id: "ORD-5625",
        status: "active",
        maintenanceHours: 0.75,
        completionHours: null,
        startTime: "14:00",
        endTime: null,
        revenue: { syp: 0, usd: 0 },
      },
    ],
  },
  {
    id: "TEC-03",
    name: "نور حمزة",
    orders: [
      {
        id: "ORD-5617",
        status: "completed",
        maintenanceHours: 3.5,
        completionHours: 4,
        startTime: "07:45",
        endTime: "11:45",
        revenue: { syp: 720_000, usd: 48 },
      },
      {
        id: "ORD-5616",
        status: "incomplete",
        maintenanceHours: 2,
        completionHours: 2.75,
        startTime: "10:30",
        endTime: "13:15",
        revenue: { syp: 160_000, usd: 10 },
      },
      {
        id: "ORD-5615",
        status: "returned",
        maintenanceHours: 5,
        completionHours: 6,
        startTime: "07:00",
        endTime: "13:00",
        revenue: { syp: 310_000, usd: 20 },
      },
      {
        id: "ORD-5614",
        status: "completed",
        maintenanceHours: 1.5,
        completionHours: 2,
        startTime: "13:30",
        endTime: "15:30",
        revenue: { syp: 380_000, usd: 25 },
      },
    ],
  },
] as const satisfies readonly TechnicianDailyPerformance[];
