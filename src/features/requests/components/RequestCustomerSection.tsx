"use client";

import { DetailItem } from "@/features/operations/components/shared/DetailItem";
import type { RepairRequestCustomer } from "@/models/requests/request.model";
import { fallback } from "@/features/requests/components/request-details.helpers";

export function RequestCustomerSection({
  customer,
}: {
  customer: RepairRequestCustomer;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <DetailItem label="اسم العميل" value={fallback(customer.name)} />
        <DetailItem label="الهاتف الأول" value={fallback(customer.firstPhone)} ltr />
        <DetailItem label="الهاتف الثاني" value={fallback(customer.secondPhone, "لا يوجد")} ltr />
        <DetailItem label="العنوان" value={fallback(customer.address)} />
        <DetailItem
          label="رابط الموقع"
          value={
            customer.locationLink ? (
              <a
                href={customer.locationLink}
                target="_blank"
                rel="noreferrer"
                className="text-gold underline-offset-4 hover:underline"
              >
                فتح الموقع
              </a>
            ) : (
              "لا يوجد"
            )
          }
        />
      </div>
    </section>
  );
}
