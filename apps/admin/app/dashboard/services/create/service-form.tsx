// apps/admin/app/dashboard/services/create/service-form.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ServiceForm() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('Main Sanctuary')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Generate a unique, random QR code string for this service
    // Example: TPC-1712345678-XJ9A
    const qrCode = `TPC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const { error } = await supabase
      .from('services')
      .insert([{ 
        title, 
        service_date: date, 
        start_time: startTime, 
        end_time: endTime, 
        location,
        qr_code: qrCode,
        is_active: true 
      }])

    if (error) {
      alert('Error creating service: ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/services')
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Service</h2>
          <p className="text-sm text-gray-500">Set up a new event and generate a check-in QR code.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Sunday Main Service, Thanksgiving Sunday"
            className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-[#C9A24A] focus:ring-[#C9A24A]"
            />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
          <div className="mt-0.5 text-yellow-600 font-bold">i</div>
          <p className="text-sm text-yellow-800">
            When you save, a unique QR code will be generated automatically. You can print it or display it on the projector for members to scan.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-[#C9A24A] text-black font-bold py-2 rounded-md hover:bg-[#B08E3E] transition"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {loading ? 'Creating...' : 'Create Service & Generate QR'}
        </button>
      </form>
    </div>
  )
}