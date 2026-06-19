"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SectionTitle } from "../shared/SectionTitle";

export function SettingsCenterScreen() {
  const [centerName, setCenterName] = useState("مركز الصيانة الذهبي");
  const [secondaryName, setSecondaryName] = useState("Golden Maintenance Center");
  const [address, setAddress] = useState("دمشق - شارع بغداد");
  const [phone, setPhone] = useState("011 555 2200");
  const [email, setEmail] = useState("info@golden-control.com");
  const [term1, setTerm1] = useState("الكفالة لا تشمل سوء الاستخدام أو أعطال الكهرباء الخارجية.");
  const [term2, setTerm2] = useState("");
  const [term3, setTerm3] = useState("");
  const [term4, setTerm4] = useState("");
  const [logoName, setLogoName] = useState("");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة بيانات المركز"
        subtitle="تحديث بيانات المركز التي تظهر على الفواتير، الطلبات، والمستندات الرسمية."
      />
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="text-right font-heading text-lg font-bold text-content">
            بيانات المركز
          </h3>
        </CardHeader>
        <form className="grid gap-4 p-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field label="اسم المركز">
            <Input value={centerName} onChange={(event) => setCenterName(event.target.value)} placeholder="اسم المركز" />
          </Field>
          <Field label="الاسم الثانوي">
            <Input value={secondaryName} onChange={(event) => setSecondaryName(event.target.value)} placeholder="الاسم الثانوي" />
          </Field>
          <Field label="العنوان" className="md:col-span-2">
            <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="عنوان المركز" />
          </Field>
          <Field label="رقم الهاتف">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" dir="ltr" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="البريد الإلكتروني" dir="ltr" type="email" />
          </Field>
          <Field label="البند 1 - اختياري" className="md:col-span-2">
            <Textarea value={term1} onChange={(event) => setTerm1(event.target.value)} className="min-h-20" placeholder="اكتب البند الأول" />
          </Field>
          <Field label="البند 2 - اختياري" className="md:col-span-2">
            <Textarea value={term2} onChange={(event) => setTerm2(event.target.value)} className="min-h-20" placeholder="اكتب البند الثاني" />
          </Field>
          <Field label="البند 3 - اختياري" className="md:col-span-2">
            <Textarea value={term3} onChange={(event) => setTerm3(event.target.value)} className="min-h-20" placeholder="اكتب البند الثالث" />
          </Field>
          <Field label="البند 4 - اختياري" className="md:col-span-2">
            <Textarea value={term4} onChange={(event) => setTerm4(event.target.value)} className="min-h-20" placeholder="اكتب البند الرابع" />
          </Field>
          <Field label="اللوجو - اختياري" className="md:col-span-2">
            <div className="grid gap-3 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Input
                type="file"
                accept="image/*"
                className="bg-surface"
                onChange={(event) => setLogoName(event.target.files?.[0]?.name ?? "")}
              />
              <span className="text-sm text-content-muted">
                {logoName || "لم يتم اختيار لوجو"}
              </span>
            </div>
          </Field>
          <div className="flex justify-end md:col-span-2">
            <Button type="button">حفظ بيانات المركز</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
