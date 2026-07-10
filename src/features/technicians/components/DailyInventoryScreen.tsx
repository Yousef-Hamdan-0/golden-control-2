"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { useRole } from "@/features/auth/hooks/use-role";
import { DailyInventoryCard } from "@/features/technicians/components/DailyInventoryCard";
import { DailyInventoryForm } from "@/features/technicians/components/DailyInventoryForm";
import {
  useDailyInventoryAllQuery,
  useDailyInventoryMutations,
} from "@/features/technicians/hooks/use-daily-inventory";

export function DailyInventoryScreen() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dailyInventoryQuery = useDailyInventoryAllQuery();
  // GET /users is admin-only, so the "available technicians" filter (and the
  // delete action — DELETE /inventory/daily/:id) applies for admins only.
  const { role } = useRole();
  const isAdmin = role === "admin";
  const availableTechniciansQuery = useUsersQuery(
    {
      role: "technician",
      status: "available",
      pageSize: 1000,
    },
    isAdmin,
  );
  const { remove } = useDailyInventoryMutations();

  const availableTechnicianIds = useMemo(
    () => new Set((availableTechniciansQuery.data?.items ?? []).map((technician) => technician.id)),
    [availableTechniciansQuery.data?.items],
  );
  const activeInventoryItems = useMemo(() => {
    const items = dailyInventoryQuery.data?.items ?? [];
    if (!isAdmin) return items;
    return items.filter((entry) => availableTechnicianIds.has(entry.technicianId));
  }, [availableTechnicianIds, dailyInventoryQuery.data?.items, isAdmin]);
  const total = activeInventoryItems.length;
  const pageSize = PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const visibleItems = activeInventoryItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const isLoading =
    dailyInventoryQuery.isLoading || (isAdmin && availableTechniciansQuery.isLoading);
  const isError = dailyInventoryQuery.isError || (isAdmin && availableTechniciansQuery.isError);
  const refetch = () => {
    void dailyInventoryQuery.refetch();
    void availableTechniciansQuery.refetch();
  };

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="text-right">
          <h2 className="font-heading text-xl font-bold text-gold">المخزون اليومي</h2>
          <p className="mt-1 max-w-md text-sm text-content-muted">
            مراقبة وتسجيل الأدوات والمهمات الخاصة بفرق الصيانة الميدانية.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Icon name="plus" size={18} />
          إنشاء مخزون
        </Button>
      </div>

      {showCreateModal ? (
        <Modal
          title="إنشاء مخزون"
          description="تسجيل أدوات ومهمات فني داخل المخزون اليومي."
          onClose={() => setShowCreateModal(false)}
          widthClassName="max-w-3xl"
        >
          <div className="p-5">
            <DailyInventoryForm
              onCancel={() => setShowCreateModal(false)}
              onSaved={() => setShowCreateModal(false)}
            />
          </div>
        </Modal>
      ) : null}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="p-6 text-center text-sm text-danger">
          تعذّر تحميل المخزون.{" "}
          <button onClick={() => refetch()} className="underline">
            إعادة المحاولة
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((entry) => (
            <DailyInventoryCard
              key={entry.id}
              entry={entry}
              isDeleting={remove.isPending}
              onDelete={
                isAdmin
                  ? () =>
                      remove.mutate(entry.id, {
                        onSuccess: () =>
                          toast.success(
                            "تم حذف المخزون",
                            `تم حذف مخزون ${entry.technicianName} بنجاح.`,
                          ),
                        onError: (error) =>
                          toast.error("تعذر حذف المخزون", getApiErrorMessage(error)),
                      })
                  : undefined
              }
            />
          ))}
          {visibleItems.length === 0 ? (
            <Card className="p-6 text-center text-sm text-content-muted md:col-span-2 xl:col-span-3">
              لا توجد سجلات مخزون يومي لفنيين متاحين حالياً.
            </Card>
          ) : null}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-sm text-content-muted">
        <span>
          عرض {start}-{end} من أصل {total} سجل
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            aria-label="السابق"
          >
            <Icon name="chevron-right" size={16} />
          </Button>
          {Array.from({ length: pages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={i + 1 === currentPage ? "primary" : "outline"}
              className="h-8 w-8 px-0"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={currentPage >= pages}
            onClick={() => setPage(currentPage + 1)}
            aria-label="التالي"
          >
            <Icon name="chevron-left" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
