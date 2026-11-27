'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-ivory">
      {/* ============ LEFT: Image panel ============ */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        {/* Background Image */}
        <Image
          src="/church-preaching.jpg"
          alt="Church preaching service"
          fill
          className="object-cover"
          priority
        />

        {/* Dark Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F] via-[#1F1F1F]/70 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center">
              <Image
                src="/logo.png"
                alt="TPC Logo"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              TPC Admin
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Welcome back to
              <br />
              <span className="text-[#C9A24A]">
                The Pentecostal Congregation
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-200">
              Manage your congregation, offerings, services, and announcements —
              all from one beautiful dashboard.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E7A3E]" />
              Secure admin portal
            </div>
          </div>

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} The Pentecostal Congregation. All
            rights reserved.
          </p>
        </div>
      </div>

      {/* ============ RIGHT: Form panel ============ */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on desktop) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center">
              <Image
                src="/logo.png"
                alt="TPC Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-[#1F1F1F]">
              TPC Admin
            </span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card-lg">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Sign in
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Enter your credentials to access the dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-[#B42318]/20 bg-[#FDECEC] px-3 py-2.5 text-sm text-[#B42318]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Trouble signing in? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
