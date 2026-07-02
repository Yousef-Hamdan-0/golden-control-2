"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Input } from "@/components/ui/Input";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { MaintenanceOrderModal } from "@/features/operations/components/OperationsScreens";
import { PAGE_SIZE } from "@/config/constants";
import { useDashboardStatsQuery } from "@/features/dashboard/hooks/use-dashboard";
import type {
  DashboardLastRequest,
  DashboardStats,
} from "@/models/dashboard/dashboard.model";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_OPTIONS,
  REQUEST_STATUS_TONE,
  type RepairRequestStatus,
} from "@/models/requests/request.model";

type ModalMode = "view" | "edit";

interface RecentOrder {
  id: string;
  requestNumber: string;
  client: string;
  phone: string;
  device: string;
  technician: string;
  status: RepairRequestStatus;
  notes: string;
}

const chartBars = ["h-16", "h-14", "h-10", "h-12", "h-7", "h-9", "h-5"];

function requestStatusMeta(status: RepairRequestStatus): {
  label: string;
  tone: BadgeTone;
} {
  return {
    label: REQUEST_STATUS_LABELS[status],
    tone: REQUEST_STATUS_TONE[status],
  };
}

function countText(value: number | undefined, loading: boolean) {
  return loading ? "..." : String(value ?? 0);
}

function recentOrderFromDashboard(request: DashboardLastRequest): RecentOrder {
  return {
    id: request.requestId,
    requestNumber: request.requestNumber,
    client: request.customerName,
    phone: "غير متوفر",
    device: request.deviceInfo,
    technician: request.technicianName || "غير محدد",
    status: request.status,
    notes: "",
  };
}

function NewOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold-active px-4 font-heading text-sm font-bold text-white shadow-card transition hover:-translate-y-px hover:bg-gold hover:shadow-gold"
      >
        <Icon name="plus" size={18} />
        طلب صيانة جديد
      </button>
    </div>
  );
}

function NewCustomersCard({
  value,
  loading,
}: {
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-right">
          <h2 className="font-heading text-base font-bold text-content">العملاء الجدد</h2>
          <p className="mt-2 font-heading text-2xl font-bold text-gold-active">
            {countText(value, loading)}
          </p>
        </div>
        <div className="rounded-md bg-gold-soft p-2 text-gold">
          <Icon name="users" />
        </div>
      </div>

      <div className="mt-8 flex h-16 items-end gap-1.5">
        {chartBars.map((heightClass, index) => (
          <div
            key={`${heightClass}-${index}`}
            className={[
              "flex-1 rounded-t-sm",
              heightClass,
              index === 0 ? "bg-gold-active" : "bg-border",
            ].join(" ")}
          />
        ))}
      </div>
    </Card>
  );
}

function InvoiceCard({
  title,
  count,
  loading,
}: {
  title: string;
  count: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-sm bg-surface-2 p-3 text-gold-active">
          <Icon name="file" size={28} />
        </div>
        <div className="text-right">
          <h3 className="font-heading text-base font-bold text-content">{title}</h3>
          <p className="mt-1 text-sm text-content-muted">
            <span className="font-heading text-2xl font-bold text-content">
              {countText(count, loading)}
            </span>
            فاتورة صادرة
          </p>
        </div>
      </div>
    </Card>
  );
}

function OrderSummaryCard({
  stats,
  loading,
}: {
  stats: DashboardStats | undefined;
  loading: boolean;
}) {
  const orderStats: Array<{
    label: string;
    value: number | undefined;
    tone: BadgeTone;
  }> = [
    { label: "طلبات داخلية", value: stats?.internalRequestsCount, tone: "gold" },
    { label: "طلبات خارجية", value: stats?.externalRequestsCount, tone: "gold" },
    { label: "مكتملة", value: stats?.completedCount, tone: "success" },
    { label: "غير مكتملة", value: stats?.incompletedCount, tone: "gold" },
    { label: "مسحوبة إلى المركز", value: stats?.pulltocenterCount, tone: "gold" },
    { label: "معاد صيانتها", value: stats?.repeatedCount, tone: "gold" },
    { label: "مؤجلة إلى المركز", value: stats?.postponedCount, tone: "gold" },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-content">
          <Icon name="wrench" className="text-gold-active" />
          ملخص طلبات الصيانة
        </h2>
        <span className="rounded-sm bg-surface-2 px-2 py-1 text-xs text-gold-active">
          اليوم
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
        {orderStats.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-xs text-content-muted">{item.label}</p>
            <p
              className={[
                "mt-1 font-heading text-2xl font-bold",
                item.tone === "success"
                  ? "text-success"
                  : item.tone === "danger"
                    ? "text-danger"
                    : "text-gold-active",
              ].join(" ")}
            >
              {countText(item.value, loading)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinanceCard({
  stats,
  loading,
}: {
  stats: DashboardStats | undefined;
  loading: boolean;
}) {
  const invoiceCount =
    (stats?.externalInvoicesCount ?? 0) + (stats?.internalInvoicesCount ?? 0);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-content">
          <Icon name="wallet" className="text-gold-active" />
          الأداء المالي
        </h2>
        <p className="text-xs text-content-muted">
          {countText(invoiceCount, loading)} فاتورة صادرة
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-md bg-gold-active p-5 text-white">
          <Icon name="wallet" className="absolute bottom-3 left-4 h-12 w-12 text-white/15" />
          <p className="text-xs text-white/80">إجمالي الإيرادات</p>
          <p className="mt-1 font-heading text-2xl font-bold">
            {loading ? "..." : formatMoney(stats?.totalRevenuesSyp ?? 0)}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-5 text-center">
          <p className="text-xs text-content-muted">المبيعات</p>
          <p className="mt-2 font-heading text-2xl font-bold text-gold-active">
            {loading ? "..." : formatMoney(stats?.salesSyp ?? 0)}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-5 text-center">
          <p className="text-xs text-content-muted">صافي الأرباح</p>
          <p className="mt-2 font-heading text-2xl font-bold text-success">
            {loading ? "..." : formatMoney(stats?.netProfitTodaySyp ?? 0)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function OrderModal({
  order,
  mode,
  onClose,
  onSave,
}: {
  order: RecentOrder;
  mode: ModalMode;
  onClose: () => void;
  onSave: (order: RecentOrder) => void;
}) {
  const [draft, setDraft] = useState(order);
  const [pendingEditOrder, setPendingEditOrder] = useState<RecentOrder | null>(null);
  const isEdit = mode === "edit";

  return (
    <OverlayPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-order-modal-title"
        className="fixed inset-0 z-[100] flex h-dvh min-h-dvh w-dvw items-center justify-center overflow-y-auto overscroll-contain bg-black/60 px-4 py-6"
      >
        <Card className="max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="text-right">
              <h3 id="recent-order-modal-title" className="font-heading text-lg font-bold text-content">
                {isEdit ? "تعديل الطلب" : "تفاصيل الطلب"}
              </h3>
              <p className="text-sm text-content-muted">
                #{order.requestNumber || order.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-3 py-1.5 text-sm text-content-muted transition hover:bg-surface-2"
            >
              إغلاق
            </button>
          </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>العميل</span>
            <Input
              value={draft.client}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, client: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>رقم الهاتف</span>
            <Input
              value={draft.phone}
              dir="ltr"
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الجهاز</span>
            <Input
              value={draft.device}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, device: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الفني المسؤول</span>
            <Input
              value={draft.technician}
              readOnly={!isEdit}
              onChange={(event) =>
                setDraft((value) => ({ ...value, technician: event.target.value }))
              }
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الحالة</span>
            <Select
              value={draft.status}
              disabled={!isEdit}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  status: event.target.value as RepairRequestStatus,
                }))
              }
            >
              {REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end justify-end">
            <Badge tone={requestStatusMeta(draft.status).tone} dot>
              {requestStatusMeta(draft.status).label}
            </Badge>
          </div>
          <label className="space-y-1.5 text-right text-sm text-content-muted md:col-span-2">
            <span>الملاحظات</span>
            <Textarea
              className="min-h-28"
              value={draft.notes}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, notes: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Link
            href={`/orders?id=${order.id}`}
            className="text-sm font-medium text-gold transition hover:text-gold-hover"
          >
            فتح في صفحة الطلبات
          </Link>
          {isEdit ? (
            <Button type="button" onClick={() => setPendingEditOrder(draft)}>
              حفظ التعديل
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              تم
            </Button>
          )}
        </div>
      </Card>
      {pendingEditOrder ? (
        <ConfirmToast
          title="تأكيد تعديل الطلب"
          message={`هل تريد حفظ التعديلات على الطلب ${pendingEditOrder.requestNumber}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditOrder(null)}
          onConfirm={() => onSave(pendingEditOrder)}
        />
      ) : null}
      </div>
    </OverlayPortal>
  );
}

function RecentOrdersTable({
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
                <td className="px-5 py-5">{order.client}</td>
                <td className="px-5 py-5 text-content-muted">{order.device}</td>
                <td className="px-5 py-5">{order.technician}</td>
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

export function DashboardOverviewScreen() {
  const toast = useToast();
  const statsQuery = useDashboardStatsQuery();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [modal, setModal] = useState<{ order: RecentOrder; mode: ModalMode } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (!statsQuery.data) return;
    setOrders(statsQuery.data.lastRequests.map(recentOrderFromDashboard));
  }, [statsQuery.data]);

  function handleSave(updatedOrder: RecentOrder) {
    setOrders((current) =>
      current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    );
    setModal(null);
    toast.success("تم تحديث الطلب", `تم حفظ تعديلات الطلب ${updatedOrder.id} بنجاح.`);
  }

  const statsLoading = statsQuery.isLoading || (statsQuery.isFetching && !statsQuery.data);

  return (
    <div className="space-y-5 text-right">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <h2 className="font-heading text-lg font-bold text-gold-active">
            نظرة عامة على النظام
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            مرحباً بك مجدداً، إليك ملخص نشاط مركز الصيانة اليوم.
          </p>
        </section>
        <NewOrderButton onClick={() => setShowOrderModal(true)} />
      </div>

      {showOrderModal ? (
        <MaintenanceOrderModal onClose={() => setShowOrderModal(false)} />
      ) : null}

      {statsQuery.isError ? (
        <Card className="border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {getApiErrorMessage(statsQuery.error)}
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <OrderSummaryCard stats={statsQuery.data} loading={statsLoading} />
          <FinanceCard stats={statsQuery.data} loading={statsLoading} />
        </div>

        <aside className="space-y-4">
          <NewCustomersCard
            value={statsQuery.data?.newCustomersToday}
            loading={statsLoading}
          />
          <InvoiceCard
            title="الفواتير الخارجية"
            count={statsQuery.data?.externalInvoicesCount}
            loading={statsLoading}
          />
          <InvoiceCard
            title="الفواتير الداخلية"
            count={statsQuery.data?.internalInvoicesCount}
            loading={statsLoading}
          />
        </aside>
      </div>

      <RecentOrdersTable
        orders={orders}
        onOpen={(order, mode) => setModal({ order, mode })}
      />

      {modal ? (
        <OrderModal
          order={modal.order}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
