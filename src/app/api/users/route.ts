import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyUserRequest } from "@/app/api/users/user-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyUserRequest(request, `${BACKEND_API_ENDPOINTS.users.root}${search}`);
}

export async function POST(request: Request) {
  return proxyUserRequest(request, BACKEND_API_ENDPOINTS.users.root);
}
