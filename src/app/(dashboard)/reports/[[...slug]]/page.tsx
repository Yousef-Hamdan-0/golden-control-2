import { notFound } from "next/navigation";
import { ReportPdfScreen, type ReportType } from "@/features/reports";

const REPORT_TYPES: readonly ReportType[] = [
  "orders",
  "technicians",
  "inventory-movements",
  "financial",
];

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const reportType = (slug?.[0] ?? "orders") as ReportType;

  if (!REPORT_TYPES.includes(reportType)) {
    notFound();
  }

  return <ReportPdfScreen type={reportType} />;
}
