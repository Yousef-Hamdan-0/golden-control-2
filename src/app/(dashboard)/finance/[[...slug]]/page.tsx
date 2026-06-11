import { FinanceScreen } from "@/features/operations/components/OperationsScreens";

export default function FinancePage({
  params,
}: {
  params: { slug?: string[] };
}) {
  return <FinanceScreen section={params.slug} />;
}
