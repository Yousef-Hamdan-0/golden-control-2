import type { Order, DateFilter } from "../types";
import { localDateKey } from "@/lib/format/date";

export function normalizeDateKey(value: string): string {
  return localDateKey(value);
}

export function matchesDateValue(value: string, filter: DateFilter): boolean {
  if (!filter.from && !filter.to) return true;
  const dateKey = normalizeDateKey(value);
  const fromKey = normalizeDateKey(filter.from);
  const toKey = normalizeDateKey(filter.to);
  return (!fromKey || dateKey >= fromKey) && (!toKey || dateKey <= toKey);
}

export function matchesDateFilter(order: Order, filter: DateFilter): boolean {
  return matchesDateValue(order.visitDate, filter);
}

export function contains(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}
