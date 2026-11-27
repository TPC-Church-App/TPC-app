import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">404 - Not Found</h2>
      <p className="text-gray-500 mb-8">Could not find the requested page.</p>
      <Link href="/login" className="bg-[#C9A24A] text-black px-6 py-2 rounded-md font-bold">
        Return to Login
      </Link>
    </div>
  )
}