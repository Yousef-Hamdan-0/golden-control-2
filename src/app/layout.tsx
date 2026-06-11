import type { ReactNode } from "react";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["500", "700"],
  variable: "--font-heading",
});

export const metadata = {
  title: "Golden Control", 
  description: "لوحة تحكم Golden Control",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
