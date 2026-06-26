const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_WITHOUT_ZONE_PATTERN = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/;
const TIME_ZONE_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;
const APP_TIME_ZONE = "Asia/Amman";

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

function dateParts(date: Date) {
  return new Intl.DateTimeFormat("en-u-nu-latn", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
}

function dateTimeParts(date: Date) {
  return new Intl.DateTimeFormat("en-u-nu-latn", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
}

function parseDate(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function localDateKey(value: string | Date | null | undefined, fallback = "") {
  if (!value) return fallback;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const parts = dateParts(value);
    return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
  }

  const raw = value.trim();
  if (!raw) return fallback;
  if (DATE_ONLY_PATTERN.test(raw)) return raw;
  const localDateTime = DATE_TIME_WITHOUT_ZONE_PATTERN.exec(raw);
  if (localDateTime && !TIME_ZONE_PATTERN.test(raw)) return localDateTime[1];

  const date = parseDate(raw);
  if (!date) return raw.length >= 10 ? raw.slice(0, 10) : fallback;

  const parts = dateParts(date);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

export function localDateTimeKey(value: string | Date | null | undefined, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") {
    const raw = value.trim();
    const localDateTime = DATE_TIME_WITHOUT_ZONE_PATTERN.exec(raw);
    if (localDateTime && !TIME_ZONE_PATTERN.test(raw)) {
      return `${localDateTime[1]} ${localDateTime[2]}`;
    }
  }
  const date = value instanceof Date ? value : parseDate(value.trim());
  if (!date || Number.isNaN(date.getTime())) return fallback;
  const parts = dateTimeParts(date);

  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")} ${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function todayDateKey() {
  return localDateKey(new Date());
}
