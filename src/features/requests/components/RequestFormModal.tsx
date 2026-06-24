"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import {
  RepairRequestInputSchema,
  REQUEST_PRIORITY_OPTIONS,
  REQUEST_STATUS_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  type RepairRequest,
  type RepairRequestInput,
  type RepairRequestPriority,
  type RepairRequestStatus,
  type RepairRequestType,
} from "@/models/requests/request.model";

type RequestFormDraft = {
  customer: {
    name: string;
    firstPhone: string;
    secondPhone: string;
    address: string;
    locationLink: string;
  };
  type: RepairRequestType;
  priority: RepairRequestPriority;
  faultDescription: string;
  notes: string;
  scheduledDate: string;
  devices: Array<{
    deviceType: string;
    deviceName: string;
    brand: string;
    model: string;
  }>;
  technicianId: string;
  status?: RepairRequestStatus;
};

const EMPTY_REQUEST_INPUT: RequestFormDraft = {
  customer: {
    name: "",
    firstPhone: "",
    secondPhone: "",
    address: "",
    locationLink: "",
  },
  type: "external",
  priority: "medium",
  faultDescription: "",
  notes: "",
  scheduledDate: "",
  devices: [{ deviceType: "", deviceName: "", brand: "", model: "" }],
  technicianId: "",
};

const EMPTY_DEVICE = { deviceType: "", deviceName: "", brand: "", model: "" };

type FieldErrors = Record<string, string>;

function errorsFromIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    errors[issue.path.join(".")] = issue.message;
    return errors;
  }, {});
}

function emptyDraft(defaultType: RepairRequestType = EMPTY_REQUEST_INPUT.type): RequestFormDraft {
  return {
    ...EMPTY_REQUEST_INPUT,
    type: defaultType,
    customer: { ...EMPTY_REQUEST_INPUT.customer },
    devices: EMPTY_REQUEST_INPUT.devices.map((device) => ({ ...device })),
  };
}

function initialDraft(request?: RepairRequest, defaultType?: RepairRequestType): RequestFormDraft {
  if (!request) return emptyDraft(defaultType);

  return {
    customer: {
      name: request.customer.name,
      firstPhone: request.customer.firstPhone,
      secondPhone: request.customer.secondPhone,
      address: request.customer.address,
      locationLink: request.customer.locationLink,
    },
    type: request.type,
    priority: request.priority,
    faultDescription: request.faultDescription,
    notes: request.notes,
    scheduledDate: request.scheduledDate,
    devices: request.devices.length
      ? request.devices.map((device) => ({ ...device }))
      : [{ ...EMPTY_DEVICE }],
    technicianId: request.technicianId,
    status: request.status,
  };
}

export function RequestFormModal({
  request,
  defaultType,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: {
  request?: RepairRequest;
  defaultType?: RepairRequestType;
  submitting: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (input: RepairRequestInput) => void;
}) {
  const isEdit = Boolean(request);
  const isTypeLocked = !isEdit && Boolean(defaultType);
  const [draft, setDraft] = useState<RequestFormDraft>(() => initialDraft(request, defaultType));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { data: technicians } = useUsersQuery({
    role: "technician",
    status: "available",
    page: 1,
    pageSize: 100,
  });

  function setCustomerField(
    field: keyof RequestFormDraft["customer"],
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      customer: { ...current.customer, [field]: value },
    }));
    setErrors((current) => ({ ...current, [`customer.${field}`]: "" }));
  }

  function updateDevice(
    index: number,
    patch: Partial<RequestFormDraft["devices"][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.map((device, currentIndex) =>
        currentIndex === index ? { ...device, ...patch } : device,
      ),
    }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[`devices.${index}.${key}`]);
      return next;
    });
  }

  function addDevice() {
    setDraft((current) => ({
      ...current,
      devices: [...current.devices, { ...EMPTY_DEVICE }],
    }));
  }

  function removeDevice(index: number) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function submit() {
    const parsed = RepairRequestInputSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(errorsFromIssues(parsed.error.issues));
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <Modal
      title={isEdit ? "تعديل طلب صيانة" : "طلب صيانة جديد"}
      description="أدخل بيانات العميل والأجهزة والعطل والفني المسؤول."
      onClose={onClose}
      widthClassName="max-w-5xl"
    >
      <form className="space-y-6 p-5" onSubmit={(event) => event.preventDefault()}>
        {submitError ? (
          <div className="whitespace-pre-line rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {submitError}
          </div>
        ) : null}

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم العميل" error={errors["customer.name"]}>
              <Input
                value={draft.customer.name}
                onChange={(event) => setCustomerField("name", event.target.value)}
                placeholder="أحمد محمد"
                disabled={submitting}
              />
            </Field>
            <Field label="الهاتف الأول" error={errors["customer.firstPhone"]}>
              <Input
                dir="ltr"
                value={draft.customer.firstPhone}
                onChange={(event) => setCustomerField("firstPhone", event.target.value)}
                placeholder="09xx xxx xxx"
                disabled={submitting}
              />
            </Field>
            <Field label="الهاتف الثاني" error={errors["customer.secondPhone"]}>
              <Input
                dir="ltr"
                value={draft.customer.secondPhone}
                onChange={(event) => setCustomerField("secondPhone", event.target.value)}
                placeholder="اختياري"
                disabled={submitting}
              />
            </Field>
            <Field label="العنوان" error={errors["customer.address"]}>
              <Input
                value={draft.customer.address}
                onChange={(event) => setCustomerField("address", event.target.value)}
                placeholder="دمشق - المزة - شارع الجلاء"
                disabled={submitting}
              />
            </Field>
            <Field
              label="رابط الموقع"
              error={errors["customer.locationLink"]}
              className="md:col-span-2"
            >
              <Input
                dir="ltr"
                value={draft.customer.locationLink}
                onChange={(event) => setCustomerField("locationLink", event.target.value)}
                placeholder="https://maps.google.com/?q=Damascus+Mezzeh"
                disabled={submitting}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-bold text-gold">الأجهزة</h3>
            <Button type="button" variant="outline" size="sm" onClick={addDevice} disabled={submitting}>
              <Icon name="plus" size={16} />
              جهاز آخر
            </Button>
          </div>
          <div className="space-y-3">
            {draft.devices.map((device, index) => (
              <div key={index} className="rounded-md border border-border bg-surface-2 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-content">جهاز {index + 1}</span>
                  {draft.devices.length > 1 ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeDevice(index)}
                      disabled={submitting}
                    >
                      <Icon name="trash" size={16} />
                      حذف
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="نوع الجهاز" error={errors[`devices.${index}.deviceType`]}>
                    <Input
                      value={device.deviceType}
                      onChange={(event) => updateDevice(index, { deviceType: event.target.value })}
                      placeholder="Smartphone"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="اسم الجهاز" error={errors[`devices.${index}.deviceName`]}>
                    <Input
                      value={device.deviceName}
                      onChange={(event) => updateDevice(index, { deviceName: event.target.value })}
                      placeholder="iPhone 13 Pro"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="العلامة التجارية" error={errors[`devices.${index}.brand`]}>
                    <Input
                      value={device.brand}
                      onChange={(event) => updateDevice(index, { brand: event.target.value })}
                      placeholder="Apple"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="الموديل" error={errors[`devices.${index}.model`]}>
                    <Input
                      value={device.model}
                      onChange={(event) => updateDevice(index, { model: event.target.value })}
                      placeholder="A2636"
                      disabled={submitting}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات الطلب</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="نوع الطلب">
              <Select
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value as RepairRequestType,
                  }))
                }
                disabled={submitting || isTypeLocked}
              >
                {REQUEST_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الأولوية">
              <Select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as RepairRequestPriority,
                  }))
                }
                disabled={submitting}
              >
                {REQUEST_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="تاريخ الصيانة" error={errors.scheduledDate}>
              <Input
                type="date"
                value={draft.scheduledDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, scheduledDate: event.target.value }))
                }
                disabled={submitting}
              />
            </Field>
            <Field label="الفني المسؤول">
              <Select
                value={draft.technicianId}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, technicianId: event.target.value }))
                }
                disabled={submitting}
              >
                <option value="">بدون تحديد</option>
                {(technicians?.items ?? []).map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            {isEdit ? (
              <Field label="الحالة">
                <Select
                  value={draft.status ?? "new"}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as RepairRequestStatus,
                    }))
                  }
                  disabled={submitting}
                >
                  {REQUEST_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="وصف العطل" error={errors.faultDescription}>
            <Textarea
              className="min-h-28"
              value={draft.faultDescription}
              onChange={(event) =>
                setDraft((current) => ({ ...current, faultDescription: event.target.value }))
              }
              placeholder="الجهاز لا يعمل والشاشة مكسورة"
              disabled={submitting}
            />
          </Field>
          <Field label="ملاحظات" error={errors.notes}>
            <Textarea
              className="min-h-28"
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="يحتاج إلى قطع غيار خاصة"
              disabled={submitting}
            />
          </Field>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديل" : "إنشاء الطلب"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
