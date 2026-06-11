"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";

interface CustomerOrder {
  id: string;
  device: string;
  status: "active" | "completed" | "cancelled";
  date: string;
  total: string;
}

interface Customer {
  id: string;
  name: string;
  phone1: string;
  phone2: string;
  address: string;
  locationUrl: string;
  notes: string;
  orders: CustomerOrder[];
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "CUS-1001",
    name: "محمد العتيبي",
    phone1: "0991 223 441",
    phone2: "011 332 8811",
    address: "دمشق - المزة",
    locationUrl: "https://maps.google.com",
    notes: "يفضل الزيارة صباحاً.",
    orders: [
      { id: "ORD-5542", device: "ثلاجة LG", status: "active", date: "2026-06-11", total: "950,000 ل.س" },
      { id: "ORD-5520", device: "غسالة سامسونغ", status: "completed", date: "2026-05-29", total: "620,000 ل.س" },
    ],
  },
  {
    id: "CUS-1002",
    name: "سارة القحطاني",
    phone1: "0944 772 118",
    phone2: "",
    address: "دمشق - المالكي",
    locationUrl: "",
    notes: "عميلة متابعة دورية.",
    orders: [
      { id: "ORD-5541", device: "شاشة سامسونغ", status: "completed", date: "2026-06-10", total: "680,000 ل.س" },
    ],
  },
  {
    id: "CUS-1003",
    name: "مركز الصفاء التجاري",
    phone1: "011 442 0911",
    phone2: "0998 221 144",
    address: "دمشق - شارع بغداد",
    locationUrl: "",
    notes: "عميل تجاري، الفواتير باسم المركز.",
    orders: [
      { id: "ORD-5540", device: "غسالة ناشونال", status: "active", date: "2026-06-12", total: "1,225,000 ل.س" },
      { id: "ORD-5488", device: "مكيف Gree", status: "completed", date: "2026-04-18", total: "1,040,000 ل.س" },
    ],
  },
  {
    id: "CUS-1004",
    name: "ليان منصور",
    phone1: "0988 113 520",
    phone2: "",
    address: "دمشق - كفرسوسة",
    locationUrl: "",
    notes: "",
    orders: [
      { id: "ORD-5539", device: "فرن كهربائي", status: "cancelled", date: "2026-06-13", total: "0 ل.س" },
    ],
  },
];

const EMPTY_CUSTOMER: Customer = {
  id: "",
  name: "",
  phone1: "",
  phone2: "",
  address: "",
  locationUrl: "",
  notes: "",
  orders: [],
};

const ORDER_STATUS = {
  active: { label: "نشط", tone: "gold" as const },
  completed: { label: "مكتمل", tone: "success" as const },
  cancelled: { label: "ملغي", tone: "danger" as const },
};

function contains(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function nextCustomerId(customers: Customer[]) {
  return `CUS-${Math.max(...customers.map((item) => Number(item.id.replace(/\D/g, "")))) + 1}`;
}

function CustomerFormModal({
  customer,
  customers,
  onClose,
  onSave,
}: {
  customer?: Customer;
  customers: Customer[];
  onClose: () => void;
  onSave: (customer: Customer) => void;
}) {
  const [draft, setDraft] = useState<Customer>(customer ?? EMPTY_CUSTOMER);
  const isEdit = Boolean(customer);

  function save() {
    onSave({ ...draft, id: draft.id || nextCustomerId(customers) });
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "تعديل العميل" : "عميل جديد"}
      description="إدارة بيانات العميل الأساسية ومعلومات التواصل."
      onClose={onClose}
      widthClassName="max-w-3xl"
    >
      <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="اسم العميل">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="اسم العميل" />
        </Field>
        <Field label="الهاتف 1">
          <Input dir="ltr" value={draft.phone1} onChange={(event) => setDraft((current) => ({ ...current, phone1: event.target.value }))} placeholder="09xx xxx xxx" />
        </Field>
        <Field label="الهاتف 2">
          <Input dir="ltr" value={draft.phone2} onChange={(event) => setDraft((current) => ({ ...current, phone2: event.target.value }))} placeholder="اختياري" />
        </Field>
        <Field label="العنوان">
          <Input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} placeholder="العنوان" />
        </Field>
        <Field label="رابط الموقع" className="md:col-span-2">
          <Input dir="ltr" value={draft.locationUrl} onChange={(event) => setDraft((current) => ({ ...current, locationUrl: event.target.value }))} placeholder="https://maps.google.com/..." />
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <Textarea className="min-h-24" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="ملاحظات العميل" />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={save}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {isEdit ? "حفظ التعديل" : "إنشاء العميل"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CustomerDetailsModal({
  customer,
  onClose,
  onEdit,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal title={customer.name} description="معلومات العميل وسجل طلباته." onClose={onClose} widthClassName="max-w-4xl">
      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="text-xs text-content-muted">الهاتف 1</div>
            <div className="mt-1 font-semibold text-content" dir="ltr">{customer.phone1}</div>
          </Card>
          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="text-xs text-content-muted">الهاتف 2</div>
            <div className="mt-1 font-semibold text-content" dir="ltr">{customer.phone2 || "غير محدد"}</div>
          </Card>
          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="text-xs text-content-muted">عدد الطلبات</div>
            <div className="mt-1 font-semibold text-content">{customer.orders.length}</div>
          </Card>
        </div>

        <div className="rounded-md border border-border p-4">
          <div className="text-sm font-semibold text-content">العنوان</div>
          <p className="mt-1 text-sm text-content-muted">{customer.address}</p>
          {customer.locationUrl ? <p className="mt-2 text-sm text-gold" dir="ltr">{customer.locationUrl}</p> : null}
          {customer.notes ? <p className="mt-3 text-sm text-content-muted">{customer.notes}</p> : null}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold text-content">سجل الطلبات</h3>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Icon name="pencil" size={16} />
              تعديل العميل
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="min-w-[680px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["رقم الطلب", "الجهاز", "الحالة", "التاريخ", "الإجمالي"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3 font-bold text-gold">{order.id}</td>
                    <td className="px-4 py-3 text-content">{order.device}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ORDER_STATUS[order.status].tone} dot>
                        {ORDER_STATUS[order.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-content-muted">{order.date}</td>
                    <td className="px-4 py-3 text-content-muted">{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(
    () =>
      customers.filter(
        (customer) =>
          !query ||
          contains(customer.name, query) ||
          contains(customer.phone1, query) ||
          contains(customer.phone2, query) ||
          contains(customer.id, query),
      ),
    [customers, query],
  );

  function upsertCustomer(customer: Customer) {
    setCustomers((current) => {
      const exists = current.some((item) => item.id === customer.id);
      return exists
        ? current.map((item) => (item.id === customer.id ? customer : item))
        : [customer, ...current];
    });
  }

  function removeCustomer(customerId: string) {
    setCustomers((current) => current.filter((customer) => customer.id !== customerId));
    setSelectedCustomer((current) => (current?.id === customerId ? null : current));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="text-right">
          <h2 className="font-heading text-xl font-bold text-gold">إدارة العملاء</h2>
          <p className="mt-1 text-sm text-content-muted">
            متابعة معلومات العملاء، تعديل بياناتهم، حذف العميل، ورؤية سجل الطلبات.
          </p>
        </div>
        <Button type="button" onClick={() => setShowCreateModal(true)}>
          <Icon name="plus" size={18} />
          عميل جديد
        </Button>
      </div>

      {showCreateModal ? <CustomerFormModal customers={customers} onClose={() => setShowCreateModal(false)} onSave={upsertCustomer} /> : null}
      {editingCustomer ? (
        <CustomerFormModal
          customer={editingCustomer}
          customers={customers}
          onClose={() => setEditingCustomer(null)}
          onSave={(customer) => {
            upsertCustomer(customer);
            setSelectedCustomer(customer);
          }}
        />
      ) : null}
      {selectedCustomer ? (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => setEditingCustomer(selectedCustomer)}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-content-muted">إجمالي العملاء</div>
          <div className="mt-2 font-heading text-2xl font-bold text-content">{customers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-content-muted">طلبات العملاء</div>
          <div className="mt-2 font-heading text-2xl font-bold text-content">
            {customers.reduce((sum, customer) => sum + customer.orders.length, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-content-muted">عملاء لديهم طلبات نشطة</div>
          <div className="mt-2 font-heading text-2xl font-bold text-gold">
            {customers.filter((customer) => customer.orders.some((order) => order.status === "active")).length}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث باسم العميل أو الهاتف أو المعرف" aria-label="بحث العملاء" />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["المعرف", "العميل", "الهاتف", "العنوان", "عدد الطلبات", "الإجراءات"].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer border-t border-border hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{customer.id}</td>
                  <td className="px-4 py-4 font-semibold text-content">{customer.name}</td>
                  <td className="px-4 py-4 text-content-muted" dir="ltr">{customer.phone1}</td>
                  <td className="px-4 py-4 text-content-muted">{customer.address}</td>
                  <td className="px-4 py-4">
                    <Badge tone="gold">{customer.orders.length}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={`عرض ${customer.name}`} title="عرض" onClick={(event) => { event.stopPropagation(); setSelectedCustomer(customer); }} className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2">
                        <Icon name="eye" size={18} />
                      </button>
                      <button type="button" aria-label={`تعديل ${customer.name}`} title="تعديل" onClick={(event) => { event.stopPropagation(); setEditingCustomer(customer); }} className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2">
                        <Icon name="pencil" size={18} />
                      </button>
                      <button type="button" aria-label={`حذف ${customer.name}`} title="حذف" onClick={(event) => { event.stopPropagation(); removeCustomer(customer.id); }} className="rounded-sm p-1.5 text-danger hover:bg-danger-soft">
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
