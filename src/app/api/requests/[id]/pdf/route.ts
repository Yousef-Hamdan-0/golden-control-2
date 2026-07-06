import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { normalizeRepairRequestResponse } from "@/models/requests/request.model";
import { normalizeSettingsResponse, type Settings } from "@/models/settings/settings.model";
import { renderRequestPdf } from "@/lib/pdf/official-documents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function fetchJson(backendUrl: string, authorization: string) {
  const response = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authorization,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("تعذر جلب البيانات من الخادم.");
  }

  return response.json();
}

async function fetchSettings(authorization: string): Promise<Settings | null> {
  try {
    const payload = await fetchJson(BACKEND_API_ENDPOINTS.settings.root, authorization);
    return normalizeSettingsResponse(payload);
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  try {
    const [requestPayload, settings] = await Promise.all([
      fetchJson(BACKEND_API_ENDPOINTS.requests.byId(id), authorization),
      fetchSettings(authorization),
    ]);
    const repairRequest = normalizeRepairRequestResponse(requestPayload);
    const pdf = await renderRequestPdf(repairRequest, settings);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="request-${repairRequest.requestNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "تعذر إنشاء ملف الطلب.",
      },
      { status: 502 },
    );
  }
}
