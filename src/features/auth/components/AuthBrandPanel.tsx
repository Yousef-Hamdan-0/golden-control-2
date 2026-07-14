import type { ReactNode } from "react";
import { BackendLogo } from "@/components/brand/BackendLogo";

const BRAND_NAME = "AL-KHUBARA COMPANY";
const BRAND_SUBTITLE = "Maintenance Center";

/**
 * Solid maintenance gear (SVG, currentColor) used by the animated cluster
 * behind the brand content. Purely decorative — hidden from screen readers.
 */
function Gear({ className, teeth = 8 }: { className?: string; teeth?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <g fill="currentColor">
        {Array.from({ length: teeth }).map((_, index) => (
          <rect
            key={index}
            x="44"
            y="2"
            width="12"
            height="20"
            rx="4"
            transform={`rotate(${(360 / teeth) * index} 50 50)`}
          />
        ))}
        <path
          fillRule="evenodd"
          d="M50 16a34 34 0 1 0 0 68 34 34 0 0 0 0-68Zm0 20a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z"
        />
      </g>
    </svg>
  );
}

/**
 * Meshing gear cluster: neighbouring gears counter-rotate at speeds matched
 * to their size so the teeth appear mechanically linked. Transform-only
 * animation (GPU-friendly) and disabled under prefers-reduced-motion.
 */
function GearCluster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Main pair meshing at the top-left of the panel */}
      <Gear className="absolute -top-10 left-[-44px] h-44 w-44 text-[var(--gold)] opacity-[0.16] [animation:gear-spin_18s_linear_infinite] motion-reduce:[animation:none]" />
      <Gear
        teeth={9}
        className="absolute top-16 left-16 h-24 w-24 text-[var(--gold-active)] opacity-[0.2] [animation:gear-spin_9.5s_linear_infinite_reverse] motion-reduce:[animation:none]"
      />
      {/* Large slow gear anchored to the bottom-right corner */}
      <Gear
        teeth={10}
        className="absolute bottom-[-72px] right-[-56px] h-64 w-64 text-[var(--gold)] opacity-[0.12] [animation:gear-spin_26s_linear_infinite_reverse] motion-reduce:[animation:none]"
      />
      <Gear
        className="absolute bottom-24 right-24 h-16 w-16 text-[var(--gold-hover)] opacity-[0.22] [animation:gear-spin_7s_linear_infinite] motion-reduce:[animation:none]"
      />
    </div>
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
      <GearCluster />

      <div className="relative flex w-full max-w-[460px] flex-col items-center text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-md bg-[var(--surface)] text-white shadow-[0_12px_28px_rgba(138,107,47,0.22)]">
          <BackendLogo
            alt={BRAND_NAME}
            className="h-[82px] w-[82px] object-contain"
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
    </section>
  );
}
