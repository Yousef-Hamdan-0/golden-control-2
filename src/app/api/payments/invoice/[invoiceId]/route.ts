import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInvoiceRequest } from "@/app/api/invoices/invoice-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ invoiceId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { invoiceId } = await params;
  const search = new URL(request.url).search;
  return proxyInvoiceRequest(
    request,
    `${BACKEND_API_ENDPOINTS.payments.byInvoice(invoiceId)}${search}`,
  );
}
