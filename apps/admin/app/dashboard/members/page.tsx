// apps/admin/app/dashboard/members/page.tsx
import { createClient } from '@/utils/supabase/server'
import { UserCheck, Shield } from 'lucide-react'

export default async function MembersPage() {
  const supabase = await createClient()

  // Fetch all profiles ordered by newest first
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
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
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
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase
                    ${member.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 
                      member.role === 'pastor' ? 'bg-blue-100 text-blue-700' : 
                      member.role === 'usher' ? 'bg-orange-100 text-orange-700' : 
                      member.role === 'finance' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-700'}`}>
                    <Shield size={12} />
                    {member.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  {member.is_verified ? (
                    <span className="text-green-600 text-sm font-medium">Verified</span>
                  ) : (
                    <span className="text-yellow-600 text-sm font-medium">Pending</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button className="text-sm font-medium text-[#C9A24A] hover:text-[#B08E3E]">
                    Edit Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}