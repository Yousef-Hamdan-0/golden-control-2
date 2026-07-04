import { NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function entityIdValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (!isRecord(value)) return "";

  const nestedId = value.id ?? value._id ?? value.userId ?? value.user_id;
  if (typeof nestedId === "string" && nestedId.trim()) return nestedId;
  if (typeof nestedId === "number") return String(nestedId);

  return "";
}

async function payrollRequestBody(request: Request, contentType: string | null) {
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  if (!hasBody) return undefined;

  if (!contentType?.includes("application/json")) {
    return request.arrayBuffer();
  }

  const rawBody = await request.text();
  if (!rawBody) return undefined;

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) return rawBody;

    const userId = entityIdValue(parsed.userId);
    const normalized = userId
      ? { ...parsed, userId }
      : parsed;

    return JSON.stringify(normalized);
  } catch {
    return rawBody;
  }
}

export async function proxyPayrollRequest(request: Request, backendUrl: string) {
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
    const body = await payrollRequestBody(request, contentType);
    const upstreamResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers({
      "Content-Type":
        upstreamResponse.headers.get("content-type") ??
        "application/json; charset=utf-8",
    });

    return new Response(responseBody.byteLength ? responseBody : null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر اتصال خادم الموقع بخادم الرواتب." },
      { status: 502 },
    );
  }
}
