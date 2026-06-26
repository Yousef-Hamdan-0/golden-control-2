"use client";

import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/hooks/query-keys";
import type { UserListParams } from "@/repositories/user.repository";

/**
 * Role + status are part of the key, so switching a filter fetches that slice
 * immediately and caches each combination (instant re-switch).
 */
export function useUsersQuery(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.listByRole(params),
  });
}

export function useUsersAllQuery(params: Omit<UserListParams, "page" | "pageSize">) {
  return useQuery({
    queryKey: queryKeys.users.listAll(params),
    queryFn: () => userService.listAllByRole(params),
  });
}

export function useUserCountsQuery() {
  return useQuery({
    queryKey: queryKeys.users.counts(),
    queryFn: () => userService.getCounts(),
  });
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => userService.getCurrent(),
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getById(id),
    enabled: Boolean(id),
  });
}
