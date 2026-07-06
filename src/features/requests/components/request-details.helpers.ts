import { localDateKey, localDisplayDateTime } from "@/lib/format/date";
import { invoiceService } from "@/services/invoice.service";
import type { Invoice } from "@/features/operations/types";
import type {
  RepairRequest,
  RepairRequestStatusHistoryItem,
} from "@/models/requests/request.model";
import { isLikelyIdentifier } from "@/features/requests/components/request-display.helpers";

export function fallback(value: string, empty = "غير محدد") {
  return value.trim() || empty;
}

function userDisplayName(value: string, usersById: Map<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const mapped = usersById.get(trimmed);
  if (mapped) return mapped;
  return isLikelyIdentifier(trimmed) ? "" : trimmed;
}

export function statusHistoryOwner(
  item: RepairRequestStatusHistoryItem,
  usersById: Map<string, string>,
) {
  return (
    userDisplayName(item.ownerId, usersById) ||
    userDisplayName(item.owner, usersById) ||
    "غير محدد"
  );
}

export function formatDate(value: string) {
  return localDateKey(value, "غير محدد");
}

export function formatDateTime(value: string) {
  return localDisplayDateTime(value, "غير محدد");
}

export function invoiceDisplayNumber(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.id;
}

export function canCreateInvoiceForRequest(request: RepairRequest) {
  return ["completed", "incompleted"].includes(request.status);
}

export function canAddPayment(invoice: Invoice) {
  return invoice.status !== "paid" && invoice.status !== "refunded" && !invoice.returned;
}

export function saveInvoicePdf(
  response: Awaited<ReturnType<typeof invoiceService.downloadPdf>>,
  invoice: Invoice,
) {
  const url = URL.createObjectURL(response.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = response.fileName ?? `${invoiceDisplayNumber(invoice)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
