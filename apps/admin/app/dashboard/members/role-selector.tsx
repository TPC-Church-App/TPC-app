// apps/admin/app/dashboard/members/role-selector.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function RoleSelector({ userId, currentRole, memberName }: { userId: string, currentRole: string, memberName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    if (newRole === currentRole) return // Don't log if it hasn't changed

    setLoading(true)

    // 1. Update the role
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Error updating role: ' + error.message)
      setLoading(false)
      return
    }

    // 2. Log the action
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ROLE_CHANGE',
        details: `Changed ${memberName}'s role from ${currentRole} to ${newRole}`
      })
    }

    router.refresh()
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