// apps/admin/app/dashboard/announcements/page.tsx
import { createClient } from '@/utils/supabase/server';
import AnnouncementForm from './announcement-form';
import { Megaphone, Trash2, Clock } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  async function deleteAnnouncement(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const supabase = await createClient();
    await supabase.from('announcements').delete().eq('id', id);
    revalidatePath('/dashboard/announcements');
  }

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Announcements
        </h2>
        <p className="text-sm text-gray-500">
          Publish messages that appear instantly on the mobile app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form column */}
        <div className="lg:col-span-1">
          <AnnouncementForm />
        </div>

        {/* List column */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Megaphone size={18} className="text-[#B08E3E]" />
            Recent Announcements
          </h3>

          {error && (
            <p className="rounded-lg bg-[#FDECEC] px-3 py-2 text-sm text-[#B42318]">
              Error loading announcements: {error.message}
            </p>
          )}

          {announcements?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EAD0] text-[#8A6A00]">
                <Megaphone size={22} />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">
                No announcements published yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Use the form to publish your first announcement.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {announcements?.map((item) => (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-gold-gradient opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                      {item.content /* ⚠️ see flag above — may need .body */}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      title="Delete Announcement"
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
