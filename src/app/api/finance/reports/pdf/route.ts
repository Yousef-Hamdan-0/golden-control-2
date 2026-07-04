import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyFinanceRequest } from "@/app/api/finance/finance-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyFinanceRequest(request, `${BACKEND_API_ENDPOINTS.finance.reportPdf}${search}`);
}
