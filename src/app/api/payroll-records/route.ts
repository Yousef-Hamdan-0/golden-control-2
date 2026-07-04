import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyPayrollRequest } from "@/app/api/payroll-records/payroll-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyPayrollRequest(request, `${BACKEND_API_ENDPOINTS.payrollRecords.root}${search}`);
}

export async function POST(request: Request) {
  return proxyPayrollRequest(request, BACKEND_API_ENDPOINTS.payrollRecords.root);
}
