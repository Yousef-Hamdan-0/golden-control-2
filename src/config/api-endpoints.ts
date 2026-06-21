/**
 * Central API registry.
 * Change the base URL in `.env.local`, and keep every backend path in this file.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://al-khbaraa-backend-production.up.railway.app"
).replace(/\/+$/, "");

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
  },
  users: {
    root: "/api/users",
    me: "/api/users/me",
    byId: (id: string) => `/api/users/${encodeURIComponent(id)}`,
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
  users: API_ROUTES.users,
} as const;

export const BACKEND_API_ENDPOINTS = {
  auth: {
    // Used only by the server-side Next.js proxy route.
    login: createApiUrl(API_ROUTES.auth.login),
    refresh: createApiUrl(API_ROUTES.auth.refresh),
    logout: createApiUrl(API_ROUTES.auth.logout),
  },
  users: {
    root: createApiUrl(API_ROUTES.users.root),
    me: createApiUrl(API_ROUTES.users.me),
    byId: (id: string) => createApiUrl(API_ROUTES.users.byId(id)),
  },
} as const;
