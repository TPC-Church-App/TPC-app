// apps/admin/app/dashboard/services/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { notFound } from 'next/navigation';
import PrintButton from './print-button';

export default async function ServiceQRPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!service) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/services"
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{service.title}</h2>
          <p className="text-sm text-gray-500">
            {new Date(service.service_date).toLocaleDateString('en-NG', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}{' '}
            at {service.start_time}
          </p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-white border-4 border-[#C9A24A] rounded-xl">
          <QRCode value={service.qr_code} size={256} />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">Scan to Check In</h3>
          <p className="text-gray-500 mt-2 font-mono text-sm bg-gray-100 px-4 py-2 rounded-lg">
            {service.qr_code}
          </p>
        </div>

        <PrintButton />
      </div>
    </div>
  );
}
