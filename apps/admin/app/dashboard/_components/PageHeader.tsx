// apps/admin/app/dashboard/_components/PageHeader.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Menu } from 'lucide-react';
import { useState } from 'react';

export default function PageHeader({
  fullName,
  roleLabel,
  initials,
  recentAnnouncements,
}: {
  fullName: string;
  roleLabel: string;
  initials: string;
  recentAnnouncements: any[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.includes('/members')) return 'Members Directory';
    if (pathname.includes('/offerings')) return 'Offerings & Giving';
    if (pathname.includes('/announcements')) return 'Announcements';
    if (pathname.includes('/services')) return 'Services & Events';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/audit-logs')) return 'Audit Logs';
    return 'Dashboard';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/dashboard/members?search=${encodeURIComponent(searchQuery)}`,
      );
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* LEFT: Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Icon (Placeholder) */}
          <button className="md:hidden p-2 text-gray-600">
            <Menu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* MIDDLE: Search (Hidden on mobile) */}
        <div className="relative max-w-md flex-1 hidden md:block mx-4">
          <form onSubmit={handleSearch}>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members and press Enter..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#C9A24A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
            />
          </form>
        </div>

        {/* RIGHT: Notifications & User Chip */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-[#C9A24A]/40 hover:text-[#C9A24A]"
            >
              <Bell size={18} />
              {recentAnnouncements.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C9A24A] ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800">
                    Recent Announcements
                  </p>
                </div>
                <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {recentAnnouncements.length === 0 ? (
                    <li className="p-4 text-center text-sm text-gray-500">
                      No announcements yet.
                    </li>
                  ) : (
                    recentAnnouncements.map((a) => (
                      <li
                        key={a.id}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {a.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {a.body}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
                <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
                  <button
                    onClick={() => router.push('/dashboard/announcements')}
                    className="text-xs font-bold text-[#C9A24A] hover:underline"
                  >
                    View All Announcements
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Chip (Initials only on mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-gray-200 bg-white p-1 sm:py-1.5 sm:pl-1.5 sm:pr-4 shadow-sm">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gold-gradient text-xs sm:text-sm font-bold text-[#1F1F1F]">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-tight text-gray-800">
                {fullName}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
