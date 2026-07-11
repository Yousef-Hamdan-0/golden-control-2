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
    roles: ["admin"],
  },
  {
    label: "إدارة المستخدمين",
    icon: "users",
    roles: ["admin"],
    children: [
      { label: "المدراء", href: "/users?role=manager" },
      { label: "موظفو خدمة العملاء", href: "/users?role=employee" },
      { label: "الفنيين", href: "/users?role=technician" },
    ],
  },
  {
    label: "إدارة العملاء",
    href: "/customers",
    icon: "user",
    roles: ["admin", "manager", "employee"],
  },
  {
    label: "إدارة الفنيين",
    icon: "wrench",
    children: [
      {
        label: "المخزون اليومي",
        href: "/technicians/inventory",
        roles: ["admin", "manager", "employee"],
      },
      { label: "الأداء", href: "/technicians/performance", roles: ["admin"] },
    ],
  },
  {
    label: "إدارة الطلبات",
    icon: "clipboard",
    roles: ["admin", "manager", "employee"],
    children: [
      { label: "طلبات خارجية", href: "/orders?type=external" },
      { label: "طلبات داخلية", href: "/orders?type=internal" },
      { label: "محولة للمركز", href: "/orders?status=pulltocenter" },
      { label: "قيد الإصلاح", href: "/orders?status=underrepair" },
      { label: "مكتملة", href: "/orders?status=completed" },
    ],
  },
  {
    label: "إدارة المخزون",
    icon: "box",
    children: [
      {
        label: "قطع الغيار",
        href: "/inventory",
        roles: ["admin", "manager", "employee"],
      },
      { label: "حركة المخزون", href: "/inventory/movement", roles: ["admin"] },
    ],
  },
  {
    label: "إدارة الفواتير",
    icon: "file",
    roles: ["admin", "manager", "employee"],
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
    roles: ["admin"],
    children: [
      { label: "المصروفات", href: "/finance/expenses" },
      { label: "تسويات الرواتب", href: "/finance/payroll-adjustments" },
      { label: "المبيعات والأرباح", href: "/finance/sales-profits" },
    ],
  },
  {
    label: "التقارير",
    icon: "chart",
    roles: ["admin"],
    children: [
      { label: "تقرير الطلبات", href: "/reports/orders" },
      { label: "تقارير الفنيين", href: "/reports/technicians" },
      { label: "تقارير حركة المخزون", href: "/reports/inventory-movements" },
      { label: "التقارير المالية", href: "/reports/financial" },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  // Exchange rate is an edit-only screen (PATCH /settings) → admin only.
  { label: "سعر الصرف", href: "/settings/exchange-rate", icon: "exchange", roles: ["admin"] },
  // Settings view link is visible to everyone; editing is blocked server-side
  // (PATCH /settings) for non-admins.
  { label: "الإعدادات", href: "/settings/center", icon: "gear" },
  { label: "تسجيل الخروج", href: "/login", icon: "logout" },
];

/** Keep only the items (and children) the given role is allowed to open. */
export function filterNavByRole(items: NavItem[], role: Role | null): NavItem[] {
  if (!role) return items;
  return items.reduce<NavItem[]>((visible, item) => {
    if (item.roles && !item.roles.includes(role)) return visible;
    if (item.children && item.children.length > 0) {
      const children = item.children.filter(
        (child) => !child.roles || child.roles.includes(role),
      );
      if (children.length === 0) return visible;
      visible.push({ ...item, children });
    } else {
      visible.push(item);
    }
    return visible;
  }, []);
}
