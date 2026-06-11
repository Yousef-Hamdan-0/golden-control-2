import { InventoryScreen } from "@/features/operations/components/OperationsScreens";

export default async function InventoryPage({
  params,
}: {
  params: any;
}) {
  const { slug } = (await params) as { slug?: string[] };
  return <InventoryScreen section={slug?.[0]} />;
}
