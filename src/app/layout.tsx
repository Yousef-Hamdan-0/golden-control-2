import type { Metadata } from "next";
import { Tajawal, Cairo } from "next/font/google";
import type { ReactNode } from "react";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

// Headings — Tajawal (static weights)
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-heading",
  display: "swap",
});

// Body — Cairo (variable font, no explicit weights needed)
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "الخبراء لصيانة الأجهزة الكهربائية",
  description: "نظام إدارة مركز صيانة الأجهزة الكهربائية",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${cairo.variable}`}
    >
      <body className="font-body">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
