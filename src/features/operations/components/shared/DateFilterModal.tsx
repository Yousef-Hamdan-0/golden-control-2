"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { DateFilter } from "../../types";

export function DateFilterModal({
  filter,
  onApply,
  onClose,
}: {
  filter: DateFilter;
  onApply: (filter: DateFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DateFilter>(filter);

  return (
    <Modal
      title="فلترة حسب الوقت"
      description="اختر تاريخ البداية والنهاية لعرض السجلات ضمن الفترة المحددة."
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="من تاريخ">
            <DatePicker
              value={draft.from}
              onChange={(value) =>
                setDraft((current) => ({ ...current, from: value }))
              }
            />
          </Field>
          <Field label="إلى تاريخ">
            <DatePicker
              value={draft.to}
              onChange={(value) =>
                setDraft((current) => ({ ...current, to: value }))
              }
            />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft({ from: "", to: "" })}
          >
            مسح
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            تطبيق الفلتر
          </Button>
        </div>
      </div>
    </Modal>
  );
}
