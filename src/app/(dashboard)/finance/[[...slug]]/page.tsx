import { FinanceScreen } from "@/features/operations/components/OperationsScreens";
import {
  ExpensesScreen,
  type ExpenseCategoryFilter,
} from "@/features/expenses";
import { PayrollAdjustmentsScreen } from "@/features/payroll-adjustments";
import { MonthlyDuesScreen } from "@/features/monthly-dues";
import { SalesProfitsScreen } from "@/features/operations/components/finance/SalesProfitsScreen";
import { redirect } from "next/navigation";

export default async function FinancePage({
  params,
}: {
  params: any;
}) {
  const { slug } = (await params) as { slug?: string[] };

  if (slug?.[0] === "expenses") {
    const initialCategory: ExpenseCategoryFilter =
      slug[1] === "fixed" || slug[1] === "variable" ? slug[1] : "all";

    return <ExpensesScreen initialCategory={initialCategory} />;
  }

  if (slug?.[0] === "payroll-adjustments") {
    return <PayrollAdjustmentsScreen />;
  }

  if (slug?.[0] === "monthly-dues") {
    return <MonthlyDuesScreen />;
  }

  if (
    slug?.[0] === "sales" ||
    slug?.[0] === "profits" ||
    slug?.[0] === "sales-profits"
  ) {
    return <SalesProfitsScreen />;
  }

  if (slug?.[0] === "reports") {
    const legacyReportRoutes: Record<string, string> = {
      maintenance: "orders",
      technicians: "technicians",
      inventory: "inventory-movements",
      financial: "financial",
    };
    redirect(`/reports/${legacyReportRoutes[slug[1]] ?? "orders"}`);
  }

  return <FinanceScreen section={slug} />;
}
