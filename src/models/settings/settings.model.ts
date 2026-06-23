import { z } from "zod";
import { API_BASE_URL } from "@/config/api-endpoints";
import { ApiError } from "@/helpers/api.helper";

export const SettingsSchema = z.object({
  id: z.string().min(1),
  centerName: z.string(),
  secondaryName: z.string(),
  address: z.string(),
  phone1: z.string(),
  phone2: z.string(),
  email: z.string(),
  term1: z.string(),
  term2: z.string(),
  term3: z.string(),
  term4: z.string(),
  logoPath: z.string(),
  dollarExchangeRate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export function settingsMediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

const optionalText = z.string().trim().optional().or(z.literal(""));

export const SettingsInputSchema = z.object({
  centerName: z.string().trim().min(2, "اسم المركز مطلوب"),
  secondaryName: optionalText,
  address: z.string().trim().min(2, "عنوان المركز مطلوب"),
  phone1: z.string().trim().min(7, "رقم الهاتف الأساسي غير صالح"),
  phone2: optionalText,
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  term1: optionalText,
  term2: optionalText,
  term3: optionalText,
  term4: optionalText,
  dollarExchangeRate: z
    .string()
    .trim()
    .min(1, "سعر الصرف مطلوب")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "سعر الصرف يجب أن يكون رقماً أكبر من صفر",
    }),
});

export type SettingsInput = z.infer<typeof SettingsInputSchema>;
export const SettingsPatchSchema = SettingsInputSchema.partial();
export type SettingsPatchInput = Partial<SettingsInput>;

const SETTINGS_FIELDS = [
  "centerName",
  "secondaryName",
  "address",
  "phone1",
  "phone2",
  "email",
  "term1",
  "term2",
  "term3",
  "term4",
  "dollarExchangeRate",
] as const;

const RawSettingsSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    centerName: z.string().nullish(),
    secondaryName: z.string().nullish(),
    address: z.string().nullish(),
    phone1: z.string().nullish(),
    phone2: z.string().nullish(),
    email: z.string().nullish(),
    term1: z.string().nullish(),
    term2: z.string().nullish(),
    term3: z.string().nullish(),
    term4: z.string().nullish(),
    logoPath: z.string().nullish(),
    dollarExchangeRate: z.union([z.string(), z.number()]),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeSettingsResponse(payload: unknown): Settings {
  const rawPayload = isRecord(payload) && payload.data !== undefined ? payload.data : payload;
  const parsed = RawSettingsSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new ApiError("استجابة الإعدادات غير مطابقة للنموذج المتوقع.");
  }

  const raw = parsed.data;
  return SettingsSchema.parse({
    id: String(raw.id),
    centerName: raw.centerName ?? "",
    secondaryName: raw.secondaryName ?? "",
    address: raw.address ?? "",
    phone1: raw.phone1 ?? "",
    phone2: raw.phone2 ?? "",
    email: raw.email ?? "",
    term1: raw.term1 ?? "",
    term2: raw.term2 ?? "",
    term3: raw.term3 ?? "",
    term4: raw.term4 ?? "",
    logoPath: raw.logoPath ?? "",
    dollarExchangeRate: String(raw.dollarExchangeRate),
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  });
}

export function settingsToInput(settings: Settings): SettingsInput {
  return {
    centerName: settings.centerName,
    secondaryName: settings.secondaryName,
    address: settings.address,
    phone1: settings.phone1,
    phone2: settings.phone2,
    email: settings.email,
    term1: settings.term1,
    term2: settings.term2,
    term3: settings.term3,
    term4: settings.term4,
    dollarExchangeRate: settings.dollarExchangeRate,
  };
}

export class UpdateSettingsRequestModel {
  constructor(private readonly input: SettingsPatchInput) {}

  toJSON() {
    const parsed = SettingsPatchSchema.parse(this.input);
    const providedFields = new Set(Object.keys(this.input));
    const body: Partial<Record<(typeof SETTINGS_FIELDS)[number], string>> = {};

    for (const field of SETTINGS_FIELDS) {
      if (providedFields.has(field)) body[field] = parsed[field] ?? "";
    }

    return body;
  }
}

export function createSettingsPatch(
  input: SettingsInput,
  currentSettings: Settings,
): SettingsPatchInput {
  const parsed = SettingsInputSchema.parse(input);
  const current = settingsToInput(currentSettings);
  const patch: SettingsPatchInput = {};

  for (const field of SETTINGS_FIELDS) {
    if ((parsed[field] ?? "") !== (current[field] ?? "")) {
      patch[field] = parsed[field] ?? "";
    }
  }

  return patch;
}

export function hasSettingsPatch(input: SettingsPatchInput) {
  return Object.keys(input).length > 0;
}

export class UploadSettingsLogoRequestModel {
  constructor(private readonly logo: File) {}

  toFormData() {
    if (!this.logo.type.startsWith("image/")) {
      throw new ApiError("يجب اختيار ملف صورة صالح للشعار.");
    }
    const formData = new FormData();
    formData.append("logoPath", this.logo);
    return formData;
  }
}
