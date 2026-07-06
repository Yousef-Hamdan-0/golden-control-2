import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import {
  normalizeInvoiceResponse,
  normalizePaymentListResponse,
} from "@/models/invoices/invoice.model";
import { normalizeSettingsResponse, type Settings } from "@/models/settings/settings.model";
import { renderInvoicePdf } from "@/lib/pdf/official-documents";

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

async function fetchInvoicePayments(invoiceId: string, authorization: string) {
  try {
    const payload = await fetchJson(BACKEND_API_ENDPOINTS.payments.byInvoice(invoiceId), authorization);
    return normalizePaymentListResponse(payload);
  } catch {
    return [];
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
    const [invoicePayload, settings] = await Promise.all([
      fetchJson(BACKEND_API_ENDPOINTS.invoices.byId(id), authorization),
      fetchSettings(authorization),
    ]);
    const invoiceDetails = normalizeInvoiceResponse(invoicePayload);
    const payments = await fetchInvoicePayments(invoiceDetails.id, authorization);
    const invoice = payments.length > 0
      ? { ...invoiceDetails, payments }
      : invoiceDetails;
    const pdf = await renderInvoicePdf(invoice, settings);
    const invoiceNumber = invoice.invoiceNumber || invoice.id;

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "تعذر إنشاء ملف الفاتورة.",
      },
      { status: 502 },
    );
  }
}
