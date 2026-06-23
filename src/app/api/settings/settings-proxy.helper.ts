import { NextResponse } from "next/server";

export async function proxySettingsRequest(request: Request, backendUrl: string) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: authorization,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const upstreamResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const responseBody = await upstreamResponse.text();

    return new Response(responseBody || null, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ??
          "application/json; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر اتصال خادم الموقع بخادم الإعدادات." },
      { status: 502 },
    );
  }
}
