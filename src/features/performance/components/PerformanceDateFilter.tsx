"use client";

import { Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { monthLabel, SYRIAC_MONTHS } from "@/lib/format/months";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, index) => CURRENT_YEAR + 1 - index);

/** Days in the given month, so February and leap years never offer an invalid day. */
export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export interface PerformanceDateValue {
  year: number;
  month: number;
  /** 0 means "the whole month". */
  day: number;
}

export function PerformanceDateFilter({
  value,
  onChange,
}: {
  value: PerformanceDateValue;
  onChange: (value: PerformanceDateValue) => void;
}) {
  const maxDay = daysInMonth(value.year, value.month);
  const days = Array.from({ length: maxDay }, (_, index) => index + 1);

  function change(patch: Partial<PerformanceDateValue>) {
    const next = { ...value, ...patch };
    // A day that no longer exists in the new month falls back to "whole month".
    if (next.day > daysInMonth(next.year, next.month)) next.day = 0;
    onChange(next);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3" dir="rtl">
      <Field label="السنة" htmlFor="performance-year">
        <Select
          id="performance-year"
          value={String(value.year)}
          onChange={(event) => change({ year: Number(event.target.value) })}
        >
          {YEARS.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="الشهر" htmlFor="performance-month">
        <Select
          id="performance-month"
          value={String(value.month)}
          onChange={(event) => change({ month: Number(event.target.value) })}
        >
          {SYRIAC_MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1)}>
              {monthLabel(index + 1)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="اليوم" htmlFor="performance-day">
        <Select
          id="performance-day"
          value={String(value.day)}
          onChange={(event) => change({ day: Number(event.target.value) })}
        >
          <option value="0">الشهر كاملاً</option>
          {days.map((day) => (
            <option key={day} value={String(day)}>
              {day}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
