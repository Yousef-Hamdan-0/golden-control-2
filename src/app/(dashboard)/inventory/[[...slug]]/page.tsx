import { notFound } from "next/navigation";
import { InventoryScreen } from "@/features/operations/components/OperationsScreens";

export default async function InventoryPage({
  params,
}: {
  params: any;
}) {
  const { slug } = (await params) as { slug?: string[] };
  if (slug?.[0] === "alerts") notFound();
  return <InventoryScreen section={slug?.[0]} />;
}
