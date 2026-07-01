"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { localDateKey } from "@/lib/format/date";
import {
  CustomerInputSchema,
  createCustomerUpdatePatch,
  hasCustomerPatch,
  type Customer,
  type CustomerInput,
  type CustomerRepairRequest,
} from "@/models/customers/customer.model";
import {
  useCustomerMutations,
  useCustomerQuery,
  useCustomersQuery,
} from "@/features/customers/hooks/use-customers";

const EMPTY_CUSTOMER_INPUT: CustomerInput = {
  name: "",
  firstPhone: "",
  secondPhone: "",
  address: "",
  locationLink: "",
};

type CustomerInputKey = keyof CustomerInput;
type CustomerFieldErrors = Partial<Record<CustomerInputKey, string>>;

const REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  accepted: "مقبول",
  ontheway: "في الطريق",
  "on-the-way": "في الطريق",
  arrived: "تم الوصول",
  underrepair: "قيد الإصلاح",
  "under-repair": "قيد الإصلاح",
  completed: "مكتمل",
  incompleted: "غير مكتمل",
  pulltocenter: "مسحوب للمركز",
  "pull-to-center": "مسحوب للمركز",
  postponed: "مؤجل",
  cancelled: "ملغي",
  canceled: "ملغي",
  notanswer: "لا يجيب",
  "not-answer": "لا يجيب",
  notrepairable: "غير قابل للإصلاح",
  repeated: "مكرر",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
  urgent: "طارئة",
};

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

function formatApiDate(value: string) {
  return localDateKey(value, "غير محدد");
}

function requestStatusLabel(request: CustomerRepairRequest) {
  if (request.isCompleted) return "مكتمل";
  return REQUEST_STATUS_LABELS[request.status] ?? (request.status || "غير محدد");
}

function requestStatusTone(request: CustomerRepairRequest) {
  const status = request.status.toLowerCase();
  if (request.isCompleted || status === "completed") return "success" as const;
  if (status === "cancelled" || status === "canceled") return "danger" as const;
  return "gold" as const;
}

function customerSearchParams(search: string) {
  const value = search.trim();
  if (!value) return {};

  return /\d/.test(value) ? { phone: value } : { name: value };
}

function CustomerFormModal({
  customer,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: {
  customer?: Customer;
  submitting: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => void;
}) {
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

function CustomerDetailsModal({
  customer,
  isLoading,
  errorMessage,
  onClose,
  onEdit,
}: {
  customer: Customer | null;
  isLoading: boolean;
  errorMessage?: string;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}) {
  const [requestsPage, setRequestsPage] = useState(1);
  const requests = useMemo(() => customer?.requests ?? [], [customer]);
  const pages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const currentPage = Math.min(requestsPage, pages);
  const visibleRequests = requests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <Modal
      title={customer?.name ?? "تفاصيل العميل"}
      description="معلومات العميل وسجل طلبات الإصلاح المرتبطة به."
      onClose={onClose}
      widthClassName="max-w-5xl"
    >
      <div className="space-y-5 p-5">
        {errorMessage ? (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            تعذّر تحميل تفاصيل العميل. {errorMessage}
          </div>
        ) : null}

        {!customer && isLoading ? (
          <Card className="bg-surface-2 p-5 text-center text-sm text-content-muted shadow-none">
            جاري تحميل بيانات العميل...
          </Card>
        ) : null}

        {customer ? (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">معرّف العميل</div>
                <div className="mt-1 font-semibold text-gold" dir="ltr">
                  {customer.customerNumber}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">الهاتف الأول</div>
                <div className="mt-1 font-semibold text-content" dir="ltr">
                  {customer.firstPhone || "غير محدد"}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">الهاتف الثاني</div>
                <div className="mt-1 font-semibold text-content" dir="ltr">
                  {customer.secondPhone || "غير محدد"}
                </div>
              </Card>
              <Card className="bg-surface-2 p-4 shadow-none">
                <div className="text-xs text-content-muted">سجل الإصلاح</div>
                <div className="mt-1 font-semibold text-content">{requests.length}</div>
              </Card>
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="text-sm font-semibold text-content">العنوان</div>
              <p className="mt-1 text-sm text-content-muted">
                {customer.address || "غير محدد"}
              </p>
              {customer.locationLink ? (
                <a
                  href={customer.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-sm text-gold underline-offset-4 hover:underline"
                  dir="ltr"
                >
                  {customer.locationLink}
                </a>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-content">سجل الإصلاح</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(customer)}>
                  <Icon name="pencil" size={16} />
                  تعديل العميل
                </Button>
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-[820px] w-full text-right text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-content-muted">
                      {["رقم الطلب", "الأولوية", "الحالة", "الموعد", "وصف العطل", "ملاحظات"].map(
                        (header) => (
                          <th key={header} className="px-4 py-3 font-medium">
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={6}>
                          جاري تحميل سجل الإصلاح...
                        </td>
                      </tr>
                    ) : visibleRequests.length ? (
                      visibleRequests.map((request) => (
                        <tr key={request.id} className="border-t border-border">
                          <td className="px-4 py-3 font-bold text-gold" dir="ltr">
                            {request.requestNumber}
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {PRIORITY_LABELS[request.priority] ??
                              (request.priority || "غير محدد")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={requestStatusTone(request)} dot>
                              {requestStatusLabel(request)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-content-muted">
                            {formatApiDate(request.scheduledDate)}
                          </td>
                          <td className="max-w-[260px] px-4 py-3 text-content">
                            {request.faultDescription || "غير محدد"}
                          </td>
                          <td className="max-w-[240px] px-4 py-3 text-content-muted">
                            {request.notes || "لا توجد"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-border">
                        <td className="px-4 py-6 text-center text-content-muted" colSpan={6}>
                          لا يوجد سجل إصلاح لهذا العميل.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={currentPage}
                total={requests.length}
                pageSize={PAGE_SIZE}
                onPage={setRequestsPage}
                itemLabel="طلب"
              />
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

export function CustomersScreen() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { create, update, remove } = useCustomerMutations();

  const listParams = useMemo(
    () => ({
      ...customerSearchParams(search),
      page,
      pageSize: PAGE_SIZE,
    }),
    [page, search],
  );
  const {
    data,
    error: listError,
    isLoading,
    isError,
    refetch,
  } = useCustomersQuery(listParams);
  const selectedCustomerPreview =
    data?.items.find((customer) => customer.id === selectedCustomerId) ?? null;
  const detailsQuery = useCustomerQuery(selectedCustomerId);
  const detailsCustomer = detailsQuery.data ?? selectedCustomerPreview;

  useEffect(() => {
    if (isError && listError) {
      toast.error("تعذر تحميل العملاء", getApiErrorMessage(listError));
    }
  }, [isError, listError, toast]);

  function clearFilters() {
    setSearch("");
    setPage(1);
  }

  const customers = data?.items ?? [];
  const totalCustomers = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="text-right">
          <h2 className="font-heading text-xl font-bold text-gold">إدارة العملاء</h2>
          <p className="mt-1 text-sm text-content-muted">
            متابعة معلومات العملاء، تعديل بياناتهم، تعطيل العميل، ورؤية سجل الإصلاح.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            create.reset();
            setShowCreateModal(true);
          }}
        >
          <Icon name="plus" size={18} />
          عميل جديد
        </Button>
      </div>

      {showCreateModal ? (
        <CustomerFormModal
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : undefined}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: () => {
                setShowCreateModal(false);
                setPage(1);
                toast.success("تم إنشاء العميل", `تمت إضافة ${input.name} بنجاح.`);
              },
              onError: (error) =>
                toast.error("تعذر إنشاء العميل", getApiErrorMessage(error)),
            })
          }
        />
      ) : null}

      {editingCustomer ? (
        <CustomerFormModal
          customer={editingCustomer}
          submitting={update.isPending}
          submitError={update.error ? getApiErrorMessage(update.error) : undefined}
          onClose={() => setEditingCustomer(null)}
          onSubmit={(input) => {
            const patch = createCustomerUpdatePatch(input, editingCustomer);
            if (!hasCustomerPatch(patch)) {
              setEditingCustomer(null);
              toast.success("لا توجد تغييرات", "لم يتم إرسال طلب تعديل للعميل.");
              return;
            }

            update.mutate(
              { id: editingCustomer.id, input: patch },
              {
                onSuccess: () => {
                  setEditingCustomer(null);
                  toast.success("تم تحديث العميل", `تم حفظ تعديلات ${input.name} بنجاح.`);
                },
                onError: (error) =>
                  toast.error("تعذر تحديث العميل", getApiErrorMessage(error)),
              },
            );
          }}
        />
      ) : null}

      {selectedCustomerId ? (
        <CustomerDetailsModal
          customer={detailsCustomer}
          isLoading={detailsQuery.isLoading}
          errorMessage={detailsQuery.error ? getApiErrorMessage(detailsQuery.error) : undefined}
          onClose={() => setSelectedCustomerId(null)}
          onEdit={(customer) => {
            update.reset();
            setSelectedCustomerId(null);
            setEditingCustomer(customer);
          }}
        />
      ) : null}

      {customerToDelete ? (
        <ConfirmToast
          title="تأكيد تعطيل العميل"
          message={`هل تريد تعطيل العميل ${customerToDelete.name}؟`}
          tone="danger"
          confirmLabel={remove.isPending ? "جاري التعطيل..." : "تعطيل العميل"}
          isLoading={remove.isPending}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={() => {
            remove.mutate(customerToDelete.id, {
              onSuccess: () => {
                if (selectedCustomerId === customerToDelete.id) setSelectedCustomerId(null);
                toast.success("تم تعطيل العميل", `تم تعطيل ${customerToDelete.name} بنجاح.`);
                setCustomerToDelete(null);
              },
              onError: (error) =>
                toast.error("تعذر تعطيل العميل", getApiErrorMessage(error)),
            });
          }}
        />
      ) : null}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Field label="بحث العملاء">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="اسم العميل أو رقم الهاتف"
              aria-label="بحث العملاء بالاسم أو رقم الهاتف"
            />
          </Field>
          <Button type="button" variant="outline" className="self-end" onClick={clearFilters}>
            مسح
          </Button>
        </div>
      </Card>

      {isError && !data ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
          تعذّر تحميل العملاء.{" "}
          <button onClick={() => refetch()} className="underline">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["المعرف", "العميل", "الهاتف الأول", "الهاتف الثاني", "العنوان", "الإجراءات"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="border-t border-border">
                    <td className="px-4 py-8 text-center text-content-muted" colSpan={6}>
                      جاري تحميل العملاء...
                    </td>
                  </tr>
                ) : customers.length ? (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className="cursor-pointer border-t border-border hover:bg-gold-soft"
                    >
                      <td className="px-4 py-4 font-bold text-gold" dir="ltr">
                        {customer.customerNumber}
                      </td>
                      <td className="px-4 py-4 font-semibold text-content">
                        {customer.name}
                      </td>
                      <td className="px-4 py-4 text-content-muted" dir="ltr">
                        {customer.firstPhone || "غير محدد"}
                      </td>
                      <td className="px-4 py-4 text-content-muted" dir="ltr">
                        {customer.secondPhone || "غير محدد"}
                      </td>
                      <td className="px-4 py-4 text-content-muted">
                        {customer.address || "غير محدد"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-start gap-2" dir="rtl">
                          <button
                            type="button"
                            aria-label={`عرض ${customer.name}`}
                            title="عرض"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCustomerId(customer.id);
                            }}
                            className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                          >
                            <Icon name="eye" size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label={`تعديل ${customer.name}`}
                            title="تعديل"
                            onClick={(event) => {
                              event.stopPropagation();
                              update.reset();
                              setEditingCustomer(customer);
                            }}
                            className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                          >
                            <Icon name="pencil" size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label={`تعطيل ${customer.name}`}
                            title="تعطيل"
                            onClick={(event) => {
                              event.stopPropagation();
                              remove.reset();
                              setCustomerToDelete(customer);
                            }}
                            className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                          >
                            <Icon name="trash" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-border">
                    <td className="px-4 py-8 text-center text-content-muted" colSpan={6}>
                      لا يوجد عملاء مطابقون للبحث الحالي.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            total={totalCustomers}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            itemLabel="عميل"
          />
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-col gap-4 text-right sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-sm bg-gold-soft text-gold">
              <Icon name="users" size={22} />
            </span>
            <div>
              <div className="text-sm text-content-muted">إجمالي العملاء</div>
              <div className="mt-1 text-xs text-content-muted">
                العدد القادم من pagination في استجابة الخادم
              </div>
            </div>
          </div>
          <div className="font-heading text-3xl font-bold text-content">{totalCustomers}</div>
        </div>
      </Card>
    </div>
  );
}
