import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInventoryRequest } from "@/app/api/inventory/inventory-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.partById(id));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.partById(id));
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.partById(id));
}
