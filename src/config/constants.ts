/** App-wide constants. One knob each. */

import type { Currency } from "@/lib/format/currency";

/** Auto-refresh interval for live tables (orders, inventory, finance). */
export const REFRESH_MS = 5 * 60_000; // 5 minutes

/** System base currency. No JOD — the design uses Syrian Lira. */
export const BASE_CURRENCY: Currency = "SYP";
export const CURRENCY_SYMBOL = "ل.س";

/** Default page size for list tables. */
export const PAGE_SIZE = 10;

/** Default debounce (ms) for search inputs. */
export const SEARCH_DEBOUNCE_MS = 300;

/** TanStack Query stale time — kept below REFRESH_MS so navigation feels fresh. */
export const QUERY_STALE_MS = 60_000;
