import {
  userRepository,
  type Paginated,
  type UserListParams,
} from "@/repositories/user.repository";
import type { User, UserCounts } from "@/models/auth/user.model";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdateInput } from "@/models/users/user-update.schema";

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

  getById(id: string): Promise<User> {
    return userRepository.getById(id);
  },

  create(input: UserCreateInput): Promise<User> {
    // Domain rule example: technicians must carry a discount.
    if (input.role === "technician" && input.discount === undefined) {
      throw new Error("DISCOUNT_REQUIRED");
    }
    return userRepository.create(input);
  },

  update(id: string, input: UserUpdateInput): Promise<User> {
    // If a new password was supplied, a real impl would call setPassword here.
    return userRepository.update(id, input);
  },

  remove(id: string): Promise<{ id: string }> {
    return userRepository.remove(id);
  },
};
