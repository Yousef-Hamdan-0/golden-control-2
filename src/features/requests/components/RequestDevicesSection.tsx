import type { RepairRequestDevice } from "@/models/requests/request.model";
import { fallback } from "@/features/requests/components/request-details.helpers";

interface RequestDevicesSectionProps {
  devices: RepairRequestDevice[];
}

export function RequestDevicesSection({ devices }: RequestDevicesSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold text-gold">الأجهزة</h3>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[760px] w-full text-right text-sm">
          <thead>
            <tr className="bg-surface-2 text-content-muted">
              {["نوع الجهاز", "اسم الجهاز", "العلامة التجارية", "الموديل"].map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.length ? (
              devices.map((device, index) => (
                <tr key={`${device.deviceName}-${index}`} className="border-t border-border">
                  <td className="px-4 py-3 text-content-muted">{fallback(device.deviceType)}</td>
                  <td className="px-4 py-3 font-semibold text-content">{fallback(device.deviceName)}</td>
                  <td className="px-4 py-3 text-content-muted">{fallback(device.brand)}</td>
                  <td className="px-4 py-3 text-content-muted">{fallback(device.model)}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-center text-content-muted" colSpan={4}>
                  لا توجد أجهزة مرتبطة بهذا الطلب.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
