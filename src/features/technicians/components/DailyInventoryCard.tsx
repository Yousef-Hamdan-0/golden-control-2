"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Icon } from "@/lib/icons";
import type { DailyInventory } from "@/models/technician/daily-inventory.model";

function formatCreated(iso: string): string {
  const d = new Date(iso);
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "ص" : "م";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m}${period} ${date}`;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gold">
      <Icon name="wrench" size={15} />
      <span>{children}</span>
    </div>
  );
}

export function DailyInventoryCard({
  entry,
  onDelete,
  isDeleting = false,
}: {
  entry: DailyInventory;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card className="flex flex-col overflow-hidden">
      {confirmDelete ? (
        <ConfirmToast
          title="تأكيد حذف المخزون"
          message={`هل تريد حذف مخزون ${entry.technicianName} من المخزون اليومي؟`}
          isLoading={isDeleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete?.();
          }}
        />
      ) : null}
      {/* Header: technician */}
      <div className="border-b border-border bg-surface-2 px-4 py-3 text-right">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-content">{entry.technicianName}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-content-muted">
              <Icon name="phone" size={13} />
              <span dir="ltr">{entry.technicianPhone}</span>
            </div>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleting}
              aria-label={`حذف مخزون ${entry.technicianName}`}
              title="حذف"
              className="rounded-sm p-1.5 text-danger transition hover:bg-danger-soft disabled:opacity-50"
            >
              <Icon name="trash" size={17} />
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Created time */}
        <div className="flex items-center justify-end gap-1.5 text-xs text-content-muted">
          <span>وقت الإنشاء {formatCreated(entry.createdAt)}</span>
          <Icon name="clock" size={14} />
        </div>

        {/* Tools */}
        <div className="space-y-1.5 text-right">
          <SectionTitle>الأدوات</SectionTitle>
          <p className="text-sm leading-relaxed text-content-muted">{entry.tools}</p>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="rounded-md bg-surface-2 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gold">
              <Icon name="file" size={14} />
              <span>ملاحظات</span>
            </div>
            <p className="text-sm leading-relaxed text-content-muted">{entry.notes}</p>
          </div>
        )}

        {/* Used tools */}
        {entry.usedTools.length > 0 && (
          <div className="space-y-1.5 text-right">
            <SectionTitle>الأدوات المستخدمة</SectionTitle>
            <ul className="space-y-1 text-sm">
              {entry.usedTools.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-content-muted">
                  <span>{t.name}</span>
                  <span className="tabular-nums" dir="ltr">{t.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
