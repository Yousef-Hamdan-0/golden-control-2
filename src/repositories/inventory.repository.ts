import { API_ENDPOINTS } from "@/config/api-endpoints";
import { PAGE_SIZE } from "@/config/constants";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import {
  InventoryDailyPayloadModel,
  InventoryMovementPayloadModel,
  InventoryPartPayloadModel,
  normalizeInventoryDailyList,
  normalizeInventoryMovementList,
  normalizeInventoryPartList,
  normalizeInventoryPartResponse,
  type InventoryDailyCreateInput,
  type InventoryListResult,
  type InventoryMovementInput,
  type InventoryMovementLog,
  type InventoryPart,
  type InventoryPartInput,
} from "@/models/inventory/inventory.model";

export interface InventoryDailyListParams {
  page?: number;
  pageSize?: number;
}

export interface InventoryPartListParams {
  name?: string;
  sku?: string;
  page?: number;
  pageSize?: number;
}

export const inventoryRepository = {
  async listDaily(
    params: InventoryDailyListParams = {},
  ): Promise<InventoryListResult<ReturnType<typeof normalizeInventoryDailyList>["items"][number]>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.daily, {
      method: "GET",
    });

    return normalizeInventoryDailyList(payload, page, pageSize);
  },

  async createDaily(input: InventoryDailyCreateInput): Promise<void> {
    const body = new InventoryDailyPayloadModel(input).toJSON();
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.daily, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  async deleteDaily(id: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.dailyById(id), {
      method: "DELETE",
    });
  },

  async listParts(params: InventoryPartListParams = {}): Promise<InventoryListResult<InventoryPart>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (params.name?.trim()) searchParams.set("name", params.name.trim());
    if (params.sku?.trim()) searchParams.set("sku", params.sku.trim());

    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.inventory.parts}?${searchParams}`,
      { method: "GET" },
    );

    return normalizeInventoryPartList(payload, { page, pageSize });
  },

  async getPartById(id: string): Promise<InventoryPart> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.partById(id), {
      method: "GET",
    });
    return normalizeInventoryPartResponse(payload);
  },

  async createPart(input: InventoryPartInput): Promise<InventoryPart> {
    const body = new InventoryPartPayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.parts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeInventoryPartResponse(payload);
  },

  async updatePart(id: string, input: InventoryPartInput): Promise<InventoryPart> {
    const body = new InventoryPartPayloadModel(input).toJSON();
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.partById(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return normalizeInventoryPartResponse(payload);
  },

  async deletePart(id: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.partById(id), {
      method: "DELETE",
    });
  },

  async listMovements(): Promise<InventoryMovementLog[]> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.movements, {
      method: "GET",
    });
    return normalizeInventoryMovementList(payload);
  },

  async createMovement(input: InventoryMovementInput): Promise<void> {
    const body = new InventoryMovementPayloadModel(input).toJSON();
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.movements, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
