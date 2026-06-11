"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon, type IconName } from "@/lib/icons";
import { formatMoney, type Currency } from "@/lib/format/currency";

type OrderStatus =
  | "new"
  | "accepted"
  | "on-the-way"
  | "arrived"
  | "under-repair"
  | "completed"
  | "incompleted"
  | "pull-to-center"
  | "postponed"
  | "cancelled"
  | "not-answer";

type OrderType = "external" | "internal";
type Priority = "low" | "medium" | "high" | "emergency";
type InvoiceType = "external" | "internal";
type PaymentStatus = "paid" | "partial" | "unpaid";

export interface Order {
  id: string;
  type: OrderType;
  client: string;
  phone: string;
  address: string;
  device: string;
  brand: string;
  technician: string;
  status: OrderStatus;
  priority: Priority;
  visitDate: string;
  total: number;
  paid: number;
}

interface DeviceDraft {
  type: string;
  name: string;
  brand: string;
  model: string;
}

interface MaintenanceOrderDraft {
  location: OrderType;
  clientName: string;
  phone1: string;
  phone2: string;
  address: string;
  locationUrl: string;
  devices: DeviceDraft[];
  faultDescription: string;
  notes: string;
  visitDate: string;
  visitTime: string;
  priority: Priority;
  technician: string;
}

type DateFilterMode = "day" | "month" | "year";

interface DateFilter {
  mode: DateFilterMode;
  from: string;
  to: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  lastMove: string;
  location: string;
}

interface Invoice {
  id: string;
  orderId: string;
  type: InvoiceType;
  client: string;
  technician: string;
  status: PaymentStatus;
  currency: Currency;
  total: number;
  paid: number;
  issuedAt: string;
}

interface FinanceRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  owner: string;
}

interface TechnicianPerformance {
  id: string;
  name: string;
  completed: number;
  active: number;
  delayed: number;
  revenue: number;
  satisfaction: number;
  status: "available" | "busy" | "leave";
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  accepted: "مقبول",
  "on-the-way": "في الطريق",
  arrived: "تم الوصول",
  "under-repair": "قيد الإصلاح",
  completed: "مكتمل",
  incompleted: "غير مكتمل",
  "pull-to-center": "مسحوب للمركز",
  postponed: "مؤجل",
  cancelled: "ملغي",
  "not-answer": "لا يجيب",
};

const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  new: "gold",
  accepted: "info",
  "on-the-way": "info",
  arrived: "info",
  "under-repair": "gold",
  completed: "success",
  incompleted: "danger",
  "pull-to-center": "info",
  postponed: "neutral",
  cancelled: "danger",
  "not-answer": "danger",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  emergency: "طارئة",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "مدفوعة بالكامل",
  partial: "مدفوعة جزئياً",
  unpaid: "غير مدفوعة",
};

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  paid: "success",
  partial: "gold",
  unpaid: "danger",
};

const ORDERS: Order[] = [
  {
    id: "ORD-5542",
    type: "external",
    client: "محمد العتيبي",
    phone: "0991 223 441",
    address: "دمشق - المزة",
    device: "ثلاجة LG",
    brand: "LG",
    technician: "رامي سمير",
    status: "under-repair",
    priority: "high",
    visitDate: "2026-06-11 10:30",
    total: 950000,
    paid: 450000,
  },
  {
    id: "ORD-5541",
    type: "external",
    client: "سارة القحطاني",
    phone: "0944 772 118",
    address: "دمشق - المالكي",
    device: "شاشة سامسونغ",
    brand: "Samsung",
    technician: "رامي سمير",
    status: "completed",
    priority: "medium",
    visitDate: "2026-06-11 12:00",
    total: 680000,
    paid: 680000,
  },
  {
    id: "ORD-5540",
    type: "internal",
    client: "مركز الصفاء التجاري",
    phone: "011 442 0911",
    address: "استلام داخل المركز",
    device: "غسالة ناشونال",
    brand: "National",
    technician: "هاني خالد",
    status: "pull-to-center",
    priority: "emergency",
    visitDate: "2026-06-12 09:00",
    total: 1225000,
    paid: 600000,
  },
  {
    id: "ORD-5539",
    type: "external",
    client: "ليان منصور",
    phone: "0988 113 520",
    address: "دمشق - كفرسوسة",
    device: "فرن كهربائي",
    brand: "Ariston",
    technician: "نور حمزة",
    status: "postponed",
    priority: "low",
    visitDate: "2026-06-13 16:00",
    total: 320000,
    paid: 0,
  },
  {
    id: "ORD-5538",
    type: "internal",
    client: "شركة الربيع",
    phone: "011 889 2020",
    address: "استلام داخل المركز",
    device: "مكيف سبليت",
    brand: "Gree",
    technician: "هاني خالد",
    status: "incompleted",
    priority: "high",
    visitDate: "2026-06-12 14:15",
    total: 1450000,
    paid: 750000,
  },
  {
    id: "ORD-5537",
    type: "external",
    client: "مالك ناصر",
    phone: "0933 441 224",
    address: "ريف دمشق - جرمانا",
    device: "جلاية بوش",
    brand: "Bosch",
    technician: "رامي سمير",
    status: "not-answer",
    priority: "medium",
    visitDate: "2026-06-11 18:00",
    total: 0,
    paid: 0,
  },
];

const INVENTORY: InventoryItem[] = [
  {
    id: "PRT-101",
    name: "كمبروسر ثلاجة 1/4",
    category: "ثلاجات",
    stock: 8,
    minStock: 4,
    unitCost: 780000,
    lastMove: "صرف إلى رامي سمير",
    location: "رف A-01",
  },
  {
    id: "PRT-102",
    name: "حساس حرارة NTC",
    category: "غسالات",
    stock: 3,
    minStock: 10,
    unitCost: 55000,
    lastMove: "تنبيه نقص",
    location: "رف B-04",
  },
  {
    id: "PRT-103",
    name: "لوحة تحكم شاشة",
    category: "شاشات",
    stock: 12,
    minStock: 5,
    unitCost: 420000,
    lastMove: "توريد جديد",
    location: "خزانة C",
  },
  {
    id: "PRT-104",
    name: "موتور جلاية",
    category: "جلايات",
    stock: 2,
    minStock: 4,
    unitCost: 610000,
    lastMove: "صرف إلى هاني خالد",
    location: "رف A-03",
  },
  {
    id: "PRT-105",
    name: "فلتر مكيف داخلي",
    category: "مكيفات",
    stock: 30,
    minStock: 12,
    unitCost: 30000,
    lastMove: "جرد يومي",
    location: "رف D-02",
  },
];

const INVOICES: Invoice[] = [
  {
    id: "INV-9021",
    orderId: "ORD-5542",
    type: "external",
    client: "محمد العتيبي",
    technician: "رامي سمير",
    status: "partial",
    currency: "SYP",
    total: 950000,
    paid: 450000,
    issuedAt: "2026-06-11",
  },
  {
    id: "INV-9020",
    orderId: "ORD-5541",
    type: "external",
    client: "سارة القحطاني",
    technician: "رامي سمير",
    status: "paid",
    currency: "SYP",
    total: 680000,
    paid: 680000,
    issuedAt: "2026-06-10",
  },
  {
    id: "INV-9019",
    orderId: "ORD-5540",
    type: "internal",
    client: "مركز الصفاء التجاري",
    technician: "هاني خالد",
    status: "partial",
    currency: "USD",
    total: 125,
    paid: 60,
    issuedAt: "2026-06-10",
  },
  {
    id: "INV-9018",
    orderId: "ORD-5538",
    type: "internal",
    client: "شركة الربيع",
    technician: "هاني خالد",
    status: "unpaid",
    currency: "SYP",
    total: 1450000,
    paid: 0,
    issuedAt: "2026-06-09",
  },
];

const FINANCE_RECORDS: FinanceRecord[] = [
  {
    id: "FIN-310",
    title: "إيجار المركز",
    category: "fixed",
    amount: 4200000,
    currency: "SYP",
    date: "2026-06-01",
    owner: "الإدارة",
  },
  {
    id: "FIN-311",
    title: "وقود سيارات الصيانة",
    category: "variable",
    amount: 740000,
    currency: "SYP",
    date: "2026-06-09",
    owner: "العمليات",
  },
  {
    id: "FIN-312",
    title: "بيع قطع غيار",
    category: "sales",
    amount: 2650000,
    currency: "SYP",
    date: "2026-06-10",
    owner: "المخزون",
  },
  {
    id: "FIN-313",
    title: "دفعات صيانة خارجية",
    category: "sales",
    amount: 3120000,
    currency: "SYP",
    date: "2026-06-11",
    owner: "الفواتير",
  },
];

const TECHNICIANS: TechnicianPerformance[] = [
  {
    id: "TEC-01",
    name: "رامي سمير",
    completed: 18,
    active: 4,
    delayed: 1,
    revenue: 7250000,
    satisfaction: 96,
    status: "busy",
  },
  {
    id: "TEC-02",
    name: "هاني خالد",
    completed: 14,
    active: 3,
    delayed: 2,
    revenue: 6120000,
    satisfaction: 91,
    status: "available",
  },
  {
    id: "TEC-03",
    name: "نور حمزة",
    completed: 11,
    active: 2,
    delayed: 0,
    revenue: 4480000,
    satisfaction: 94,
    status: "available",
  },
  {
    id: "TEC-04",
    name: "سامر يوسف",
    completed: 7,
    active: 0,
    delayed: 1,
    revenue: 2880000,
    satisfaction: 88,
    status: "leave",
  },
];

function typeLabel(type: OrderType | InvoiceType) {
  return type === "external" ? "خارجي" : "داخلي";
}

function remaining(total: number, paid: number) {
  return Math.max(0, total - paid);
}

function contains(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

const EMPTY_DEVICE: DeviceDraft = {
  type: "",
  name: "",
  brand: "",
  model: "",
};

const EMPTY_MAINTENANCE_ORDER: MaintenanceOrderDraft = {
  location: "external",
  clientName: "",
  phone1: "",
  phone2: "",
  address: "",
  locationUrl: "",
  devices: [{ ...EMPTY_DEVICE }],
  faultDescription: "",
  notes: "",
  visitDate: "",
  visitTime: "",
  priority: "medium",
  technician: "",
};

const DATE_FILTER_LABELS: Record<DateFilterMode, string> = {
  day: "اليوم",
  month: "الشهر",
  year: "السنة",
};

function orderToDraft(order: Order): MaintenanceOrderDraft {
  return {
    location: order.type,
    clientName: order.client,
    phone1: order.phone,
    phone2: "",
    address: order.address,
    locationUrl: "",
    devices: [
      {
        type: order.device.split(" ")[0] ?? "",
        name: order.device,
        brand: order.brand,
        model: "",
      },
    ],
    faultDescription: "",
    notes: "",
    visitDate: order.visitDate.slice(0, 10),
    visitTime: order.visitDate.slice(11, 16),
    priority: order.priority,
    technician: order.technician === "غير محدد" ? "" : order.technician,
  };
}

function draftToOrder(draft: MaintenanceOrderDraft, existing?: Order): Order {
  const primaryDevice = draft.devices[0] ?? EMPTY_DEVICE;
  const nextNumber =
    Math.max(...ORDERS.map((order) => Number(order.id.replace(/\D/g, "")))) + 1;

  return {
    id: existing?.id ?? `ORD-${nextNumber}`,
    type: draft.location,
    client: draft.clientName || "عميل جديد",
    phone: draft.phone1 || "غير محدد",
    address: draft.location === "internal" ? "استلام داخل المركز" : draft.address || "غير محدد",
    device: [primaryDevice.type, primaryDevice.name].filter(Boolean).join(" ") || "جهاز غير محدد",
    brand: primaryDevice.brand || "غير محدد",
    technician: draft.technician || "غير محدد",
    status: existing?.status ?? "new",
    priority: draft.priority,
    visitDate: `${draft.visitDate || "2026-06-11"} ${draft.visitTime || "09:00"}`,
    total: existing?.total ?? 0,
    paid: existing?.paid ?? 0,
  };
}

function normalizeDateKey(value: string, mode: DateFilterMode): string {
  if (!value) return "";
  if (mode === "year") return value.slice(0, 4);
  if (mode === "month") return value.slice(0, 7);
  return value.slice(0, 10);
}

function matchesDateFilter(order: Order, filter: DateFilter): boolean {
  if (!filter.from && !filter.to) return true;
  const orderKey = normalizeDateKey(order.visitDate, filter.mode);
  const fromKey = normalizeDateKey(filter.from, filter.mode);
  const toKey = normalizeDateKey(filter.to, filter.mode);

  return (!fromKey || orderKey >= fromKey) && (!toKey || orderKey <= toKey);
}

function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex items-center gap-2 text-gold">
        <span className="text-sm font-medium">لوحة تشغيلية</span>
        <Icon name={icon} />
      </div>
    </div>
  );
}

function KpiCards({
  cards,
}: {
  cards: Array<{ label: string; value: string; icon: IconName; tone?: BadgeTone }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-right">
              <p className="text-sm text-content-muted">{card.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-content">
                {card.value}
              </p>
            </div>
            <div className="rounded-md bg-gold-soft p-2 text-gold">
              <Icon name={card.icon} />
            </div>
          </div>
          {card.tone ? (
            <div className="mt-4 flex justify-end">
              <Badge tone={card.tone} dot>
                مباشر
              </Badge>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function FilterCard({ children }: { children: ReactNode }) {
  return <Card className="grid gap-3 p-4 md:grid-cols-4">{children}</Card>;
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="p-10 text-center text-sm text-content-muted">
      {title}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const widthClass =
    value >= 90
      ? "w-full"
      : value >= 75
        ? "w-3/4"
        : value >= 50
          ? "w-1/2"
          : value >= 25
            ? "w-1/4"
            : "w-1/12";

  return (
    <div className="h-2 overflow-hidden rounded-sm bg-surface-2">
      <div className={`h-full rounded-sm bg-gold ${widthClass}`} />
    </div>
  );
}

export function MaintenanceOrderModal({
  onClose,
  onSave,
  initialOrder,
}: {
  onClose: () => void;
  onSave?: (order: Order) => void;
  initialOrder?: Order;
}) {
  const [draft, setDraft] = useState<MaintenanceOrderDraft>(
    initialOrder ? orderToDraft(initialOrder) : EMPTY_MAINTENANCE_ORDER,
  );
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const isEdit = Boolean(initialOrder);

  function updateDevice(index: number, patch: Partial<DeviceDraft>) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.map((device, currentIndex) =>
        currentIndex === index ? { ...device, ...patch } : device,
      ),
    }));
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

  function handleSubmit() {
    const order = draftToOrder(draft, initialOrder);
    onSave?.(order);
    if (isEdit) onClose();
    else setCreatedOrder(order);
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل طلب صيانة" : "إنشاء طلب صيانة"}
        description="أدخل بيانات الطلب، العميل، الأجهزة، العطل، وموعد الزيارة."
        onClose={onClose}
        widthClassName="max-w-5xl"
      >
        <form className="space-y-6 p-5" onSubmit={(event) => event.preventDefault()}>
        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">موقع الطلب</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["internal", "external"] as OrderType[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, location: value }))}
                className={[
                  "rounded-md border px-4 py-3 text-right text-sm transition",
                  draft.location === value
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-border bg-surface-2 text-content hover:bg-gold-soft",
                ].join(" ")}
              >
                {typeLabel(value)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الاسم">
              <Input
                value={draft.clientName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, clientName: event.target.value }))
                }
                placeholder="اسم العميل"
              />
            </Field>
            <Field label="الهاتف 1">
              <Input
                dir="ltr"
                value={draft.phone1}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone1: event.target.value }))
                }
                placeholder="09xx xxx xxx"
              />
            </Field>
            <Field label="الهاتف 2">
              <Input
                dir="ltr"
                value={draft.phone2}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone2: event.target.value }))
                }
                placeholder="اختياري"
              />
            </Field>
            <Field label="العنوان">
              <Input
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="المدينة / المنطقة / التفاصيل"
              />
            </Field>
            <Field label="رابط الموقع (اختياري)" className="md:col-span-2">
              <Input
                dir="ltr"
                value={draft.locationUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, locationUrl: event.target.value }))
                }
                placeholder="https://maps.google.com/..."
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-bold text-gold">بيانات الأجهزة</h3>
            <Button type="button" variant="outline" size="sm" onClick={addDevice}>
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
                    >
                      <Icon name="trash" size={16} />
                      حذف
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="نوع الجهاز">
                    <Input
                      value={device.type}
                      onChange={(event) => updateDevice(index, { type: event.target.value })}
                      placeholder="ثلاجة / غسالة / شاشة"
                    />
                  </Field>
                  <Field label="اسم الجهاز">
                    <Input
                      value={device.name}
                      onChange={(event) => updateDevice(index, { name: event.target.value })}
                      placeholder="اسم الجهاز"
                    />
                  </Field>
                  <Field label="الماركة">
                    <Input
                      value={device.brand}
                      onChange={(event) => updateDevice(index, { brand: event.target.value })}
                      placeholder="LG / Samsung..."
                    />
                  </Field>
                  <Field label="الموديل (اختياري)">
                    <Input
                      value={device.model}
                      onChange={(event) => updateDevice(index, { model: event.target.value })}
                      placeholder="رقم الموديل"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">بيانات العطل</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="وصف العطل">
              <Textarea
                className="min-h-28"
                value={draft.faultDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    faultDescription: event.target.value,
                  }))
                }
                placeholder="اكتب وصف العطل هنا"
              />
            </Field>
            <Field label="ملاحظات (اختياري)">
              <Textarea
                className="min-h-28"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="أي ملاحظات إضافية"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-gold">تاريخ التسليم / الزيارة</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="التاريخ">
              <Input
                type="date"
                value={draft.visitDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, visitDate: event.target.value }))
                }
              />
            </Field>
            <Field label="الوقت">
              <Input
                type="time"
                value={draft.visitTime}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, visitTime: event.target.value }))
                }
              />
            </Field>
            <Field label="الأولوية">
              <Select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as Priority,
                  }))
                }
              >
                <option value="low">منخفضة (Low)</option>
                <option value="medium">متوسطة (Medium)</option>
                <option value="high">عالية (High)</option>
                <option value="emergency">طارئة (Emergency)</option>
              </Select>
            </Field>
            <Field label="الفني (اختياري)">
              <Select
                value={draft.technician}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, technician: event.target.value }))
                }
              >
                <option value="">بدون تحديد</option>
                {TECHNICIANS.map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <Icon name={isEdit ? "pencil" : "plus"} size={18} />
            {isEdit ? "حفظ التعديل" : "إنشاء الطلب"}
          </Button>
        </div>
        </form>
      </Modal>
      {createdOrder ? (
        <OrderPdfActionsModal
          order={createdOrder}
          onClose={() => {
            setCreatedOrder(null);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(order: Order): Blob {
  const lines = [
    "Golden Control - Maintenance Order",
    `Order: ${order.id}`,
    `Client: ${escapePdfText(order.client)}`,
    `Phone: ${order.phone}`,
    `Device: ${escapePdfText(order.device)}`,
    `Brand: ${escapePdfText(order.brand)}`,
    `Technician: ${escapePdfText(order.technician)}`,
    `Visit: ${order.visitDate}`,
    `Priority: ${order.priority}`,
  ];

  const content = [
    "BT",
    "/F1 18 Tf",
    "50 780 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 12 Tf",
    ...lines.slice(1).map((line) => `0 -28 Td (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadOrderPdf(order: Order) {
  const url = URL.createObjectURL(buildSimplePdf(order));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printOrderPdf(order: Order) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
          h1 { color: #8a6b2f; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td { border: 1px solid #e7dfcf; padding: 12px; }
          td:first-child { width: 180px; font-weight: 700; background: #f6f1e7; }
        </style>
      </head>
      <body>
        <h1>طلب صيانة ${order.id}</h1>
        <table>
          <tr><td>العميل</td><td>${order.client}</td></tr>
          <tr><td>الهاتف</td><td dir="ltr">${order.phone}</td></tr>
          <tr><td>الجهاز</td><td>${order.device}</td></tr>
          <tr><td>الماركة</td><td>${order.brand}</td></tr>
          <tr><td>الفني</td><td>${order.technician}</td></tr>
          <tr><td>موعد الزيارة</td><td>${order.visitDate}</td></tr>
          <tr><td>العنوان</td><td>${order.address}</td></tr>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function OrderPdfActionsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal
      title="تم إنشاء الطلب"
      description={`تم إنشاء الطلب ${order.id}. يمكنك تنزيل ملف PDF أو طباعته الآن.`}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div className="rounded-md border border-border bg-surface-2 p-4 text-sm text-content-muted">
          <div className="font-semibold text-content">{order.client}</div>
          <div className="mt-1" dir="ltr">{order.phone}</div>
          <div className="mt-1">{order.device}</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => downloadOrderPdf(order)}>
            تنزيل PDF
          </Button>
          <Button type="button" onClick={() => printOrderPdf(order)}>
            طباعة PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DateFilterModal({
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
      description="حدد نوع الفترة ثم اختر تاريخ البداية والنهاية."
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <Field label="نوع الفترة">
          <Select
            value={draft.mode}
            onChange={(event) =>
              setDraft((current) => ({ ...current, mode: event.target.value as DateFilterMode }))
            }
          >
            {Object.entries(DATE_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="من تاريخ">
            <Input
              type="date"
              value={draft.from}
              onChange={(event) =>
                setDraft((current) => ({ ...current, from: event.target.value }))
              }
            />
          </Field>
          <Field label="إلى تاريخ">
            <Input
              type="date"
              value={draft.to}
              onChange={(event) =>
                setDraft((current) => ({ ...current, to: event.target.value }))
              }
            />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft({ mode: "day", from: "", to: "" })}
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

function SupplyPartModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="توريد قطعة"
      description="إضافة عملية توريد وهمية إلى حركة المخزون."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="اسم القطعة">
          <Input placeholder="مثال: حساس حرارة NTC" />
        </Field>
        <Field label="الكود">
          <Input placeholder="PRT-000" dir="ltr" />
        </Field>
        <Field label="التصنيف">
          <Input placeholder="ثلاجات / غسالات / شاشات" />
        </Field>
        <Field label="الكمية">
          <Input type="number" min={1} defaultValue={1} />
        </Field>
        <Field label="تكلفة الوحدة">
          <Input type="number" min={0} placeholder="0" />
        </Field>
        <Field label="الموقع">
          <Input placeholder="رف A-01" />
        </Field>
        <Field label="ملاحظات" className="md:col-span-2">
          <Textarea className="min-h-24" placeholder="ملاحظات اختيارية" />
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" onClick={onClose}>
            <Icon name="plus" size={18} />
            حفظ التوريد
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InternalInvoiceModal({ onClose }: { onClose: () => void }) {
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

export function OrdersScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as OrderType | null;
  const initialStatus = params.get("status") as OrderStatus | null;
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [type, setType] = useState<OrderType | "all">(initialType ?? "all");
  const [status, setStatus] = useState<OrderStatus | "all">(initialStatus ?? "all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [showForm, setShowForm] = useState(params.get("create") === "1");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    mode: "day",
    from: "",
    to: "",
  });

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const byType = type === "all" || order.type === type;
        const byStatus = status === "all" || order.status === status;
        const byPriority = priority === "all" || order.priority === priority;
        const byQuery =
          !query ||
          contains(order.id, query) ||
          contains(order.phone, query);
        const byDate = matchesDateFilter(order, dateFilter);
        return byType && byStatus && byPriority && byQuery && byDate;
      }),
    [dateFilter, orders, priority, query, status, type],
  );

  const completed = orders.filter((order) => order.status === "completed").length;
  const incompleted = orders.filter((order) => order.status === "incompleted").length;
  const pulled = orders.filter((order) => order.status === "pull-to-center").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);

  function upsertOrder(order: Order) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id);
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current];
    });
  }

  function toggleRow(orderId: string) {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الطلبات"
        subtitle="متابعة الطلبات الداخلية والخارجية، الحالات، الأولويات، والفني المسؤول."
        icon="clipboard"
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={18} />
          طلب صيانة جديد
        </Button>
      </div>

      <KpiCards
        cards={[
          { label: "إجمالي الطلبات", value: String(orders.length), icon: "clipboard" },
          { label: "مكتملة", value: String(completed), icon: "shield", tone: "success" },
          { label: "غير مكتملة", value: String(incompleted), icon: "alert", tone: "danger" },
          { label: "مسحوبة للمركز", value: String(pulled), icon: "box", tone: "info" },
        ]}
      />

      {showForm ? (
        <MaintenanceOrderModal
          onClose={() => setShowForm(false)}
          onSave={upsertOrder}
        />
      ) : null}
      {editingOrder ? (
        <MaintenanceOrderModal
          initialOrder={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={upsertOrder}
        />
      ) : null}
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={setDateFilter}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}

      <FilterCard>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث برقم الطلب أو الهاتف"
          aria-label="بحث الطلبات"
        />
        <Select
          value={type}
          onChange={(event) => setType(event.target.value as OrderType | "all")}
          aria-label="تصفية نوع الطلب"
        >
          <option value="all">كل أنواع الطلبات</option>
          <option value="external">طلبات خارجية</option>
          <option value="internal">طلبات داخلية</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}
          aria-label="تصفية حالة الطلب"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority | "all")}
          aria-label="تصفية الأولوية"
        >
          <option value="all">كل الأولويات</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          وقت
        </Button>
      </FilterCard>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {[
                  "رقم الطلب",
                  "العميل",
                  "الجهاز",
                  "الفني",
                  "الحالة",
                  "الأولوية",
                  "الإجراءات",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <Fragment key={order.id}>
                  <tr key={order.id} className="border-b border-border hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{order.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-content">{order.client}</div>
                      <div className="text-xs text-content-muted" dir="ltr">
                        {order.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-content-muted">
                      {order.device}
                      <span className="mx-1 text-border">/</span>
                      {order.brand}
                    </td>
                    <td className="px-4 py-4 text-content">{order.technician}</td>
                    <td className="px-4 py-4">
                      <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={order.priority === "emergency" ? "danger" : "neutral"}>
                        {PRIORITY_LABELS[order.priority]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`${expandedRows.has(order.id) ? "إخفاء" : "إظهار"} ${order.id}`}
                          title={expandedRows.has(order.id) ? "إخفاء المعلومات" : "إظهار المعلومات"}
                          onClick={() => toggleRow(order.id)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name={expandedRows.has(order.id) ? "eye-off" : "eye"} size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`تعديل ${order.id}`}
                          title="تعديل"
                          onClick={() => setEditingOrder(order)}
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${order.id}`}
                          title="حذف"
                          onClick={() => setOrders((current) => current.filter((item) => item.id !== order.id))}
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(order.id) ? (
                    <tr className="border-b border-border bg-surface-2/70">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-3 text-sm text-content-muted md:grid-cols-4">
                          <div>
                            <span className="font-semibold text-content">موقع الطلب: </span>
                            {typeLabel(order.type)}
                          </div>
                          <div>
                            <span className="font-semibold text-content">العنوان: </span>
                            {order.address}
                          </div>
                          <div>
                            <span className="font-semibold text-content">موعد الزيارة: </span>
                            {order.visitDate}
                          </div>
                          <div>
                            <span className="font-semibold text-content">الإجمالي: </span>
                            {formatMoney(order.total)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <EmptyState title="لا توجد طلبات مطابقة للفلاتر." /> : null}
      </Card>
    </div>
  );
}

export function InventoryScreen({ section = "parts" }: { section?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const lowStock = INVENTORY.filter((item) => item.stock <= item.minStock);
  const categories = Array.from(new Set(INVENTORY.map((item) => item.category)));
  const filtered = INVENTORY.filter((item) => {
    const byQuery = !query || contains(item.name, query) || contains(item.id, query);
    const byCategory = category === "all" || item.category === category;
    return byQuery && byCategory;
  });

  const isAlerts = section === "alerts";
  const isMovement = section === "movement";

  return (
    <div className="space-y-6">
      <SectionTitle
        title={isAlerts ? "تنبيهات المخزون" : isMovement ? "حركة المخزون" : "قطع الغيار"}
        subtitle="إدارة مخزون قطع الصيانة، حدود النقص، ومتابعة الصرف والتوريد."
        icon="box"
      />
      {showSupplyModal ? <SupplyPartModal onClose={() => setShowSupplyModal(false)} /> : null}

      <KpiCards
        cards={[
          { label: "إجمالي القطع", value: String(INVENTORY.length), icon: "box" },
          { label: "تنبيهات نقص", value: String(lowStock.length), icon: "alert", tone: "danger" },
          {
            label: "قيمة المخزون",
            value: formatMoney(INVENTORY.reduce((sum, item) => sum + item.stock * item.unitCost, 0)),
            icon: "wallet",
          },
          { label: "آخر حركة", value: "اليوم", icon: "clock", tone: "info" },
        ]}
      />

      <FilterCard>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث باسم القطعة أو الكود"
          aria-label="بحث المخزون"
        />
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="تصنيف القطع"
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button type="button" variant="outline">
          <Icon name="clipboard" size={18} />
          جرد سريع
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowSupplyModal(true)}>
          <Icon name="plus" size={18} />
          توريد قطعة
        </Button>
      </FilterCard>

      {isAlerts ? (
        <div className="grid gap-4 md:grid-cols-2">
          {lowStock.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="text-right">
                  <h3 className="font-heading text-lg font-bold text-content">{item.name}</h3>
                  <p className="text-sm text-content-muted">{item.location}</p>
                </div>
                <Badge tone="danger" dot>
                  تحت الحد الأدنى
                </Badge>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-content-muted">
                  <span>المتوفر {item.stock}</span>
                  <span>الحد الأدنى {item.minStock}</span>
                </div>
                <ProgressBar value={(item.stock / item.minStock) * 100} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الكود", "القطعة", "التصنيف", "المتوفر", "الموقع", "آخر حركة", "القيمة"].map(
                    (header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{item.id}</td>
                    <td className="px-4 py-4 text-content">{item.name}</td>
                    <td className="px-4 py-4">
                      <Badge tone="neutral">{item.category}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={item.stock <= item.minStock ? "danger" : "success"} dot>
                        {item.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{item.location}</td>
                    <td className="px-4 py-4 text-content-muted">{item.lastMove}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(item.stock * item.unitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function InvoicesScreen() {
  const params = useSearchParams();
  const initialType = params.get("type") as InvoiceType | null;
  const initialCurrency = params.get("currency")?.toUpperCase() as Currency | undefined;
  const [type, setType] = useState<InvoiceType | "all">(initialType ?? "all");
  const [currency, setCurrency] = useState<Currency | "all">(initialCurrency ?? "all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const filtered = INVOICES.filter((invoice) => {
    const byType = type === "all" || invoice.type === type;
    const byCurrency = currency === "all" || invoice.currency === currency;
    const byStatus = status === "all" || invoice.status === status;
    return byType && byCurrency && byStatus;
  });

  const total = filtered.reduce((sum, invoice) => sum + invoice.total, 0);
  const paid = filtered.reduce((sum, invoice) => sum + invoice.paid, 0);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الفواتير"
        subtitle="مراجعة الفواتير الداخلية والخارجية، الدفعات، المتبقي، وتجهيز الطباعة."
        icon="file"
      />
      {showInvoiceModal ? <InternalInvoiceModal onClose={() => setShowInvoiceModal(false)} /> : null}
      <KpiCards
        cards={[
          { label: "عدد الفواتير", value: String(filtered.length), icon: "file" },
          { label: "المدفوع", value: formatMoney(paid), icon: "wallet", tone: "success" },
          { label: "المتبقي", value: formatMoney(total - paid), icon: "clock", tone: "gold" },
          { label: "فواتير جزئية", value: String(INVOICES.filter((i) => i.status === "partial").length), icon: "alert" },
        ]}
      />
      <FilterCard>
        <Select value={type} onChange={(event) => setType(event.target.value as InvoiceType | "all")}>
          <option value="all">كل الفواتير</option>
          <option value="external">فواتير خارجية</option>
          <option value="internal">فواتير داخلية</option>
        </Select>
        <Select value={currency} onChange={(event) => setCurrency(event.target.value as Currency | "all")}>
          <option value="all">كل العملات</option>
          <option value="SYP">ليرة سورية</option>
          <option value="USD">دولار</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus | "all")}>
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوعة بالكامل</option>
          <option value="partial">مدفوعة جزئياً</option>
          <option value="unpaid">غير مدفوعة</option>
        </Select>
        <Button type="button" onClick={() => setShowInvoiceModal(true)}>
          <Icon name="plus" size={18} />
          فاتورة داخلية
        </Button>
      </FilterCard>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["رقم الفاتورة", "الطلب", "العميل", "الفني", "النوع", "الحالة", "الإجمالي", "المتبقي", "إجراءات"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{invoice.id}</td>
                  <td className="px-4 py-4 text-content-muted">{invoice.orderId}</td>
                  <td className="px-4 py-4 text-content">{invoice.client}</td>
                  <td className="px-4 py-4 text-content-muted">{invoice.technician}</td>
                  <td className="px-4 py-4">
                    <Badge tone="neutral">{typeLabel(invoice.type)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                      {PAYMENT_LABELS[invoice.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline">
                        PDF
                      </Button>
                      <Button type="button" size="sm" variant="ghost">
                        دفعة
                      </Button>
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

function financeTitle(section?: string[]) {
  const key = section?.join("/") ?? "";
  if (key.includes("expenses/fixed")) return "المصروفات الثابتة";
  if (key.includes("expenses/variable")) return "المصروفات المتغيرة";
  if (key.includes("sales")) return "المبيعات";
  if (key.includes("profits")) return "الأرباح";
  if (key.includes("reports/maintenance")) return "تقارير الصيانة";
  if (key.includes("reports/technicians")) return "تقارير الفنيين";
  if (key.includes("reports/financial")) return "التقارير المالية";
  return "الإدارة المالية";
}

export function FinanceScreen({ section }: { section?: string[] }) {
  const title = financeTitle(section);
  const sales = FINANCE_RECORDS.filter((record) => record.category === "sales");
  const expenses = FINANCE_RECORDS.filter((record) => record.category !== "sales");
  const salesTotal = sales.reduce((sum, record) => sum + record.amount, 0);
  const expensesTotal = expenses.reduce((sum, record) => sum + record.amount, 0);
  const profit = salesTotal - expensesTotal;
  const isReport = section?.[0] === "reports";

  const records = useMemo(() => {
    const key = section?.join("/") ?? "";
    if (key.includes("fixed")) return FINANCE_RECORDS.filter((record) => record.category === "fixed");
    if (key.includes("variable")) return FINANCE_RECORDS.filter((record) => record.category === "variable");
    if (key.includes("sales")) return sales;
    return FINANCE_RECORDS;
  }, [sales, section]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title={title}
        subtitle="مراقبة التدفقات المالية، المصروفات، المبيعات، وصافي الأرباح."
        icon="wallet"
      />
      <KpiCards
        cards={[
          { label: "المبيعات", value: formatMoney(salesTotal), icon: "chart", tone: "success" },
          { label: "المصروفات", value: formatMoney(expensesTotal), icon: "wallet", tone: "gold" },
          { label: "صافي الربح", value: formatMoney(profit), icon: "shield", tone: profit >= 0 ? "success" : "danger" },
          { label: "الفواتير المفتوحة", value: "3", icon: "file", tone: "info" },
        ]}
      />

      {isReport ? (
        <Card className="p-5">
          <div className="mb-5 text-right">
            <h3 className="font-heading text-lg font-bold text-content">{title}</h3>
            <p className="text-sm text-content-muted">
              ملخص بصري سريع للاتجاهات الشهرية مع مؤشرات قابلة للاستبدال لاحقًا برسوم بيانية حقيقية.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-6" dir="ltr">
            {["h-[54%]", "h-[72%]", "h-[64%]", "h-[88%]", "h-[76%]", "h-[94%]"].map((heightClass, index) => (
              <div key={heightClass} className="flex h-44 flex-col justify-end rounded-md bg-surface-2 p-3">
                <div
                  className={`rounded-sm bg-gold ${heightClass}`}
                  title={`الشهر ${index + 1}`}
                />
                <span className="mt-2 text-center text-xs text-content-muted">{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الرقم", "البند", "التصنيف", "المسؤول", "التاريخ", "المبلغ"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{record.id}</td>
                    <td className="px-4 py-4 text-content">{record.title}</td>
                    <td className="px-4 py-4">
                      <Badge tone={record.category === "sales" ? "success" : "gold"}>
                        {record.category === "sales"
                          ? "مبيعات"
                          : record.category === "fixed"
                            ? "ثابت"
                            : "متغير"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{record.owner}</td>
                    <td className="px-4 py-4 text-content-muted">{record.date}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(record.amount, record.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function TechnicianPerformanceScreen() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="أداء الفنيين"
        subtitle="تتبع الإنجاز، الطلبات النشطة، التأخير، رضا العملاء، والعائد لكل فني."
        icon="chart"
      />
      <KpiCards
        cards={[
          {
            label: "الطلبات المكتملة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.completed, 0)),
            icon: "shield",
            tone: "success",
          },
          {
            label: "طلبات نشطة",
            value: String(TECHNICIANS.reduce((sum, tech) => sum + tech.active, 0)),
            icon: "clipboard",
            tone: "info",
          },
          {
            label: "متوسط الرضا",
            value: `${Math.round(TECHNICIANS.reduce((sum, tech) => sum + tech.satisfaction, 0) / TECHNICIANS.length)}%`,
            icon: "chart",
          },
          {
            label: "العائد",
            value: formatMoney(TECHNICIANS.reduce((sum, tech) => sum + tech.revenue, 0)),
            icon: "wallet",
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {TECHNICIANS.map((tech) => (
          <Card key={tech.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="font-heading text-lg font-bold text-content">{tech.name}</h3>
                <p className="text-sm text-content-muted">{tech.id}</p>
              </div>
              <Badge tone={tech.status === "available" ? "success" : tech.status === "busy" ? "gold" : "neutral"} dot>
                {tech.status === "available" ? "متاح" : tech.status === "busy" ? "مشغول" : "مجاز"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">مكتملة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.completed}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">نشطة</p>
                <p className="font-heading text-xl font-bold text-content">{tech.active}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">تأخير</p>
                <p className="font-heading text-xl font-bold text-content">{tech.delayed}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-content-muted">
                <span>رضا العملاء</span>
                <span>{tech.satisfaction}%</span>
              </div>
              <ProgressBar value={tech.satisfaction} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsCenterScreen() {
  const [centerName, setCenterName] = useState("مركز الصيانة الذهبي");
  const [phone, setPhone] = useState("011 555 2200");
  const [exchangeRate, setExchangeRate] = useState("14500");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="الإعدادات"
        subtitle="إعدادات المركز، بيانات التواصل، سعر الصرف، وسلوك النظام العام."
        icon="gear"
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <h3 className="text-right font-heading text-lg font-bold text-content">
              بيانات المركز
            </h3>
          </CardHeader>
          <form className="grid gap-4 p-4 md:grid-cols-2">
            <Input value={centerName} onChange={(event) => setCenterName(event.target.value)} aria-label="اسم المركز" />
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="هاتف المركز" dir="ltr" />
            <Input placeholder="العنوان" defaultValue="دمشق - شارع بغداد" aria-label="العنوان" />
            <Input value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} aria-label="سعر الصرف" dir="ltr" />
            <Textarea
              className="min-h-24 md:col-span-2"
              defaultValue="الكفالة لا تشمل سوء الاستخدام أو أعطال الكهرباء الخارجية."
              aria-label="بنود الفواتير"
            />
            <div className="flex justify-end md:col-span-2">
              <Button type="button">حفظ الإعدادات الوهمية</Button>
            </div>
          </form>
        </Card>
        <Card className="p-4">
          <h3 className="text-right font-heading text-lg font-bold text-content">
            تفضيلات النظام
          </h3>
          <div className="mt-4 space-y-3">
            {[
              "كل الصلاحيات مفتوحة في النسخة الحالية",
              "إظهار تنبيهات نقص المخزون",
              "تفعيل تحديثات الطلبات اللحظية لاحقًا",
              "استخدام الليرة السورية كعملة أساسية",
            ].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-md bg-surface-2 px-3 py-3 text-sm text-content">
                <span>{item}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-gold" />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
