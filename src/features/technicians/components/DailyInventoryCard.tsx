"use client";

import { Card } from "@/components/ui/Card";
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
    <div className="flex items-center justify-end gap-2 text-sm font-semibold text-gold">
      <span>{children}</span>
      <Icon name="wrench" size={15} />
    </div>
  );
}

export function DailyInventoryCard({ entry }: { entry: DailyInventory }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header: technician */}
      <div className="border-b border-border bg-surface-2 px-4 py-3 text-center">
        <div className="text-sm font-bold text-content">{entry.technicianName}</div>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-content-muted" dir="ltr">
          {entry.technicianPhone}
          <Icon name="phone" size={13} />
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
          <div className="rounded-md bg-surface-2 p-3 text-right">
            <div className="mb-1 flex items-center justify-end gap-2 text-sm font-semibold text-gold">
              <span>ملاحظات</span>
              <Icon name="file" size={14} />
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
                <li key={i} className="flex items-center justify-between text-content-muted">
                  <span className="tabular-nums">{t.qty}</span>
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
