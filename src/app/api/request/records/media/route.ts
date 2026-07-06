import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/config/api-endpoints";

export const dynamic = "force-dynamic";

function resolveBackendMediaUrl(value: string | null) {
  const rawUrl = value?.trim();
  if (!rawUrl) return null;

  try {
    const backendBase = new URL(API_BASE_URL);
    const mediaUrl = new URL(rawUrl, backendBase);
    if (mediaUrl.origin !== backendBase.origin) return null;
    return mediaUrl.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  const mediaUrl = resolveBackendMediaUrl(new URL(request.url).searchParams.get("url"));
  if (!mediaUrl) {
    return NextResponse.json(
      { success: false, message: "رابط التسجيل الصوتي غير صالح." },
      { status: 400 },
    );
  }

  try {
    const upstreamResponse = await fetch(mediaUrl, {
      headers: {
        Accept: request.headers.get("accept") ?? "audio/*",
        Authorization: authorization,
      },
      cache: "no-store",
    });
    const responseBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = upstreamResponse.headers.get("content-type");
    const contentLength = upstreamResponse.headers.get("content-length");

    responseHeaders.set("Content-Type", contentType ?? "audio/mpeg");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new Response(responseBody.byteLength ? responseBody : null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر تحميل التسجيل الصوتي من الخادم." },
      { status: 502 },
    );
  }
}
