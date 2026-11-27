'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-[#C9A24A] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#B08E3E] transition mt-4 print:hidden"
    >
      <Printer size={20} /> Print QR Code
    </button>
  );
}
