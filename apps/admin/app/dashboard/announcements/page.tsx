// apps/admin/app/dashboard/announcements/page.tsx
import { createClient } from '@/utils/supabase/server'
import AnnouncementForm from './announcement-form'
import { Megaphone, Trash2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  // Fetch existing announcements
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  // Server Action to delete an announcement
  async function deleteAnnouncement(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = await createClient()
    await supabase.from('announcements').delete().eq('id', id)
    revalidatePath('/dashboard/announcements')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
        <p className="text-sm text-gray-500">Publish messages that appear instantly on the mobile app.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <AnnouncementForm />
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Megaphone size={20} className="text-[#C9A24A]" />
            Recent Announcements
          </h3>

          {error && <p className="text-red-500">Error loading announcements: {error.message}</p>}

          {announcements?.length === 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 text-gray-500 text-center">
              No announcements published yet.
            </div>
          )}

          <div className="space-y-4">
            {announcements?.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(item.created_at).toLocaleDateString('en-NG', { 
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {/* Delete Button (Server Action) */}
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={item.id} />
                  <button 
                    type="submit"
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Announcement"
                  >
                    <Trash2 size={20} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}