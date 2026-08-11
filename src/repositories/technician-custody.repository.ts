import { PAGE_SIZE } from "@/config/constants";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { requestAuthenticatedApi } from "@/helpers/authenticated-api.helper";
import type {
  CustodyPartsInput,
  PartMovement,
  TechnicianCustody,
  WalletMovement,
  WalletMovementInput,
} from "@/models/technician/custody.model";

export interface MovementListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

function pageParams(params: { page?: number; pageSize?: number }) {
  return { page: params.page ?? 1, pageSize: params.pageSize ?? PAGE_SIZE };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function dataValue(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  return payload.data ?? payload;
}

function inventoryArray(payload: unknown): unknown[] {
  const data = dataValue(payload);
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  for (const value of [data.items, data.inventories, data.data]) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function nestedRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function soldItemsPage(
  payload: unknown,
  params: Required<Pick<MovementListParams, "page" | "pageSize">>,
): PagedResult<PartMovement> {
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};
  const meta = nestedRecord(raw.meta);
  const entries = Array.isArray(data)
    ? data
    : Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.soldItems)
        ? raw.soldItems
        : [];
  const items = entries.map((entry, index) => {
    const item = nestedRecord(entry);
    const sparePart = nestedRecord(item.sparePart);
    const request = nestedRecord(item.request);
    const invoice = nestedRecord(item.invoice);
    return {
      id: stringValue(item.id, `sold-item-${params.page}-${index + 1}`),
      partId: stringValue(
        item.sparePartId,
        item.spare_part_id,
        sparePart.id,
        item.partId,
        item.part_id,
      ),
      partName: stringValue(
        item.sparePartName,
        item.spare_part_name,
        sparePart.name,
        item.partName,
        item.part_name,
        "قطعة غير محددة",
      ),
      quantity: numberValue(item.quantity, item.qty, item.soldQuantity, item.sold_quantity),
      reason: stringValue(
        item.requestNumber,
        item.request_number,
        request.requestNumber,
        request.request_number,
        item.notes,
        "—",
      ),
      createdAt: stringValue(
        item.soldAt,
        item.sold_at,
        item.createdAt,
        item.created_at,
        invoice.createdAt,
        invoice.created_at,
      ),
    };
  });

  return {
    items,
    total: numberValue(raw.total, raw.totalItems, raw.total_items, meta.total, items.length),
  };
}

function walletMovementsPage(payload: unknown): PagedResult<WalletMovement> {
  const root = isRecord(payload) ? payload : {};
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};
  const meta = nestedRecord(raw.meta ?? root.meta);
  const entries = Array.isArray(data)
    ? data
    : Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.movements)
        ? raw.movements
        : Array.isArray(raw.walletMovements)
          ? raw.walletMovements
          : [];
  const items = entries.map((entry, index) => {
    const movement = nestedRecord(entry);
    const apiType = stringValue(movement.type, movement.movementType, movement.movement_type);
    return {
      id: stringValue(movement.id, `wallet-movement-${index + 1}`),
      amount: numberValue(movement.amount),
      type: apiType === "deduction" ? "withdraw" as const : "supply" as const,
      reason: stringValue(movement.notes, movement.note, movement.reason, "—"),
      createdAt: stringValue(
        movement.createdAt,
        movement.created_at,
        movement.movedAt,
        movement.moved_at,
        movement.date,
      ),
    };
  });

  return {
    items,
    total: numberValue(
      raw.total,
      root.total,
      raw.totalItems,
      root.totalItems,
      meta.total,
      items.length,
    ),
  };
}

function normalizeCustody(payload: unknown): TechnicianCustody {
  const data = dataValue(payload);
  const raw = isRecord(data) ? data : {};
  const technician = isRecord(raw.technician) ? raw.technician : {};
  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.inventoryItems)
      ? raw.inventoryItems
      : [];

  return {
    inventoryId: stringValue(raw.id, raw.inventoryId, raw.inventory_id),
    technicianId: stringValue(
      raw.technicianId,
      raw.technician_id,
      technician.id,
      raw.userId,
      raw.user_id,
    ),
    walletBalance: numberValue(
      raw.walletAmount,
      raw.wallet_amount,
      raw.walletBalance,
      raw.wallet_balance,
    ),
    tools: stringValue(raw.notes),
    parts: rawItems.map((item, index) => {
      const part = isRecord(item) ? item : {};
      const sparePart = isRecord(part.sparePart) ? part.sparePart : {};
      return {
        partId: stringValue(
          part.sparePartId,
          part.spare_part_id,
          sparePart.id,
          part.partId,
          part.part_id,
        ),
        name: stringValue(
          part.sparePartName,
          part.spare_part_name,
          sparePart.name,
          part.name,
          `قطعة ${index + 1}`,
        ),
        quantity: numberValue(part.quantity, part.qty),
      };
    }),
  };
}

function inventoryBody(custody: TechnicianCustody) {
  return {
    notes: custody.tools,
    items: custody.parts
      .filter((part) => part.partId && part.quantity > 0)
      .map((part) => ({ sparePartId: part.partId, quantity: part.quantity })),
  };
}

async function saveInventory(custody: TechnicianCustody): Promise<TechnicianCustody> {
  const body = inventoryBody(custody);
  const creating = !custody.inventoryId;
  const payload = await requestAuthenticatedApi(
    creating
      ? API_ENDPOINTS.inventory.technicians
      : API_ENDPOINTS.inventory.technicianById(custody.inventoryId ?? ""),
    {
      method: creating ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating ? { technicianId: custody.technicianId, ...body } : body),
    },
  );
  return normalizeCustody(payload);
}

export const technicianCustodyRepository = {
  async list(): Promise<TechnicianCustody[]> {
    const payload = await requestAuthenticatedApi(API_ENDPOINTS.inventory.technicians, {
      method: "GET",
    });
    return inventoryArray(payload).map(normalizeCustody);
  },

  async get(technicianId: string): Promise<TechnicianCustody> {
    const inventories = await this.list();
    const inventory = inventories.find((item) => item.technicianId === technicianId);
    if (!inventory?.inventoryId) {
      return { technicianId, walletBalance: 0, tools: "", parts: [] };
    }

    const payload = await requestAuthenticatedApi(
      API_ENDPOINTS.inventory.technicianById(inventory.inventoryId),
      { method: "GET" },
    );
    return normalizeCustody(payload);
  },

  async remove(inventoryId: string): Promise<void> {
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.technicianById(inventoryId), {
      method: "DELETE",
    });
  },

  async listWalletMovements(
    technicianId: string,
    params: MovementListParams = {},
  ): Promise<PagedResult<WalletMovement>> {
    const custody = await this.get(technicianId);
    if (!custody.inventoryId) return { items: [], total: 0 };
    const resolved = pageParams(params);
    const searchParams = new URLSearchParams({
      page: String(resolved.page),
      limit: String(resolved.pageSize),
    });
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.inventory.technicianWalletMovements(custody.inventoryId)}?${searchParams}`,
      { method: "GET" },
    );
    return walletMovementsPage(payload);
  },

  async listPartMovements(
    technicianId: string,
    params: MovementListParams = {},
  ): Promise<PagedResult<PartMovement>> {
    const resolved = pageParams(params);
    const searchParams = new URLSearchParams({
      page: String(resolved.page),
      limit: String(resolved.pageSize),
    });
    if (params.search?.trim()) searchParams.set("search", params.search.trim());
    const payload = await requestAuthenticatedApi(
      `${API_ENDPOINTS.inventory.technicianSoldItems(technicianId)}?${searchParams}`,
      { method: "GET" },
    );
    return soldItemsPage(payload, resolved);
  },

  async createWalletMovement(
    technicianId: string,
    input: WalletMovementInput,
  ): Promise<void> {
    let custody = await this.get(technicianId);
    if (!custody.inventoryId) custody = await saveInventory(custody);
    if (!custody.inventoryId) {
      throw new Error("تعذر تحديد مخزون الفني بعد إنشائه.");
    }
    await requestAuthenticatedApi(API_ENDPOINTS.inventory.technicianWalletMovement, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        technicianInventoryId: custody.inventoryId,
        amount: input.amount,
        type: input.type === "supply" ? "addition" : "deduction",
        notes: input.reason,
      }),
    });
  },

  async updateParts(
    technicianId: string,
    input: CustodyPartsInput,
  ): Promise<TechnicianCustody> {
    const custody = await this.get(technicianId);
    return saveInventory({ ...custody, parts: input.parts });
  },

  async updateTools(technicianId: string, tools: string): Promise<TechnicianCustody> {
    const custody = await this.get(technicianId);
    return saveInventory({ ...custody, tools });
  },
};
