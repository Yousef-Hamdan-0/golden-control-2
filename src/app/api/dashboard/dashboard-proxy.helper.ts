import { NextResponse } from "next/server";

export async function proxyDashboardRequest(
  request: Request,
  backendUrls: string | readonly string[],
) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  const headers = new Headers({
    Accept: request.headers.get("accept") ?? "application/json",
    Authorization: authorization,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const urls = Array.isArray(backendUrls) ? backendUrls : [backendUrls];
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? await request.arrayBuffer() : undefined;
    let upstreamResponse: Response | null = null;

    for (const url of urls) {
      upstreamResponse = await fetch(url, {
        method: request.method,
        headers,
        body,
        cache: "no-store",
      });
      if (upstreamResponse.status !== 404) break;
    }

    if (!upstreamResponse) {
      return NextResponse.json(
        { success: false, message: "رابط لوحة التحكم غير مضبوط." },
        { status: 500 },
      );
    }

    const responseBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers({
      "Content-Type":
        upstreamResponse.headers.get("content-type") ??
        "application/json; charset=utf-8",
    });
    const contentDisposition = upstreamResponse.headers.get("content-disposition");
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }

    return new Response(responseBody.byteLength ? responseBody : null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر اتصال خادم الموقع بخادم لوحة التحكم." },
      { status: 502 },
    );
  }
}
