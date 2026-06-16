"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { Icon } from "@/lib/icons";
import { PAGE_SIZE } from "@/config/constants";
import {
  OrderDetailsModal,
  type Invoice,
  type Order,
} from "@/features/operations/components/OperationsScreens";

interface CustomerOrder {
  id: string;
  device: string;
  status: "active" | "completed" | "cancelled";
  date: string;
  total: string;
  type?: Order["type"];
  brand?: string;
  technician?: string;
  orderStatus?: Order["status"];
  priority?: Order["priority"];
  visitTime?: string;
  totalAmount?: number;
  paidAmount?: number;
  invoiceId?: string;
  invoiceStatus?: Invoice["status"];
  paymentMethod?: Invoice["paymentMethod"];
  payments?: Invoice["payments"];
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

function parseMoney(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function buildOrderDetails(customer: Customer, customerOrder: CustomerOrder) {
  const totalAmount = customerOrder.totalAmount ?? parseMoney(customerOrder.total);
  const paidAmount =
    customerOrder.paidAmount ??
    (customerOrder.status === "completed" ? totalAmount : Math.round(totalAmount / 2));

  const order: Order = {
    id: customerOrder.id,
    type: customerOrder.type ?? "external",
    client: customer.name,
    phone: customer.phone1,
    address: customer.address,
    device: customerOrder.device,
    brand: customerOrder.brand ?? customerOrder.device.split(" ").slice(-1)[0] ?? "غير محدد",
    technician: customerOrder.technician ?? "رامي سمير",
    status:
      customerOrder.orderStatus ??
      (customerOrder.status === "completed"
        ? "completed"
        : customerOrder.status === "cancelled"
          ? "cancelled"
          : "under-repair"),
    priority: customerOrder.priority ?? "medium",
    visitDate: `${customerOrder.date} ${customerOrder.visitTime ?? "09:00"}`,
    total: totalAmount,
    paid: paidAmount,
  };

  const invoice: Invoice = {
    id: customerOrder.invoiceId ?? `INV-${customerOrder.id.replace(/\D/g, "").slice(-4)}`,
    orderId: customerOrder.id,
    type: order.type,
    client: customer.name,
    clientPhone: customer.phone1,
    clientPhone2: customer.phone2 || "لا يوجد",
    clientAddress: customer.address,
    technician: order.technician,
    technicianPhone: order.technician === "رامي سمير" ? "0955 114 220" : "لا يوجد",
    status:
      customerOrder.invoiceStatus ??
      (paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid"),
    currency: "SYP",
    paymentMethod: customerOrder.paymentMethod ?? "cash",
    total: totalAmount,
    paid: paidAmount,
    issuedAt: customerOrder.date,
    warrantyDuration: "3 أشهر",
    centerPullItems: "",
    notes: "",
    parts: [
      {
        id: `PRT-${customerOrder.id.replace(/\D/g, "").slice(-4)}`,
        name: customerOrder.device,
        quantity: 1,
        unitPrice: totalAmount,
      },
    ],
    payments:
      customerOrder.payments ??
      (paidAmount > 0
        ? [
            {
              id: `PAY-${customerOrder.id.replace(/\D/g, "").slice(-4)}`,
              amount: paidAmount,
              convertedAmount: paidAmount,
              currency: "SYP",
              method: customerOrder.paymentMethod ?? "cash",
              paidAt: customerOrder.date,
            },
          ]
        : []),
  };

  return { order, invoice };
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
  const [pendingEditCustomer, setPendingEditCustomer] = useState<Customer | null>(null);
  const isEdit = Boolean(customer);

  function saveCustomer(nextCustomer: Customer) {
    onSave(nextCustomer);
    onClose();
  }

  return (
    <>
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
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => {
                const nextCustomer = { ...draft, id: draft.id || nextCustomerId(customers) };
                if (isEdit) setPendingEditCustomer(nextCustomer);
                else saveCustomer(nextCustomer);
              }}
            >
              <Icon name={isEdit ? "pencil" : "plus"} size={18} />
              {isEdit ? "حفظ التعديل" : "إنشاء العميل"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingEditCustomer ? (
        <ConfirmToast
          title="تأكيد تعديل العميل"
          message={`هل تريد حفظ التعديلات على العميل ${pendingEditCustomer.name}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditCustomer(null)}
          onConfirm={() => saveCustomer(pendingEditCustomer)}
        />
      ) : null}
    </>
  );
}

function CustomerDetailsModal({
  customer,
  onClose,
  onEdit,
  onOpenOrder,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onOpenOrder: (details: { order: Order; invoice: Invoice }) => void;
}) {
  const [ordersPage, setOrdersPage] = useState(1);
  const orderPages = Math.max(1, Math.ceil(customer.orders.length / PAGE_SIZE));
  const currentOrdersPage = Math.min(ordersPage, orderPages);
  const visibleOrders = customer.orders.slice(
    (currentOrdersPage - 1) * PAGE_SIZE,
    currentOrdersPage * PAGE_SIZE,
  );

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
                  {["رقم الطلب", "الجهاز", "الحالة", "التاريخ", "الإجمالي", "الإجراءات"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${order.id}`}
                        title="تفاصيل الطلب"
                        onClick={() => onOpenOrder(buildOrderDetails(customer, order))}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentOrdersPage}
            total={customer.orders.length}
            pageSize={PAGE_SIZE}
            onPage={setOrdersPage}
            itemLabel="طلب"
          />
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
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<{
    order: Order;
    invoice: Invoice;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

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
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleCustomers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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
          onEdit={() => {
            setSelectedCustomer(null);
            setEditingCustomer(selectedCustomer);
          }}
          onOpenOrder={setSelectedOrderDetails}
        />
      ) : null}
      {selectedOrderDetails ? (
        <OrderDetailsModal
          order={selectedOrderDetails.order}
          invoice={selectedOrderDetails.invoice}
          onClose={() => setSelectedOrderDetails(null)}
        />
      ) : null}
      {customerToDelete ? (
        <ConfirmToast
          title="تأكيد حذف العميل"
          message={`هل تريد حذف العميل ${customerToDelete.name}؟ سيتم حذف بياناته من القائمة الحالية.`}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={() => {
            removeCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-content-muted">إجمالي العملاء</div>
          <div className="mt-2 font-heading text-2xl font-bold text-content">{customers.length}</div>
        </Card>
      </div>

      <Card className="p-4">
        <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="بحث باسم العميل أو هاتف العميل أو المعرف" aria-label="بحث العملاء" />
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
              {visibleCustomers.map((customer) => (
                <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer border-t border-border hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{customer.id}</td>
                  <td className="px-4 py-4 font-semibold text-content">{customer.name}</td>
                  <td className="px-4 py-4 text-content-muted" dir="ltr">{customer.phone1}</td>
                  <td className="px-4 py-4 text-content-muted">{customer.address}</td>
                  <td className="px-4 py-4">
                    <Badge tone="gold">{customer.orders.length}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button type="button" aria-label={`عرض ${customer.name}`} title="عرض" onClick={(event) => { event.stopPropagation(); setSelectedCustomer(customer); }} className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2">
                        <Icon name="eye" size={18} />
                      </button>
                      <button type="button" aria-label={`تعديل ${customer.name}`} title="تعديل" onClick={(event) => { event.stopPropagation(); setEditingCustomer(customer); }} className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2">
                        <Icon name="pencil" size={18} />
                      </button>
                      <button type="button" aria-label={`حذف ${customer.name}`} title="حذف" onClick={(event) => { event.stopPropagation(); setCustomerToDelete(customer); }} className="rounded-sm p-1.5 text-danger hover:bg-danger-soft">
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="عميل"
        />
      </Card>
    </div>
  );
}
