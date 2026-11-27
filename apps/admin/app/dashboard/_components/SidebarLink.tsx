// apps/admin/app/dashboard/_components/SidebarLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  /** Pass a rendered element, e.g. <Calendar size={18} /> — NOT the component */
  icon: ReactNode;
  label: string;
  exact?: boolean;
};

export default function SidebarLink({
  href,
  icon,
  label,
  exact = false,
}: Props) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={[
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-white/[0.06] text-white'
          : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-100',
      ].join(' ')}
    >
      {/* Gold left-border indicator */}
      <span
        className={[
          'absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full transition-all',
          isActive
            ? 'bg-[#C9A24A]'
            : 'bg-transparent group-hover:bg-[#C9A24A]/40',
        ].join(' ')}
      />

      {/* Icon wrapper carries the gold color — Lucide inherits via currentColor */}
      <span
        className={
          isActive
            ? 'text-[#C9A24A]'
            : 'text-gray-500 group-hover:text-[#C9A24A]'
        }
      >
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}
