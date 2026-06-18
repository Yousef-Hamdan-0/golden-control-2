import type { Metadata } from "next";
import { DailyPerformanceScreen } from "@/features/performance";

export const metadata: Metadata = {
  title: "الأداء | مركز الصيانة الذهبي",
};

export default function TechnicianPerformancePage() {
  return <DailyPerformanceScreen />;
}
