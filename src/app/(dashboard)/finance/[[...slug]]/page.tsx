import { FinanceScreen } from "@/features/operations/components/OperationsScreens";
import {
  ExpensesScreen,
  type ExpenseCategoryFilter,
} from "@/features/expenses";

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

  return <FinanceScreen section={slug} />;
}
