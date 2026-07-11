"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import {
  type ModalMode,
  type RecentOrder,
  requestStatusMeta,
} from "@/features/dashboard/components/dashboard-overview.helpers";
import { Icon } from "@/lib/icons";

export function RecentOrdersTable({
  orders,
  onOpen,
}: {
  orders: RecentOrder[];
  onOpen: (order: RecentOrder, mode: ModalMode) => void;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleOrders = orders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-heading text-lg font-bold text-content">آخر الطلبات المحدثة</h2>
        <Link href="/orders" className="text-sm font-medium text-gold transition hover:text-gold-hover">
          عرض الكل
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-right">
          <thead>
            <tr className="bg-surface-2 text-xs font-normal text-content-muted">
              <th className="px-5 py-3 font-normal">رقم الطلب</th>
              <th className="px-5 py-3 font-normal">العميل</th>
              <th className="px-5 py-3 font-normal">اسم ونوع الجهاز</th>
              <th className="px-5 py-3 font-normal">الفني المسؤول</th>
              <th className="px-5 py-3 font-normal">الحالة</th>
              <th className="px-5 py-3 font-normal">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id} className="border-t border-border text-sm text-content hover:bg-gold-soft">
                <td className="px-5 py-5 font-bold text-gold">
                  #{order.requestNumber || order.id}
                </td>
                <td className="max-w-[150px] px-5 py-5">{order.client}</td>
                <td className="max-w-[150px] px-5 py-5 text-content-muted">{order.device}</td>
                <td className="max-w-[150px] px-5 py-5">{order.technician}</td>
                <td className="px-5 py-5">
                  <Badge tone={requestStatusMeta(order.status).tone} dot>
                    {requestStatusMeta(order.status).label}
                  </Badge>
                </td>
                <td className="px-5 py-5">
                  <div className="flex items-center justify-start gap-2" dir="rtl">
                    <button
                      type="button"
                      aria-label={`عرض ${order.id}`}
                      title="عرض"
                      onClick={() => onOpen(order, "view")}
                      className="rounded-sm p-1.5 text-content-muted transition hover:bg-surface-2 hover:text-content"
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label={`تعديل ${order.id}`}
                      title="تعديل"
                      onClick={() => onOpen(order, "edit")}
                      className="rounded-sm p-1.5 text-content-muted transition hover:bg-surface-2 hover:text-content"
                    >
                      <Icon name="pencil" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={currentPage}
        total={orders.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
        itemLabel="طلب"
      />
    </Card>
  );
}
