'use client';

import { useMemo, useState } from 'react';
import { Search, UserCheck } from 'lucide-react';
import RoleSelector from '../role-selector';

type Member = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  is_verified: boolean | null;
};

const ROLE_FILTERS = [
  'all',
  'super_admin',
  'pastor',
  'finance',
  'usher',
  'member',
];

export default function MembersTable({ members }: { members: Member[] }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return members.filter((m) => {
      const matchQ =
        !needle ||
        (m.full_name ?? '').toLowerCase().includes(needle) ||
        (m.phone ?? '').toLowerCase().includes(needle);
      const matchRole =
        roleFilter === 'all' || (m.role ?? 'member') === roleFilter;
      return matchQ && matchRole;
    });
  }, [members, q, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All roles' : r.replace('_', ' ')}
            </option>
          ))}
        </select>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5EAD0] px-3 py-2 text-xs font-semibold text-[#8A6A00]">
          <UserCheck size={14} /> {filtered.length} shown
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FDF9F0] text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="w-48 px-5 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    No members match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((member, idx) => (
                <tr
                  key={member.id}
                  className={`border-b border-gray-50 transition hover:bg-brand-ivory/60 ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5EAD0] text-xs font-bold text-[#8A6A00]">
                        {(member.full_name ?? '?')
                          .split(' ')
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.full_name || 'Unnamed Member'}
                        </p>
                        <p className="font-mono text-[11px] text-gray-400">
                          {member.id.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {member.phone || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {member.is_verified ? (
                      <span className="pill bg-[#E6F4EA] text-[#1E7A3E]">
                        Verified
                      </span>
                    ) : (
                      <span className="pill bg-[#FEF4D6] text-[#8A6A00]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleSelector
                      userId={member.id}
                      currentRole={member.role ?? 'member'}
                      memberName={member.full_name || 'Unknown Member'}
                    />
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
