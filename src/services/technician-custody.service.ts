import {
  technicianCustodyRepository,
  type MovementListParams,
} from "@/repositories/technician-custody.repository";
import type {
  CustodyPartsInput,
  WalletMovementInput,
} from "@/models/technician/custody.model";

export const technicianCustodyService = {
  get(technicianId: string) {
    return technicianCustodyRepository.get(technicianId);
  },

  listWalletMovements(technicianId: string, params: MovementListParams = {}) {
    return technicianCustodyRepository.listWalletMovements(technicianId, params);
  },

  listPartMovements(technicianId: string, params: MovementListParams = {}) {
    return technicianCustodyRepository.listPartMovements(technicianId, params);
  },

  createWalletMovement(technicianId: string, input: WalletMovementInput) {
    return technicianCustodyRepository.createWalletMovement(technicianId, input);
  },

  updateParts(technicianId: string, input: CustodyPartsInput) {
    return technicianCustodyRepository.updateParts(technicianId, input);
  },

  updateTools(technicianId: string, tools: string) {
    return technicianCustodyRepository.updateTools(technicianId, tools);
  },
};
