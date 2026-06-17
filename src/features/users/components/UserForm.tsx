"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import { CURRENCY_SYMBOL } from "@/config/constants";
import { ROLE_LABELS_AR, type Role, type User } from "@/models/auth/user.model";
import {
  UserCreateSchema,
  type UserCreateInput,
} from "@/models/users/user-create.schema";
import {
  UserUpdateSchema,
  type UserUpdateInput,
} from "@/models/users/user-update.schema";

type CreateProps = {
  mode: "create";
  onSubmit: (input: UserCreateInput) => void;
  submitting?: boolean;
  onCancel: () => void;
};
type EditProps = {
  mode: "edit";
  user: User;
  onSubmit: (input: UserUpdateInput) => void;
  submitting?: boolean;
  onCancel: () => void;
};
type Props = CreateProps | EditProps;

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center justify-start gap-2 text-right" dir="rtl">
      <span className="h-4 w-1 rounded-full bg-gold" />
      <span className="text-sm font-semibold text-gold">{children}</span>
    </div>
  );
}

export function UserForm(props: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEditValues, setPendingEditValues] = useState<UserUpdateInput | null>(null);
  const isEdit = props.mode === "edit";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserCreateInput & UserUpdateInput>({
    resolver: zodResolver(isEdit ? UserUpdateSchema : UserCreateSchema) as never,
    defaultValues: isEdit
      ? {
          fullName: props.user.fullName,
          email: props.user.email,
          phone: props.user.phone,
          jobTitle: props.user.jobTitle,
          salary: props.user.salary,
          role: props.user.role,
          status: props.user.status,
          password: "",
        }
      : { role: "employee" as Role, salary: 0 },
  });

  const role = watch("role");
  const canChangePassword = true;

  function confirmEdit() {
    if (props.mode !== "edit" || !pendingEditValues) return;
    props.onSubmit(pendingEditValues);
  }

  function sanitizeSubmitValues(values: UserCreateInput & UserUpdateInput) {
    if (!isEdit) {
      props.onSubmit(values as UserCreateInput);
      return;
    }

    setPendingEditValues(values as UserUpdateInput);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(sanitizeSubmitValues)}
        className="space-y-6"
      >
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-content">
              <Icon name="users" size={16} className="text-gold" />
              بيانات الحساب الجديد
            </span>
            <span className="text-xs text-content-muted">* جميع الحقول مطلوبة</span>
          </CardHeader>

          <div className="space-y-8 p-6">
            {/* Personal */}
            <section>
              <SectionLabel>المعلومات الشخصية</SectionLabel>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="الاسم الكامل" error={errors.fullName?.message}>
                  <Input placeholder="مثال: محمد أحمد" {...register("fullName")} />
                </Field>
                <Field label="البريد الإلكتروني" error={errors.email?.message}>
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder="user@goldencontrol.com"
                    {...register("email")}
                  />
                </Field>
                <Field label="رقم الهاتف" error={errors.phone?.message}>
                  <Input dir="ltr" placeholder="+966 50 000 0000" {...register("phone")} />
                </Field>
              </div>
            </section>

            {/* Job */}
            <section>
              <SectionLabel>المعلومات الوظيفية</SectionLabel>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="الدور" error={errors.role?.message}>
                  <Select {...register("role")}>
                    {(Object.keys(ROLE_LABELS_AR) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS_AR[r]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="المسمى الوظيفي" error={errors.jobTitle?.message}>
                  <Input placeholder="مثال: كبير المهندسين" {...register("jobTitle")} />
                </Field>
                <Field label="الراتب الشهري" error={errors.salary?.message}>
                  <div className="relative">
                    <Input type="number" step="0.01" dir="ltr" className="pl-12" {...register("salary")} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
                      {CURRENCY_SYMBOL}
                    </span>
                  </div>
                </Field>
              </div>
              {!isEdit && role === "technician" && (
                <div className="mt-4 md:w-1/3">
                  <Field label="الخصم (%)" error={errors.discount?.message}>
                    <Input type="number" step="0.1" {...register("discount")} />
                  </Field>
                </div>
              )}
            </section>

            {canChangePassword ? (
              <section>
                <SectionLabel>الأمان</SectionLabel>
                <div className="md:w-2/3">
                  <Field
                    label={isEdit ? "كلمة المرور الجديدة" : "كلمة المرور"}
                    error={errors.password?.message}
                  >
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label="إظهار كلمة المرور"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
                      >
                        <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
                      </button>
                    </div>
                  </Field>
                  <p className="mt-1.5 text-xs text-content-muted">
                    {isEdit
                      ? "يمكن لمدير النظام تغيير كلمة مرور هذا المستخدم أو تركها فارغة للإبقاء على الحالية."
                      : "سيحتاجها المستخدم عند كل تسجيل دخول. يمكن لمدير النظام تغييرها لاحقاً."}
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={props.onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={props.submitting}>
            {isEdit ? "حفظ التعديلات" : "إنشاء مستخدم"}
            {!isEdit && <Icon name="arrow-left" size={18} />}
          </Button>
        </div>
      </form>
      {pendingEditValues ? (
        <ConfirmToast
          title="تأكيد تعديل المستخدم"
          message={`هل تريد حفظ التعديلات على المستخدم ${props.mode === "edit" ? props.user.fullName : ""}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          isLoading={props.submitting}
          onCancel={() => setPendingEditValues(null)}
          onConfirm={confirmEdit}
        />
      ) : null}
    </>
  );
}
