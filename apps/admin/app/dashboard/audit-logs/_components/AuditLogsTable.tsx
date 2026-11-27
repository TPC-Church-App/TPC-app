'use client';

import { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';

// Supabase infers to-one joins as arrays; runtime may return object OR array.
type JoinedProfile =
  { full_name: string | null } | { full_name: string | null }[] | null;

type Log = {
  id: string;
  action: string;
  details: unknown;
  created_at: string;
  profiles: JoinedProfile;
};

function getName(p: JoinedProfile): string | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0]?.full_name ?? null;
  return p.full_name;
}

export default function AuditLogsTable({ logs }: { logs: Log[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return logs;
    return logs.filter((l) => {
      const admin = (getName(l.profiles) ?? '').toLowerCase();
      const details =
        typeof l.details === 'string'
          ? l.details.toLowerCase()
          : JSON.stringify(l.details ?? '').toLowerCase();
      return (
        admin.includes(needle) ||
        l.action.toLowerCase().includes(needle) ||
        details.includes(needle)
      );
    });
  }, [logs, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by admin, action, or details…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
          />
        </div>
        <span className="rounded-lg bg-[#F5EAD0] px-3 py-2 text-xs font-semibold text-[#8A6A00]">
          {filtered.length} log{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FDF9F0] text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-semibold">Date &amp; Time</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    No logs match your search.
                  </td>
                </tr>
              )}
              {filtered.map((log, idx) => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-50 transition hover:bg-brand-ivory/60 ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                    {getName(log.profiles) ?? 'System'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="pill bg-[#E7EEFB] text-[#1E4FA8]">
                      <History size={12} className="mr-1" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    <span className="line-clamp-2">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
