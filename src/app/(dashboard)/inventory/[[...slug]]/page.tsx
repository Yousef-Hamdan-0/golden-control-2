import { InventoryScreen } from "@/features/operations/components/OperationsScreens";

export default function InventoryPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  return <InventoryScreen section={params.slug?.[0]} />;
}
