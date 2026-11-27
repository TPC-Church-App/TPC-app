// apps/admin/app/dashboard/services/page.tsx
import { createClient } from '@/utils/supabase/server';
import { Calendar, QrCode } from 'lucide-react';
import Link from 'next/link';

export default async function ServicesPage() {
  const supabase = await createClient();

  // Fetch all services
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .order('service_date', { ascending: false });

  if (error) {
    return (
      <div className="text-red-500">
        Error loading services: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Services & Events
          </h2>
          <p className="text-sm text-gray-500">
            Create services and generate QR codes for member check-in.
          </p>
        </div>
        <Link
          href="/dashboard/services/create"
          className="bg-[#C9A24A] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#B08E3E] transition"
        >
          + Create Service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.length === 0 && (
          <div className="col-span-full bg-white p-6 rounded-xl border border-gray-100 text-gray-500 text-center">
            No services created yet. Click "Create Service" to get started.
          </div>
        )}

        {services?.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={14} />
                  {new Date(service.service_date).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold uppercase ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {service.is_active ? 'Active' : 'Closed'}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-gray-700">
                <QrCode size={18} className="text-[#C9A24A]" />
                <span className="font-mono text-sm">{service.qr_code}</span>
              </div>
              <Link
                href={`/dashboard/services/${service.id}`}
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                View QR
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
