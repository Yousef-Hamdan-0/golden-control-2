"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Icon } from "@/lib/icons";
import { SectionTitle } from "../shared/SectionTitle";
import { DetailItem } from "../shared/DetailItem";

export function ExchangeRateSettingsScreen() {
  const [exchangeRate, setExchangeRate] = useState("14500");
  const [updatedAt, setUpdatedAt] = useState("لم يتم التحديث بعد");

  function updateExchangeRate() {
    const now = new Intl.DateTimeFormat("ar-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
    setUpdatedAt(now);
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
        <form className="grid gap-4 p-4 md:grid-cols-[minmax(240px,1fr)_auto]" onSubmit={(event) => event.preventDefault()}>
          <Field label="سعر صرف الدولار مقابل الليرة السورية">
            <Input
              value={exchangeRate}
              onChange={(event) => setExchangeRate(event.target.value)}
              placeholder="مثال: 14500"
              dir="ltr"
              inputMode="numeric"
            />
          </Field>
          <div className="flex items-end">
            <Button type="button" className="w-full md:w-auto" onClick={updateExchangeRate}>
              <Icon name="exchange" size={18} />
              تحديث سعر الصرف
            </Button>
          </div>
        </form>
        <div className="grid gap-3 border-t border-border bg-surface-2 p-4 md:grid-cols-2">
          <DetailItem label="السعر الحالي" value={`${exchangeRate || "0"} ل.س`} ltr />
          <DetailItem label="آخر تحديث" value={updatedAt} />
        </div>
      </Card>
    </div>
  );
}
