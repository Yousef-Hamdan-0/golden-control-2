"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { TechnicianCustody } from "@/models/technician/custody.model";

export function UpdateToolsModal({
  custody,
  technicianName,
  isSaving,
  onSave,
  onClose,
}: {
  custody: TechnicianCustody;
  technicianName: string;
  isSaving: boolean;
  onSave: (tools: string) => void;
  onClose: () => void;
}) {
  const [tools, setTools] = useState(custody.tools);

  return (
    <Modal
      title="تحديث الأدوات"
      description={`أدوات عهدة الفني ${technicianName}.`}
      onClose={onClose}
      widthClassName="max-w-lg"
    >
      <form
        dir="rtl"
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (isSaving) return;
          onSave(tools.trim());
        }}
      >
        <Field label="الأدوات" htmlFor="custody-tools">
          <Textarea
            id="custody-tools"
            rows={5}
            value={tools}
            onChange={(event) => setTools(event.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
