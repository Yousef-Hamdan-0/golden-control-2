import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { proxyInvoiceRequest } from "@/app/api/invoices/invoice-proxy.helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyInvoiceRequest(request, `${BACKEND_API_ENDPOINTS.invoices.root}${search}`);
}

export async function POST(request: Request) {
  return proxyInvoiceRequest(request, BACKEND_API_ENDPOINTS.invoices.root);
}
