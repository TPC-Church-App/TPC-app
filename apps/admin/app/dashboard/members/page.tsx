// apps/admin/app/dashboard/members/page.tsx
import { createClient } from '@/utils/supabase/server';
import MembersTable from './_components/MembersTable';

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const supabase = await createClient();
  const searchQuery = searchParams.search || '';

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // If there is a search query, filter the results
  if (searchQuery) {
    query = query.ilike('full_name', `%${searchQuery}%`);
  }

  const { data: members, error } = await query;

  if (error) {
    return (
      <div className="text-red-500">Error loading members: {error.message}</div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Member Directory
          </h2>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : 'Manage church members and staff roles'}
          </p>
        </div>
      </div>
      <MembersTable members={members ?? []} />
    </div>
  );
}
