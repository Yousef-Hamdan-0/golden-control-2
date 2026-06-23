import { proxySettingsRequest } from "@/app/api/settings/settings-proxy.helper";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxySettingsRequest(request, BACKEND_API_ENDPOINTS.settings.root);
}

export async function PATCH(request: Request) {
  return proxySettingsRequest(request, BACKEND_API_ENDPOINTS.settings.root);
}
