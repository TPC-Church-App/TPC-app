// apps/admin/app/dashboard/members/page.tsx
import { createClient } from '@/utils/supabase/server'
import { UserCheck } from 'lucide-react'
import RoleSelector from './role-selector'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading members: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Member Directory</h2>
          <p className="text-sm text-gray-500">Manage church members and staff roles</p>
        </div>
        <div className="bg-[#C9A24A] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <UserCheck size={18} />
          {members?.length || 0} Total Members
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium w-48">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members?.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <p className="font-medium text-gray-900">{member.full_name || 'Unnamed Member'}</p>
                  <p className="text-xs text-gray-500">{member.id.split('-')[0]}...</p>
                </td>
                <td className="p-4 text-gray-600">{member.phone || 'N/A'}</td>
                <td className="p-4">
                  {member.is_verified ? (
                    <span className="text-green-600 text-sm font-medium">Verified</span>
                  ) : (
                    <span className="text-yellow-600 text-sm font-medium">Pending</span>
                  )}
                </td>
                <td className="p-4">
                  {/* Replace the button with the interactive dropdown */}
                  // apps/admin/app/dashboard/members/page.tsx
                <RoleSelector 
                userId={member.id} 
                currentRole={member.role} 
                memberName={member.full_name || 'Unknown Member'} 
                />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}