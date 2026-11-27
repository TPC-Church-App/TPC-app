// apps/admin/app/dashboard/audit-logs/page.tsx
import { createClient } from '@/utils/supabase/server';
import { History } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">System Audit Logs</h2>
        <p className="text-sm text-gray-500">
          Track all administrative actions and changes.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Admin</th>
              <th className="p-4 font-medium">Action</th>
              <th className="p-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No audit logs recorded yet. Perform actions to see them here.
                </td>
              </tr>
            )}

            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600 whitespace-nowrap text-sm">
                  {new Date(log.created_at).toLocaleString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {/* Safely handle the joined profile */}
                  {(log.profiles as any)?.full_name || 'System'}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    <History size={12} /> {log.action}
                  </span>
                </td>
                <td className="p-4 text-gray-600 text-sm">
                  {/* Safely handle string vs object details */}
                  {typeof log.details === 'string'
                    ? log.details
                    : JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
