import type { Role } from "@/models/auth/user.model";
import type { IconName } from "@/lib/icons";

export interface NavItem {
  label: string;
  href?: string;
  icon?: IconName;
  /** Roles allowed to see this item. Omit = all roles. */
  roles?: Role[];
  children?: NavItem[];
}

/**
 * Sidebar tree — matches the uploaded screenshots exactly.
 * Single source consumed by the Sidebar and (later) middleware route gating.
 */
export const NAVIGATION: NavItem[] = [
  {
    label: "لوحة القيادة",
    href: "/dashboard",
    icon: "shield",
  },
  {
    label: "إدارة المستخدمين",
    icon: "users",
    roles: ["admin"],
    children: [
      { label: "المدراء", href: "/settings/users?role=manager" },
      { label: "موظفو خدمة العملاء", href: "/settings/users?role=employee" },
      { label: "الفنيين", href: "/settings/users?role=technician" },
    ],
  },
  {
    label: "إدارة العملاء",
    href: "/customers",
    icon: "user",
  },
  {
    label: "إدارة الفنيين",
    icon: "wrench",
    children: [
      { label: "المخزون اليومي", href: "/technicians/inventory" },
      { label: "الأداء", href: "/technicians/performance" },
    ],
  },
  {
    label: "إدارة الطلبات",
    icon: "clipboard",
    children: [
      { label: "طلبات خارجية", href: "/orders?type=external" },
      { label: "طلبات داخلية", href: "/orders?type=internal" },
      { label: "محولة للمركز", href: "/orders?status=pull-to-center" },
      { label: "قيد الإصلاح", href: "/orders?status=incompleted" },
      { label: "مكتملة", href: "/orders?status=completed" },
    ],
  },
  {
    label: "إدارة المخزون",
    icon: "box",
    children: [
      { label: "قطع الغيار", href: "/inventory" },
      { label: "حركة المخزون", href: "/inventory/movement" },
    ],
  },
  {
    label: "إدارة الفواتير",
    icon: "file",
    children: [
      { label: "الفواتير الداخلية", href: "/invoices?type=internal" },
      { label: "الفواتير الخارجية", href: "/invoices?type=external" },
      { label: "فواتير الدولار", href: "/invoices?currency=usd" },
      { label: "فواتير الليرة", href: "/invoices?currency=syp" },
    ],
  },
  {
    label: "الإدارة المالية",
    icon: "wallet",
    children: [
      { label: "المصروفات الثابتة", href: "/finance/expenses/fixed" },
      { label: "المصروفات المتغيرة", href: "/finance/expenses/variable" },
      { label: "المبيعات", href: "/finance/sales" },
      { label: "الأرباح", href: "/finance/profits" },
    ],
  },
  {
    label: "التقارير والإحصائيات",
    icon: "chart",
    children: [
      { label: "تقارير الصيانة", href: "/finance/reports/maintenance" },
      { label: "تقارير الفنيين", href: "/finance/reports/technicians" },
      { label: "التقارير المالية", href: "/finance/reports/financial" },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { label: "سعر الصرف", href: "/settings/exchange-rate", icon: "exchange" },
  { label: "الإعدادات", href: "/settings/center", icon: "gear" },
  { label: "تسجيل الخروج", href: "/login", icon: "logout" },
];
