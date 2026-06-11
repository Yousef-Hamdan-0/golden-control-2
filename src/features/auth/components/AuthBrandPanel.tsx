import type { ReactNode } from "react";

const BRAND_NAME = "مركز الصيانة الذهبي";
const BRAND_SUBTITLE = "نظام الإدارة المتكامل للمرافق";

function ToolsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.67 18.17l-5.3-5.3h-.99l-2.54 2.54v.99l5.3 5.3c.39.39 1.02.39 1.41 0l2.12-2.12c.39-.39.39-1.02 0-1.41zM17.34 10.19l1.41-1.41 2.12 2.12c1.17-1.17 1.17-3.07 0-4.24l-3.54-3.54-1.41 1.41V1.71l-.7-.71-3.54 3.54.71.71h2.83l-1.41 1.41 1.06 1.06-2.89 2.89-4.13-4.13V5.06L4.83 2.04 2 4.87 5.03 7.9h1.41l4.13 4.13-.85.85H7.6l-5.3 5.3c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0l5.3-5.3v-2.12l5.15-5.15z" />
    </svg>
  );
}

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  );
}

function ActivityIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-3" />
      <path d="M19 7l-3-3-3 3" />
    </svg>
  );
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--surface)] text-center shadow-[0_2px_8px_rgba(64,50,22,0.06)] sm:h-36 sm:w-36">
      <div className="text-[var(--gold)]">{icon}</div>
      <div className="font-heading text-[20px] font-bold leading-none text-[var(--gold)] sm:text-[22px]">
        {value}
      </div>
      <div className="text-[12px] text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <section className="relative flex min-h-[360px] flex-1 items-center justify-center overflow-hidden bg-[var(--surface-2)] px-6 py-12 lg:min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_20%_12%,var(--auth-brand-glow)_0%,transparent_58%),radial-gradient(70%_55%_at_90%_90%,var(--auth-gold-glow)_0%,transparent_62%)]" />

      <div className="relative flex w-full max-w-[460px] flex-col items-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-md bg-[var(--gold-active)] text-white shadow-[0_12px_28px_rgba(138,107,47,0.22)]">
          <ToolsIcon className="h-9 w-9" />
        </div>

        <h1 className="font-heading text-[30px] font-bold leading-relaxed text-[var(--gold-active)] sm:text-[34px]">
          {BRAND_NAME}
        </h1>
        <p className="mt-2 text-[15px] text-[var(--text-muted)]">
          {BRAND_SUBTITLE}
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4">
          <MetricCard
            icon={<GridIcon className="h-6 w-6" />}
            value="24/7"
            label="مراقبة الأنظمة"
          />
          <MetricCard
            icon={<ActivityIcon className="h-6 w-6" />}
            value="100%"
            label="كفاءة التحول"
          />
        </div>
      </div>

      <p className="absolute bottom-8 font-heading text-[14px] font-bold text-[var(--gold-active)]">
        نظام التحكم الذهبي
      </p>
    </section>
  );
}
