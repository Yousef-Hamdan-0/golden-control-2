"use client";

import { Button } from "@/components/ui/Button";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { Icon, type IconName } from "@/lib/icons";

type ConfirmTone = "danger" | "gold";

interface ConfirmToastProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TONE_STYLES: Record<
  ConfirmTone,
  {
    border: string;
    iconWrap: string;
    icon: IconName;
    confirmVariant: "primary" | "danger";
  }
> = {
  danger: {
    border: "border-danger/25",
    iconWrap: "bg-danger-soft text-danger",
    icon: "alert",
    confirmVariant: "danger",
  },
  gold: {
    border: "border-gold/25",
    iconWrap: "bg-gold-soft text-gold",
    icon: "pencil",
    confirmVariant: "primary",
  },
};

export function ConfirmToast({
  title,
  message,
  confirmLabel = "تأكيد الحذف",
  cancelLabel = "إلغاء",
  tone = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmToastProps) {
  const styles = TONE_STYLES[tone];

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[140] flex h-dvh min-h-dvh w-dvw items-center justify-center overflow-y-auto overscroll-contain bg-black/10 px-4 py-6 backdrop-blur-[1px]"
        role="alertdialog"
        aria-live="assertive"
      >
        <div className={`w-full max-w-xl rounded-md border ${styles.border} bg-surface p-4 text-right shadow-[0_14px_40px_rgba(15,23,42,0.12)]`}>
          <div className="flex items-start gap-3" dir="rtl">
            <div className={`rounded-md p-2 ${styles.iconWrap}`}>
              <Icon name={styles.icon} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-base font-bold text-content">{title}</h3>
              <p className="mt-1 text-sm text-content-muted">{message}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="button" variant={styles.confirmVariant} size="sm" onClick={onConfirm} disabled={isLoading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
