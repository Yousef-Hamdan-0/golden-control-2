"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { settingsService } from "@/services/settings.service";
import { USD_TO_SYP_RATE } from "@/features/operations/constants";
import type { Settings, SettingsPatchInput } from "@/models/settings/settings.model";

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: () => settingsService.get(),
  });
}

/**
 * Numeric USD→SYP rate from center settings, with the legacy constant as a
 * fallback while settings load or if the backend value is missing/invalid.
 */
export function useDollarExchangeRate(): number {
  const { data } = useSettingsQuery();
  const parsed = Number(data?.dollarExchangeRate);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : USD_TO_SYP_RATE;
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
