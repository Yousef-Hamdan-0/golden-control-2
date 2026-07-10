"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { useRole } from "@/features/auth/hooks/use-role";
import {
  useDailyInventoryAllQuery,
  useDailyInventoryMutations,
} from "@/features/technicians/hooks/use-daily-inventory";
import {
  DailyInventoryCreateSchema,
  type DailyInventoryCreateInput,
} from "@/models/technician/daily-inventory.model";

interface DailyInventoryFormProps {
  onCancel?: () => void;
  onSaved?: () => void;
}

export function DailyInventoryForm({ onCancel, onSaved }: DailyInventoryFormProps = {}) {
  const router = useRouter();
  const toast = useToast();
  const { create } = useDailyInventoryMutations();
  // Reuse the users feature to populate the technician picker. GET /users is
  // admin-only per the permissions matrix, so the picker loads for admins
  // only; other roles see an explanatory note instead of a broken list.
  const { role } = useRole();
  const isAdmin = role === "admin";
  const { data: techs } = useUsersQuery(
    {
      role: "technician",
      status: "available",
      pageSize: 1000,
    },
    isAdmin,
  );
  const dailyInventoryQuery = useDailyInventoryAllQuery();
  const isCheckingDailyInventory =
    dailyInventoryQuery.isLoading || dailyInventoryQuery.isFetching;
  const assignedTechnicianIds = new Set(
    (dailyInventoryQuery.data?.items ?? []).map((entry) => entry.technicianId),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DailyInventoryCreateInput>({
    resolver: zodResolver(DailyInventoryCreateSchema),
  });

  const back = () => {
    if (onCancel) onCancel();
    else router.push("/technicians/inventory");
  };
  const saved = () => {
    if (onSaved) onSaved();
    else router.push("/technicians/inventory");
  };

  return (
    <form
      onSubmit={handleSubmit((values) => {
        if (isCheckingDailyInventory) {
          toast.error("تعذر إنشاء المخزون", "انتظر حتى يكتمل فحص سجلات المخزون الحالية.");
          return;
        }

        if (dailyInventoryQuery.isError) {
          toast.error(
            "تعذر إنشاء المخزون",
            "تعذر التحقق من سجلات المخزون الحالية. أعد المحاولة بعد تحديث الصفحة.",
          );
          return;
        }

        const selectedTechnician = techs?.items.find((tech) => tech.id === values.technicianId);
        if (assignedTechnicianIds.has(values.technicianId)) {
          toast.error(
            "تعذر إنشاء المخزون",
            `يوجد مخزون يومي لهذا الفني${selectedTechnician ? ` (${selectedTechnician.fullName})` : ""}. احذف السجل الموجود أولاً ثم أعد المحاولة.`,
          );
          return;
        }

        create.mutate(values, {
          onSuccess: () => {
            toast.success("تم إنشاء المخزون", "تمت إضافة مخزون الفني اليومي بنجاح.");
            saved();
          },
          onError: (error) =>
            toast.error("تعذر إنشاء المخزون", getApiErrorMessage(error)),
        });
      })}
      className="space-y-6"
    >
      <Card className="overflow-hidden">
        {/* Info banner */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3 text-sm text-content-muted">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white">
            <Icon name="alert" size={13} />
          </span>
          <span>يرجى التأكد من مطابقة الأدوات المسجّلة مع الواقع الفعلي لعهدة الفني قبل الحفظ.</span>
        </div>

        <div className="space-y-6 p-6">
          <Field label="اختيار الفني" error={errors.technicianId?.message}>
            <Select defaultValue="" {...register("technicianId")}>
              <option value="" disabled>
                اختر الفني…
              </option>
              {techs?.items.map((t) => {
                const hasDailyInventory = assignedTechnicianIds.has(t.id);
                return (
                  <option key={t.id} value={t.id} disabled={hasDailyInventory}>
                    {t.fullName}
                    {hasDailyInventory ? " - لديه مخزون يومي" : ""}
                  </option>
                );
              })}
            </Select>
          </Field>
          {!isAdmin ? (
            <p className="text-xs text-content-muted">
              قائمة الفنيين متاحة لمدير النظام فقط حالياً.
            </p>
          ) : null}
          {isCheckingDailyInventory ? (
            <p className="text-xs text-content-muted">جارٍ التحقق من سجلات المخزون الحالية...</p>
          ) : null}
          {dailyInventoryQuery.isError ? (
            <p className="text-xs text-danger">
              تعذر التحقق من سجلات المخزون الحالية. حدّث الصفحة ثم حاول مرة أخرى.
            </p>
          ) : null}

          <Field label="الأدوات (قائمة المواد)" error={errors.tools?.message}>
            <Textarea
              rows={6}
              placeholder="أدخل قائمة الأدوات والمواد هنا (مثال: مثقاب كهربائي، طقم مفكات، كابلات 50 متر…)"
              {...register("tools")}
            />
          </Field>

          <Field label="ملاحظات إضافية" error={errors.notes?.message}>
            <Textarea
              rows={4}
              placeholder="أية ملاحظات حول حالة العهدة أو نواقص معينة…"
              {...register("notes")}
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={back}>
          إلغاء
        </Button>
        <Button type="submit" disabled={create.isPending || isCheckingDailyInventory}>
          حفظ وإضافة للمخزون
        </Button>
      </div>
    </form>
  );
}
