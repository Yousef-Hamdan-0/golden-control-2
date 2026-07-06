"use client";

import { useEffect, useState } from "react";
import type { BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { useDashboardStatsQuery } from "@/features/dashboard/hooks/use-dashboard";
import { DashboardOrderModal } from "@/features/dashboard/components/DashboardOrderModal";
import { RecentOrdersTable } from "@/features/dashboard/components/RecentOrdersTable";
import { RequestFormModal } from "@/features/requests/components/RequestFormModal";
import { useRequestMutations } from "@/features/requests/hooks/use-requests";
import {
  type ModalMode,
  type RecentOrder,
  recentOrderFromDashboard,
} from "@/features/dashboard/components/dashboard-overview.helpers";
import type { DashboardStats } from "@/models/dashboard/dashboard.model";
import type { RepairRequestInput } from "@/models/requests/request.model";

const chartBars = ["h-16", "h-14", "h-10", "h-12", "h-7", "h-9", "h-5"];

function countText(value: number | undefined, loading: boolean) {
  return loading ? "..." : String(value ?? 0);
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
    { label: "غير الناجحة", value: stats?.notrepairableCount, tone: "danger" },
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

export function DashboardOverviewScreen() {
  const toast = useToast();
  const statsQuery = useDashboardStatsQuery();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [modal, setModal] = useState<{ order: RecentOrder; mode: ModalMode } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { create } = useRequestMutations();

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

  function submitCreate(input: RepairRequestInput) {
    create.mutate(input, {
      onSuccess: () => {
        setShowOrderModal(false);
        void statsQuery.refetch();
        toast.success("تم إنشاء الطلب", "تمت إضافة طلب الصيانة بنجاح.");
      },
      onError: (error) => toast.error("تعذر إنشاء الطلب", getApiErrorMessage(error)),
    });
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
        <RequestFormModal
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : undefined}
          onClose={() => setShowOrderModal(false)}
          onSubmit={submitCreate}
        />
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
        <DashboardOrderModal
          order={modal.order}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
