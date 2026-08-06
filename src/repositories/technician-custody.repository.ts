import { PAGE_SIZE } from "@/config/constants";
import {
  mockCreateWalletMovement,
  mockGetCustody,
  mockListPartMovements,
  mockListWalletMovements,
  mockUpdateCustodyParts,
  mockUpdateCustodyTools,
} from "@/mocks/pending-endpoints.mock";
import type {
  CustodyPartsInput,
  PartMovement,
  TechnicianCustody,
  WalletMovement,
  WalletMovementInput,
} from "@/models/technician/custody.model";

export interface MovementListParams {
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

export const technicianCustodyRepository = {
  // TODO: API — بانتظار Endpoint: GET /api/technicians/{id}/custody
  // Response: TechnicianCustody (أصول العهدة فقط؛ الهوية من endpoint المستخدمين)
  async get(technicianId: string): Promise<TechnicianCustody> {
    return mockGetCustody(technicianId);
  },

  // TODO: API — بانتظار Endpoint: GET /api/technicians/{id}/wallet-movements?page&pageSize
  // Response: { items: WalletMovement[], total: number }
  async listWalletMovements(
    technicianId: string,
    params: MovementListParams = {},
  ): Promise<PagedResult<WalletMovement>> {
    return mockListWalletMovements(technicianId, pageParams(params));
  },

  // TODO: API — بانتظار Endpoint: GET /api/technicians/{id}/part-movements?page&pageSize
  // Response: { items: PartMovement[], total: number }
  async listPartMovements(
    technicianId: string,
    params: MovementListParams = {},
  ): Promise<PagedResult<PartMovement>> {
    return mockListPartMovements(technicianId, pageParams(params));
  },

  // TODO: API — بانتظار Endpoint: POST /api/technicians/{id}/wallet-movements
  // Request: { amount, type: "supply" | "withdraw", reason } → Response: TechnicianCustody
  async createWalletMovement(
    technicianId: string,
    input: WalletMovementInput,
  ): Promise<TechnicianCustody> {
    return mockCreateWalletMovement(technicianId, input);
  },

  // TODO: API — بانتظار Endpoint: PUT /api/technicians/{id}/custody/parts
  // Request: { parts: [{ partId, quantity }], reason } → Response: TechnicianCustody
  async updateParts(
    technicianId: string,
    input: CustodyPartsInput,
  ): Promise<TechnicianCustody> {
    return mockUpdateCustodyParts(technicianId, input);
  },

  // TODO: API — بانتظار Endpoint: PATCH /api/technicians/{id}/custody/tools
  // Request: { tools } → Response: TechnicianCustody
  async updateTools(technicianId: string, tools: string): Promise<TechnicianCustody> {
    return mockUpdateCustodyTools(technicianId, tools);
  },
};
