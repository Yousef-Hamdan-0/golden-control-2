import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyDashboardRequest } from "@/app/api/dashboard/dashboard-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyDashboardRequest(request, BACKEND_API_ENDPOINTS.dashboard.stats);
}
