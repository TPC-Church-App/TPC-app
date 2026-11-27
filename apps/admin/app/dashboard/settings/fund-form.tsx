// apps/admin/app/dashboard/settings/fund-form.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function FundForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('funds')
      .insert([{ name, description, is_active: true }]);

    if (error) {
      alert('Error creating fund: ' + error.message);
    } else {
      setName('');
      setDescription('');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        Add New Giving Fund
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fund Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Building Project, Missions"
          className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-[#C9A24A] text-black font-bold py-2 rounded-md hover:bg-[#B08E3E] transition"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <PlusCircle size={20} />
        )}
        {loading ? 'Adding...' : 'Add Fund'}
      </button>
    </form>
  );
}
