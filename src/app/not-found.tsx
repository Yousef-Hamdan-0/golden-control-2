import Link from "next/link";
import { Icon } from "@/lib/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-xl rounded-md border border-border bg-surface p-12 text-center shadow-card">
        <div className="relative mx-auto mb-6 flex h-20 items-center justify-center">
          <span className="select-none text-7xl font-bold text-surface-2">404</span>
          <span className="absolute flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold text-gold">
            <Icon name="alert" size={26} />
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-content">
          عذراً، الصفحة غير موجودة
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-content-muted">
          يبدو أن الرابط الذي تحاول الوصول إليه غير متاح حالياً أو قد تم نقله. يرجى
          التحقق من العنوان أو العودة للوحة التحكم الرئيسية.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gold-hover hover:shadow-gold"
        >
          <Icon name="home" size={18} />
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
