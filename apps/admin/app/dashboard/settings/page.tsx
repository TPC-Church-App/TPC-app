// apps/admin/app/dashboard/settings/page.tsx
import { createClient } from '@/utils/supabase/server';
import FundForm from './fund-form';
import { Wallet, Power, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import StatusPill from '../_components/StatusPill';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: funds, error } = await supabase
    .from('funds')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Funds fetch error:', error);
  }

  async function deleteFund(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const supabase = await createClient();
    await supabase.from('funds').delete().eq('id', id);
    revalidatePath('/dashboard/settings');
  }

  async function toggleFundStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const currentStatus = formData.get('currentStatus') === 'true';
    const supabase = await createClient();
    await supabase
      .from('funds')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    revalidatePath('/dashboard/settings');
  }

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Church Settings
        </h2>
        <p className="text-sm text-gray-500">
          Manage giving funds and administrative configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form column */}
        <div className="lg:col-span-1">
          <FundForm />
        </div>

        {/* List column */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Wallet size={18} className="text-[#B08E3E]" />
            Giving Funds
          </h3>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FDF9F0] text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 font-semibold">Fund</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funds?.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-10 text-center text-sm text-gray-400"
                      >
                        No funds created yet.
                      </td>
                    </tr>
                  )}

                  {funds?.map((fund, idx) => (
                    <tr
                      key={fund.id}
                      className={`border-b border-gray-50 transition hover:bg-brand-ivory/60 ${
                        idx % 2 === 1 ? 'bg-gray-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {fund.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {fund.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill
                          label={fund.is_active ? 'Active' : 'Inactive'}
                          variant={fund.is_active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <form action={toggleFundStatus}>
                            <input type="hidden" name="id" value={fund.id} />
                            <input
                              type="hidden"
                              name="currentStatus"
                              value={String(fund.is_active)}
                            />
                            <button
                              type="submit"
                              title={
                                fund.is_active
                                  ? 'Deactivate Fund'
                                  : 'Activate Fund'
                              }
                              className={`rounded-lg p-2 transition ${
                                fund.is_active
                                  ? 'text-[#8A6A00] hover:bg-[#FEF4D6]'
                                  : 'text-[#1E7A3E] hover:bg-[#E6F4EA]'
                              }`}
                            >
                              <Power size={16} />
                            </button>
                          </form>

                          <form action={deleteFund}>
                            <input type="hidden" name="id" value={fund.id} />
                            <button
                              type="submit"
                              title="Delete Fund"
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
