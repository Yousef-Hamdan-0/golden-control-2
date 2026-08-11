import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInventoryRequest } from "@/app/api/inventory/inventory-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ technicianId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { technicianId } = await params;
  const search = new URL(request.url).search;
  return proxyInventoryRequest(
    request,
    `${BACKEND_API_ENDPOINTS.inventory.technicianSoldItems(technicianId)}${search}`,
  );
}
