"use client";

import { Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SYRIAC_MONTHS } from "@/lib/format/months";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, index) => CURRENT_YEAR + 1 - index);

/**
 * Date filter rendered as two dropdown lists — a year list and a month list
 * (with Assyrian/Syriac month names). Year and month are independent: an empty
 * value means "not filtered by that part".
 */
export function MonthYearFilter({
  year,
  month,
  onYearChange,
  onMonthChange,
  idPrefix,
}: {
  /** Selected year as a string (e.g. "2026") or "" for all years. */
  year: string;
  /** Selected month as "1".."12" or "" for all months. */
  month: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  idPrefix: string;
}) {
  return (
    <>
      <Field label="السنة" htmlFor={`${idPrefix}-year`}>
        <Select
          id={`${idPrefix}-year`}
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
        >
          <option value="">كل السنوات</option>
          {YEARS.map((value) => (
            <option key={value} value={String(value)}>
              {value}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="الشهر" htmlFor={`${idPrefix}-month`}>
        <Select
          id={`${idPrefix}-month`}
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
        >
          <option value="">كل الأشهر</option>
          {SYRIAC_MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1)}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
