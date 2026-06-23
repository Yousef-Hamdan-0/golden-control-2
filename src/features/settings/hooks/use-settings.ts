"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { settingsService } from "@/services/settings.service";
import type { Settings, SettingsPatchInput } from "@/models/settings/settings.model";

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: () => settingsService.get(),
  });
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();
  const cacheSettings = (settings: Settings) => {
    queryClient.setQueryData(queryKeys.settings.detail(), settings);
  };

  const update = useMutation({
    mutationFn: (input: SettingsPatchInput) => settingsService.update(input),
    onSuccess: cacheSettings,
  });

  const uploadLogo = useMutation({
    mutationFn: (logo: File) => settingsService.uploadLogo(logo),
    onSuccess: cacheSettings,
  });

  return { update, uploadLogo };
}
