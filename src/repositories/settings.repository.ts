import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiError } from "@/helpers/api.helper";
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
    const requestModel = new UploadSettingsLogoRequestModel(logo);
    const upload = (fieldName: string) =>
      requestAuthenticatedApi(API_ENDPOINTS.settings.root, {
        method: "PATCH",
        body: requestModel.toFormData(fieldName),
      });

    try {
      const payload = await upload("logoPath");
      return normalizeSettingsResponse(payload);
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) {
        throw error;
      }

      const payload = await upload("logo");
      return normalizeSettingsResponse(payload);
    }
  },
};
