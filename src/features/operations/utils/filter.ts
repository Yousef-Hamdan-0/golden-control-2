import type { Order, DateFilter } from "../types";

export function normalizeDateKey(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
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
