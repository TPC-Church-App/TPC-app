// apps/admin/app/dashboard/_components/StatCard.tsx
import type { ReactNode } from 'react';

type Tone = 'gold' | 'green' | 'blue' | 'amber';

const toneMap: Record<Tone, { tile: string; accent: string }> = {
  gold: { tile: 'bg-[#F5EAD0] text-[#8A6A00]', accent: '#C9A24A' },
  green: { tile: 'bg-[#E6F4EA] text-[#1E7A3E]', accent: '#1E7A3E' },
  blue: { tile: 'bg-[#E7EEFB] text-[#1E4FA8]', accent: '#1E4FA8' },
  amber: { tile: 'bg-[#FEF4D6] text-[#8A6A00]', accent: '#C9A24A' },
};

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
  /** Optional sparkline element (e.g. <Sparkline data={...} />) */
  sparkline?: ReactNode;
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'gold',
  sparkline,
}: Props) {
  const t = toneMap[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg">
      {/* soft corner gradient tint */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: t.accent + '22' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.tile}`}
        >
          {icon}
        </div>
      </div>

      {sparkline && <div className="relative mt-4">{sparkline}</div>}
    </div>
  );
}
