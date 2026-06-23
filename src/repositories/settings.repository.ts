import { API_ENDPOINTS } from "@/config/api-endpoints";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import {
  UpdateSettingsRequestModel,
  UploadSettingsLogoRequestModel,
  normalizeSettingsResponse,
  type Settings,
  type SettingsInput,
  type SettingsPatchInput,
} from "@/models/settings/settings.model";

export const settingsRepository = {
  async get(): Promise<Settings> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.settings.root, {
      method: "GET",
    });
    return normalizeSettingsResponse(payload);
  },

  async update(input: SettingsPatchInput): Promise<Settings> {
    const body = new UpdateSettingsRequestModel(input).toJSON();
    if (Object.keys(body).length === 0) return this.get();

    const payload = await requestAuthenticatedApi(API_ENDPOINTS.settings.root, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeSettingsResponse(payload);
  },

  async uploadLogo(logo: File): Promise<Settings> {
    const body = new UploadSettingsLogoRequestModel(logo).toFormData();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.settings.logo, {
      method: "POST",
      body,
    });
    return normalizeSettingsResponse(payload);
  },
};
