"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import type { Order, Invoice, OrderType, OrderStatus, Priority, DateFilter } from "../../types";
import { ORDERS } from "../../data/seed";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PRIORITY_LABELS,
  INVOICES_STORAGE_KEY,
} from "../../constants";
import { readStoredInvoices, writeStoredList } from "../../utils/storage";
import { matchesDateFilter, contains } from "../../utils/filter";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { FilterCard } from "../shared/FilterCard";
import { EmptyState } from "../shared/EmptyState";
import { DateFilterModal } from "../shared/DateFilterModal";
import { MaintenanceOrderModal } from "./MaintenanceOrderModal";
import { OrderDetailsModal } from "./OrderDetailsModal";

export function OrdersScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as OrderType | null;
  const initialStatus = params.get("status") as OrderStatus | null;
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [orderInvoices, setOrderInvoices] = useState<Invoice[]>(readStoredInvoices);
  const [type, setType] = useState<OrderType | "all">(initialType ?? "all");
  const [status, setStatus] = useState<OrderStatus | "all">(initialStatus ?? "all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [showForm, setShowForm] = useState(params.get("create") === "1");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const byType = type === "all" || order.type === type;
        const byStatus = status === "all" || order.status === status;
        const byPriority = priority === "all" || order.priority === priority;
        const byQuery =
          !query ||
          contains(order.id, query) ||
          contains(order.phone, query);
        const byDate = matchesDateFilter(order, dateFilter);
        return byType && byStatus && byPriority && byQuery && byDate;
      }),
    [dateFilter, orders, priority, query, status, type],
  );

  const completed = orders.filter((order) => order.status === "completed").length;
  const incompleted = orders.filter((order) => order.status === "incompleted").length;
  const pulled = orders.filter((order) => order.status === "pull-to-center").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function upsertOrder(order: Order) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id);
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current];
    });
  }

  useEffect(() => {
    writeStoredList(INVOICES_STORAGE_KEY, orderInvoices);
  }, [orderInvoices]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الطلبات"
        subtitle="متابعة الطلبات الداخلية والخارجية، الحالات، الأولويات، والفني المسؤول."
        action={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={18} />
            طلب صيانة جديد
          </Button>
        }
      />

      <KpiCards
        cards={[
          { label: "إجمالي الطلبات", value: String(orders.length), icon: "clipboard" },
          { label: "مكتملة", value: String(completed), icon: "shield", tone: "success" },
          { label: "قيد الإصلاح", value: String(incompleted), icon: "wrench", tone: "gold" },
          { label: "مسحوبة للمركز", value: String(pulled), icon: "box", tone: "info" },
        ]}
      />

      {showForm ? (
        <MaintenanceOrderModal
          onClose={() => setShowForm(false)}
          onSave={upsertOrder}
        />
      ) : null}
      {editingOrder ? (
        <MaintenanceOrderModal
          initialOrder={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={upsertOrder}
        />
      ) : null}
      {viewingOrder ? (
        <OrderDetailsModal
          order={viewingOrder}
          invoice={orderInvoices.find((invoice) => invoice.orderId === viewingOrder.id) ?? null}
          invoices={orderInvoices}
          onCreateInvoice={(invoice) =>
            setOrderInvoices((current) =>
              current.some((item) => item.id === invoice.id)
                ? current.map((item) => (item.id === invoice.id ? invoice : item))
                : [invoice, ...current],
            )
          }
          onCompleteOrder={(nextOrder) => {
            setOrders((current) =>
              current.map((item) => (item.id === nextOrder.id ? nextOrder : item)),
            );
            setViewingOrder(nextOrder);
          }}
          onClose={() => setViewingOrder(null)}
        />
      ) : null}
      {orderToDelete ? (
        <ConfirmToast
          title="تأكيد حذف الطلب"
          message={`هل تريد حذف الطلب ${orderToDelete.id} الخاص بالعميل ${orderToDelete.client}؟`}
          onCancel={() => setOrderToDelete(null)}
          onConfirm={() => {
            setOrders((current) => current.filter((item) => item.id !== orderToDelete.id));
            setOrderToDelete(null);
          }}
        />
      ) : null}
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={(filter) => {
            setDateFilter(filter);
            setPage(1);
          }}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}

      <FilterCard className="lg:grid-cols-[minmax(360px,2fr)_repeat(3,minmax(130px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الطلب أو هاتف العميل"
          aria-label="بحث الطلبات"
        />
        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value as OrderType | "all");
            setPage(1);
          }}
          aria-label="تصفية نوع الطلب"
        >
          <option value="all">كل أنواع الطلبات</option>
          <option value="external">طلبات خارجية</option>
          <option value="internal">طلبات داخلية</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "all");
            setPage(1);
          }}
          aria-label="تصفية حالة الطلب"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(event) => {
            setPriority(event.target.value as Priority | "all");
            setPage(1);
          }}
          aria-label="تصفية الأولوية"
        >
          <option value="all">كل الأولويات</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          الفترة الزمنية
        </Button>
      </FilterCard>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {[
                  "رقم الطلب",
                  "العميل",
                  "الجهاز",
                  "الفني",
                  "الحالة",
                  "الأولوية",
                  "الإجراءات",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{order.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-content">{order.client}</div>
                    <div className="text-xs text-content-muted" dir="ltr">
                      {order.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {order.device}
                    <span className="mx-1 text-border">/</span>
                    {order.brand}
                  </td>
                  <td className="px-4 py-4 text-content">{order.technician}</td>
                  <td className="px-4 py-4">
                    <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={order.priority === "emergency" ? "danger" : "neutral"}>
                      {PRIORITY_LABELS[order.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${order.id}`}
                        title="تفاصيل الطلب"
                        onClick={() => setViewingOrder(order)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`تعديل ${order.id}`}
                        title="تعديل"
                        onClick={() => setEditingOrder(order)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="pencil" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`حذف ${order.id}`}
                        title="حذف"
                        onClick={() => setOrderToDelete(order)}
                        className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <EmptyState title="لا توجد طلبات مطابقة للفلاتر." /> : null}
        <TablePagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="طلب"
        />
      </Card>
    </div>
  );
}
