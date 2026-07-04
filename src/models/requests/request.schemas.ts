import { z } from "zod";
import {
  RepairRequestPrioritySchema,
  RepairRequestStatusSchema,
  RepairRequestTypeSchema,
} from "@/models/requests/request.constants";

export const RequestListQuerySchema = z.object({
  status: z.union([RepairRequestStatusSchema, z.literal("all")]),
  priority: z.union([RepairRequestPrioritySchema, z.literal("all")]),
  type: z.union([RepairRequestTypeSchema, z.literal("all")]),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(1000),
  search: z.string().trim().optional(),
});

export type RequestListQuery = z.infer<typeof RequestListQuerySchema>;

const OptionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "صيغة التاريخ يجب أن تكون YYYY-MM-DD.",
  });

export const RequestCustomerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم العميل مطلوب.")
    .max(255, "اسم العميل يجب ألا يتجاوز 255 حرفاً."),
  firstPhone: z
    .string()
    .trim()
    .min(1, "رقم الهاتف الأول مطلوب.")
    .max(50, "رقم الهاتف الأول يجب ألا يتجاوز 50 حرفاً."),
  secondPhone: z
    .string()
    .trim()
    .max(50, "رقم الهاتف الثاني يجب ألا يتجاوز 50 حرفاً.")
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .min(1, "عنوان العميل مطلوب.")
    .max(255, "عنوان العميل يجب ألا يتجاوز 255 حرفاً."),
  locationLink: z
    .string()
    .trim()
    .max(500, "رابط موقع العميل يجب ألا يتجاوز 500 حرف.")
    .optional()
    .default(""),
});

export const RequestDeviceInputSchema = z.object({
  deviceType: z
    .string()
    .trim()
    .min(1, "نوع الجهاز مطلوب.")
    .max(100, "نوع الجهاز يجب ألا يتجاوز 100 حرف."),
  deviceName: z
    .string()
    .trim()
    .min(1, "اسم الجهاز مطلوب.")
    .max(255, "اسم الجهاز يجب ألا يتجاوز 255 حرفاً."),
  brand: z
    .string()
    .trim()
    .max(100, "العلامة التجارية يجب ألا تتجاوز 100 حرف.")
    .optional()
    .default(""),
  model: z
    .string()
    .trim()
    .max(100, "رقم الموديل يجب ألا يتجاوز 100 حرف.")
    .optional()
    .default(""),
});

export const RepairRequestInputSchema = z.object({
  customer: RequestCustomerInputSchema,
  type: RepairRequestTypeSchema,
  priority: RepairRequestPrioritySchema,
  faultDescription: z
    .string()
    .trim()
    .min(1, "وصف العطل مطلوب.")
    .max(2000, "وصف العطل يجب ألا يتجاوز 2000 حرف."),
  notes: z
    .string()
    .trim()
    .max(2000, "الملاحظات يجب ألا تتجاوز 2000 حرف.")
    .optional()
    .default(""),
  scheduledDate: OptionalDateSchema.optional().default(""),
  devices: z.array(RequestDeviceInputSchema).min(1, "أضف جهازاً واحداً على الأقل."),
  technicianId: z.string().trim().optional().default(""),
  status: RepairRequestStatusSchema.optional(),
});

export type RepairRequestInput = z.input<typeof RepairRequestInputSchema>;
export type ParsedRepairRequestInput = z.infer<typeof RepairRequestInputSchema>;
export type RepairRequestPatchInput = Partial<
  Omit<ParsedRepairRequestInput, "customer" | "devices">
> & {
  customer?: Partial<ParsedRepairRequestInput["customer"]>;
  devices?: ParsedRepairRequestInput["devices"];
};

export const RequestRecordsInputSchema = z.object({
  requestNumber: z.string().trim().min(1, "رقم الطلب مطلوب."),
  records: z
    .array(z.string().trim().min(1, "التسجيل الصوتي مطلوب."))
    .min(1, "أضف تسجيلاً واحداً على الأقل."),
});

export type RequestRecordsInput = z.infer<typeof RequestRecordsInputSchema>;
