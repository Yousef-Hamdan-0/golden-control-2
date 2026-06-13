import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";

interface ConfirmToastProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmToast({
  title,
  message,
  confirmLabel = "تأكيد الحذف",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmToastProps) {
  return (
    <div className="fixed inset-x-0 top-4 z-[140] flex justify-center px-4" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-xl rounded-md border border-danger/25 bg-surface p-4 text-right shadow-gold">
        <div className="flex items-start gap-3" dir="rtl">
          <div className="rounded-md bg-danger-soft p-2 text-danger">
            <Icon name="alert" size={20} />
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
          <Button type="button" variant="danger" size="sm" onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
