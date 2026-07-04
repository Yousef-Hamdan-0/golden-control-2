import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyPayrollRequest } from "@/app/api/payroll-records/payroll-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyPayrollRequest(request, BACKEND_API_ENDPOINTS.payrollRecords.byId(id));
}
