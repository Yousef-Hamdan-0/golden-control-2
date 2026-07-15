import { NextResponse, type NextRequest } from "next/server";
import { canAccessApi } from "@/lib/auth/permissions";
import { roleFromBearer } from "@/lib/auth/jwt-role";

export const config = {
  matcher: ["/api/:path*"],
};

/**
 * Server-side role gate for the API proxy (part b of the roles task): rejects any
 * request whose role is not allowed to reach the endpoint, even when called
 * directly outside the UI. The Employee field restriction on PATCH /requests/:id
 * is enforced in src/app/api/requests/[id]/route.ts (middleware cannot rewrite
 * a request body).
 */
export function proxy(request: NextRequest) {
  const role = roleFromBearer(request.headers.get("authorization"));

  // No decodable role (login, or an absent/opaque token) → defer to the backend.
  if (!role) return NextResponse.next();

  if (!canAccessApi(role, request.method, request.nextUrl.pathname)) {
    return NextResponse.json(
      { success: false, message: "ليس لديك صلاحية للوصول إلى هذا المورد." },
      { status: 403 },
    );
  }

  return NextResponse.next();
}
