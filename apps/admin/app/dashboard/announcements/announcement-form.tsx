'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';

export default function AnnouncementForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(''); // Changed to body
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Insert into the announcements table using 'body'
    const { error } = await supabase
      .from('announcements')
      .insert([{ title, body, is_active: true }]);

    if (error) {
      alert('Error creating announcement: ' + error.message);
    } else {
      setTitle('');
      setBody('');
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
        Create New Announcement
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Thanksgiving Sunday Details"
          className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          placeholder="Type the announcement here. It will appear on the mobile app."
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
          <Send size={20} />
        )}
        {loading ? 'Publishing...' : 'Publish Announcement'}
      </button>
    </form>
  );
}
