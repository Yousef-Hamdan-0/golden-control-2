import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyRepairRequest } from "@/app/api/requests/request-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyRepairRequest(request, BACKEND_API_ENDPOINTS.requests.statusHistory(id));
}
