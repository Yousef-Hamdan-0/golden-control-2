import { settingsRepository } from "@/repositories/settings.repository";
import type { Settings, SettingsPatchInput } from "@/models/settings/settings.model";

export const settingsService = {
  get(): Promise<Settings> {
    return settingsRepository.get();
  },

  update(input: SettingsPatchInput): Promise<Settings> {
    return settingsRepository.update(input);
  },

  uploadLogo(logo: File): Promise<Settings> {
    return settingsRepository.uploadLogo(logo);
  },
};
