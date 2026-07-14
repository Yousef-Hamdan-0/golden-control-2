import { z } from "zod";

/** A single tool consumed/handed over, with its quantity. */
export const UsedToolSchema = z.object({
  name: z.string(),
  qty: z.number().int().nonnegative(),
});
export type UsedTool = z.infer<typeof UsedToolSchema>;

/** A daily inventory entry assigned to a technician (screenshot 2). */
export const DailyInventorySchema = z.object({
  id: z.string(),
  technicianId: z.string(),
  technicianName: z.string(),
  createdAt: z.string(), // ISO
  tools: z.string(), // free-text "الأدوات"
  notes: z.string().optional(), // "ملاحظات"
  usedTools: z.array(UsedToolSchema),
});
export type DailyInventory = z.infer<typeof DailyInventorySchema>;

/** Validated input for creating an entry (screenshot 3). */
export const DailyInventoryCreateSchema = z.object({
  technicianId: z.string().min(1, "اختيار الفني مطلوب"),
  tools: z.string().min(3, "قائمة الأدوات مطلوبة"),
  notes: z.string().optional(),
});
export type DailyInventoryCreateInput = z.infer<typeof DailyInventoryCreateSchema>;
