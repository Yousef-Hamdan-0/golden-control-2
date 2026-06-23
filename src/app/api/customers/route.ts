import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyCustomerRequest } from "@/app/api/customers/customer-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyCustomerRequest(request, `${BACKEND_API_ENDPOINTS.customers.root}${search}`);
}

export async function POST(request: Request) {
  return proxyCustomerRequest(request, BACKEND_API_ENDPOINTS.customers.root);
}
