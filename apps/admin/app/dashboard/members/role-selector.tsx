// apps/admin/app/dashboard/members/role-selector.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function RoleSelector({ userId, currentRole }: { userId: string, currentRole: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Error updating role: ' + error.message)
    } else {
      // Refresh the page to show the new role and update the sidebar if needed
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <select
      disabled={loading}
      value={currentRole}
      onChange={handleRoleChange}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#C9A24A] focus:border-[#C9A24A] block w-full p-2"
    >
      <option value="member">Member</option>
      <option value="usher">Usher</option>
      <option value="finance">Finance</option>
      <option value="pastor">Pastor</option>
      <option value="super_admin">Super Admin</option>
    </select>
  )
}