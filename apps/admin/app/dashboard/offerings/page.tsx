import { createClient } from '@/utils/supabase/server';
import { DollarSign, Download } from 'lucide-react';
import OfferingsTable from './_components/OfferingsTable';

export default async function OfferingsPage() {
  const supabase = await createClient();

  const { data: offerings, error } = await supabase
    .from('offerings')
    .select(
      `
      id,
      amount,
      status,
      created_at,
      reference,
      profiles ( full_name ),
      funds ( name )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="text-red-500">
        Error loading offerings: {error.message}
      </div>
    );
  }

  const total =
    offerings
      ?.filter((o) => o.status === 'successful')
      .reduce((sum, o) => sum + Number(o.amount), 0) || 0;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Offerings &amp; Giving
          </h2>
          <p className="text-sm text-gray-500">
            View all member contributions and Paystack transactions.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A24A]/40 hover:text-[#8A6A00] hover:shadow-card">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary card */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card md:w-1/2">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#1E7A3E]/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F4EA] text-[#1E7A3E]">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Successful Giving
            </p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">
              ₦{total.toLocaleString('en-NG')}
            </h3>
          </div>
        </div>
      </div>

      <OfferingsTable offerings={offerings ?? []} />
    </div>
  );
}
