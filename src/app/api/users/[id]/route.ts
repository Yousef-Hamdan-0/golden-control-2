import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyUserRequest } from "@/app/api/users/user-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyUserRequest(request, BACKEND_API_ENDPOINTS.users.byId(id));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyUserRequest(request, BACKEND_API_ENDPOINTS.users.byId(id));
}
