import {
  userRepository,
  type Paginated,
  type UserListParams,
} from "@/repositories/user.repository";
import type { User, UserCounts } from "@/models/auth/user.model";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdatePatchInput } from "@/models/users/user-update.schema";

/**
 * Business layer. Orchestrates repositories and enforces domain rules.
 * Components/hooks call this — never the repository directly.
 */
export const userService = {
  listByRole(params: UserListParams): Promise<Paginated<User>> {
    return userRepository.list(params);
  },

  getCounts(): Promise<UserCounts> {
    return userRepository.counts();
  },

  getCurrent(): Promise<User> {
    return userRepository.getCurrent();
  },

  getById(id: string): Promise<User> {
    return userRepository.getById(id);
  },

  create(input: UserCreateInput): Promise<void> {
    return userRepository.create(input);
  },

  update(id: string, input: UserUpdatePatchInput): Promise<void> {
    return userRepository.update(id, input);
  },
};
