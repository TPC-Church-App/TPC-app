// apps/admin/app/dashboard/_components/StatusPill.tsx
type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const map: Record<Variant, string> = {
  success: 'bg-[#E6F4EA] text-[#1E7A3E]',
  warning: 'bg-[#FEF4D6] text-[#8A6A00]',
  danger: 'bg-[#FDECEC] text-[#B42318]',
  info: 'bg-[#E7EEFB] text-[#1E4FA8]',
  neutral: 'bg-gray-100 text-gray-600',
};

export default function StatusPill({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: Variant;
}) {
  return <span className={`pill capitalize ${map[variant]}`}>{label}</span>;
}
