import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-content px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <section className="rounded-3xl border border-border bg-surface p-8 shadow-card">
          <h1 className="text-3xl font-semibold">مرحباً بك في Golden Control</h1>
          <p className="mt-4 text-base text-content-muted">
            هذه نسخة تجريبية من لوحة التحكم. استخدم الروابط أدناه للتنقل إلى إعدادات المستخدمين أو المخزون اليومي.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/settings/users"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              إدارة المستخدمين
            </Link>
            <Link
              href="/technicians/inventory"
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface-2 px-5 py-3 text-sm font-semibold text-content transition hover:bg-surface"
            >
              الجرد اليومي
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
