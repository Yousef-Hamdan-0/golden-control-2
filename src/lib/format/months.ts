/**
 * Assyrian / Syriac month names (the naming used across the Levant) ordered
 * January → December. Shared by every date picker in the app so the calendar
 * header and formatted dates stay consistent.
 */
export const SYRIAC_MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
] as const;

/** Weekday short labels, starting on Saturday (Levant week start). */
export const WEEKDAY_LABELS = [
  "سبت",
  "أحد",
  "إثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
] as const;

/** First weekday of the calendar grid (6 = Saturday in JS getDay()). */
export const WEEK_START_DAY = 6;

/**
 * Format a "YYYY-MM-DD" key into a readable Syriac-month date, e.g.
 * "15 نيسان 2026". Returns an empty string for missing/invalid values.
 */
export function formatSyriacDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "";
  const [, year, month, day] = match;
  const monthName = SYRIAC_MONTHS[Number(month) - 1];
  if (!monthName) return "";
  return `${Number(day)} ${monthName} ${year}`;
}
