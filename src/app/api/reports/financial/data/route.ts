import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";

export const dynamic = "force-dynamic";

/**
 * JSON proxy for the range financial report (GET /api/reports/financial).
 * The finance screens read their period summary from here; the sibling
 * /api/reports/financial route (dynamic [type]) renders the same data as PDF.
 */
export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  const { search } = new URL(request.url);

  try {
    const upstreamResponse = await fetch(
      `${BACKEND_API_ENDPOINTS.reports.financial}${search}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
        cache: "no-store",
      },
    );
    const body = await upstreamResponse.arrayBuffer();

    return new Response(body.byteLength ? body : null, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ??
          "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر اتصال خادم الموقع بخادم التقارير." },
      { status: 502 },
    );
  }
}
