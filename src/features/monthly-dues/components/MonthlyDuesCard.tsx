import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { UserAvatar } from "@/features/users/components/UserAvatar";
import { PAYROLL_ADJUSTMENT_LABELS } from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import type { PayrollAdjustmentType } from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { isPositiveAdjustment, type MonthlyUserDue } from "@/features/monthly-dues/models/monthly-dues.model";
import { formatMoney } from "@/lib/format/currency";
import { Icon } from "@/lib/icons";
import { ROLE_LABELS_AR } from "@/models/auth/user.model";

const ADJUSTMENT_TONES: Record<PayrollAdjustmentType, BadgeTone> = {
  salary: "gold",
  bonus: "success",
  deduction: "danger",
  overtime: "info",
  commission: "success",
};

export function MonthlyDuesCard({ due }: { due: MonthlyUserDue }) {
  const { user, settlements, totalDue } = due;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-center gap-3">
        <UserAvatar name={user.fullName} imageUrl={user.imageUrl} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-base font-bold text-content">
            {user.fullName}
          </h3>
          <p className="text-xs text-content-muted" dir="ltr">
            {user.userNumber || user.id}
          </p>
        </div>
        <Badge tone="gold">{ROLE_LABELS_AR[user.role]}</Badge>
      </CardHeader>

      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-surface px-4 py-3">
          <p className="text-xs text-content-muted">المسمى الوظيفي</p>
          <p className="mt-1 truncate text-sm font-medium text-content">
            {user.jobTitle || "غير محدد"}
          </p>
        </div>
        <div className="bg-surface px-4 py-3">
          <p className="text-xs text-content-muted">الراتب الأساسي</p>
          <p className="mt-1 text-sm font-medium text-content" dir="ltr">
            {formatMoney(user.salary, "SYP")}
          </p>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-xs font-medium text-content-muted">تسويات الراتب عن هذا الشهر</p>
        {settlements.length ? (
          <ul className="space-y-2">
            {settlements.map((settlement) => (
              <li
                key={settlement.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-surface-2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone={ADJUSTMENT_TONES[settlement.type]}>
                    {PAYROLL_ADJUSTMENT_LABELS[settlement.type]}
                  </Badge>
                  {settlement.note ? (
                    <span className="truncate text-xs text-content-muted">{settlement.note}</span>
                  ) : null}
                </div>
                <span
                  className={`text-sm font-medium ${isPositiveAdjustment(settlement.type) ? "text-success" : "text-danger"}`}
                  dir="ltr"
                >
                  {isPositiveAdjustment(settlement.type) ? "+" : "-"}
                  {formatMoney(settlement.amount, "SYP")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-content-muted">لا توجد تسويات لهذا الشهر</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold">
            <Icon name="wallet" size={18} />
          </span>
          <p className="text-sm font-semibold text-content">إجمالي المستحق</p>
        </div>
        <p className="font-heading text-lg font-bold text-content" dir="ltr">
          {formatMoney(totalDue, "SYP")}
        </p>
      </div>
    </Card>
  );
}
