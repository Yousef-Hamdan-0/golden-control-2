"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import {
  createCustomerUpdatePatch,
  hasCustomerPatch,
  type Customer,
} from "@/models/customers/customer.model";
import {
  useCustomerMutations,
  useCustomerQuery,
  useCustomersQuery,
} from "@/features/customers/hooks/use-customers";
import { CustomerDetailsModal } from "@/features/customers/components/CustomerDetailsModal";
import { CustomerFormModal } from "@/features/customers/components/CustomerFormModal";
import { customerSearchParams } from "@/features/customers/components/customer-display.helpers";
import { useRole } from "@/features/auth/hooks/use-role";

export function CustomersScreen() {
  const toast = useToast();
  // DELETE /customers/:id is admin-only per the permissions matrix.
  const { role } = useRole();
  const isAdmin = role === "admin";
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
                      <td className="max-w-[150px] px-4 py-4 font-semibold text-content">
                        {customer.name}
                      </td>
                      <td className="px-4 py-4 text-content-muted" dir="ltr">
                        {customer.firstPhone || "غير محدد"}
                      </td>
                      <td className="px-4 py-4 text-content-muted" dir="ltr">
                        {customer.secondPhone || "غير محدد"}
                      </td>
                      <td className="max-w-[150px] px-4 py-4 text-content-muted">
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
                          {isAdmin ? (
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
                          ) : null}
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
            </div>
          </div>
          <div className="font-heading text-3xl font-bold text-content">{totalCustomers}</div>
        </div>
      </Card>
    </div>
  );
}
