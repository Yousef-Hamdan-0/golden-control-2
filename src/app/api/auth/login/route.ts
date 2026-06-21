import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { LoginRequestSchema } from "@/models/auth/login.model";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  const parsedRequest = LoginRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedRequest.error.issues[0]?.message ?? "بيانات الدخول غير صالحة.",
      },
      { status: 422 },
    );
  }

  if (!BACKEND_API_ENDPOINTS.auth.login.startsWith("http")) {
    return NextResponse.json(
      {
        success: false,
        message: "رابط خادم الـ API غير مضبوط في NEXT_PUBLIC_API_URL.",
      },
      { status: 500 },
    );
  }

  try {
    const upstreamResponse = await fetch(BACKEND_API_ENDPOINTS.auth.login, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedRequest.data),
      cache: "no-store",
    });
    const responseBody = await upstreamResponse.text();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "تعذر اتصال خادم الموقع بخادم الـ API.",
      },
      { status: 502 },
    );
  }
}
