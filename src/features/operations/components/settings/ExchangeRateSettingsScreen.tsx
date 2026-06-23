"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useSettingsMutations, useSettingsQuery } from "@/features/settings/hooks/use-settings";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { Icon } from "@/lib/icons";
import { SettingsInputSchema, settingsToInput } from "@/models/settings/settings.model";
import { SectionTitle } from "../shared/SectionTitle";
import { DetailItem } from "../shared/DetailItem";

function formatUpdatedAt(value: string) {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ExchangeRateSettingsScreen() {
  const toast = useToast();
  const settingsQuery = useSettingsQuery();
  const { update } = useSettingsMutations();
  const [exchangeRate, setExchangeRate] = useState("");
  const [rateError, setRateError] = useState<string>();

  useEffect(() => {
    if (settingsQuery.data) setExchangeRate(settingsQuery.data.dollarExchangeRate);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (settingsQuery.isError && settingsQuery.error) {
      toast.error("تعذر تحميل سعر الصرف", getApiErrorMessage(settingsQuery.error));
    }
  }, [settingsQuery.error, settingsQuery.isError, toast]);

  function updateExchangeRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settingsQuery.data) return;

    const input = {
      ...settingsToInput(settingsQuery.data),
      dollarExchangeRate: exchangeRate,
    };
    const parsed = SettingsInputSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (current) => current.path[0] === "dollarExchangeRate",
      );
      setRateError(issue?.message ?? "سعر الصرف غير صالح");
      return;
    }

    setRateError(undefined);
    if (parsed.data.dollarExchangeRate === settingsQuery.data.dollarExchangeRate) {
      toast.success("لا توجد تغييرات", "لم يتم إرسال طلب تعديل لسعر الصرف.");
      return;
    }

    update.mutate({ dollarExchangeRate: parsed.data.dollarExchangeRate }, {
      onSuccess: (settings) => {
        setExchangeRate(settings.dollarExchangeRate);
        toast.success("تم تحديث سعر الصرف", "تم حفظ سعر صرف الدولار بنجاح.");
      },
      onError: (error) =>
        toast.error("تعذر تحديث سعر الصرف", getApiErrorMessage(error)),
    });
  }

  if (settingsQuery.isLoading && !settingsQuery.data) {
    return (
      <Card className="flex min-h-64 items-center justify-center">
        <Spinner />
      </Card>
    );
  }

  if (settingsQuery.isError && !settingsQuery.data) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <p className="text-sm text-danger">{getApiErrorMessage(settingsQuery.error)}</p>
        <Button type="button" variant="outline" onClick={() => settingsQuery.refetch()}>
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="سعر الصرف"
        subtitle="تحديد سعر صرف الدولار مقابل الليرة السورية لاستخدامه في الدفعات والتحويلات المالية."
      />
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-right font-heading text-lg font-bold text-content">
            تحديث سعر الصرف
          </h3>
        </CardHeader>
        <form
          className="grid gap-4 p-4 md:grid-cols-[minmax(240px,1fr)_auto]"
          onSubmit={updateExchangeRate}
        >
          <Field label="سعر صرف الدولار مقابل الليرة السورية" error={rateError}>
            <Input
              value={exchangeRate}
              onChange={(event) => {
                update.reset();
                setRateError(undefined);
                setExchangeRate(event.target.value);
              }}
              placeholder="مثال: 14500"
              dir="ltr"
              inputMode="decimal"
              aria-invalid={Boolean(rateError)}
            />
          </Field>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={update.isPending || !settingsQuery.data}
            >
              {update.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="exchange" size={18} />}
              {update.isPending ? "جارٍ التحديث..." : "تحديث سعر الصرف"}
            </Button>
          </div>
          {update.error ? (
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger md:col-span-2">
              {getApiErrorMessage(update.error)}
            </div>
          ) : null}
        </form>
        <div className="grid gap-3 border-t border-border bg-surface-2 p-4 md:grid-cols-2">
          <DetailItem label="السعر الحالي" value={`${settingsQuery.data?.dollarExchangeRate || "0"} ل.س`} ltr />
          <DetailItem
            label="آخر تحديث"
            value={formatUpdatedAt(settingsQuery.data?.updatedAt ?? "")}
          />
        </div>
      </Card>
    </div>
  );
}
