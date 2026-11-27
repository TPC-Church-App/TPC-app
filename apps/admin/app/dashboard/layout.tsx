// apps/admin/app/dashboard/layout.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Users, Calendar, DollarSign, Settings, Megaphone } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'member'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1F1F1F] text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-[#C9A24A]">TPC Admin</h2>
          <p className="text-sm text-gray-400 mt-1">{profile?.full_name}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs font-bold bg-[#C9A24A] text-black rounded uppercase">
            {role.replace('_', ' ')}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <Calendar size={20} className="text-[#C9A24A]" /> Overview
          </Link>

          {['super_admin', 'pastor', 'usher'].includes(role) && (
            <Link href="/dashboard/members" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
              <Users size={20} className="text-[#C9A24A]" /> Members
            </Link>
          )}

          {/* NEW ANNOUNCEMENTS LINK */}
          {['super_admin', 'pastor'].includes(role) && (
            <Link href="/dashboard/announcements" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
              <Megaphone size={20} className="text-[#C9A24A]" /> Announcements
            </Link>
          )}

          {['super_admin', 'pastor', 'finance'].includes(role) && (
            <Link href="/dashboard/offerings" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
              <DollarSign size={20} className="text-[#C9A24A]" /> Offerings
            </Link>
          )}

          {role === 'super_admin' && (
            <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
              <Settings size={20} className="text-[#C9A24A]" /> Settings
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-gray-800 rounded transition">
              <LogOut size={20} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}