"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/hooks/query-keys";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdateInput } from "@/models/users/user-update.schema";

export function useUserMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.users.all });

  const create = useMutation({
    mutationFn: (input: UserCreateInput) => userService.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
      userService.update(id, input),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.users.detail(vars.id) }),
        invalidate(),
      ]);
    },
  });

  return { create, update };
}
