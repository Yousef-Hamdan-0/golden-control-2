"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Order } from "../../types";
import { downloadOrderPdf, printOrderPdf } from "../../utils/pdf";

export function OrderPdfActionsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal
      title="تم إنشاء الطلب"
      description={`تم إنشاء الطلب ${order.id}. يمكنك تنزيل ملف PDF أو طباعته الآن.`}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div className="rounded-md border border-border bg-surface-2 p-4 text-sm text-content-muted">
          <div className="font-semibold text-content">{order.client}</div>
          <div className="mt-1" dir="ltr">{order.phone}</div>
          <div className="mt-1">{order.device}</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => downloadOrderPdf(order)}>
            تنزيل PDF
          </Button>
          <Button type="button" onClick={() => printOrderPdf(order)}>
            طباعة PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
