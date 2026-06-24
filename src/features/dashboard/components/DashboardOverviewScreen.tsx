"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Icon } from "@/lib/icons";
import { readAuthSession } from "@/helpers/auth-session.helper";
import { formatMoney } from "@/lib/format/currency";
import { MaintenanceOrderModal } from "@/features/operations/components/OperationsScreens";
import { PAGE_SIZE } from "@/config/constants";

type OrderStatus = "maintenance" | "completed" | "center";
type ModalMode = "view" | "edit";

interface RecentOrder {
  id: string;
  client: string;
  phone: string;
  device: string;
  technician: string;
  status: OrderStatus;
  notes: string;
}

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  maintenance: { label: "قيد الصيانة", tone: "gold" },
  completed: { label: "مكتمل", tone: "success" },
  center: { label: "محول للمركز", tone: "info" },
};

const orderStats = [
  { label: "طلبات داخلية", value: "24", tone: "gold" },
  { label: "طلبات خارجية", value: "15", tone: "gold" },
  { label: "مكتملة", value: "18", tone: "success" },
  { label: "غير مكتملة", value: "32", tone: "gold" },
  { label: "مسحوبة إلى المركز", value: "24", tone: "gold" },
  { label: "معاد صيانتها", value: "24", tone: "gold" },
  { label: "مؤجلة إلى المركز", value: "24", tone: "gold" },
];

const chartBars = ["h-16", "h-14", "h-10", "h-12", "h-7", "h-9", "h-5"];

const initialRecentOrders: RecentOrder[] = [
  {
    id: "ORD-5542",
    client: "محمد العتيبي",
    phone: "0991 223 441",
    device: "ثلاجة LG",
    technician: "رامي سمير",
    status: "maintenance",
    notes: "تحتاج فحص كمبروسر وتأكيد كلفة القطعة قبل الإغلاق.",
  },
  {
    id: "ORD-5541",
    client: "سارة القحطاني",
    phone: "0944 772 118",
    device: "شاشة سامسونغ",
    technician: "رامي سمير",
    status: "completed",
    notes: "تم تبديل لوحة التغذية وتجربة الجهاز بنجاح.",
  },
  {
    id: "ORD-5540",
    client: "مركز الصفاء التجاري",
    phone: "011 442 0911",
    device: "غسالة ناشونال",
    technician: "رامي سمير",
    status: "center",
    notes: "الجهاز داخل المركز بانتظار وصول قطعة الغيار.",
  },
];

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

function NewCustomersCard() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-right">
          <h2 className="font-heading text-base font-bold text-content">العملاء الجدد</h2>
          <p className="mt-2 font-heading text-2xl font-bold text-gold-active">12</p>
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

function InvoiceCard({ title }: { title: string }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-sm bg-surface-2 p-3 text-gold-active">
          <Icon name="file" size={28} />
        </div>
        <div className="text-right">
          <h3 className="font-heading text-base font-bold text-content">{title}</h3>
          <p className="mt-1 text-sm text-content-muted">
            <span className="font-heading text-2xl font-bold text-content">42</span>
            فاتورة صادرة
          </p>
        </div>
      </div>
    </Card>
  );
}

function OrderSummaryCard() {
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
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinanceCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-content">
          <Icon name="wallet" className="text-gold-active" />
          الأداء المالي
        </h2>
        <p className="text-xs text-content-muted">42 فاتورة صادرة</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-md bg-gold-active p-5 text-white">
          <Icon name="wallet" className="absolute bottom-3 left-4 h-12 w-12 text-white/15" />
          <p className="text-xs text-white/80">إجمالي الإيرادات</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatMoney(12450000)}</p>
        </div>

        <div className="rounded-md border border-border bg-surface p-5 text-center">
          <p className="text-xs text-content-muted">المبيعات</p>
          <p className="mt-2 font-heading text-2xl font-bold text-gold-active">
            {formatMoney(8200000)}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface p-5 text-center">
          <p className="text-xs text-content-muted">صافي الأرباح</p>
          <p className="mt-2 font-heading text-2xl font-bold text-success">
            {formatMoney(4250000)}
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
              <p className="text-sm text-content-muted">#{order.id}</p>
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
                setDraft((value) => ({ ...value, status: event.target.value as OrderStatus }))
              }
            >
              <option value="maintenance">قيد الصيانة</option>
              <option value="completed">مكتمل</option>
              <option value="center">محول للمركز</option>
            </Select>
          </label>
          <div className="flex items-end justify-end">
            <Badge tone={ORDER_STATUS[draft.status].tone} dot>
              {ORDER_STATUS[draft.status].label}
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
          message={`هل تريد حفظ التعديلات على الطلب ${pendingEditOrder.id}؟`}
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
                <td className="px-5 py-5 font-bold text-gold">#{order.id}</td>
                <td className="px-5 py-5">{order.client}</td>
                <td className="px-5 py-5 text-content-muted">{order.device}</td>
                <td className="px-5 py-5">{order.technician}</td>
                <td className="px-5 py-5">
                  <Badge tone={ORDER_STATUS[order.status].tone} dot>
                    {ORDER_STATUS[order.status].label}
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
  const router = useRouter();
  const toast = useToast();
  const [isChecking, setIsChecking] = useState(true);
  const [orders, setOrders] = useState(initialRecentOrders);
  const [modal, setModal] = useState<{ order: RecentOrder; mode: ModalMode } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const storedSession = readAuthSession();

    if (!storedSession) {
      router.replace("/login");
      return;
    }

    setIsChecking(false);
  }, [router]);

  function handleSave(updatedOrder: RecentOrder) {
    setOrders((current) =>
      current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    );
    setModal(null);
    toast.success("تم تحديث الطلب", `تم حفظ تعديلات الطلب ${updatedOrder.id} بنجاح.`);
  }

  if (isChecking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-content-muted">
        جار التحقق...
      </div>
    );
  }

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <OrderSummaryCard />
          <FinanceCard />
        </div>

        <aside className="space-y-4">
          <NewCustomersCard />
          <InvoiceCard title="الفواتير الخارجية" />
          <InvoiceCard title="الفواتير الداخلية" />
        </aside>
      </div>

      <RecentOrdersTable orders={orders} onOpen={(order, mode) => setModal({ order, mode })} />

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
