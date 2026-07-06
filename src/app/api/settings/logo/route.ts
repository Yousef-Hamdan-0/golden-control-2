import { proxySettingsRequest } from "@/app/api/settings/settings-proxy.helper";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxySettingsRequest(request, BACKEND_API_ENDPOINTS.settings.root, "PATCH");
}

export async function PATCH(request: Request) {
  return proxySettingsRequest(request, BACKEND_API_ENDPOINTS.settings.root, "PATCH");
}
