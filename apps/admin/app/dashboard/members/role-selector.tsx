'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RoleSelector({
  userId,
  currentRole,
  memberName,
}: {
  userId: string;
  currentRole: string;
  memberName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === currentRole) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert('Error updating role: ' + error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ROLE_CHANGE',
        details: `Changed ${memberName}'s role from ${currentRole} to ${newRole}`,
      });
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <div className="relative">
      <select
        disabled={loading}
        value={currentRole}
        onChange={handleRoleChange}
        className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#C9A24A]/40 focus:border-[#C9A24A] focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/25 disabled:cursor-wait disabled:opacity-60"
      >
        <option value="member">Member</option>
        <option value="usher">Usher</option>
        <option value="finance">Finance</option>
        <option value="pastor">Pastor</option>
        <option value="super_admin">Super Admin</option>
      </select>

      {/* Chevron / loading indicator on the right */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-[#B08E3E]" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </div>
  );
}
