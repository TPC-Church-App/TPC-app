// apps/admin/app/dashboard/settings/page.tsx
import { createClient } from '@/utils/supabase/server';
import FundForm from './fund-form';
import { Wallet, CheckCircle2, XCircle, Trash2, Power } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch all funds (fixed to order by name instead of created_at)
  const { data: funds, error } = await supabase
    .from('funds')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Funds fetch error:', error);
  }

  // Server Action: Delete a fund
  async function deleteFund(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const supabase = await createClient();
    await supabase.from('funds').delete().eq('id', id);
    revalidatePath('/dashboard/settings');
  }

  // Server Action: Toggle Active/Inactive status
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Church Settings</h2>
        <p className="text-sm text-gray-500">
          Manage giving funds and administrative configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fund Form Column */}
        <div className="lg:col-span-1">
          <FundForm />
        </div>

        {/* Fund List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={20} className="text-[#C9A24A]" />
            Giving Funds
          </h3>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-4 font-medium">Fund Name</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funds?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      No funds created yet.
                    </td>
                  </tr>
                )}

                {funds?.map((fund) => (
                  <tr key={fund.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{fund.name}</p>
                      <p className="text-sm text-gray-500">
                        {fund.description || 'No description'}
                      </p>
                    </td>
                    <td className="p-4">
                      {fund.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 size={16} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                          <XCircle size={16} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      {/* Toggle Status Button */}
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
                            fund.is_active ? 'Deactivate Fund' : 'Activate Fund'
                          }
                          className={`p-2 rounded-lg transition ${fund.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          <Power size={18} />
                        </button>
                      </form>

                      {/* Delete Button */}
                      <form action={deleteFund}>
                        <input type="hidden" name="id" value={fund.id} />
                        <button
                          type="submit"
                          title="Delete Fund"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
