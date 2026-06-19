"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";
import { TECHNICIANS } from "../../data/seed";

export function InternalInvoiceModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="فاتورة داخلية"
      description="إنشاء فاتورة داخلية وهمية مرتبطة بطلب صيانة."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="رقم الطلب">
          <Input placeholder="ORD-0000" dir="ltr" />
        </Field>
        <Field label="اسم العميل">
          <Input placeholder="اسم العميل" />
        </Field>
        <Field label="الفني">
          <Select defaultValue="">
            <option value="">اختر الفني</option>
            {TECHNICIANS.map((tech) => (
              <option key={tech.id} value={tech.name}>
                {tech.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="الإجمالي">
          <Input type="number" min={0} placeholder="0" />
        </Field>
        <Field label="المدفوع">
          <Input type="number" min={0} placeholder="0" />
        </Field>
        <Field label="العملة">
          <Select defaultValue="SYP">
            <option value="SYP">ليرة سورية</option>
            <option value="USD">دولار</option>
          </Select>
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <Textarea className="min-h-24" placeholder="بنود أو ملاحظات الفاتورة" />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={onClose}>
            <Icon name="plus" size={18} />
            إنشاء الفاتورة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
