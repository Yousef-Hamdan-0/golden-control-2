import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import {
  CustomerListQuerySchema,
  CustomerRequestModel,
  hasCustomerPatch,
  normalizeCustomerListResponse,
  normalizeCustomerResponse,
  type Customer,
  type CustomerInput,
  type CustomerPatchInput,
} from "@/models/customers/customer.model";
import type { Paginated } from "@/repositories/user.repository";

export interface CustomerListParams {
  name?: string;
  phone?: string;
  page?: number;
  pageSize?: number;
}

function listQuery(params: CustomerListParams) {
  return CustomerListQuerySchema.parse({
    name: params.name?.trim() || undefined,
    phone: params.phone?.trim() || undefined,
    page: params.page ?? 1,
    limit: params.pageSize ?? PAGE_SIZE,
  });
}

function maybeNormalizeCustomerResponse(payload: unknown): Customer | null {
  try {
    return normalizeCustomerResponse(payload);
  } catch {
    return null;
  }
}

export const customerRepository = {
  async list(params: CustomerListParams = {}): Promise<Paginated<Customer>> {
    const query = listQuery(params);
    const searchParams = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.name) searchParams.set("name", query.name);
    if (query.phone) searchParams.set("phone", query.phone);

    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.customers.root}?${searchParams}`,
      { method: "GET" },
    );
    const result = normalizeCustomerListResponse(payload, query);

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
    };
  },

  async getById(id: string): Promise<Customer> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.customers.byId(id), {
      method: "GET",
    });
    return normalizeCustomerResponse(payload);
  },

  async create(input: CustomerInput): Promise<Customer | null> {
    const body = new CustomerRequestModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.customers.root, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return maybeNormalizeCustomerResponse(payload);
  },

  async update(id: string, input: CustomerPatchInput): Promise<Customer | null> {
    if (!hasCustomerPatch(input)) return null;

    const body = new CustomerRequestModel(input, { partial: true }).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.customers.byId(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return maybeNormalizeCustomerResponse(payload);
  },

  async delete(id: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.customers.byId(id), {
      method: "DELETE",
    });
  },
};
