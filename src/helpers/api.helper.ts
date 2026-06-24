type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;

  const directMessage = payload.message ?? payload.error;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  if (isRecord(payload.data)) {
    const nestedMessage = payload.data.message ?? payload.data.error;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return undefined;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestApi(
  url: string,
  options: RequestInit,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    }

    if (!response.ok) {
      throw new ApiError(
        extractMessage(payload) ?? "تعذر إكمال الطلب من الخادم.",
        response.status,
        payload,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.");
    }

    throw new ApiError("تعذر الاتصال بالخادم. تحقق من رابط الـ API والاتصال بالشبكة.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getApiErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  if (
    error.message.includes("requests_request_number_key") ||
    error.message.includes("فشل إنشاء رقم طلب فريد")
  ) {
    return "تعذر توليد رقم طلب فريد من الخادم. حاول مرة أخرى بعد لحظة، وإذا تكرر الخطأ يحتاج مولّد أرقام الطلبات في الـ Backend إلى تعديل.";
  }

  if (
    error.message.includes("يوجد مخزون يومي لهذا الفني") ||
    error.message.toLowerCase().includes("daily inventory")
  ) {
    return "يوجد مخزون يومي لهذا الفني حالياً. احذف السجل الموجود أولاً ثم أعد المحاولة.";
  }

  return error.message;
}
