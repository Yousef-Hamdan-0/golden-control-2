import { ApiError } from "@/helpers/api.helper";

/**
 * requests/technicians/inventory-movements reports only take `from`/`to` as
 * user input, so any 400 that reaches here (past the proxy's own "both
 * dates are required" check) means the backend rejected the chosen period —
 * e.g. it's too far in the past or spans more than the allowed window. The
 * exact backend wording isn't confirmed (no live-auth access to check it),
 * so this message is intentionally general rather than guessing phrasing.
 */
const STATUS_MESSAGES: Partial<Record<number, string>> = {
  400: "الفترة الزمنية المحددة غير صالحة. يرجى اختيار فترة أحدث وضمن نطاق مسموح ثم إعادة المحاولة.",
  401: "انتهت صلاحية الجلسة أو لم يتم تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.",
  403: "لا تملك صلاحية الوصول إلى هذا التقرير.",
  404: "تعذر العثور على بيانات هذا التقرير.",
  500: "حدث خطأ في خادم التقارير. حاول مرة أخرى لاحقاً.",
  502: "تعذر الاتصال بخادم التقارير. حاول مرة أخرى لاحقاً.",
};

/** Shared by the requests/technicians/inventory-movements report screens so
 * the user always sees a clear Arabic message instead of the raw text/code
 * the backend returned. */
export function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // status 0 = connection/timeout failure caught before any server
    // response; authenticated-api.helper.ts already produces an Arabic
    // message for this case, safe to show as-is.
    if (error.status === 0) return error.message;

    return (
      STATUS_MESSAGES[error.status] ?? "تعذر تحميل التقرير من الخادم. حاول مرة أخرى لاحقاً."
    );
  }

  if (error instanceof Error) return error.message;

  return "حدث خطأ غير متوقع أثناء تحميل التقرير. حاول مرة أخرى.";
}
