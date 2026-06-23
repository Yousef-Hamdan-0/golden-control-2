import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import type { Role, User, UserCounts, UserStatus } from "@/models/auth/user.model";
import type { UserCreateInput } from "@/models/users/user-create.schema";
import type { UserUpdateInput } from "@/models/users/user-update.schema";
import {
  CreateUserRequestModel,
  UpdateUserRequestModel,
  hasUserUpdatePatch,
  UserListQuerySchema,
  normalizeUserListResponse,
  normalizeUserResponse,
} from "@/models/users/user-api.model";
import type { UserUpdatePatchInput } from "@/models/users/user-update.schema";

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

function listQuery(params: UserListParams) {
  return UserListQuerySchema.parse({
    page: params.page ?? 1,
    limit: params.pageSize ?? PAGE_SIZE,
    role: params.role ?? "all",
    isActive:
      params.status === "available"
        ? true
        : params.status === "unavailable"
          ? false
          : "all",
  });
}

export const userRepository = {
  async list(params: UserListParams = {}): Promise<Paginated<User>> {
    const query = listQuery(params);
    const searchParams = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.role !== "all") searchParams.set("role", query.role);
    if (query.isActive !== "all") {
      searchParams.set("isActive", String(query.isActive));
    }
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.users.root}?${searchParams}`,
      { method: "GET" },
    );
    const result = normalizeUserListResponse(payload, query);

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
    };
  },

  async counts(): Promise<UserCounts> {
    const [technicians, employees, allUsers] = await Promise.all([
      this.list({ role: "technician", status: "available", page: 1, pageSize: 1 }),
      this.list({ role: "employee", status: "all", page: 1, pageSize: 1 }),
      this.list({ role: "all", status: "all", page: 1, pageSize: 1 }),
    ]);

    return {
      certifiedTechnicians: technicians.total,
      employees: employees.total,
      total: allUsers.total,
    };
  },

  async getCurrent(): Promise<User> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.users.me, {
      method: "GET",
    });
    return normalizeUserResponse(payload);
  },

  async getById(id: string): Promise<User> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.users.byId(id), {
      method: "GET",
    });
    return normalizeUserResponse(payload);
  },

  async create(input: UserCreateInput): Promise<void> {
    const body = new CreateUserRequestModel(input).toFormData();
    await requestAuthenticatedApi(API_ENDPOINTS.users.root, {
      method: "POST",
      body,
    });
  },

  async update(id: string, input: UserUpdatePatchInput): Promise<void> {
    if (!hasUserUpdatePatch(input)) return;

    const body = new UpdateUserRequestModel(input).toFormData();
    await requestAuthenticatedApi(API_ENDPOINTS.users.byId(id), {
      method: "PATCH",
      body,
    });
  },
};
