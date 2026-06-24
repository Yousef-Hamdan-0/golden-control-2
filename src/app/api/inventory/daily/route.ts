import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInventoryRequest } from "@/app/api/inventory/inventory-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.daily);
}

export async function POST(request: Request) {
  return proxyInventoryRequest(request, BACKEND_API_ENDPOINTS.inventory.daily);
}
