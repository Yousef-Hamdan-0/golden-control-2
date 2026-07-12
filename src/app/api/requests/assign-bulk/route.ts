import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyRepairRequest } from "@/app/api/requests/request-proxy.helper";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyRepairRequest(request, BACKEND_API_ENDPOINTS.requests.assignBulk);
}
