// apps/admin/app/dashboard/offerings/page.tsx
import { createClient } from '@/utils/supabase/server';
import { DollarSign, Download } from 'lucide-react';

export default async function OfferingsPage() {
  const supabase = await createClient();

  // Fetch offerings and join with the member's profile and the fund name
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

  // Calculate total
  const total =
    offerings
      ?.filter((o) => o.status === 'successful')
      .reduce((sum, o) => sum + Number(o.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Offerings & Giving
          </h2>
          <p className="text-sm text-gray-500">
            View all member contributions and Paystack transactions.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 w-full md:w-1/2">
        <div className="p-4 bg-green-50 text-green-600 rounded-full">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">
            Total Successful Giving
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            ₦{total.toLocaleString('en-NG')}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Member</th>
              <th className="p-4 font-medium">Fund</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offerings?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No offerings recorded yet.
                </td>
              </tr>
            )}
            {offerings?.map((offering) => (
              <tr key={offering.id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600 whitespace-nowrap">
                  {new Date(offering.created_at).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {/* Handle the joined profile object */}
                  {(offering.profiles as any)?.full_name || 'Unknown Member'}
                </td>
                <td className="p-4 text-gray-600">
                  {(offering.funds as any)?.name || 'General'}
                </td>
                <td className="p-4 font-bold text-gray-900">
                  ₦{Number(offering.amount).toLocaleString('en-NG')}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase
                    ${
                      offering.status === 'successful'
                        ? 'bg-green-100 text-green-700'
                        : offering.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {offering.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500 font-mono">
                  {offering.reference.split('-')[0]}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
