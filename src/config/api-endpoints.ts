/**
 * Central API registry.
 * Change the base URL in `.env.local`, and keep every backend path in this file.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://al-khbaraa-backend-productions.up.railway.app"
).replace(/\/+$/, "");

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
  },
  dashboard: {
    stats: "/api/dashboard/stats",
    technicianPerformance: "/api/dashboard/technician-performance",
    financialReport: (format: string) =>
      `/api/dashboard/financial-report?${new URLSearchParams({ format })}`,
  },
  users: {
    root: "/api/users",
    me: "/api/users/me",
    byId: (id: string) => `/api/users/${encodeURIComponent(id)}`,
  },
  customers: {
    root: "/api/customers",
    byId: (id: string) => `/api/customers/${encodeURIComponent(id)}`,
  },
  requests: {
    root: "/api/requests",
    byId: (id: string) => `/api/requests/${encodeURIComponent(id)}`,
    pdf: (id: string) => `/api/requests/${encodeURIComponent(id)}/pdf`,
    statusHistory: (id: string) =>
      `/api/requests/${encodeURIComponent(id)}/status-history`,
    records: "/api/request/records",
  },
  invoices: {
    root: "/api/invoices",
    byId: (id: string) => `/api/invoices/${encodeURIComponent(id)}`,
    pdf: (id: string) => `/api/invoices/${encodeURIComponent(id)}/pdf`,
    refund: (id: string) => `/api/invoices/${encodeURIComponent(id)}/refund`,
  },
  payments: {
    root: "/api/payments",
    byInvoice: (invoiceId: string) =>
      `/api/payments/invoice/${encodeURIComponent(invoiceId)}`,
  },
  payrollRecords: {
    root: "/api/payroll-records",
    byId: (id: string) => `/api/payroll-records/${encodeURIComponent(id)}`,
  },
  finance: {
    expenses: "/api/finance/expenses",
    expenseById: (id: string) => `/api/finance/expenses/${encodeURIComponent(id)}`,
    summary: "/api/finance/summary",
    reportPdf: "/api/finance/reports/pdf",
  },
  inventory: {
    daily: "/api/inventory/daily",
    dailyById: (id: string) => `/api/inventory/daily/${encodeURIComponent(id)}`,
    parts: "/api/inventory/parts",
    partById: (id: string) => `/api/inventory/parts/${encodeURIComponent(id)}`,
    movements: "/api/inventory/movements",
  },
  technician: {
    myRequests: "/api/technician/my-requests",
    requestStatus: (id: string) =>
      `/api/technician/requests/${encodeURIComponent(id)}/status`,
  },
  reports: {
    requests: "/api/reports/requests",
    technicians: "/api/reports/technicians",
    inventoryMovements: "/api/reports/inventory-movements",
    financial: "/api/reports/financial",
  },
  settings: {
    root: "/api/settings",
    logo: "/api/settings/logo",
  },
} as const;

function createApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const API_ENDPOINTS = {
  auth: {
    // Browser requests stay on the same origin to avoid backend CORS failures.
    login: API_ROUTES.auth.login,
    refresh: API_ROUTES.auth.refresh,
    logout: API_ROUTES.auth.logout,
  },
  dashboard: API_ROUTES.dashboard,
  users: API_ROUTES.users,
  customers: API_ROUTES.customers,
  requests: API_ROUTES.requests,
  invoices: API_ROUTES.invoices,
  payments: API_ROUTES.payments,
  payrollRecords: API_ROUTES.payrollRecords,
  finance: API_ROUTES.finance,
  inventory: API_ROUTES.inventory,
  technician: API_ROUTES.technician,
  settings: API_ROUTES.settings,
} as const;

export const BACKEND_API_ENDPOINTS = {
  auth: {
    // Used only by the server-side Next.js proxy route.
    login: createApiUrl(API_ROUTES.auth.login),
    refresh: createApiUrl(API_ROUTES.auth.refresh),
    logout: createApiUrl(API_ROUTES.auth.logout),
  },
  dashboard: {
    // Dashboard backend routes are currently namespaced under /api/api.
    stats: [
      createApiUrl("/api/api/dashboard/stats"),
      createApiUrl("/api/dashboard/stats"),
    ],
    technicianPerformance: [
      createApiUrl("/api/api/dashboard/technician-performance"),
      createApiUrl("/api/dashboard/technician-performance"),
    ],
    financialReport: (format: string) =>
      [
        createApiUrl("/api/api/dashboard/financial-report"),
        createApiUrl("/api/dashboard/financial-report"),
      ].map((url) => `${url}?${new URLSearchParams({ format })}`),
  },
  users: {
    root: createApiUrl(API_ROUTES.users.root),
    me: createApiUrl(API_ROUTES.users.me),
    byId: (id: string) => createApiUrl(API_ROUTES.users.byId(id)),
  },
  customers: {
    root: createApiUrl(API_ROUTES.customers.root),
    byId: (id: string) => createApiUrl(API_ROUTES.customers.byId(id)),
  },
  requests: {
    root: createApiUrl(API_ROUTES.requests.root),
    byId: (id: string) => createApiUrl(API_ROUTES.requests.byId(id)),
    pdf: (id: string) => createApiUrl(API_ROUTES.requests.pdf(id)),
    statusHistory: (id: string) =>
      createApiUrl(API_ROUTES.requests.statusHistory(id)),
    records: createApiUrl(API_ROUTES.requests.records),
  },
  invoices: {
    root: createApiUrl(API_ROUTES.invoices.root),
    byId: (id: string) => createApiUrl(API_ROUTES.invoices.byId(id)),
    pdf: (id: string) => createApiUrl(API_ROUTES.invoices.pdf(id)),
    refund: (id: string) => createApiUrl(API_ROUTES.invoices.refund(id)),
  },
  payments: {
    root: createApiUrl(API_ROUTES.payments.root),
    byInvoice: (invoiceId: string) => createApiUrl(API_ROUTES.payments.byInvoice(invoiceId)),
  },
  payrollRecords: {
    root: createApiUrl(API_ROUTES.payrollRecords.root),
    byId: (id: string) => createApiUrl(API_ROUTES.payrollRecords.byId(id)),
  },
  finance: {
    expenses: createApiUrl(API_ROUTES.finance.expenses),
    expenseById: (id: string) => createApiUrl(API_ROUTES.finance.expenseById(id)),
    summary: createApiUrl(API_ROUTES.finance.summary),
    reportPdf: createApiUrl(API_ROUTES.finance.reportPdf),
  },
  inventory: {
    daily: createApiUrl(API_ROUTES.inventory.daily),
    dailyById: (id: string) => createApiUrl(API_ROUTES.inventory.dailyById(id)),
    parts: createApiUrl(API_ROUTES.inventory.parts),
    partById: (id: string) => createApiUrl(API_ROUTES.inventory.partById(id)),
    movements: createApiUrl(API_ROUTES.inventory.movements),
  },
  technician: {
    myRequests: createApiUrl(API_ROUTES.technician.myRequests),
    requestStatus: (id: string) => createApiUrl(API_ROUTES.technician.requestStatus(id)),
  },
  reports: {
    requests: createApiUrl(API_ROUTES.reports.requests),
    technicians: createApiUrl(API_ROUTES.reports.technicians),
    inventoryMovements: createApiUrl(API_ROUTES.reports.inventoryMovements),
    financial: createApiUrl(API_ROUTES.reports.financial),
  },
  settings: {
    root: createApiUrl(API_ROUTES.settings.root),
    logo: createApiUrl(API_ROUTES.settings.logo),
  },
} as const;
