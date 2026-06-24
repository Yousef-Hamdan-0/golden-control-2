// Barrel re-export — imports from this file continue to work unchanged.
// Each domain has been split into its own folder under components/.

export type {
  OrderStatus,
  OrderType,
  Priority,
  InvoiceType,
  PaymentStatus,
  PaymentMethod,
  PaymentCurrency,
  Order,
  DeviceDraft,
  OrderAudioRecord,
  OrderStatusHistoryItem,
  MaintenanceOrderDraft,
  DateFilter,
  InventoryItem,
  InventoryMovement,
  InvoicePayment,
  InvoicePart,
  Invoice,
  FinanceRecord,
  TechnicianPerformance,
} from "../types";

export { MaintenanceOrderModal } from "./orders/MaintenanceOrderModal";
export { OrderDetailsModal } from "./orders/OrderDetailsModal";
export { RequestsScreen as OrdersScreen } from "@/features/requests/components/RequestsScreen";

export { InventoryScreen } from "./inventory/InventoryScreen";

export { InvoicesScreen } from "./invoices/InvoicesScreen";

export { FinanceScreen } from "./finance/FinanceScreen";

export { TechnicianPerformanceScreen } from "./technicians/TechnicianPerformanceScreen";

export { SettingsCenterScreen } from "./settings/SettingsCenterScreen";
export { ExchangeRateSettingsScreen } from "./settings/ExchangeRateSettingsScreen";
