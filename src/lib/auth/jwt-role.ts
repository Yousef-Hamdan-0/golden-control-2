import { normalizeRole, type Role } from "@/lib/auth/permissions";

/** Base64url-decode a JWT segment (works in the Edge/middleware runtime). */
function decodeSegment(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  try {
    return decodeURIComponent(
      Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
    );
  } catch {
    return binary;
  }
}

function extractRole(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    record.role,
    Array.isArray(record.roles) ? record.roles[0] : record.roles,
    (record.user as Record<string, unknown> | undefined)?.role,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    if (candidate && typeof candidate === "object" && "name" in candidate) {
      const name = (candidate as { name?: unknown }).name;
      if (typeof name === "string") return name;
    }
  }
  return null;
}

/**
 * Read the (signed) role claim from a Bearer JWT. The token is signed by the
 * backend, so its role claim is trustworthy for gating. Returns null when the
 * token is missing/opaque/undecodable — callers then defer to the backend.
 */
export function roleFromBearer(authorization: string | null): Role | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const parts = authorization.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    return normalizeRole(extractRole(JSON.parse(decodeSegment(parts[1]))));
  } catch {
    return null;
  }
}
