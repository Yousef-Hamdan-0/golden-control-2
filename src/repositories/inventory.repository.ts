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
  sparePartNumber?: string;
  page?: number;
  pageSize?: number;
}

async function fetchPartsPage(params: InventoryPartListParams): Promise<InventoryListResult<InventoryPart>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (params.name?.trim()) searchParams.set("name", params.name.trim());
  if (params.sparePartNumber?.trim()) {
    searchParams.set("sparePartNumber", params.sparePartNumber.trim());
  }

  const payload = await requestAuthenticatedApi(
    `${API_ENDPOINTS.inventory.parts}?${searchParams}`,
    { method: "GET" },
  );

  return normalizeInventoryPartList(payload, { page, pageSize });
}

async function fetchAllParts(params: Omit<InventoryPartListParams, "page">) {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const firstPage = await fetchPartsPage({ ...params, page: 1, pageSize });
  const byId = new Map(firstPage.items.map((part) => [part.id, part]));
  const knownPages =
    firstPage.total > firstPage.items.length
      ? Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize))
      : undefined;

  if (knownPages) {
    // The total is known, so fetch the remaining pages in parallel.
    const restPages = await Promise.all(
      Array.from({ length: knownPages - 1 }, (_, index) =>
        fetchPartsPage({ ...params, page: index + 2, pageSize }),
      ),
    );
    restPages.forEach((result) =>
      result.items.forEach((part) => byId.set(part.id, part)),
    );
    return Array.from(byId.values());
  }

  // The total is unknown, so walk pages sequentially until an empty/short page.
  let page = 2;
  while (firstPage.items.length >= pageSize && page <= 100) {
    const result = await fetchPartsPage({ ...params, page, pageSize });
    let addedNewPart = false;
    result.items.forEach((part) => {
      if (!byId.has(part.id)) addedNewPart = true;
      byId.set(part.id, part);
    });

    if (!addedNewPart || result.items.length < pageSize) break;
    page += 1;
  }

  return Array.from(byId.values());
}

function enrichMovementsWithParts(
  movements: InventoryMovementLog[],
  parts: InventoryPart[],
): InventoryMovementLog[] {
  const partsById = new Map(parts.map((part) => [part.id, part]));
  const partsByNumber = new Map(parts.map((part) => [part.sparePartNumber, part]));

  return movements.map((movement) => {
    if (movement.partNumber && movement.partName) return movement;

    const part = partsById.get(movement.partId) || partsByNumber.get(movement.partId);
    if (!part) return movement;

    return {
      ...movement,
      partNumber: movement.partNumber || part.sparePartNumber,
      partName: movement.partName || part.name,
    };
  });
}

export const inventoryRepository = {
  async listDaily(
    params: InventoryDailyListParams = {},
  ): Promise<InventoryListResult<ReturnType<typeof normalizeInventoryDailyList>["items"][number]>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.inventory.daily}?${searchParams}`,
      { method: "GET" },
    );

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
    return fetchPartsPage(params);
  },

  async listAllParts(): Promise<InventoryPart[]> {
    return fetchAllParts({ pageSize: PAGE_SIZE });
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
    const movements = normalizeInventoryMovementList(payload);

    if (movements.every((movement) => movement.partNumber && movement.partName)) {
      return movements;
    }

    try {
      const parts = await fetchAllParts({ pageSize: PAGE_SIZE });
      return enrichMovementsWithParts(movements, parts);
    } catch {
      return movements;
    }
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
