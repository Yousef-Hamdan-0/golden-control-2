import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyDashboardRequest } from "@/app/api/dashboard/dashboard-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyDashboardRequest(
    request,
    BACKEND_API_ENDPOINTS.dashboard.technicianPerformance.map(
      (url) => `${url}${search}`,
    ),
  );
}
