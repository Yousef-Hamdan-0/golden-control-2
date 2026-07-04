"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import {
  CustomerInputSchema,
  type Customer,
  type CustomerInput,
} from "@/models/customers/customer.model";

const EMPTY_CUSTOMER_INPUT: CustomerInput = {
  name: "",
  firstPhone: "",
  secondPhone: "",
  address: "",
  locationLink: "",
};

type CustomerInputKey = keyof CustomerInput;
type CustomerFieldErrors = Partial<Record<CustomerInputKey, string>>;

function customerToInput(customer: Customer): CustomerInput {
  return {
    name: customer.name,
    firstPhone: customer.firstPhone,
    secondPhone: customer.secondPhone,
    address: customer.address,
    locationLink: customer.locationLink,
  };
}

function fieldErrorsFromIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): CustomerFieldErrors {
  return issues.reduce<CustomerFieldErrors>((errors, issue) => {
    const field = issue.path[0];
    if (
      field === "name" ||
      field === "firstPhone" ||
      field === "secondPhone" ||
      field === "address" ||
      field === "locationLink"
    ) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}

interface CustomerFormModalProps {
  customer?: Customer;
  submitting: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => void;
}

export function CustomerFormModal({
  customer,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  const [draft, setDraft] = useState<CustomerInput>(
    customer ? customerToInput(customer) : EMPTY_CUSTOMER_INPUT,
  );
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const isEdit = Boolean(customer);

  function updateDraft(field: CustomerInputKey, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit() {
    const parsed = CustomerInputSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrorsFromIssues(parsed.error.issues));
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <Modal
      title={isEdit ? "تعديل العميل" : "عميل جديد"}
      description="إدارة بيانات العميل الأساسية ومعلومات التواصل."
      onClose={onClose}
      widthClassName="max-w-3xl"
    >
      <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        {submitError ? (
          <div className="whitespace-pre-line rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger md:col-span-2">
            {submitError}
          </div>
        ) : null}
        <Field label="اسم العميل" error={errors.name}>
          <Input
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            placeholder="اسم العميل"
            disabled={submitting}
          />
        </Field>
        <Field label="الهاتف الأول" error={errors.firstPhone}>
          <Input
            dir="ltr"
            value={draft.firstPhone}
            onChange={(event) => updateDraft("firstPhone", event.target.value)}
            placeholder="09xx xxx xxx"
            disabled={submitting}
          />
        </Field>
        <Field label="الهاتف الثاني" error={errors.secondPhone}>
          <Input
            dir="ltr"
            value={draft.secondPhone ?? ""}
            onChange={(event) => updateDraft("secondPhone", event.target.value)}
            placeholder="اختياري"
            disabled={submitting}
          />
        </Field>
        <Field label="العنوان" error={errors.address}>
          <Input
            value={draft.address ?? ""}
            onChange={(event) => updateDraft("address", event.target.value)}
            placeholder="دمشق - المزة - شارع الجلاء"
            disabled={submitting}
          />
        </Field>
        <Field label="رابط الموقع" error={errors.locationLink} className="md:col-span-2">
          <Input
            dir="ltr"
            value={draft.locationLink ?? ""}
            onChange={(event) => updateDraft("locationLink", event.target.value)}
            placeholder="https://maps.google.com/?q=Damascus+Mezzeh"
            disabled={submitting}
          />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديل" : "إنشاء العميل"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
