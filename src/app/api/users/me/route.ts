import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyUserRequest } from "@/app/api/users/user-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyUserRequest(request, BACKEND_API_ENDPOINTS.users.me);
}
