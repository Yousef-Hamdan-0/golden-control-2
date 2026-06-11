import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { DashboardOverviewScreen } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "لوحة التحكم | مركز الصيانة الذهبي",
};

export default function DashboardPage() {
  return (
    <Shell>
      <DashboardOverviewScreen />
    </Shell>
  );
}
