"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import { CURRENCY_SYMBOL } from "@/config/constants";
import {
  ROLE_LABELS_AR,
  STATUS_LABELS_AR,
  type Role,
  type User,
  type UserStatus,
} from "@/models/auth/user.model";
import {
  UserCreateSchema,
  type UserCreateInput,
} from "@/models/users/user-create.schema";
import {
  UserUpdateSchema,
  type UserUpdateInput,
} from "@/models/users/user-update.schema";
import { UserAvatar } from "@/features/users/components/UserAvatar";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CreateProps = {
  mode: "create";
  defaultRole?: Role;
  onSubmit: (input: UserCreateInput) => void;
  submitting?: boolean;
  submitError?: string;
  onCancel: () => void;
};
type EditProps = {
  mode: "edit";
  user: User;
  onSubmit: (input: UserUpdateInput) => void;
  submitting?: boolean;
  submitError?: string;
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

function ImageUploadField({
  title,
  value,
  error,
  preview,
  userName,
  onChange,
}: {
  title: string;
  value?: string;
  error?: string;
  preview: "avatar" | "document";
  userName: string;
  onChange: (value: string) => void;
}) {
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFileError("الصيغ المدعومة هي JPG وPNG وWebP فقط.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFileError("يجب ألا يتجاوز حجم الصورة 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setFileError("تعذر قراءة الصورة المختارة.");
        return;
      }
      onChange(reader.result);
      setFileError("");
    };
    reader.onerror = () => setFileError("تعذر قراءة الصورة المختارة.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface-2 p-4 sm:flex-row sm:items-center">
      {preview === "avatar" ? (
        <UserAvatar name={userName} imageUrl={value || undefined} size="lg" />
      ) : (
        <span className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-gold">
          {value ? (
            <Image
              src={value}
              alt="معاينة الوثيقة الشخصية"
              fill
              sizes="160px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <Icon name="file" size={28} />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-content">{title}</p>
        <p className="mt-1 text-xs leading-5 text-content-muted">
          اختيارية — JPG أو PNG أو WebP، وبحجم لا يتجاوز 2MB.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Icon name={value ? "pencil" : "plus"} size={16} />
            {value ? "تغيير الصورة" : "اختيار صورة"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                onChange("");
                setFileError("");
              }}
            >
              <Icon name="trash" size={16} />
              إزالة الصورة
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={selectImage}
        />
        {fileError || error ? (
          <p role="alert" className="mt-2 text-xs text-danger">
            {fileError || error}
          </p>
        ) : null}
      </div>
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
    setValue,
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
          imageUrl: props.user.imageUrl ?? "",
          identityDocumentUrl: props.user.identityDocumentUrl ?? "",
          profileImagePath: props.user.profileImagePath ?? "",
          documentImagePath: props.user.documentImagePath ?? "",
          password: "",
        }
      : {
          role: props.mode === "create" ? (props.defaultRole ?? "employee") : "employee",
          salary: 0,
          imageUrl: "",
          identityDocumentUrl: "",
        },
  });

  const imageUrl = watch("imageUrl");
  const identityDocumentUrl = watch("identityDocumentUrl");
  const canChangePassword = !isEdit;

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
              {isEdit ? "بيانات المستخدم" : "بيانات الحساب الجديد"}
            </span>
            <span className="text-xs text-content-muted">* الصور اختيارية</span>
          </CardHeader>

          <div className="space-y-8 p-6">
            {/* Personal */}
            <section>
              <SectionLabel>المعلومات الشخصية</SectionLabel>
              <input type="hidden" {...register("imageUrl")} />
              <input type="hidden" {...register("identityDocumentUrl")} />
              {isEdit ? (
                <>
                  <input type="hidden" {...register("profileImagePath")} />
                  <input type="hidden" {...register("documentImagePath")} />
                </>
              ) : null}
              <div className="mb-5 grid gap-4 lg:grid-cols-2">
                <ImageUploadField
                  title="صورة المستخدم"
                  value={imageUrl}
                  error={errors.imageUrl?.message}
                  preview="avatar"
                  userName={watch("fullName") || "المستخدم"}
                  onChange={(value) => {
                    setValue("imageUrl", value, { shouldDirty: true, shouldValidate: true });
                    if (isEdit && !value) {
                      setValue("profileImagePath", "", { shouldDirty: true });
                    }
                  }}
                />
                <ImageUploadField
                  title="صورة الوثيقة الشخصية"
                  value={identityDocumentUrl}
                  error={errors.identityDocumentUrl?.message}
                  preview="document"
                  userName={watch("fullName") || "المستخدم"}
                  onChange={(value) => {
                    setValue("identityDocumentUrl", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (isEdit && !value) {
                      setValue("documentImagePath", "", { shouldDirty: true });
                    }
                  }}
                />
              </div>
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
                  <Input
                    dir="ltr"
                    placeholder="+963 9xx xxx xxx"
                    disabled={isEdit}
                    {...register("phone")}
                  />
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
                {isEdit ? (
                  <Field label="حالة المستخدم" error={errors.status?.message}>
                    <Select {...register("status")}>
                      {(Object.keys(STATUS_LABELS_AR) as UserStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS_AR[status]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </div>
            </section>

            {canChangePassword ? (
              <section>
                <SectionLabel>الأمان</SectionLabel>
                <div className="md:w-2/3">
                  <Field
                    label="كلمة المرور"
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
                    سيحتاجها المستخدم عند كل تسجيل دخول.
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </Card>

        {props.submitError ? (
          <div
            role="alert"
            className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {props.submitError}
          </div>
        ) : null}

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
