/**
 * Single source of truth for role-based access, derived from the approved
 * permissions table. Consumed by:
 *  - the sidebar navigation (hide items a role cannot reach),
 *  - the client route guard (block direct screen navigation),
 *  - the API middleware (reject unauthorized proxy calls server-side).
 */

import type { Role } from "@/models/auth/user.model";

export type { Role };

export const ALL_ROLES: Role[] = ["admin", "manager", "employee", "technician"];

export function normalizeRole(value: string | null | undefined): Role | null {
  const next = (value ?? "").trim().toLowerCase();
  if (next === "admin" || next === "manager" || next === "employee" || next === "technician") {
    return next;
  }
  return null;
}

/* ------------------------------- Screens -------------------------------- */

/** Screen route prefix → roles allowed to open it. Longest prefix wins. */
const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["admin"] },
  { prefix: "/users", roles: ["admin"] },
  { prefix: "/customers", roles: ["admin", "manager", "employee"] },
  { prefix: "/technicians/performance", roles: ["admin"] },
  { prefix: "/technicians/inventory", roles: ["admin", "manager", "employee"] },
  { prefix: "/technicians", roles: ["admin", "manager", "employee"] },
  // The technician web dashboard was removed — technicians use the mobile app,
  // so no screen route includes the technician role anymore.
  { prefix: "/orders", roles: ["admin", "manager", "employee"] },
  { prefix: "/inventory/movement", roles: ["admin"] },
  { prefix: "/inventory", roles: ["admin", "manager", "employee"] },
  { prefix: "/invoices", roles: ["admin", "manager", "employee"] },
  // Manager gets full (Admin-equivalent) access scoped to payroll
  // adjustments + monthly dues only; the rest of Finance stays admin-only.
  { prefix: "/finance/payroll-adjustments", roles: ["admin", "manager"] },
  { prefix: "/finance/monthly-dues", roles: ["admin", "manager"] },
  { prefix: "/finance", roles: ["admin"] },
  { prefix: "/reports", roles: ["admin"] },
  // Screen is open to admin/manager/employee; editing is enforced
  // server-side (only admin may PATCH /api/settings — see API_RULES below).
  { prefix: "/settings/exchange-rate", roles: ["admin", "manager", "employee"] },
  { prefix: "/settings", roles: ["admin", "manager", "employee"] },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return (
    pathname === prefix ||
    pathname.startsWith(`${prefix}/`) ||
    pathname.startsWith(`${prefix}?`)
  );
}

/** Roles allowed for a screen route, or null when the route is unrestricted. */
export function rolesForRoute(pathname: string): Role[] | null {
  const match = ROUTE_ROLES.filter((rule) => matchesPrefix(pathname, rule.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];
  return match ? match.roles : null;
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  const roles = rolesForRoute(pathname);
  return !roles || roles.includes(role);
}

/** First screen a role is allowed to open — used as its landing/redirect page. */
export function defaultRouteForRole(role: Role): string {
  const order = ["/dashboard", "/customers", "/orders", "/inventory"];
  for (const route of order) {
    if (canAccessRoute(role, route)) return route;
  }
  return "/inventory";
}

/* -------------------------------- API ----------------------------------- */

type ApiRule = {
  test: (pathname: string) => boolean;
  methods?: string[]; // undefined = any method
  roles: Role[];
};

const seg = "[^/]+";
function re(pattern: string): RegExp {
  return new RegExp(`^${pattern.replace(/:id/g, seg)}/?$`);
}

/** Ordered API rules (first match wins), mirroring the permissions table. */
const API_RULES: ApiRule[] = [
  // Public / self
  { test: (p) => p.startsWith("/api/auth/"), roles: ALL_ROLES },
  { test: (p) => re("/api/users/me").test(p), roles: ALL_ROLES },

  // Users — writes and per-user reads stay admin-only, but manager/employee
  // may read the list (GET /users) to fill the technician-assignment dropdown
  // in the requests screens.
  { test: (p) => p === "/api/users", methods: ["GET"], roles: ["admin", "manager", "employee"] },
  { test: (p) => p === "/api/users" || re("/api/users/:id").test(p), roles: ["admin"] },

  // Customers
  { test: (p) => re("/api/customers/:id").test(p), methods: ["DELETE"], roles: ["admin"] },
  {
    test: (p) => p === "/api/customers" || re("/api/customers/:id").test(p),
    roles: ["admin", "manager", "employee"],
  },

  // Requests
  { test: (p) => p === "/api/requests", methods: ["POST"], roles: ["admin", "manager", "employee"] },
  { test: (p) => p === "/api/requests", methods: ["GET"], roles: ALL_ROLES },
  {
    test: (p) => p === "/api/requests/assign-bulk",
    methods: ["POST"],
    roles: ["admin", "manager", "employee"],
  },
  { test: (p) => re("/api/requests/:id/pdf").test(p), roles: ["admin", "manager", "employee"] },
  {
    test: (p) => re("/api/requests/:id/status-history").test(p),
    roles: ["admin", "manager", "employee"],
  },
  { test: (p) => re("/api/requests/:id").test(p), methods: ["GET"], roles: ALL_ROLES },
  {
    test: (p) => re("/api/requests/:id").test(p),
    methods: ["PATCH"],
    roles: ["admin", "manager", "employee"],
  },
  // Voice records upload — technicians only
  { test: (p) => p === "/api/request/records", methods: ["POST"], roles: ["technician"] },

  // Invoices
  { test: (p) => p === "/api/invoices", methods: ["GET"], roles: ["admin", "manager", "employee"] },
  { test: (p) => p === "/api/invoices", methods: ["POST"], roles: ALL_ROLES },
  { test: (p) => re("/api/invoices/:id/pdf").test(p), roles: ALL_ROLES },
  { test: (p) => re("/api/invoices/:id").test(p), roles: ALL_ROLES },

  // Finance & payroll — admin only, except payroll adjustments + monthly
  // dues, which Manager gets the same full access to as Admin (view, edit,
  // arrest/deliver...). The rest of Finance (expenses, sales/profits, PDF
  // reports) stays admin-only.
  { test: (p) => p.startsWith("/api/finance/monthly-dues"), roles: ["admin", "manager"] },
  { test: (p) => p.startsWith("/api/finance"), roles: ["admin"] },
  { test: (p) => p.startsWith("/api/payroll-records"), roles: ["admin", "manager"] },

  // Payments — all roles
  { test: (p) => p.startsWith("/api/payments"), roles: ALL_ROLES },

  // Inventory
  { test: (p) => p === "/api/inventory/parts", methods: ["GET"], roles: ALL_ROLES },
  { test: (p) => p.startsWith("/api/inventory/parts"), roles: ["admin"] },
  { test: (p) => p.startsWith("/api/inventory/movements"), roles: ["admin"] },
  { test: (p) => re("/api/inventory/daily/:id").test(p), methods: ["DELETE"], roles: ["admin"] },
  {
    test: (p) => p.startsWith("/api/inventory/daily"),
    roles: ["admin", "manager", "employee"],
  },

  // Dashboard & report generation — admin only
  { test: (p) => p.startsWith("/api/dashboard"), roles: ["admin"] },
  { test: (p) => p.startsWith("/api/reports"), roles: ["admin"] },

  // Settings — reads for everyone, any write (PATCH, logo POST, …) admin only
  { test: (p) => p.startsWith("/api/settings"), methods: ["GET"], roles: ALL_ROLES },
  { test: (p) => p.startsWith("/api/settings"), roles: ["admin"] },
];

/** Roles allowed for an API request, or null when the endpoint is unrestricted. */
export function rolesForApi(method: string, pathname: string): Role[] | null {
  const upper = method.toUpperCase();
  for (const rule of API_RULES) {
    if (!rule.test(pathname)) continue;
    if (rule.methods && !rule.methods.includes(upper)) continue;
    return rule.roles;
  }
  return null;
}

export function canAccessApi(role: Role, method: string, pathname: string): boolean {
  const roles = rolesForApi(method, pathname);
  return !roles || roles.includes(role);
}

/* --------------------- Employee request-edit fields --------------------- */

/**
 * Fields an Employee may change via PATCH /requests/:id. Both the matrix
 * aliases (techId/date) and the actual payload keys the frontend sends
 * (technicianId/scheduledDate) are listed so the filter never strips the
 * technician assignment or the maintenance date.
 */
export const EMPLOYEE_REQUEST_FIELDS = [
  "techId",
  "technicianId",
  "priority",
  "date",
  "scheduledDate",
  "status",
] as const;
