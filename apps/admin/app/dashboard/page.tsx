// apps/admin/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users,
  DollarSign,
  CalendarDays,
  Megaphone,
  ArrowUpRight,
  Clock,
  HandCoins,
} from 'lucide-react';
import StatCard from './_components/StatCard';
import Sparkline from './_components/Sparkline';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const firstName = (profile?.full_name || 'Admin').split(' ')[0];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const todayStr = now.toISOString().split('T')[0];

  const [
    profilesRes,
    announcementsRes,
    servicesRes,
    monthOfferingsRes,
    sixMonthOfferingsRes,
    recentOfferingsRes,
    upcomingServicesRes,
  ] = await Promise.all([
    // 1. Fetch from 'profiles', not 'members'
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .gte('service_date', todayStr),
    // 2. Only sum successful offerings
    supabase
      .from('offerings')
      .select('amount')
      .eq('status', 'successful')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('offerings')
      .select('amount, created_at')
      .eq('status', 'successful')
      .gte('created_at', sixMonthsAgo.toISOString()),
    supabase
      .from('offerings')
      .select('amount, created_at')
      .eq('status', 'successful')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('services')
      .select('id, title, service_date')
      .gte('service_date', todayStr)
      .order('service_date', { ascending: true })
      .limit(5),
  ]);

  const memberCount = profilesRes.count ?? 0;
  const announcementCount = announcementsRes.count ?? 0;
  const upcomingCount = servicesRes.count ?? 0;

  const monthTotal =
    monthOfferingsRes.data?.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    ) ?? 0;

  const buckets = Array(6).fill(0);
  for (const row of sixMonthOfferingsRes.data ?? []) {
    const d = new Date(row.created_at as string);
    const idx =
      5 -
      (now.getFullYear() * 12 +
        now.getMonth() -
        (d.getFullYear() * 12 + d.getMonth()));
    if (idx >= 0 && idx < 6) buckets[idx] += Number(row.amount) || 0;
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(n);

  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';
  const today = now.toLocaleDateString('en-NG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening across the ministry today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Members"
          value={memberCount}
          hint="Registered profiles"
          tone="gold"
          icon={<Users size={20} />}
        />
        <StatCard
          label="Giving (This Month)"
          value={formatCurrency(monthTotal)}
          hint="6-month trend"
          tone="green"
          icon={<HandCoins size={20} />}
          sparkline={<Sparkline data={buckets} stroke="#1E7A3E" />}
        />
        <StatCard
          label="Upcoming Services"
          value={upcomingCount}
          hint="Scheduled ahead"
          tone="blue"
          icon={<CalendarDays size={20} />}
        />
        <StatCard
          label="Announcements"
          value={announcementCount}
          hint="Published total"
          tone="amber"
          icon={<Megaphone size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Offerings */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Recent Offerings
            </h2>
            <a
              href="/dashboard/offerings"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#B08E3E] hover:text-[#8A6A00]"
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <ul className="divide-y divide-gray-100">
            {(recentOfferingsRes.data ?? []).length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No offerings recorded yet.
              </li>
            )}
            {(recentOfferingsRes.data ?? []).map((o, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-brand-ivory/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F4EA] text-[#1E7A3E]">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Offering
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at as string).toLocaleDateString(
                        'en-NG',
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(o.amount) || 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Services */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Upcoming Services
            </h2>
            <a
              href="/dashboard/services"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#B08E3E] hover:text-[#8A6A00]"
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <ul className="divide-y divide-gray-100">
            {(upcomingServicesRes.data ?? []).length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No upcoming services scheduled.
              </li>
            )}
            {(upcomingServicesRes.data ?? []).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-brand-ivory/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7EEFB] text-[#1E4FA8]">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {s.title || 'Service'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.service_date as string).toLocaleString(
                        'en-NG',
                        {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
