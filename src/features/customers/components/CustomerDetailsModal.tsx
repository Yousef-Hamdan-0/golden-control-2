"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import { Icon } from "@/lib/icons";
import type { Customer } from "@/models/customers/customer.model";
import {
  formatApiDate,
  PRIORITY_LABELS,
  requestStatusLabel,
  requestStatusTone,
} from "@/features/customers/components/customer-display.helpers";

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isLoading: boolean;
  errorMessage?: string;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export function CustomerDetailsModal({
  customer,
  isLoading,
  errorMessage,
  onClose,
  onEdit,
}: CustomerDetailsModalProps) {
  const [requestsPage, setRequestsPage] = useState(1);
  const requests = useMemo(() => customer?.requests ?? [], [customer]);
  const pages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const currentPage = Math.min(requestsPage, pages);
  const visibleRequests = requests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <Modal
      title={customer?.name ?? "تفاصيل العميل"}
      description="معلومات العميل وسجل طلبات الإصلاح المرتبطة به."
      onClose={onClose}
      widthClassName="max-w-5xl"
    >
      <div className="space-y-5 p-5">
        {errorMessage ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            تعذّر تحميل تفاصيل العميل. {errorMessage}
          </div>
        ) : null}

        {!customer && isLoading ? (
          <Card className="bg-surface-2 p-5 text-center text-sm text-content-muted shadow-none">
            جاري تحميل بيانات العميل...
          </Card>
        ) : null}

        {customer ? (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">معرّف العميل</div>
                <div className="mt-1 font-semibold text-gold" dir="ltr">
                  {customer.customerNumber}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">الهاتف الأول</div>
                <div className="mt-1 font-semibold text-content" dir="ltr">
                  {customer.firstPhone || "غير محدد"}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">الهاتف الثاني</div>
                <div className="mt-1 font-semibold text-content" dir="ltr">
                  {customer.secondPhone || "غير محدد"}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">سجل الإصلاح</div>
                <div className="mt-1 font-semibold text-content">{requests.length}</div>
              </Card>
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="text-sm font-semibold text-content">العنوان</div>
              <p className="mt-1 text-sm text-content-muted">
                {customer.address || "غير محدد"}
              </p>
              {customer.locationLink ? (
                <a
                  href={customer.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-sm text-gold underline-offset-4 hover:underline"
                  dir="ltr"
                >
                  {customer.locationLink}
                </a>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-content">سجل الإصلاح</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(customer)}>
                  <Icon name="pencil" size={16} />
                  تعديل العميل
                </Button>
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-[820px] w-full text-right text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-content-muted">
                      {["رقم الطلب", "الأولوية", "الحالة", "الموعد", "وصف العطل", "ملاحظات"].map(
                        (header) => (
                          <th key={header} className="px-4 py-3 font-medium">
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={6}>
                          جاري تحميل سجل الإصلاح...
                        </td>
                      </tr>
                    ) : visibleRequests.length ? (
                      visibleRequests.map((request) => (
                        <tr key={request.id} className="border-t border-border">
                          <td className="px-4 py-3 font-bold text-gold" dir="ltr">
                            {request.requestNumber}
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {PRIORITY_LABELS[request.priority] ??
                              (request.priority || "غير محدد")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={requestStatusTone(request)} dot>
                              {requestStatusLabel(request)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {formatApiDate(request.scheduledDate)}
                          </td>
                          <td className="max-w-[260px] px-4 py-3 text-content">
                            {request.faultDescription || "غير محدد"}
                          </td>
                          <td className="max-w-[240px] px-4 py-3 text-content-muted">
                            {request.notes || "لا توجد"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={6}>
                          لا يوجد سجل إصلاح لهذا العميل.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={currentPage}
                total={requests.length}
                pageSize={PAGE_SIZE}
                onPage={setRequestsPage}
                itemLabel="طلب"
              />
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
