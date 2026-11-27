'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-gold mt-2 print:hidden"
    >
      <Printer size={18} /> Print QR Code
    </button>
  );
}
