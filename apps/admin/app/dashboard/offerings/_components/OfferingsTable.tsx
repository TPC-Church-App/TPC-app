'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import StatusPill from '../../_components/StatusPill';

type JoinedProfile =
  { full_name: string | null } | { full_name: string | null }[] | null;

type JoinedFund = { name: string | null } | { name: string | null }[] | null;

type Offering = {
  id: string;
  amount: number | string;
  status: string;
  created_at: string;
  reference: string;
  profiles: JoinedProfile;
  funds: JoinedFund;
};

function getName(p: JoinedProfile): string | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0]?.full_name ?? null;
  return p.full_name;
}

function getFundName(f: JoinedFund): string | null {
  if (!f) return null;
  if (Array.isArray(f)) return f[0]?.name ?? null;
  return f.name;
}

const STATUS_FILTERS = ['all', 'successful', 'pending', 'failed'];

export default function OfferingsTable({
  offerings,
}: {
  offerings: Offering[];
}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return offerings.filter((o) => {
      const memberName = (getName(o.profiles) ?? '').toLowerCase();
      const fundName = (getFundName(o.funds) ?? '').toLowerCase();
      const ref = (o.reference ?? '').toLowerCase();
      const matchQ =
        !needle ||
        memberName.includes(needle) ||
        fundName.includes(needle) ||
        ref.includes(needle);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [offerings, q, statusFilter]);

  const pillVariant = (status: string) =>
    status === 'successful'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'failed'
          ? 'danger'
          : 'neutral';

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
            placeholder="Search by member, fund, or reference…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </option>
          ))}
        </select>
        <span className="rounded-lg bg-[#F5EAD0] px-3 py-2 text-xs font-semibold text-[#8A6A00]">
          {filtered.length} row{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FDF9F0] text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Fund</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    No offerings match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((offering, idx) => (
                <tr
                  key={offering.id}
                  className={`border-b border-gray-50 transition hover:bg-brand-ivory/60 ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">
                    {new Date(offering.created_at).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                    {getName(offering.profiles) ?? 'Unknown Member'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {getFundName(offering.funds) ?? 'General'}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">
                    ₦{Number(offering.amount).toLocaleString('en-NG')}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill
                      label={offering.status}
                      variant={pillVariant(offering.status)}
                    />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                    {offering.reference.split('-')[0]}…
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
