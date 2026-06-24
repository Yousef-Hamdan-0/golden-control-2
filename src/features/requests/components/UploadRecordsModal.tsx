"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";
import {
  RequestRecordsInputSchema,
  type RequestRecordsInput,
} from "@/models/requests/request.model";

export function UploadRecordsModal({
  requestNumber,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: {
  requestNumber: string;
  submitting: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (input: RequestRecordsInput) => void;
}) {
  const [recordsText, setRecordsText] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const records = recordsText
      .split(/\r?\n/)
      .map((record) => record.trim())
      .filter(Boolean);
    const parsed = RequestRecordsInputSchema.safeParse({ requestNumber, records });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "البيانات غير صالحة.");
      return;
    }

    setError("");
    onSubmit(parsed.data);
  }

  return (
    <Modal
      title="رفع تسجيلات صوتية"
      description={`إضافة تسجيلات للطلب ${requestNumber}.`}
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-4 p-5">
        {submitError ? (
          <div className="whitespace-pre-line rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {submitError}
          </div>
        ) : null}
        <Textarea
          className="min-h-40"
          value={recordsText}
          onChange={(event) => {
            setRecordsText(event.target.value);
            setError("");
          }}
          placeholder="ضع كل رابط أو قيمة تسجيل صوتي في سطر مستقل"
          disabled={submitting}
        />
        {error ? <div className="text-sm text-danger">{error}</div> : null}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            <Icon name="plus" size={18} />
            {submitting ? "جاري الرفع..." : "رفع التسجيلات"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
