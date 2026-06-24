import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInventoryRequest } from "@/app/api/inventory/inventory-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyInventoryRequest(request, `${BACKEND_API_ENDPOINTS.inventory.movements}${search}`);
}

export async function POST(request: Request) {
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.movements);
}
