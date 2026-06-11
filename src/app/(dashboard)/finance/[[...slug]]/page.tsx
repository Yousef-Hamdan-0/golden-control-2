import { FinanceScreen } from "@/features/operations/components/OperationsScreens";

export default async function FinancePage({
  params,
}: {
  params: any;
}) {
  const { slug } = (await params) as { slug?: string[] };
  return <FinanceScreen section={slug} />;
}
