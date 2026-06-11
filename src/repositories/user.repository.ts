import type { Role, User, UserCounts, UserStatus } from "@/models/auth/user.model";
import { UserSchema } from "@/models/auth/user.model";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdateInput } from "@/models/users/user-update.schema";
import { MOCK_USERS } from "@/mocks/users.mock";
import { PAGE_SIZE } from "@/config/constants";

/**
 * MOCK repository. The only layer that "knows" the data source.
 * Replace each method body with an Axios call + UserSchema parse to go live;
 * nothing above this file changes.
 */

export interface UserListParams {
  role?: Role | "all";
  status?: UserStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Mutable in-memory store so create/update/delete persist for the session.
let store: User[] = [...MOCK_USERS];

const latency = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

function nextId(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `#USR-${n}`;
}

export const userRepository = {
  async list(params: UserListParams = {}): Promise<Paginated<User>> {
    const { role = "all", status = "all", page = 1, pageSize = PAGE_SIZE } = params;
    let rows = store;
    if (role !== "all") rows = rows.filter((u) => u.role === role);
    if (status !== "all") rows = rows.filter((u) => u.status === status);

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize).map((u) => UserSchema.parse(u));
    return latency({ items, total, page, pageSize });
  },

  async counts(): Promise<UserCounts> {
    const certifiedTechnicians = store.filter(
      (u) => u.role === "technician" && u.status === "available",
    ).length;
    const employees = store.filter((u) => u.role === "employee").length;
    return latency({ certifiedTechnicians, employees, total: store.length });
  },

  async getById(id: string): Promise<User> {
    const found = store.find((u) => u.id === id);
    if (!found) throw new Error("NOT_FOUND");
    return latency(UserSchema.parse(found));
  },

  async create(input: UserCreateInput): Promise<User> {
    const { password: _password, ...rest } = input;
    const user: User = { id: nextId(), status: "available", ...rest };
    store = [user, ...store];
    return latency(UserSchema.parse(user));
  },

  async update(id: string, input: UserUpdateInput): Promise<User> {
    const idx = store.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    const { password: _password, ...rest } = input;
    const updated: User = { ...store[idx], ...rest };
    store[idx] = updated;
    return latency(UserSchema.parse(updated));
  },

  async remove(id: string): Promise<{ id: string }> {
    store = store.filter((u) => u.id !== id);
    return latency({ id });
  },
};
