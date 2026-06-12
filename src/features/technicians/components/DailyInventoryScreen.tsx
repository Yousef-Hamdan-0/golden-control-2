"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "@/lib/icons";
import { DailyInventoryCard } from "@/features/technicians/components/DailyInventoryCard";
import { DailyInventoryForm } from "@/features/technicians/components/DailyInventoryForm";
import {
  useDailyInventoryMutations,
  useDailyInventoryQuery,
} from "@/features/technicians/hooks/use-daily-inventory";

export function DailyInventoryScreen() {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading, isError, refetch } = useDailyInventoryQuery(page);
  const { remove } = useDailyInventoryMutations();

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 6;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

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
          {data?.items.map((entry) => (
            <DailyInventoryCard
              key={entry.id}
              entry={entry}
              isDeleting={remove.isPending}
              onDelete={() => remove.mutate(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-sm text-content-muted">
        <span>
          عرض {start}-{end} من أصل {total} فني
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="السابق"
          >
            <Icon name="chevron-right" size={16} />
          </Button>
          {Array.from({ length: pages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={i + 1 === page ? "primary" : "outline"}
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
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            aria-label="التالي"
          >
            <Icon name="chevron-left" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
