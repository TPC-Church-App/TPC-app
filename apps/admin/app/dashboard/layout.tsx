// apps/admin/app/dashboard/layout.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import {
  Users,
  Calendar,
  DollarSign,
  Settings,
  Megaphone,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import SidebarLink from './_components/SidebarLink';
import PageHeader from './_components/PageHeader';
import SignOutButton from './_components/SignOutButton'; // <-- Import new button

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Fetch 3 most recent announcements for the bell dropdown
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body')
    .order('created_at', { ascending: false })
    .limit(3);

  const role = profile?.role || 'member';
  const fullName = profile?.full_name || user.email || 'Admin';
  const roleLabel = role.replace('_', ' ');

  const initials =
    fullName
      .split(' ')
      .map((s: string) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A';

  return (
    <div className="flex h-screen bg-brand-ivory font-sans">
      <aside className="relative flex w-64 flex-col border-r border-white/10 bg-[#1F1F1F] text-white">
        <div className="pointer-events-none absolute inset-0 bg-sidebar-glow" />

        <div className="relative flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image
              src="/tpc-logo.png"
              alt="TPC"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-white">
              TPC Admin
            </h2>
            <p className="truncate text-xs text-gray-400">{fullName}</p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <SidebarLink
            href="/dashboard"
            icon={<Calendar size={18} />}
            label="Overview"
            exact
          />
          {['super_admin', 'pastor', 'usher'].includes(role) && (
            <SidebarLink
              href="/dashboard/members"
              icon={<Users size={18} />}
              label="Members"
            />
          )}
          {['super_admin', 'pastor'].includes(role) && (
            <SidebarLink
              href="/dashboard/announcements"
              icon={<Megaphone size={18} />}
              label="Announcements"
            />
          )}
          {['super_admin', 'pastor', 'finance'].includes(role) && (
            <SidebarLink
              href="/dashboard/offerings"
              icon={<DollarSign size={18} />}
              label="Offerings"
            />
          )}
          {['super_admin', 'pastor', 'usher'].includes(role) && (
            <SidebarLink
              href="/dashboard/services"
              icon={<CalendarDays size={18} />}
              label="Services"
            />
          )}
          {role === 'super_admin' && (
            <SidebarLink
              href="/dashboard/settings"
              icon={<Settings size={18} />}
              label="Settings"
            />
          )}
          {role === 'super_admin' && (
            <SidebarLink
              href="/dashboard/audit-logs"
              icon={<ShieldAlert size={18} />}
              label="Audit Logs"
            />
          )}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A24A]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A24A]">
              {roleLabel}
            </span>
          </div>

          {/* New Sign Out Button */}
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <PageHeader
          fullName={fullName}
          roleLabel={roleLabel}
          initials={initials}
          recentAnnouncements={announcements || []}
        />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
