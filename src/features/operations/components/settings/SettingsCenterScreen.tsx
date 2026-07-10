"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useSettingsMutations, useSettingsQuery } from "@/features/settings/hooks/use-settings";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import {
  createSettingsPatch,
  hasSettingsPatch,
  SettingsInputSchema,
  settingsMediaUrl,
  settingsToInput,
  type SettingsInput,
} from "@/models/settings/settings.model";
import { SectionTitle } from "../shared/SectionTitle";
import { useRole } from "@/features/auth/hooks/use-role";

type SettingsField = keyof SettingsInput;
type SettingsErrors = Partial<Record<SettingsField, string>>;

export function SettingsCenterScreen() {
  const toast = useToast();
  // PATCH /settings and the logo upload are admin-only per the permissions
  // matrix; other roles get a read-only view.
  const { role } = useRole();
  const readOnly = role !== null && role !== "admin";
  const settingsQuery = useSettingsQuery();
  const { update, uploadLogo } = useSettingsMutations();
  const [draft, setDraft] = useState<SettingsInput | null>(null);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoInputKey, setLogoInputKey] = useState(0);
  const logoUrl = settingsMediaUrl(settingsQuery.data?.logoPath);
  const displayedLogoUrl = logoPreviewUrl || logoUrl || "/brand/al-khubara-logo-transparent.png";

  useEffect(() => {
    if (settingsQuery.data && !draft) setDraft(settingsToInput(settingsQuery.data));
  }, [draft, settingsQuery.data]);

  useEffect(() => {
    if (settingsQuery.isError && settingsQuery.error) {
      toast.error("تعذر تحميل الإعدادات", getApiErrorMessage(settingsQuery.error));
    }
  }, [settingsQuery.error, settingsQuery.isError, toast]);

  useEffect(() => {
    if (!logo) {
      setLogoPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(logo);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  function patchDraft(field: SettingsField, value: string) {
    update.reset();
    uploadLogo.reset();
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const parsed = SettingsInputSchema.safeParse(draft);
    if (!parsed.success) {
      const nextErrors: SettingsErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as SettingsField | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    if (!settingsQuery.data) return;
    const patch = createSettingsPatch(parsed.data, settingsQuery.data);
    const hasLogo = Boolean(logo);
    if (!hasSettingsPatch(patch) && !hasLogo) {
      toast.success("لا توجد تغييرات", "لم يتم إرسال طلب تعديل للإعدادات.");
      return;
    }

    try {
      let nextSettings = settingsQuery.data;
      if (hasSettingsPatch(patch)) {
        nextSettings = await update.mutateAsync(patch);
      }
      if (logo) {
        nextSettings = await uploadLogo.mutateAsync(logo);
        setLogo(null);
        setLogoInputKey((current) => current + 1);
      }
      setDraft(settingsToInput(nextSettings));
      toast.success(
        "تم حفظ بيانات المركز",
        logo ? "تم تحديث بيانات المركز والشعار بنجاح." : "تم تحديث بيانات المركز بنجاح.",
      );
    } catch (error) {
      toast.error("تعذر حفظ بيانات المركز", getApiErrorMessage(error));
    }
  }

  if (settingsQuery.isLoading && !draft) {
    return (
      <Card className="flex min-h-64 items-center justify-center">
        <Spinner />
      </Card>
    );
  }

  if (settingsQuery.isError && !draft) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <p className="text-sm text-danger">{getApiErrorMessage(settingsQuery.error)}</p>
        <Button type="button" variant="outline" onClick={() => settingsQuery.refetch()}>
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  if (!draft) return null;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة بيانات المركز"
        subtitle="تحديث بيانات المركز التي تظهر على الفواتير، الطلبات، والمستندات الرسمية."
        action={
          <div className="flex h-36 w-52 items-center justify-center rounded-md border border-border bg-surface p-3 shadow-card">
            <div
              aria-label={settingsQuery.data?.centerName || "شعار المركز"}
              role="img"
              className="h-full w-full bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url("${displayedLogoUrl}")`,
              }}
            />
          </div>
        }
      />
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-right font-heading text-lg font-bold text-content">
            بيانات المركز
          </h3>
        </CardHeader>
        <form className="grid gap-4 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {update.error ? (
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger md:col-span-2">
              {getApiErrorMessage(update.error)}
            </div>
          ) : null}
          {uploadLogo.error ? (
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger md:col-span-2">
              {getApiErrorMessage(uploadLogo.error)}
            </div>
          ) : null}
          <Field label="اسم المركز" error={errors.centerName}>
            <Input
              value={draft.centerName}
              onChange={(event) => patchDraft("centerName", event.target.value)}
              placeholder="اسم المركز"
              disabled={readOnly}
              aria-invalid={Boolean(errors.centerName)}
            />
          </Field>
          <Field label="الاسم الثانوي" error={errors.secondaryName}>
            <Input
              value={draft.secondaryName ?? ""}
              onChange={(event) => patchDraft("secondaryName", event.target.value)}
              placeholder="الاسم الثانوي"
              disabled={readOnly}
              aria-invalid={Boolean(errors.secondaryName)}
            />
          </Field>
          <Field label="العنوان" className="md:col-span-2" error={errors.address}>
            <Input
              value={draft.address}
              onChange={(event) => patchDraft("address", event.target.value)}
              placeholder="دمشق - المزة - شارع الجلاء"
              disabled={readOnly}
              aria-invalid={Boolean(errors.address)}
            />
          </Field>
          <Field label="رقم الهاتف الأساسي" error={errors.phone1}>
            <Input
              value={draft.phone1}
              onChange={(event) => patchDraft("phone1", event.target.value)}
              placeholder="011 123 4567"
              disabled={readOnly}
              dir="ltr"
              aria-invalid={Boolean(errors.phone1)}
            />
          </Field>
          <Field label="رقم الهاتف البديل" error={errors.phone2}>
            <Input
              value={draft.phone2 ?? ""}
              onChange={(event) => patchDraft("phone2", event.target.value)}
              placeholder="09xx xxx xxx"
              disabled={readOnly}
              dir="ltr"
              aria-invalid={Boolean(errors.phone2)}
            />
          </Field>
          <Field label="البريد الإلكتروني" className="md:col-span-2" error={errors.email}>
            <Input
              value={draft.email}
              onChange={(event) => patchDraft("email", event.target.value)}
              placeholder="البريد الإلكتروني"
              disabled={readOnly}
              dir="ltr"
              type="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
          <Field label="شعار المركز" className="md:col-span-2">
            <div className="grid gap-2">
              <Input
                key={logoInputKey}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={readOnly}
                className="bg-surface"
                onChange={(event) => {
                  update.reset();
                  uploadLogo.reset();
                  setLogo(event.target.files?.[0] ?? null);
                }}
              />
              <span className="text-xs text-content-muted">
                {logo?.name || settingsQuery.data?.logoPath || "لم يتم اختيار شعار"}
              </span>
            </div>
          </Field>
          {(["term1", "term2", "term3", "term4"] as const).map((field, index) => (
            <Field
              key={field}
              label={`البند ${index + 1} - اختياري`}
              className="md:col-span-2"
              error={errors[field]}
            >
              <Textarea
                value={draft[field] ?? ""}
                onChange={(event) => patchDraft(field, event.target.value)}
                className="min-h-20"
                placeholder={`اكتب البند ${index + 1}`}
                disabled={readOnly}
                aria-invalid={Boolean(errors[field])}
              />
            </Field>
          ))}
          {readOnly ? (
            <p className="text-right text-xs text-content-muted md:col-span-2">
              تعديل بيانات المركز متاح لمدير النظام فقط.
            </p>
          ) : null}
          <div className={readOnly ? "hidden" : "flex justify-end md:col-span-2"}>
            <Button type="submit" disabled={update.isPending || uploadLogo.isPending}>
              {update.isPending || uploadLogo.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Icon name="pencil" size={18} />
              )}
              {update.isPending || uploadLogo.isPending ? "جارٍ الحفظ..." : "حفظ بيانات المركز"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
