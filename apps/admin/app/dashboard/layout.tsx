// apps/admin/app/dashboard/layout.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import {
  LogOut,
  Users,
  Calendar,
  DollarSign,
  Settings,
  Megaphone,
  CalendarDays,
  ShieldAlert,
  Search,
  Bell,
} from 'lucide-react';
import SidebarLink from './_components/SidebarLink';

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
      {/* ================= SIDEBAR ================= */}
      <aside className="relative flex w-64 flex-col border-r border-white/10 bg-[#1F1F1F] text-white">
        {/* Subtle gold ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-sidebar-glow" />

        {/* Brand */}
        <div className="relative flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
            <Image
              src="/tpc-logo.png"
              alt="TPC"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight">
              TPC Admin
            </h2>
            <p className="truncate text-xs text-gray-400">{fullName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <SidebarLink
            href="/dashboard"
            icon={Calendar}
            label="Overview"
            exact
          />

          {['super_admin', 'pastor', 'usher'].includes(role) && (
            <SidebarLink
              href="/dashboard/members"
              icon={Users}
              label="Members"
            />
          )}

          {['super_admin', 'pastor'].includes(role) && (
            <SidebarLink
              href="/dashboard/announcements"
              icon={Megaphone}
              label="Announcements"
            />
          )}

          {['super_admin', 'pastor', 'finance'].includes(role) && (
            <SidebarLink
              href="/dashboard/offerings"
              icon={DollarSign}
              label="Offerings"
            />
          )}

          {['super_admin', 'pastor', 'usher'].includes(role) && (
            <SidebarLink
              href="/dashboard/services"
              icon={CalendarDays}
              label="Services"
            />
          )}

          {role === 'super_admin' && (
            <SidebarLink
              href="/dashboard/settings"
              icon={Settings}
              label="Settings"
            />
          )}

          {role === 'super_admin' && (
            <SidebarLink
              href="/dashboard/audit-logs"
              icon={ShieldAlert}
              label="Audit Logs"
            />
          )}
        </nav>

        {/* Role chip + Sign out */}
        <div className="relative border-t border-white/10 p-3">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A24A]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A24A]">
              {roleLabel}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-300">
              <LogOut size={18} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-4 px-6 py-4">
            {/* Global Search */}
            <div className="relative max-w-md flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search members, offerings, services…"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Notification bell */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-[#C9A24A]/40 hover:text-[#C9A24A]"
              >
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C9A24A]" />
              </button>

              {/* User chip */}
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white py-1.5 pl-1.5 pr-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-gradient text-xs font-bold text-[#1F1F1F]">
                  {initials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-tight text-gray-800">
                    {fullName}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
