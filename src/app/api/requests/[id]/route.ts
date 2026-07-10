import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyRepairRequest } from "@/app/api/requests/request-proxy.helper";
import { EMPLOYEE_REQUEST_FIELDS } from "@/lib/auth/permissions";
import { roleFromBearer } from "@/lib/auth/jwt-role";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyRepairRequest(request, BACKEND_API_ENDPOINTS.requests.byId(id));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const backendUrl = BACKEND_API_ENDPOINTS.requests.byId(id);

  // Employees may only change techId/priority/date/status (permissions matrix):
  // strip anything else before forwarding. Done here because the middleware
  // cannot rewrite a request body.
  if (roleFromBearer(request.headers.get("authorization")) === "employee") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "صيغة الطلب غير صالحة." },
        { status: 400 },
      );
    }
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const filtered = Object.fromEntries(
      EMPLOYEE_REQUEST_FIELDS.filter((field) => field in record).map((field) => [
        field,
        record[field],
      ]),
    );
    if (Object.keys(filtered).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "يمكن لموظف خدمة العملاء تعديل الفني والأولوية والتاريخ والحالة فقط.",
        },
        { status: 403 },
      );
    }
    return proxyRepairRequest(request, backendUrl, { bodyOverride: JSON.stringify(filtered) });
  }

  return proxyRepairRequest(request, backendUrl);
}
