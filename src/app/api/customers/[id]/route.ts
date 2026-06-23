import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyCustomerRequest } from "@/app/api/customers/customer-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyCustomerRequest(request, BACKEND_API_ENDPOINTS.customers.byId(id));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyCustomerRequest(request, BACKEND_API_ENDPOINTS.customers.byId(id));
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyCustomerRequest(request, BACKEND_API_ENDPOINTS.customers.byId(id));
}
