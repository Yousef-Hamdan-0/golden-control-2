import type { BadgeTone } from "@/components/ui/Badge";

/** صرف = money/parts leaving the custody, تزويد = added to the custody. */
export type CustodyMovementType = "supply" | "withdraw";

export const MOVEMENT_LABELS: Record<CustodyMovementType, string> = {
  supply: "تزويد",
  withdraw: "صرف",
};

export const MOVEMENT_TONE: Record<CustodyMovementType, BadgeTone> = {
  supply: "success",
  withdraw: "danger",
};

/** Max length of the free-text reason on every custody movement. */
export const REASON_MAX_LENGTH = 50;

export interface TechnicianCustodyPart {
  partId: string;
  name: string;
  quantity: number;
}

/**
 * Custody assets only. The technician's identity (name, photo, number) is NOT
 * part of this payload — it always comes from the users endpoint via
 * `useUsersQuery({ role: "technician" })` so the page never shows a stale or
 * invented name.
 */
export interface TechnicianCustody {
  inventoryId?: string;
  technicianId: string;
  walletBalance: number;
  tools: string;
  parts: TechnicianCustodyPart[];
}

export interface WalletMovement {
  id: string;
  amount: number;
  type: CustodyMovementType;
  reason: string;
  createdAt: string;
}

export interface PartMovement {
  id: string;
  partId: string;
  partName: string;
  /** Signed delta: positive when added to the custody, negative when removed. */
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface WalletMovementInput {
  amount: number;
  type: CustodyMovementType;
  reason: string;
}

export interface CustodyPartsInput {
  parts: TechnicianCustodyPart[];
  reason: string;
}
