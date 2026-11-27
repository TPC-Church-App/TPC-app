import { createClient } from '@/utils/supabase/server';
import AuditLogsTable from './_components/AuditLogsTable';

export default async function AuditLogsPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(
      `
      id,
      action,
      details,
      created_at,
      profiles ( full_name )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="text-red-500">Error loading logs: {error.message}</div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          System Audit Logs
        </h2>
        <p className="text-sm text-gray-500">
          Track all administrative actions and changes.
        </p>
      </div>
      <AuditLogsTable logs={logs ?? []} />
    </div>
  );
}
