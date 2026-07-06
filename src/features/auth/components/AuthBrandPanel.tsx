import Image from "next/image";
import type { ReactNode } from "react";

const BRAND_NAME = "AL-KHUBARA COMPANY";
const BRAND_SUBTITLE = "Maintenance Center";

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
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-md bg-[var(--surface)] text-white shadow-[0_12px_28px_rgba(138,107,47,0.22)]">
          <Image
            src="/brand/al-khubara-emblem-transparent.png"
            alt={BRAND_NAME}
            width={82}
            height={82}
            className="object-contain"
            priority
          />
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
        {BRAND_NAME}
      </p>
    </section>
  );
}
