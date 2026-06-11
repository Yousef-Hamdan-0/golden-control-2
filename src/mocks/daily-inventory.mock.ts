import type { DailyInventory } from "@/models/technician/daily-inventory.model";

const TOOLS =
  "مجموعة مفكات كهربائية بوش، ملتيميتر رقمي فلوك، حقيبة صيانة متنقلة ألومنيوم، كاشف تسريب غاز، طقم مفاتيح ربط 12 قطعة، دريل لاسلكي.";
const NOTES = "تم فحص جميع الأدوات وهي جاهزة للعمل، تم استبدال بطارية الملتيميتر.";

const usedTools = [
  { name: "ضاغط ثلاجة", qty: 2 },
  { name: "كبسة تشغيل", qty: 2 },
  { name: "مكثف تشغيل", qty: 2 },
  { name: "ريليه حماية", qty: 2 },
  { name: "غاز R134", qty: 2 },
  { name: "أنبوب نحاس", qty: 2 },
  { name: "عازل حراري", qty: 2 },
  { name: "لحام فضي", qty: 2 },
];

export const MOCK_DAILY_INVENTORY: DailyInventory[] = Array.from({ length: 6 }).map(
  (_, i) => ({
    id: `INV-${1001 + i}`,
    technicianId: "#USR-555",
    technicianName: "م. فادي العمري",
    technicianPhone: "+966 50 1234567",
    createdAt: "2026-06-06T08:30:00",
    tools: TOOLS,
    notes: NOTES,
    usedTools,
  }),
);
