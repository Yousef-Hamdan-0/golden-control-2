import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyDashboardRequest } from "@/app/api/dashboard/dashboard-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format")?.trim();
  if (!format) {
    return NextResponse.json(
      { success: false, message: "صيغة التقرير مطلوبة." },
      { status: 400 },
    );
  }

  return proxyDashboardRequest(
    request,
    BACKEND_API_ENDPOINTS.dashboard.financialReport(format),
  );
}
