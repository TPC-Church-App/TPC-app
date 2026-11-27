// apps/admin/app/dashboard/services/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/services"
          aria-label="Back to services"
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A24A]/40 hover:text-[#8A6A00] hover:shadow-card"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold tracking-tight text-gray-900">
            {service.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="text-[#B08E3E]" />
              {new Date(service.service_date).toLocaleDateString('en-NG', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {service.start_time && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-[#B08E3E]" />
                {service.start_time}
              </span>
            )}
            {service.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-[#B08E3E]" />
                {service.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="bg-gold-gradient px-6 py-4">
          <h3 className="text-center text-sm font-semibold uppercase tracking-widest text-[#1F1F1F]">
            Scan to Check In
          </h3>
        </div>

        <div className="flex flex-col items-center gap-6 p-10">
          <div className="rounded-2xl border-4 border-[#C9A24A] bg-white p-6 shadow-gold">
            <QRCode value={service.qr_code} size={256} />
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Service Code
            </p>
            <p className="inline-block rounded-lg bg-[#FDF9F0] px-4 py-2 font-mono text-sm text-[#5B4A1E]">
              {service.qr_code}
            </p>
          </div>

          <PrintButton />
        </div>
      </div>
    </div>
  );
}
