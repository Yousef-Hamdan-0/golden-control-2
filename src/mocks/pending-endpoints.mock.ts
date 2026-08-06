/**
 * Temporary in-memory stand-in for capabilities the backend does not expose yet.
 * Every repository function that reaches this file carries a
 * `// TODO: API — بانتظار Endpoint` comment naming its proposed contract, so
 * wiring the real backend is a one-line change per function.
 *
 * Proposed contracts:
 *   PATCH /api/payments/{id}/collection            { isCollected }
 *   GET   /api/technicians/{id}/custody
 *   GET   /api/technicians/{id}/wallet-movements   ?page&pageSize
 *   POST  /api/technicians/{id}/wallet-movements   { amount, type, reason }
 *   GET   /api/technicians/{id}/part-movements     ?page&pageSize
 *   PUT   /api/technicians/{id}/custody/parts      { parts, reason }
 *   PATCH /api/technicians/{id}/custody/tools      { tools }
 */

import type {
  CustodyMovementType,
  PartMovement,
  TechnicianCustody,
  TechnicianCustodyPart,
  WalletMovement,
} from "@/models/technician/custody.model";

const NETWORK_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

/** Mirrors the backend's serialization so date parsing is exercised identically. */
function serverTimestamp() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Payment collection
// ---------------------------------------------------------------------------

export interface PaymentCollectionResult {
  id: string;
  isCollected: boolean;
  collectedAt: string | null;
}

const paymentCollections = new Map<string, PaymentCollectionResult>();

export function mockSetPaymentCollected(
  paymentId: string,
  isCollected: boolean,
): Promise<PaymentCollectionResult> {
  const result: PaymentCollectionResult = {
    id: paymentId,
    isCollected,
    collectedAt: isCollected ? serverTimestamp() : null,
  };
  paymentCollections.set(paymentId, result);
  return delay(result);
}

/** Overlays session-local collection state onto a freshly fetched invoice. */
export function mockPaymentCollection(paymentId: string) {
  return paymentCollections.get(paymentId) ?? null;
}

// ---------------------------------------------------------------------------
// Technician custody
// ---------------------------------------------------------------------------

interface CustodyRecord {
  custody: TechnicianCustody;
  walletMovements: WalletMovement[];
  partMovements: PartMovement[];
}

/**
 * Keyed by the real technician id coming from the users endpoint. A technician
 * with no record yet starts from an empty custody rather than an error, so the
 * page works for every real technician the API returns.
 */
const custodyRecords = new Map<string, CustodyRecord>();

function requireCustody(technicianId: string): CustodyRecord {
  const existing = custodyRecords.get(technicianId);
  if (existing) return existing;

  const created: CustodyRecord = {
    custody: { technicianId, walletBalance: 0, tools: "", parts: [] },
    walletMovements: [],
    partMovements: [],
  };
  custodyRecords.set(technicianId, created);
  return created;
}

function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length };
}

export function mockGetCustody(technicianId: string): Promise<TechnicianCustody> {
  return delay(requireCustody(technicianId).custody);
}

export function mockListWalletMovements(
  technicianId: string,
  params: { page: number; pageSize: number },
): Promise<{ items: WalletMovement[]; total: number }> {
  const record = requireCustody(technicianId);
  return delay(paginate(record.walletMovements, params.page, params.pageSize));
}

export function mockListPartMovements(
  technicianId: string,
  params: { page: number; pageSize: number },
): Promise<{ items: PartMovement[]; total: number }> {
  const record = requireCustody(technicianId);
  return delay(paginate(record.partMovements, params.page, params.pageSize));
}

export function mockCreateWalletMovement(
  technicianId: string,
  input: { amount: number; type: CustodyMovementType; reason: string },
): Promise<TechnicianCustody> {
  const record = requireCustody(technicianId);
  const signed = input.type === "withdraw" ? -input.amount : input.amount;
  const nextBalance = record.custody.walletBalance + signed;
  if (nextBalance < 0) throw new Error("لا يمكن أن يصبح رصيد المحفظة سالباً.");

  record.custody = { ...record.custody, walletBalance: nextBalance };
  record.walletMovements = [
    {
      id: newId("WM"),
      amount: input.amount,
      type: input.type,
      reason: input.reason,
      createdAt: serverTimestamp(),
    },
    ...record.walletMovements,
  ];
  return delay(record.custody);
}

export function mockUpdateCustodyParts(
  technicianId: string,
  input: { parts: { partId: string; name: string; quantity: number }[]; reason: string },
): Promise<TechnicianCustody> {
  const record = requireCustody(technicianId);
  const previous = new Map(record.custody.parts.map((part) => [part.partId, part]));
  const movements: PartMovement[] = [];

  for (const part of input.parts) {
    const before = previous.get(part.partId)?.quantity ?? 0;
    if (before !== part.quantity) {
      movements.push({
        id: newId("PM"),
        partId: part.partId,
        partName: part.name,
        quantity: part.quantity - before,
        reason: input.reason,
        createdAt: serverTimestamp(),
      });
    }
    previous.delete(part.partId);
  }

  // Parts dropped from the form are treated as removed from the custody.
  for (const removed of previous.values()) {
    movements.push({
      id: newId("PM"),
      partId: removed.partId,
      partName: removed.name,
      quantity: -removed.quantity,
      reason: input.reason,
      createdAt: serverTimestamp(),
    });
  }

  record.custody = {
    ...record.custody,
    parts: input.parts
      .filter((part) => part.quantity > 0)
      .map(({ partId, name, quantity }) => ({ partId, name, quantity })),
  };
  record.partMovements = [...movements, ...record.partMovements];
  return delay(record.custody);
}

export function mockUpdateCustodyTools(
  technicianId: string,
  tools: string,
): Promise<TechnicianCustody> {
  const record = requireCustody(technicianId);
  record.custody = { ...record.custody, tools };
  return delay(record.custody);
}
