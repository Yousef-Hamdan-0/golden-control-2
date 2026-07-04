import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyFinanceRequest } from "@/app/api/finance/finance-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyFinanceRequest(request, BACKEND_API_ENDPOINTS.finance.expenseById(id));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyFinanceRequest(request, BACKEND_API_ENDPOINTS.finance.expenseById(id));
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyFinanceRequest(request, BACKEND_API_ENDPOINTS.finance.expenseById(id));
}
