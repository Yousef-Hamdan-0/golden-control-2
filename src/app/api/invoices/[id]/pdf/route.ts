import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInvoiceRequest } from "@/app/api/invoices/invoice-proxy.helper";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyInvoiceRequest(request, BACKEND_API_ENDPOINTS.invoices.pdf(id));
}
