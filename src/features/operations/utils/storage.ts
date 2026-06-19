import type { Invoice } from "../types";
import { INVOICES_STORAGE_KEY } from "../constants";
import { INVOICES } from "../data/seed";
import { normalizeInvoice } from "./invoice";

export function readStoredList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredList<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function readStoredInvoices(): Invoice[] {
  return readStoredList<Partial<Invoice>>(INVOICES_STORAGE_KEY, INVOICES).map(normalizeInvoice);
}
